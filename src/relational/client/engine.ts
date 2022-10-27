import { CreateStatement } from "../parser/ast/create";
import { Expression } from "../parser/ast/expression";
import { InsertStatement } from "../parser/ast/insert";
import { SelectStatement } from "../parser/ast/select";
import { Statement } from "../parser/ast/statement";
import { parse } from "../parser/parser";
import { Table } from "./table";

/** Binary operator tokens to JS functions. */
const BINARY_OPERATORS: Record<string, (a: any, b: any) => any> = {
    star: (a, b) => a * b,
    greaterThan: (a, b) => a > b,
};

/** Unary operator tokens to JS functions. */
const UNARY_OPERATORS: Record<string, (a: any) => any> = {
    minus: (a) => a * -1,
};

export class Engine {
    private readonly tables: Table[] = [];
    private readonly tableContexts: { table: Table; row: number }[] = [];

    /** Executes a string. */
    public async execute(input: string) {
        const statements = parse(input);
        let result; // Always return the result of the last statement.
        for (const statement of statements) {
            result = await this.executeStatement(statement);
        }
        return result;
    }

    /** Executes a single statement. */
    public async executeStatement(statement: Statement) {
        switch (statement.type) {
            case "create":
                return this.executeCreate(statement);
            case "insert":
                return this.executeInsert(statement);
            case "select":
                return this.executeSelect(statement);
            default:
                this.error(`Unhandled statement ${statement.type}`);
        }
    }

    /** Evaluates an expression to a primative type */
    public async evaluateExpression(expression: Expression): Promise<any> {
        switch (expression.type) {
            case "value":
                return expression.value;
            case "binary":
                const operator = BINARY_OPERATORS[expression.operator];
                if (!operator) {
                    this.error(`Unknown operator ${expression.operator}`);
                }
                const left = await this.evaluateExpression(expression.left);
                const right = await this.evaluateExpression(expression.right);
                return operator(left, right);
            case "unary":
                const unaryOperator = UNARY_OPERATORS[expression.operator];
                if (!unaryOperator) {
                    this.error(`Unknown operator ${expression.operator}`);
                }
                const value = await this.evaluateExpression(
                    expression.expression
                );
                return unaryOperator(value);
            case "ternary":
                if (expression.operator !== "between") {
                    this.error(`Unknown operator ${expression.operator}`);
                }
                const expr1 = await this.evaluateExpression(expression.expr1);
                const expr2 = await this.evaluateExpression(expression.expr2);
                const expr3 = await this.evaluateExpression(expression.expr3);
                return expr1 >= expr2 && expr1 <= expr3;
            case "case":
                const branches = expression.when;
                for (const { when, then } of branches) {
                    if (await this.evaluateExpression(when)) {
                        return this.evaluateExpression(then);
                    }
                }
                if (expression.else) {
                    return this.evaluateExpression(expression.else);
                }
                // TODO: What happens if a case has no match and no else?
                return null;
            case "column":
                return this.getColumnValue(expression.column);
            case "select":
                const v = await this.executeSelect(expression.statement);
                return v[0][0]; // Just unwrap to the first value
            case "function":
            // TODO...
            default:
                this.error(`Unhandled expression type: ${expression.type}`);
        }
    }

    /** Execute a create statement. */
    private async executeCreate(statement: CreateStatement) {
        this.tables.push(new Table(statement.table, statement.columns));
    }

    // Could I do something with a "table context"
    private async executeInsert(statement: InsertStatement) {
        const table = this.getTable(statement.insertClause.table);
        const evalutedValues = [];
        for (const value of statement.valuesClause.values) {
            evalutedValues.push(await this.evaluateExpression(value));
        }
        await table.insertValue(evalutedValues, statement.insertClause.columns);
    }

    private async executeSelect(statement: SelectStatement) {
        const table = this.getTable(statement.fromClause.table);
        const results: any[][] = [];
        for (const row of table.getRows()) {
            this.pushTableContext(table, row);
            const result = [];
            for (const column of statement.selectClause.columns) {
                if (column.type === "expression") {
                    if (column.expression.type === "function") {
                        switch (column.expression.name) {
                            case "avg":
                                // Agh! These functions are messing me up big time...
                                let sum = 0;
                                for (const row of table.getRows()) {
                                    this.pushTableContext(table, row);
                                    const value = await this.evaluateExpression(
                                        column.expression.argument as Expression
                                    );
                                    this.popTableContext();
                                    sum += value;
                                }
                                result.push(sum / table.getRows().length);
                                break;
                            default:
                                this.error(
                                    `Unhandled function ${column.expression.name}`
                                );
                        }
                    } else {
                        const value = await this.evaluateExpression(
                            column.expression
                        );
                        result.push(value);
                    }
                }
            }
            results.push(result);
            this.popTableContext();
        }
        return results;
        // Ok, maybe the table moves into the context?

        // const table = this.getTable()
        // const table2 = table.applyWhere(this) // A table that has had the were applied
        // const results = table2.select()
        // const sortedResults = this.sortResults(results)
    }

    /** Get a table from the database. */
    private getTable(name: string): Table {
        const table = this.tables.find((x) => x.name === name);
        if (!table) {
            this.error(`Could not find table named ${name}`);
        }
        return table;
    }

    private getColumnValue(column: string): any {
        const context = this.tableContexts[0];
        if (!context) {
            this.error("Not in a table context");
        }
        return context.table.getValue(context.row, column);
    }

    private pushTableContext(table: Table, row: number) {
        this.tableContexts.unshift({ table, row });
    }

    private popTableContext() {
        this.tableContexts.shift();
    }

    /** Indicate an error occurred during execution. */
    private error(message: string): never {
        throw new Error(message);
    }
}
