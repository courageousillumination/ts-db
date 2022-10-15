import { Expression } from "../parser/ast/expression";
import {
    FromClause,
    SelectClause,
    SelectStatement,
} from "../parser/ast/select";
import { Statement } from "../parser/ast/statement";
import { parse } from "../parser/parser";
import { RelationalLoadDataFormat, RelationalReturnDataFormat } from "./data";
import { Table, createTable } from "./table";

class RelationalClient {
    private readonly tables: Table[] = [];

    public async loadData(tableName: string, data: RelationalLoadDataFormat) {
        this.tables.push(createTable(tableName, data));
    }

    public async executeQuery(
        query: string
    ): Promise<RelationalReturnDataFormat | undefined> {
        const statements = parse(query);

        let returnResult;
        for (const statement of statements) {
            returnResult = await this.executeStatement(statement);
        }
        return returnResult;
    }

    private async executeStatement(
        statement: Statement
    ): Promise<RelationalReturnDataFormat | undefined> {
        switch (statement.type) {
            case "select":
                return this.executeSelect(statement);
        }
    }

    private async executeSelect(
        statement: SelectStatement
    ): Promise<RelationalReturnDataFormat> {
        // Process the from clause
        let table = await this.processFrom(statement.fromClause);

        // Apply the where clause
        table = await this.processWhere(table, statement.whereClause);

        // Proces select
        const results = await this.processSelect(table, statement.selectClause);
        return results;
    }

    private async processFrom(fromClause: FromClause) {
        const table = this.tables.find((x) => x.name === fromClause.table);
        if (!table) {
            this.error("Could not find table");
        }
        return table;
    }

    private async processSelect(table: Table, selectClause: SelectClause) {
        const results: any = [];
        for (const row of table.data) {
            const result = [];
            for (const column of selectClause.columns) {
                switch (column.type) {
                    case "wildcard":
                        for (const x of row) {
                            result.push(x);
                        }
                        break;
                    case "expression":
                        result.push(
                            await this.evaluateExpression(
                                table,
                                row,
                                column.expression
                            )
                        );
                }
            }

            results.push(result);
        }
        return results;
    }

    private async processWhere(table: Table, whereClause?: Expression) {
        if (!whereClause) {
            return table;
        }

        const data = [];
        for (const row of table.data) {
            if (await this.evaluateExpression(table, row, whereClause)) {
                data.push(row);
            }
        }

        return {
            ...table,
            data,
        };
    }

    private async evaluateExpression(
        table: Table,
        row: unknown[],
        expression: Expression
    ): Promise<any> {
        switch (expression.type) {
            case "value":
                return expression.value;
            case "columnName":
                const index = table.columns.findIndex(
                    (x) => x === expression.name
                );
                if (index === -1) {
                    this.error(
                        `Could not find column named ${expression.name}`
                    );
                }
                return row[index];
            case "binary":
                const leftValue = await this.evaluateExpression(
                    table,
                    row,
                    expression.left
                );
                const rightValue = await this.evaluateExpression(
                    table,
                    row,
                    expression.right
                );

                switch (expression.operator) {
                    case ">":
                        return leftValue > rightValue;
                    default:
                        this.error("Unhandle operation!");
                }

            default:
                this.error("Unhandled expression type");
        }
    }

    private error(error: string): never {
        throw new Error(error);
    }
}

export { RelationalClient };
