import { CreateStatement } from "../parser/ast/create";
import { Expression } from "../parser/ast/expression";
import { InsertStatement } from "../parser/ast/insert";
import {
    FromClause,
    SelectClause,
    SelectStatement,
} from "../parser/ast/select";
import { Statement } from "../parser/ast/statement";
import { UpdateStatement } from "../parser/ast/update";
import { parse } from "../parser/parser";
import { RelationalLoadDataFormat, RelationalReturnDataFormat } from "./data";
import {
    Table,
    createTableFromData,
    createTable,
    findColumnIndex,
} from "./table";

class RelationalClient {
    private readonly tables: Table[] = [];

    public async loadData(tableName: string, data: RelationalLoadDataFormat) {
        this.tables.push(createTableFromData(tableName, data));
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

    public async getTables() {
        return this.tables.map((x) => x.name);
    }

    private async executeStatement(
        statement: Statement
    ): Promise<RelationalReturnDataFormat | undefined> {
        switch (statement.type) {
            case "select":
                return this.executeSelect(statement);
            case "insert":
                return this.executeInsert(statement);
            case "create":
                return this.executeCreate(statement);
            case "update":
                return this.executeUpdate(statement);
        }
    }

    private async executeUpdate(statement: UpdateStatement) {
        const table = await this.processFrom(statement);

        for (const row of table.data) {
            if (
                statement.whereClause &&
                (await this.evaluateExpression(
                    table,
                    row,
                    statement.whereClause
                ))
            ) {
                // We need to apply the update
                for (const {
                    columnName,
                    expression,
                } of statement.assignments) {
                    // Is this actually right? what context does an update happen in?
                    const value = await this.evaluateExpression(
                        table,
                        row,
                        expression
                    );
                    const index = findColumnIndex(table, columnName);
                    row[index] = value;
                }
            }
        }

        return undefined; // What should this return?
    }

    private async executeCreate(statement: CreateStatement) {
        this.tables.push(createTable(statement.table, statement.columns));
        return undefined;
    }

    private async executeInsert(statement: InsertStatement) {
        const values = await Promise.all(
            statement.valuesClause.values.map(
                async (x) => await this.evaluateExpression(null, [], x)
            )
        );
        const table = await this.processFrom(statement.insertClause);
        // Remap the values
        if (statement.insertClause.columns) {
            const indicies = statement.insertClause.columns.map((x) => {
                const index = findColumnIndex(table, x);
                if (index === -1 || index === undefined) {
                    this.error(`Could not find column named ${x}`);
                }
                return index;
            });
            const newValues = new Array(table.columns.length);
            for (let i = 0; i < indicies.length; i++) {
                newValues[indicies[i]] = values[i];
            }
            table.data.push(newValues);
            return [newValues]; // Not sure about this actually...
        } else {
            table.data.push(values);
        }
        return [values];
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
        table: Table | null,
        row: unknown[],
        expression: Expression
    ): Promise<any> {
        switch (expression.type) {
            case "value":
                return expression.value;
            case "columnName":
                if (!table) {
                    this.error("Not in a tabel context");
                }
                const index = findColumnIndex(table, expression.name);
                if (index === -1 || index === undefined) {
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
                    case "=":
                        return leftValue === rightValue;
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
