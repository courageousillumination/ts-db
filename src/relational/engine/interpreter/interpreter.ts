import { Backend } from "../../backend/backend";
import { Cursor } from "../../backend/cursor";
import { Expression, FunctionExpression } from "../../parser/ast/expression";
import { SelectStatement } from "../../parser/ast/select";
import { Statement } from "../../parser/ast/statement";
import { TokenType } from "../../parser/tokenizer";

/** Binary operator tokens to JS functions. */
const OPERATORS: Partial<Record<TokenType, (...args: any[]) => any>> = {
    star: (a, b) => a * b,
    greaterThan: (a, b) => a > b,
    plus: (a, b) => a + b,
    minus: (a) => a * -1,
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
    sum: (a) => a,
    count: (a) => a,
    avg: (a) => a[0],
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
            return true;
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
    /** Current cursor, if any. */
    private cursor?: Cursor;
    /** Current table, if any. */
    private tableName?: string;

    public constructor(private readonly backend: Backend) {}

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
        this.tableName = undefined;
        this.cursor = undefined;
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
            default:
                this.error(`Unhandled statement: ${this.statement.type}`);
        }
    }

    /**
     * Execute a select statement.
     * Returns a generator for each result row.
     */
    private *executeSelect(statement: SelectStatement): Generator<unknown[]> {
        // Set up the context
        this.tableName = statement.fromClause.table;
        // We'll start accumulating if any of our selects have an aggregate in them.
        this.isAccumulating = statement.selectClause.columns.some(
            (x) => x.type === "expression" && isAggregate(x.expression)
        );
        this.aggregateAccumulator = new Map();
        const requiresSort = !!statement.orderByClause;
        const sortlist = [];

        // Create a new cursor to walk the table.
        this.cursor = this.backend.createCursor();

        while (this.cursor.hasData()) {
            // Note that this will update the aggregate accumulator.
            const results = statement.selectClause.columns.map((x) =>
                x.type === "expression"
                    ? this.evaluateExpression(x.expression)
                    : null
            );
            if (requiresSort) {
                sortlist.push(results);
            } else if (!this.isAccumulating) {
                yield results;
            }
            this.cursor.next();
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
                return this.evaluateOperator(
                    expression.operator,
                    expression.expr1,
                    expression.expr2,
                    expression.expr3
                );

            case "case":
                const branches = expression.when;
                for (const { when, then } of branches) {
                    if (this.evaluateExpression(when)) {
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
                return this.applyAggregate(expression);
            case "select":
                // This is super inefficent since it will be executed every time, but whatever...
                const interpreter = new Interpreter(this.backend);
                interpreter.prepare(expression.statement);
                const result = interpreter.step().next().value;
                if (Array.isArray(result)) {
                    return result[0];
                }
                this.error("Idk, select went wrong...");
            default:
                this.error(
                    `Unhandled expression type: ${(expression as any).type}`
                );
        }
    }

    /** Applies an aggregate function. */
    private applyAggregate(expression: FunctionExpression): unknown {
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
    private getColumn(column: string, table?: string): unknown {
        const tableName = table || this.tableName;
        if (!tableName) {
            this.error("Could not find table name");
        }

        const columnIndex = this.backend.getColumnIndex(tableName, column);
        return this.getCursor().getColumn(columnIndex);
    }

    /** Get the current cursor, with error checking. */
    private getCursor() {
        if (!this.cursor) {
            this.error("No current cursor");
        }
        return this.cursor;
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
