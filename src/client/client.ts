import { Database } from "../core/database";
import { TableSchema } from "../core/schema";
import { InsertIntoExpression, SelectExpression } from "../parser/expression";
import { parseExpression } from "../parser/parser";


const SCHEMA: TableSchema = {
    columns: [{ name: 'test1' }]
}


export class Client {
    // TODO: At some point we'll have to clean this up.
    private readonly database: Database = new Database()

    constructor() {
        this.database.createTable('test', SCHEMA)
    }

    public execute(input: string) {
        const expression = parseExpression(input)

        switch (expression.type) {
            case 'select':
                return this.handleSelectExpression(expression)
            case 'insertInto':
                return this.handleInsertInto(expression)
            default:
                console.warn("Unhandled expression")
        }
    }

    public dumpDatabase() {
        console.log(this.database)
    }

    private handleSelectExpression(expr: SelectExpression) {
        return this.database.select(expr.from.table, expr.select.columns)
    }

    private handleInsertInto(expr: InsertIntoExpression) {
        console.log(expr.values.values)
        return this.database.insertInto(expr.insertInto.table, expr.values.values)
    }
}