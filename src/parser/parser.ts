// import { ColumnSchema, ColumnType, CreateTableExpression, Expression, FromClause, InsertIntoClause, InsertIntoExpression, OrderByClause, SelectClause, SelectExpression, ValuesClause } from "./expression";

import { Expression, IdentifierExpression, Literal, LiteralExpression } from "./expression";
import { CreateTableStatement, InsertStatement, SelectStatement, Statement } from "./statement";
import { Token, TokenType } from "./token";
import { tokenize } from "./tokenize";


export const parse = (input: string) => {
    const tokens = tokenize(input)
    const parser = new Parser(tokens)
    return parser.parse()
}

export const parseExpression = (input: string): any[] => {
    return []
}

class Parser {
    private position = 0;
    constructor(private readonly tokens: Token[]) { }

    public parse() {
        const statements = []
        while (!this.isAtEnd()) {
            statements.push(this.statement())
            if (this.isAtEnd()) {
                break
            }
            this.consumeToken('semicolon')
        }
        return statements
    }

    private statement(): Statement {
        if (this.match('select')) {
            return this.selectStatement()
        }

        if (this.match('insert')) {
            return this.insertStatement()
        }

        if (this.match('create')) {
            return this.createTableStatement()
        }


        const expression = this.expression()
        return {
            type: 'expression',
            expression
        }
    }

    private createTableStatement(): CreateTableStatement {
        this.consumeToken('table')
        const table = this.consumeToken('identifier')
        this.consumeToken('leftParen')

        const columns = this.parseList(() => {
            const name = this.consumeToken('identifier')
            const type = this.consumeToken('integer') // TODO: Support other types
            return {
                name: name.lexeme, type: type.type
            }
        }, 'rightParen')

        return {
            type: 'createTable',
            table: table.lexeme,
            columnDefinitions: columns as any
        }
    }

    private insertStatement(): InsertStatement {
        this.consumeToken('into')
        const table = this.consumeToken('identifier')
        let columns: string[] | undefined = undefined
        if (this.match('leftParen')) {
            columns = this.parseList(() => {
                const token = this.consumeToken('identifier')
                return token.lexeme
            }, 'rightParen')

        }

        this.consumeToken('values')
        this.consumeToken('leftParen')
        const values = this.parseList(() => this.expression(), 'rightParen')
        return {
            type: 'insert',
            table: table.lexeme,
            values: values,
            columns
        }

    }

    private selectStatement(): SelectStatement {
        const columns = this.parseList(() => this.expression(), 'from')
        const table = this.consumeToken('identifier')
        return {
            type: 'select',
            table: table.lexeme,
            columns
        }
    }

    /** An expression evaluates to a value. */
    private expression(): Expression {
        return this.factor()
    }

    private factor(): Expression {
        let expr = this.unary()

        while (this.match('star')) {
            const operator = this.previous();
            const right = this.unary()
            expr = {
                type: 'binary',
                operator: operator.type,
                left: expr,
                right
            }
        }

        return expr;
    }

    private unary(): Expression {
        return this.primary()
    }

    private primary(): Expression {
        if (this.match('literal')) {
            const literal = this.previous()
            if (typeof literal.literal === 'number') {
                return { type: 'literal', literal: { type: 'number', value: literal.literal } }
            }
            if (typeof literal.literal === 'string') {
                return { type: 'literal', literal: { type: 'string', value: literal.literal } }
            }
            throw new Error("Unknown literal")
        }

        if (this.match('identifier')) {
            return { type: 'identifier', identifier: this.previous().lexeme }
        }

        if (this.match('leftParen')) {
            const expr = this.expression()
            this.consumeToken('rightParen')
            return {
                type: 'grouping',
                expression: expr
            }
        }
        throw new Error("Unexpected primary")
    }

    private parseList<T>(getter: () => T, end: TokenType) {
        const results = []
        while (!this.match(end) && !this.isAtEnd()) {
            const expression = getter()
            results.push(expression)
            if (this.peekToken()?.type !== end) {
                this.consumeToken('comma')
            }
        }
        return results
    }


    /** Consumes a token (and checks that it is the right type). */
    private consumeToken(tokenType?: TokenType) {
        const token = this.tokens[this.position++]
        if (!token) {
            throw new Error("Unexpected end of input")
        }
        if (tokenType && tokenType !== token.type) {
            throw new Error(`Token type did not match. Expecte ${tokenType} got ${token.type}`)
        }
        return token
    }

    private peekToken() {
        return this.tokens[this.position]
    }

    private previous() {
        return this.tokens[this.position - 1]
    }

    private match(tokenType: TokenType) {
        if (!this.isAtEnd() && this.peekToken().type === tokenType) {
            return this.consumeToken()
        }
        return null
    }

    private isAtEnd() {
        return this.position >= this.tokens.length
    }
}