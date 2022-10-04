import { Expression, FromClause, InsertIntoClause, InsertIntoExpression, SelectClause, SelectExpression, ValuesClause } from "./expression";
import { Token } from "./token";
import { tokenize } from "./tokenize";

export const parseExpression = (input: string): Expression => {
    const tokens = tokenize(input)
    const parser = new Parser(tokens)
    return parser.parse()
}

// This is a simple recursive descent parser that works on token
// strings.
class Parser {
    private position = 0
    constructor(private readonly tokens: Token[]) { }

    public parse() {
        return this.expression()
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
        throw new Error(`Unexpected token: ${token.type}`)
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
            columns.push(token.value)
            this.consumeToken()
            token = this.peekToken()
        }
        return { columns }
    }

    private fromClause(): FromClause {
        this.consumeToken() // Get the FROM 
        const table = this.consumeToken()
        if (table.type === 'identifier') {
            return { table: table.value }
        }
        throw new Error("Unexpected token for FROM clause")
    }

    private insertIntoClause(): InsertIntoClause {
        this.consumeToken() // consume both keywords
        this.consumeToken()
        const table = this.consumeToken()
        if (table.type === 'identifier') {
            return { table: table.value }
        }
        throw new Error("Unexpected token for INSERT INTO clause")
    }
    private valuesClause(): ValuesClause {
        this.consumeToken() // Values
        this.consumeToken() // Open parentheses
        let token = this.peekToken()
        let values = []
        while (token && token.type === 'identifier') {
            values.push(token.value)
            this.consumeToken()
            token = this.peekToken()
        }
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