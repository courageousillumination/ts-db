import exp from "constants";
import { Backend } from "../../backend/backend";
import { Cursor } from "../../backend/cursor";
import { CreateStatement } from "../../parser/ast/create";
import { Expression, FunctionExpression } from "../../parser/ast/expression";
import { InsertStatement } from "../../parser/ast/insert";
import { SelectStatement } from "../../parser/ast/select";
import { Statement } from "../../parser/ast/statement";
import { UpdateStatement } from "../../parser/ast/update";
import { TokenType } from "../../parser/tokenizer";

/** Binary operator tokens to JS functions. */
const OPERATORS: Partial<Record<TokenType, (...args: any[]) => any>> = {
    star: (a, b) => a * b,
    greaterThan: (a, b) => a > b,
    lessThan: (a, b) => a < b,
    lessThanEqual: (a, b) => a <= b,
    plus: (a, b) => a + b,
    minus: (a, b = null) => (b === null ? -a : a - b),
    slash: (a, b) => a / b,
    and: (a, b) => a && b,
    or: (a, b) => a || b,
    between: (a, b, c) => a >= b && a <= c,
    not: (a) => !a,
    greaterThanEqual: (a, b) => a >= b,
    equal: (a, b) => a === b,
};

/** Aggregation functions. */
const AGGREGATORS: Record<string, (a: any, b: any) => any> = {
    sum: (a, b) => (a || 0) + b,
    count: (a, _) => (a || 0) + 1,
    avg: ([avg, count] = [0, 0], b = 0) => {
        return [(avg * count) / (count + 1) + b / (count + 1), count + 1];
    },
};

/** Get the value out of an aggregator. */
const AGGREGATEOR_GET_VALUE: Record<string, (a: any) => any> = {
    sum: (a) => a || 0,
    count: (a) => a || 0,
    avg: (a) => a[0] || 0,
};

const STANDARD_FUNCTIONS: Record<string, (a: any) => any> = {
    abs: (a) => Math.abs(a),
};

/** Checks if the expression will need an aggregate */
const isAggregate = (expression: Expression): boolean => {
    switch (expression.type) {
        case "binary":
            return (
                isAggregate(expression.left) || isAggregate(expression.right)
            );
        case "unary":
            return isAggregate(expression.expression);
        case "ternary":
            return (
                isAggregate(expression.expr1) ||
                isAggregate(expression.expr2) ||
                isAggregate(expression.expr3)
            );
        case "value":
        case "column":
        case "select":
            return false;
        case "case":
            const expressions = [
                expression.initial,
                expression.else,
                ...expression.when.map((x) => x.when),
                ...expression.when.map((x) => x.then),
            ].filter((x) => !!x);
            return expressions.some((x) => isAggregate(x as Expression));
        case "function":
            return !!AGGREGATORS[expression.name];
        default:
            throw new Error("unhandeld expression type");
    }
};

/** A tree walk interpreter for TS-DB */
export class Interpreter {
    /** Statement currently being evaluated. */
    private statement?: Statement;
    /** Aggregate accumulator. */
    private aggregateAccumulator?: Map<any, any>;

    /** If we should update accumulators. */
    private isAccumulating: boolean = false;

    public constructor(
        private readonly backend: Backend,
        private openCursors: Record<string, Cursor> = {}
    ) {}

    /**
     * Prepares a statement for execution.
     * NOTE: No results will be returned until step
     * is called.
     */
    public prepare(statement: Statement) {
        this.statement = statement;
    }

    /** Resets the interpreter for a new statement. */
    public reset() {
        this.statement = undefined;
        this.isAccumulating = false;
        this.openCursors = {};
    }

    /**
     * Execute a single step.
     * This returns a generator that can be used to generate results.
     * In the case of SELECT each iteration will return a row.
     * Otherstatements will execute in their entirety.
     */
    public step() {
        if (!this.statement) {
            this.error("Must prepare a statement before stepping.");
        }

        switch (this.statement.type) {
            case "select":
                return this.executeSelect(this.statement);
            case "create":
                return this.executeCreate(this.statement);
            case "insert":
                return this.executeInsert(this.statement);
            case "update":
                return this.executeUpdate(this.statement);
            default:
                this.error(`Unhandled statement: ${this.statement.type}`);
        }
    }

