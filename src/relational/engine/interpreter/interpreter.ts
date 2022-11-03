import exp from "constants";
import { stat } from "fs";
import { Backend } from "../../backend/backend";
import { Cursor } from "../../backend/cursor";
import { Expression } from "../../parser/ast/expression";
import { SelectStatement } from "../../parser/ast/select";
import { Statement } from "../../parser/ast/statement";
import { TokenType } from "../../parser/tokenizer";

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

/** Binary operator tokens to JS functions. */
const OPERATORS: Partial<Record<TokenType, (...args: any[]) => any>> = {
    star: (a, b) => a * b,
    greaterThan: (a, b) => a > b,
    plus: (a, b) => a + b,
    minus: (a) => a * -1,
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
    private executeSelect(statement: SelectStatement) {
        // Set up the context
        this.tableName = statement.fromClause.table;
        if (
            statement.selectClause.columns.some(
                (x) => x.type === "expression" && isAggregate(x.expression)
            )
        ) {
            return this.executeAggregate(statement);
        } else {
            return this.executeNonAggregate(statement);
        }
    }

    private *executeAggregate(statement: SelectStatement) {
        this.aggregateAccumulator = new Map();
        this.isAccumulating = true;

        // Create a new cursor
        this.cursor = this.backend.createCursor();

        while (this.cursor.hasData()) {
            // Note that this will update the aggregate accumulator.
            statement.selectClause.columns.map((x) =>
                x.type === "expression"
                    ? this.evaluateExpression(x.expression)
                    : null
            );
            this.cursor.next();
        }
        this.isAccumulating = false;

        // One final pass to get the value of out the accumulators.
        const result = statement.selectClause.columns.map((x) =>
            x.type === "expression"
                ? this.evaluateExpression(x.expression)
                : null
        );
        yield result;
    }

    private *executeNonAggregate(
        statement: SelectStatement
    ): Generator<unknown[]> {
        // Create a new cursor
        this.cursor = this.backend.createCursor();

        while (this.cursor.hasData()) {
            const results = statement.selectClause.columns.map((x) =>
                x.type === "expression"
                    ? this.evaluateExpression(x.expression)
                    : null
            );
            yield results;
            this.cursor.next();
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
                if (expression.name === "count") {
                    const value =
                        this.aggregateAccumulator?.get(expression) || 0;
                    if (this.isAccumulating) {
                        this.aggregateAccumulator?.set(expression, value + 1);
                        return value + 1;
                    }
                    return value;
                }
                if (expression.name === "sum") {
                    const value =
                        this.aggregateAccumulator?.get(expression) || 0;
                    if (this.isAccumulating) {
                        const newValue = this.evaluateExpression(
                            expression.argument as Expression
                        );

                        this.aggregateAccumulator?.set(
                            expression,
                            value + newValue
                        );
                        return value + newValue;
                    }
                    return value;
                } else {
                    this.error(`Unknown function ${expression.name}`);
                }
            default:
                this.error(`Unhandled expression type: ${expression.type}`);
        }
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
