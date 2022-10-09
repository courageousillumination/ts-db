import { Database } from "../core/database";
import { Expression } from "../parser/expression";
// import { CreateTableExpression, InsertIntoExpression, SelectExpression } from "../parser/expression";
import { parse } from "../parser/parser";
import { CreateTableStatement, ExpresisonStatement, InsertStatement, SelectStatement } from "../parser/statement";


export class Client {
    // TODO: At some point we'll have to clean this up.
    private readonly database: Database = new Database()

    constructor() { }

    public execute(input: string) {
        const statements = parse(input)

        for (const statement of statements) {
            switch (statement.type) {
                case 'createTable':
                    return this.handleCreateTable(statement)
                case 'insert':
                    return this.handleInsertInto(statement)
                case 'select':
                    return this.handleSelect(statement)
                default:
                    console.warn("Unhandled expression")
            }
        }
    }

    public dumpDatabase() {
        console.log(this.database)
    }

    private handleSelect(statement: SelectStatement) {
        // return this.database.select(expr.from.table, expr.select.columns, expr.orderBy?.orderBy)
    }

    private handleInsertInto(statement: InsertStatement) {
        // return this.database.insertInto(expr.insertInto.table, expr.values.values)
    }

    private handleCreateTable(statement: CreateTableStatement) {
        return this.database.createTable(statement.table, { columns: statement.columnDefinitions })
    }

    private handleExpressionStatement(statement: ExpresisonStatement) {
        // return this.handleExpression(statement.expression)
    }

    private handleExpression(expr: Expression): any {
        // switch (expr.type) {
        //     case 'grouping':
        //         return this.handleExpression(expr.expression)
        //     case 'literal':
        //         return expr.literal.value
        //     case 'binary':
        //         const left = this.handleExpression(expr.left)
        //         const right = this.handleExpression(expr.right)
        //         if (expr.operator === 'star') {
        //             return left * right
        //         }
        // }
    }
}