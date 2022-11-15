import { Backend } from "../../backend/backend";
import { Cursor } from "../../backend/cursor";
import { CreateIndexNode, CreateNode } from "../../parser/ast/create";
import {
    ExpressionNode,
    FunctionCallExpressionNode,
    Operator,
} from "../../parser/ast/expression";
import { InsertNode } from "../../parser/ast/insert";
import { CompoundSelect, SimpleSelectNode } from "../../parser/ast/select";
import { StatementNode } from "../../parser/ast/statement";
import { UpdateNode } from "../../parser/ast/update";

const bubbleNulls = (func: (a: any, b: any) => any) => {
    return (a: any, b: any) => (a === null || b === null ? null : func(a, b));
};

const rowEqual = (a: any[], b: any[]) => {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
};

const uniqueData = (a: any[][]) => {
    let result = [];
    for (let i = 0; i < a.length; i++) {
        let found = false;
        for (let j = i + 1; j < a.length; j++) {
            if (rowEqual(a[i], a[j])) {
                found = true;
                break;
            }
        }
        if (!found) {
            result.push(a[i]);
        }
    }
    return result;
};

const applyCompoundOperator = (
    a: any[][],
    b: any[][],
    operator: "union" | "unionAll" | "intersect" | "except" | "initial"
) => {
    if (operator == "initial") {
        return b;
    }
    if (operator == "union") {
        const result = [...a, ...b];
        return uniqueData(result);
    }

    if (operator === "unionAll") {
        const result = [...a, ...b];
        return result;
    }

    if (operator === "intersect") {
        const result = [];
        for (const row1 of a) {
            for (const row2 of b) {
                if (rowEqual(row1, row2)) {
                    result.push(row1);
                }
            }
        }
        return uniqueData(result);
    }

    if (operator === "except") {
        const results = [];
        for (const row1 of a) {
            let found = false;
            for (const row2 of b) {
                if (rowEqual(row1, row2)) {
                    found = true;
                }
            }
            if (!found) {
                results.push(row1);
            }
        }
        return uniqueData(results);
    }

    throw new Error("unsupported operation");
};

/** Binary operator tokens to JS functions. */
const OPERATORS: Partial<Record<Operator, (...args: any[]) => any>> = {
    multiply: bubbleNulls((a, b) => a * b),
    greaterThan: bubbleNulls((a, b) => a > b),
    lessThan: bubbleNulls((a, b) => a < b),
    lessThanEqual: bubbleNulls((a, b) => a <= b),
    add: bubbleNulls((a, b = undefined) => (b === undefined ? a : a + b)),
    subtract: bubbleNulls((a, b = undefined) => (b === undefined ? -a : a - b)),
    divide: bubbleNulls((a, b) => a / b),
    and: bubbleNulls((a, b) => a && b),
    or: (a, b) => a || b,
    between: (a, b, c) => {
        if (a === null) {
            return null;
        }
        if (b === null || c === null) {
            return false;
        }
        return a >= b && a <= c;
    },
    greaterThanEqual: bubbleNulls((a, b) => a >= b),
    equal: bubbleNulls((a, b) => a === b),
    is: (a, b) => a === b,
    notEqual: (a, b) => a !== b,
    not: (a) => !a,
};

