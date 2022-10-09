import { Database } from "../core/database";
import { CreateTableExpression, InsertIntoExpression, SelectExpression } from "../parser/expression";
import { parseExpression } from "../parser/parser";


export class Client {
    // TODO: At some point we'll have to clean this up.
    private readonly database: Database = new Database()

    constructor() { }

    public execute(input: string) {
        const expressions = parseExpression(input)
        for (const expression of expressions) {
            switch (expression.type) {
                case 'select':
                    return this.handleSelectExpression(expression)
                case 'insertInto':
                    return this.handleInsertInto(expression)
                case 'createTable':
                    return this.handleCreateTable(expression)
                default:
                    console.warn("Unhandled expression")
            }
        }
    }

    public dumpDatabase() {
        console.log(this.database)
    }

    private handleSelectExpression(expr: SelectExpression) {
        return this.database.select(expr.from.table, expr.select.columns, expr.orderBy?.orderBy)
    }

    private handleInsertInto(expr: InsertIntoExpression) {
        console.log(expr)
        return this.database.insertInto(expr.insertInto.table, expr.values.values)
    }

    private handleCreateTable(expr: CreateTableExpression) {
        return this.database.createTable(expr.tableName, { columns: expr.columns })
    }
}