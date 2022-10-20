import { ColumnType, CreateStatement } from "./ast/create";
import {
    Expression,
    ValueExpression,
    ColumnNameExpression,
} from "./ast/expression";
import { InsertStatement } from "./ast/insert";
import {
    FromClause,
    ResultColumn,
    SelectClause,
    SelectStatement,
} from "./ast/select";
import { Statement } from "./ast/statement";
import { Token, tokenize, TokenType } from "./tokenizer";

/**
 * Parses a query string into a set of statements.
 * @param query
 */
export const parse = (query: string): Statement[] => {
    const tokens = tokenize(query);
    const parser = new Parser(tokens);
    return parser.parse();
};

class Parser {
    private position = 0;
    constructor(private readonly tokens: Token[]) {}

    public parse(): Statement[] {
        const statements: Statement[] = [];

        while (!this.isAtEnd()) {
            statements.push(this.statement());
            // All statements must end with a semi-colon
            this.consume("semicolon");
        }

        return statements;
    }

    /** Parses a statement. */
    private statement(): Statement {
        const token = this.consume();
        switch (token.type) {
            case "select":
                return this.selectStatement();
            case "insert":
                return this.insertStatement();
            case "create":
                return this.createStatement();
            default: // Hacky....
                // Try parsing as a simple expression statement.
                this.position--;
                return { type: "expression", expression: this.expression() };
        }
    }

    private createStatement(): CreateStatement {
        this.consume("table");
        const table = this.table();
        this.consume("leftParen");
        const columns = this.consumeList(() => {
            const name = this.columnName();
            const type = this.columnType();
            return { name, type };
        }, "rightParen");
        return {
            type: "create",
            table,
            columns,
        };
    }

    private columnName() {
        const token = this.consume("identifier");
        return token.lexeme;
    }

    private columnType(): ColumnType {
        if (this.match("integer")) {
            return "integer";
        }
        this.error("Unknown column type");
        // if (this.match('string'))
    }

    private insertStatement(): InsertStatement {
        this.consume("into");
        const table = this.table();
        let columns;
        if (!this.match("values")) {
            this.consume("leftParen");
            columns = this.consumeList(() => {
                const token = this.consume("identifier");
                return token.lexeme;
            }, "rightParen");
            this.consume("values");
        }
        this.consume("leftParen");
        const values = this.consumeList(() => this.expression(), "rightParen");

        return {
            type: "insert",
            insertClause: {
                table,
                columns,
            },
            valuesClause: { values },
        };
    }

    /** Parses a select statement specifically. */
    private selectStatement(): SelectStatement {
        const selectClause = this.selectClause(); // Note: This consumes the FROM
        const fromClause = this.fromClause();
        const whereClause = this.match("where") ? this.expression() : undefined;

        return {
            type: "select",
            selectClause,
            fromClause,
            whereClause,
        };
    }

    private selectClause(): SelectClause {
        const columns = this.consumeList(() => this.resultColumn(), "from");
        return { columns };
    }

    /** A result column that belongs to a select clause. */
    private resultColumn(): ResultColumn {
        if (this.match("star")) {
            return { type: "wildcard" };
        }

        const expression = this.expression();
        return { type: "expression", expression };
    }

    private fromClause(): FromClause {
        const table = this.table();
        return { table };
    }

    private table(): string {
        const token = this.consume("identifier");
        return token.lexeme;
    }

    // Expression parsing

    /**
     * Parses an expression.
     * @returns
     */
    private expression(): Expression {
        return this.equality();
    }

    private equality(): Expression {
        const left = this.primary();
        const operator = this.match("greaterThan");
        if (operator) {
            const right = this.expression();
            return {
                type: "binary",
                left,
                right,
                operator: operator.lexeme,
            };
        }
        return left;
    }

    private primary(): Expression {
        if (this.match("literal")) {
            return { type: "value", value: this.previous().literal };
        }
        if (this.match("identifier")) {
            return { type: "columnName", name: this.previous().lexeme };
        }
        this.error(`Unhandled primary expression ${this.peekToken().type}`);
    }

    // UTILITIES

    /**
     * Parses a list of items, seperated by commas.
     * Returns the parsed syntax nodes
     */
    private consumeList<T>(getter: () => T, end: TokenType) {
        const results = [];
        while (!this.match(end) && !this.isAtEnd()) {
            results.push(getter());
            this.match("comma"); // Note: trailing comms allowed
        }
        return results;
    }

    /** Consumes a token, with optional type checking */
    private consume(tokenType?: TokenType) {
        if (this.isAtEnd()) {
            this.error("Unexpected end of input");
        }
        const token = this.tokens[this.position++];
        if (tokenType && token.type !== tokenType) {
            this.error(`Expected ${tokenType} but got ${token.type}`);
        }
        return token;
    }

    /** Look at the next token. */
    private peekToken(): Token {
        return this.tokens[this.position];
    }

    /** Look at the previous token. */
    private previous(): Token {
        return this.tokens[this.position - 1];
    }

    /** Consumes a token if and only if it matches. */
    private match(tokenType: TokenType): Token | null {
        if (!this.isAtEnd() && this.peekToken().type === tokenType) {
            return this.consume(tokenType);
        }
        return null;
    }

    /** Checks if we are at the end of parsing. */
    private isAtEnd() {
        return this.position >= this.tokens.length;
    }

    /** Throws an error. */
    private error(error: string): never {
        throw new Error(error);
    }
}