/** Aggregation functions. */
const AGGREGATORS: Record<string, (a: any, b: any) => any> = {
    sum: (a, b) => (a || 0) + b,
    count: (a, _) => (a || 0) + 1,
    avg: ([avg, count] = [0, 0], b = 0) => {
        if (b === null) {
            return [avg, count];
        }
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
    abs: (a) => (a === null ? a : Math.abs(a)),
    coalesce: (...args) => args.find((x) => x !== null) || null,
};

/** Checks if the expression will need an aggregate */
const isAggregate = (expression: ExpressionNode): boolean => {
    switch (expression.subType) {
        case "operator":
            expression.arguments.some(isAggregate);
        case "literal-value":
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
            return expressions.some((x) => isAggregate(x as ExpressionNode));
        case "function-call":
            return !!AGGREGATORS[expression.functionName];
        default:
            throw new Error("unhandeld expression type");
    }
};

/** A tree walk interpreter for TS-DB */
export class Interpreter {
    /** Statement currently being evaluated. */
    private statement?: StatementNode;
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
    public prepare(statement: StatementNode) {
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
            case "create-index":
                return this.executeCreateIndex(this.statement);
            case "compound-select":
                return this.executeCompoundSelect(this.statement);
            default:
                this.error(
                    `Unhandled statement: ${(this.statement as any).type}`
                );
        }
    }

    private *executeCreateIndex(statement: CreateIndexNode) {
        // We ignore indexes for now.
        return;
    }

    private *executeCompoundSelect(statement: CompoundSelect) {
        let results: any[] = [];
        for (const s of statement.parts) {
            const subQueryResults = [...this.executeSelect(s.select)];
            results = applyCompoundOperator(
                results,
                subQueryResults,
                s.compoundOperator
            );
        }
        // Finally do the order by

        if (statement.orderBy) {
            // Sort the remaining sort list
            // Right now we only support order by with number expressions.
            const sorted = results.sort((a: any[], b: any[]) => {
                for (const col of statement.orderBy || []) {
                    if (col.expression.subType !== "literal-value") {
                        this.error("Only number order by are supported.");
                    }
                    const index = (col.expression.value as number) - 1;
                    const left = col.direction === "asc" ? a[index] : b[index];
                    const right = col.direction === "asc" ? b[index] : a[index];
                    // Special case null handling.
                    if (left === null && right === null) {
                        continue;
                    }

                    if (left === null) {
                        return -1;
                    }

                    if (right === null) {
                        return 1;
                    }

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
        } else {
            for (const row of results) {
                yield row;
            }
        }
    }

    private *executeUpdate(statement: UpdateNode) {
        const table = statement.table;
        const cursor = this.backend.createCursor(table);
        this.openCursors[table] = cursor;

        while (cursor.hasData()) {
            if (statement.where) {
                const evalutaed = this.evaluateExpression(statement.where);
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

    private *executeCreate(statement: CreateNode) {
        this.backend.createTable(statement.table, statement.columns);
    }

    private *executeInsert(statement: InsertNode) {
        const evaluated = statement.values.map((x) =>
            this.evaluateExpression(x)
        );
        const table = statement.table;
        let record: unknown[] = [];
        if (statement.columns) {
            for (let i = 0; i < statement.columns.length; i++) {
                const name = statement.columns[i];
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
    private *executeSelect(statement: SimpleSelectNode): Generator<unknown[]> {
        // Set up the context
        const cursors: Cursor[] = [];
        for (const table of statement.tables) {
            const tableName = table.tableName;
            const cursor = this.backend.createCursor(tableName);
            if (table.alias) {
                this.openCursors[table.alias] = cursor;
            } else {
                this.openCursors[tableName] = cursor;
            }
            cursors.push(cursor);
        }

        // We'll start accumulating if any of our selects have an aggregate in them.
        this.isAccumulating = statement.columns.some(
            (x) => x.type === "expression" && isAggregate(x.expression)
        );
        this.aggregateAccumulator = new Map();
        const requiresSort = !!statement.orderBy;
        const sortlist = [];

        // Loop until the last cursor has no more data.
        while (cursors[cursors.length - 1].hasData()) {
            // First check if this current row is going to be vaild
            const isValid = statement.where
                ? !!this.evaluateExpression(statement.where)
                : true;
            if (isValid) {
                const row = statement.columns.flatMap((x) =>
                    x.type === "expression"
                        ? this.evaluateExpression(x.expression)
                        : cursors.flatMap((c) => c.getRow())
                );
                if (requiresSort) {
                    sortlist.push(row);
                } else if (!this.isAccumulating) {
                    yield row;
                }
            }

            // Find the next cursor to advance, starting at the end.
            for (let i = 0; i < cursors.length; i++) {
                cursors[i].next();
                if (cursors[i].hasData() || i === cursors.length - 1) {
                    break;
                }
                // This cursor has reached the end, keep going
                cursors[i].rewind();
            }
        }

        if (this.isAccumulating) {
            this.isAccumulating = false;
            const result = statement.columns.map((x) =>
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
                for (const col of statement.orderBy || []) {
                    if (col.expression.subType !== "literal-value") {
                        this.error("Only number order by are supported.");
                    }
                    const index = (col.expression.value as number) - 1;
                    const left = col.direction === "asc" ? a[index] : b[index];
                    const right = col.direction === "asc" ? b[index] : a[index];
                    // Special case null handling.
                    if (left === null && right === null) {
                        continue;
                    }

                    if (left === null) {
                        return -1;
                    }

                    if (right === null) {
                        return 1;
                    }

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
    public evaluateExpression(expression: ExpressionNode): unknown {
        switch (expression.subType) {
            case "literal-value":
                return expression.value;
            case "operator":
                const value = this.evaluateOperator(
                    expression.operator,
                    ...expression.arguments
                );
                if (expression.negate && value !== null) {
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
                if (initial !== null) {
                    // Interesting. Need to read up on this. I guess it's just some null weirdness.
                    for (const { when, then } of branches) {
                        const whenValue = this.evaluateExpression(when);
                        if (
                            initial === whenValue ||
                            (initial === undefined && whenValue)
                        ) {
                            return this.evaluateExpression(then);
                        }
                    }
                }
                if (expression.else) {
                    return this.evaluateExpression(expression.else);
                }
                // TODO: What happens if a case has no match and no else?
                return null;
            case "column":
                return this.getColumn(
                    expression.columnName,
                    expression.tableName
                );
            case "function-call":
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
            case "in":
                let values: any[] = [];
                if (Array.isArray(expression.list)) {
                    values = expression.list.map((e) =>
                        this.evaluateExpression(e)
                    );
                } else {
                    this.error("Selects are not supported yet");
                }
                const left = this.evaluateExpression(expression.expression);
                return expression.negate
                    ? !values.includes(left)
                    : values.includes(left);
            default:
                this.error(
                    `Unhandled expression type: ${(expression as any).subType}`
                );
        }
    }

    /** Applies an aggregate function. */
    private applyFunction(expression: FunctionCallExpressionNode): unknown {
        const func = STANDARD_FUNCTIONS[expression.functionName];
        if (func) {
            return func(this.evaluateExpression(expression.arguments[0]));
        }

        const value = this.aggregateAccumulator?.get(expression);

        const aggregator = AGGREGATORS[expression.functionName];
        if (!aggregator) {
            this.error(`Unknown function ${expression.functionName}`);
        }

        const getter = AGGREGATEOR_GET_VALUE[expression.functionName];
        if (!getter) {
            this.error(`Unknown getter ${expression.functionName}`);
        }

        if (!this.isAccumulating) {
            return getter(value);
        }
        // TODO: Why is '*' valid for count?

        const parameter = expression.wildcard
            ? null
            : this.evaluateExpression(expression.arguments[0]);

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
    private evaluateOperator(operator: Operator, ...args: ExpressionNode[]) {
        const opFunction = OPERATORS[operator];
        if (!opFunction) {
            this.error(`Unknown operator ${operator}`);
        }
        const evaluatedArgs = args.map((e) => this.evaluateExpression(e));
        return opFunction(...evaluatedArgs);
    }

    /** Throws an error. */
    private error(message: string): never {
        throw new Error(`Execution error: ${message}`);
    }
}