    private *executeUpdate(statement: UpdateStatement) {
        const table = statement.table;
        const cursor = this.backend.createCursor(table);
        this.openCursors[table] = cursor;

        while (cursor.hasData()) {
            if (statement.whereClause) {
                const evalutaed = this.evaluateExpression(
                    statement.whereClause
                );
                if (!evalutaed) {
                    cursor.next();
                    continue;
                }
            }

            for (const assignment of statement.assignments) {
                const index = this.backend.getColumnIndex(
                    table,
                    assignment.columnName
                );
                const value = this.evaluateExpression(assignment.expression);
                cursor.writeColumn(index, value);
            }
            cursor.next();
        }
    }

    private *executeCreate(statement: CreateStatement) {
        this.backend.createTable(statement.table, statement.columns);
    }

    private *executeInsert(statement: InsertStatement) {
        const evaluated = statement.valuesClause.values.map((x) =>
            this.evaluateExpression(x)
        );
        const table = statement.insertClause.table;
        let record: unknown[] = [];
        if (statement.insertClause.columns) {
            for (let i = 0; i < statement.insertClause.columns.length; i++) {
                const name = statement.insertClause.columns[i];
                const index = this.backend.getColumnIndex(table, name);
                record[index] = evaluated[i];
            }
        } else {
            record = evaluated;
        }
        const cursor = this.backend.createCursor(table);
        cursor.writeRecord(record);
    }

    /**
     * Execute a select statement.
     * Returns a generator for each result row.
     */
    private *executeSelect(statement: SelectStatement): Generator<unknown[]> {
        // Set up the context
        const tableName = statement.fromClause.table;
        const cursor = this.backend.createCursor(tableName);
        if (statement.fromClause.alias) {
            this.openCursors[statement.fromClause.alias] = cursor;
        } else {
            this.openCursors[tableName] = cursor;
        }

        // We'll start accumulating if any of our selects have an aggregate in them.
        this.isAccumulating = statement.selectClause.columns.some(
            (x) => x.type === "expression" && isAggregate(x.expression)
        );
        this.aggregateAccumulator = new Map();
        const requiresSort = !!statement.orderByClause;
        const sortlist = [];

        while (cursor.hasData()) {
            // Check the where clause
            let isValid = false;
            if (statement.whereClause) {
                const value = this.evaluateExpression(statement.whereClause);
                isValid = !!value;
            } else {
                isValid = true;
            }

            if (!isValid) {
                cursor.next();
                continue;
            }

            // Note that this will update the aggregate accumulator.
            const results = statement.selectClause.columns.flatMap((x) =>
                x.type === "expression"
                    ? this.evaluateExpression(x.expression)
                    : this.backend
                          .getColumns(statement.fromClause.table)
                          .map((x) => cursor.getColumn(x.name))
            );

            if (isValid) {
                if (requiresSort) {
                    sortlist.push(results);
                } else if (!this.isAccumulating) {
                    yield results;
                }
            }
            cursor.next();
        }

        if (this.isAccumulating) {
            this.isAccumulating = false;
            const result = statement.selectClause.columns.map((x) =>
                x.type === "expression"
                    ? this.evaluateExpression(x.expression)
                    : null
            );
            yield result;
        }

        if (requiresSort) {
            // Sort the remaining sort list
            // Right now we only support order by with number expressions.
            const sorted = sortlist.sort((a: any[], b: any[]) => {
                for (const col of statement.orderByClause?.orderBy || []) {
                    if (col.expression.type !== "value") {
                        this.error("Only number order by are supported.");
                    }
                    const index = (col.expression.value as number) - 1;
                    const left = col.direction === "asc" ? a[index] : b[index];
                    const right = col.direction === "asc" ? b[index] : a[index];

                    if (left < right) {
                        return -1;
                    } else if (left > right) {
                        return 1;
                    }
                }
                return 0;
            });
            for (const row of sorted) {
                yield row;
            }
        }
    }

