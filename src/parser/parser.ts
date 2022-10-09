import { ColumnSchema, ColumnType, CreateTableExpression, Expression, FromClause, InsertIntoClause, InsertIntoExpression, SelectClause, SelectExpression, ValuesClause } from "./expression";
import { Token } from "./token";
import { tokenize } from "./tokenize";

export const parseExpression = (input: string): Expression[] => {
    const tokens = tokenize(input)
    const parser = new Parser(tokens)
    return parser.parse()
}

// This is a simple recursive descent parser that works on token
// strings.
class Parser {
    private position = 0
    constructor(private readonly tokens: Token[]) { }

    public parse(): Expression[] {
        const expressions = []
        while (this.position < this.tokens.length) {
            expressions.push(this.expression())
            if (this.peekToken()?.type === 'semicolon') {
                this.consumeToken() // Get the last semi colon
            }
        }
        return expressions
    }

    private expression(): Expression {
        const token = this.peekToken()

        if (token === null) {
            throw new Error("Unexpected end of input")
        }
        if (token.type === 'select') {
            return this.selectExpression()
        }
        if (token.type === 'insert') {
            return this.insertIntoExpression()
        }
        if (token.type == 'create') {
            return this.createTableExpression()
        }
        throw new Error(`Unexpected token: ${token.type}`)
    }

    private createTableExpression(): CreateTableExpression {
        this.consumeToken() // create
        this.consumeToken() // table

        const tableName = this.consumeToken()

        if (tableName.type !== 'identifier') {
            throw new Error("Unexpected token for CREATE TABLE clause")
            // return { table: table.lexeme }
        }

        this.consumeToken() // '('

        const columns: ColumnSchema[] = []

        while (this.peekToken() && this.peekToken()?.type !== 'rightParen') {
            const schema = this.columnSchema()
            columns.push(schema)
            if (this.peekToken()?.type === 'comma') {
                this.consumeToken()
            }
        }

        this.consumeToken() // ')'


        return {
            type: 'createTable',
            tableName: tableName.lexeme,
            columns: columns
        }
    }

    private columnSchema(): ColumnSchema {
        const columnName = this.consumeToken()

        if (columnName.type !== 'identifier') {
            throw new Error("Unexpected token for CREATE TABLE clause")
        }

        const columnTypeToken = this.consumeToken()
        let columnType: ColumnType
        if (columnTypeToken.type === 'integer') {
            columnType = 'integer'
        } else {
            throw new Error("Unexpected column type")
        }
        return {
            name: columnName.lexeme,
            type: columnType
        }
    }

    private selectExpression(): SelectExpression {
        const selectClause = this.selectClause()
        const fromClause = this.fromClause()
        return {
            type:
                'select',
            select: selectClause,
            from: fromClause
        }
    }

    private insertIntoExpression(): InsertIntoExpression {
        const insertIntoClause = this.insertIntoClause()
        const valuesClause = this.valuesClause()
        return {
            type: 'insertInto',
            insertInto: insertIntoClause,
            values: valuesClause
        }
    }

    private selectClause(): SelectClause {
        this.consumeToken() // Get the SELECT token
        let token = this.peekToken()
        const columns: string[] = []
        while (token !== null && token.type === 'identifier') {
            columns.push(token.lexeme)
            this.consumeToken()
            token = this.peekToken()
        }
        return { columns }
    }

    private fromClause(): FromClause {
        this.consumeToken() // Get the FROM 
        const table = this.consumeToken()
        if (table.type === 'identifier') {
            return { table: table.lexeme }
        }
        throw new Error("Unexpected token for FROM clause")
    }

    private insertIntoClause(): InsertIntoClause {
        this.consumeToken() // consume both keywords
        this.consumeToken()
        const table = this.consumeToken()
        if (table.type === 'identifier') {
            return { table: table.lexeme }
        }
        throw new Error("Unexpected token for INSERT INTO clause")
    }
    private valuesClause(): ValuesClause {
        this.consumeToken() // Values
        this.consumeToken() // Open parentheses
        let token = this.peekToken()
        let values = []
        while (token && token.type === 'literal') {
            values.push(token.literal)
            this.consumeToken()
            token = this.peekToken()
            if (token?.type === 'comma') {
                this.consumeToken()
                token = this.peekToken()
            }
        }

        this.consumeToken() // ')'
        return { values }
    }

    private peekToken(): Token | null {
        return this.tokens[this.position]
    }

    private consumeToken(): Token {
        const token = this.tokens[this.position++]
        return token
    }
}