    /**
     * Evaluates a single expression.
     */
    public evaluateExpression(expression: Expression): unknown {
        switch (expression.type) {
            case "value":
                return expression.value;
            case "binary":
                return this.evaluateOperator(
                    expression.operator,
                    expression.left,
                    expression.right
                );
            case "unary":
                return this.evaluateOperator(
                    expression.operator,
                    expression.expression
                );
            case "ternary":
                const value = this.evaluateOperator(
                    expression.operator,
                    expression.expr1,
                    expression.expr2,
                    expression.expr3
                );
                if (expression.isNegative) {
                    return !value;
                } else {
                    return value;
                }

            case "case":
                const branches = expression.when;
                let initial;
                if (expression.initial) {
                    initial = this.evaluateExpression(expression.initial);
                }
                for (const { when, then } of branches) {
                    const whenValue = this.evaluateExpression(when);
                    if (
                        initial === whenValue ||
                        (initial === undefined && whenValue)
                    ) {
                        return this.evaluateExpression(then);
                    }
                }
                if (expression.else) {
                    return this.evaluateExpression(expression.else);
                }
                // TODO: What happens if a case has no match and no else?
                return null;
            case "column":
                return this.getColumn(expression.column, expression.table);
            case "function":
                return this.applyFunction(expression);
            case "select":
                // This is super inefficent since it will be executed every time, but whatever...
                const interpreter = new Interpreter(this.backend, {
                    ...this.openCursors,
                });
                interpreter.prepare(expression.statement);
                const result = interpreter.step().next().value;
                if (Array.isArray(result)) {
                    if (expression.exists) {
                        return true;
                    }
                    return result[0];
                }

                if (expression.exists) {
                    return false;
                }

                this.error("Idk, select went wrong...");
            default:
                this.error(
                    `Unhandled expression type: ${(expression as any).type}`
                );
        }
    }

    /** Applies an aggregate function. */
    private applyFunction(expression: FunctionExpression): unknown {
        const func = STANDARD_FUNCTIONS[expression.name];
        if (func) {
            return func(
                this.evaluateExpression(expression.argument as Expression)
            );
        }

        const value = this.aggregateAccumulator?.get(expression);

        const aggregator = AGGREGATORS[expression.name];
        if (!aggregator) {
            this.error(`Unknown function ${expression.name}`);
        }

        const getter = AGGREGATEOR_GET_VALUE[expression.name];
        if (!getter) {
            this.error(`Unknown getter ${expression.name}`);
        }

        if (!this.isAccumulating) {
            return getter(value);
        }
        // TODO: Why is '*' valid for count?
        if (expression.argument === "star" && expression.name !== "count") {
            this.error("Incorrect number of arguments");
        }
        const parameter =
            expression.argument === "star"
                ? undefined
                : this.evaluateExpression(expression.argument);

        const newValue = aggregator(value, parameter);
        this.aggregateAccumulator?.set(expression, newValue);
        return getter(newValue);
    }

    /** Loads a column using the current cursor. */
    private getColumn(column: string, tableName?: string): unknown {
        // If we don't have a table name, try each of our
        // open tables to see if we can find the appropriate cursor
        const possibleNames = [];
        if (!tableName) {
            for (const t of Object.keys(this.openCursors)) {
                if (this.backend.getColumnIndex(t, column) !== -1) {
                    possibleNames.push(t);
                }
            }
        } else {
            possibleNames.push(tableName);
        }

        if (possibleNames.length === 0) {
            this.error(`Could not find table named ${tableName}`);
        } else if (possibleNames.length > 1) {
            this.error(`Ambigous column ${column}`);
        }

        const cursor = this.openCursors[possibleNames[0]];

        if (!cursor) {
            this.error("Could not find open cursor");
        }

        return cursor.getColumn(column);
    }

    /** Evaluate a single operator. */
    private evaluateOperator(operator: TokenType, ...args: Expression[]) {
        const opFunction = OPERATORS[operator];
        if (!opFunction) {
            this.error(`Unknown operator ${operator}`);
        }
        return opFunction(...args.map((e) => this.evaluateExpression(e)));
    }

    /** Throws an error. */
    private error(message: string): never {
        throw new Error(`Execution error: ${message}`);
    }
}
