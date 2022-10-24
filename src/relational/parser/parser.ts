import { ColumnType, CreateStatement } from "./ast/create";
import { Expression, CaseExpression } from "./ast/expression";
import { InsertStatement } from "./ast/insert";
import {
    FromClause,
    OrderByClause,
    OrderByTerm,
    ResultColumn,
    SelectClause,
    SelectStatement,
} from "./ast/select";
import { Statement } from "./ast/statement";
import { UpdateStatement } from "./ast/update";
import { Token, tokenize, TokenType } from "./tokenizer";

abstract class BaseParser<T> {
    constructor(
        protected readonly tokens: Token[],
        protected position: number
    ) {}

    public parse(): { result: T; position: number } {
        return {
            result: this.parseInternal(),
            position: this.position,
        };
    }

    protected abstract parseInternal(): T;

    /** Applies a sub parser. */
    protected applySubParser<TRet>(
        parser: new (tokens: Token[], position: number) => BaseParser<TRet>
    ) {
        const instance = new parser(this.tokens, this.position);
        const { result, position } = instance.parse();
        this.position = position; // Update based on the sub parser.
        return result;
    }

    /** Consumes a token, optionally checking the type. */
    protected consume(type?: TokenType) {
        if (this.isAtEnd()) {
            this.error(`Unexpected end of input. Expected ${type}`);
        }

        const token = this.tokens[this.position++];

        if (type && type !== token.type) {
            this.error(`Expected ${type} but found ${token.type}`);
        }
        return token;
    }

    /** Consumes a token, only if it matches a given type */
    protected match(type: TokenType) {
        if (this.peek()?.type === type) {
            return this.consume(type);
        }
        return null;
    }

    /** Look at the next token. */
    protected peek() {
        if (this.isAtEnd()) {
            return null;
        }
        return this.tokens[this.position];
    }

    /** Checks if the parser is at the end of the input */
    protected isAtEnd() {
        return this.position >= this.tokens.length;
    }

    /** Consumes a repeated list */
    protected consumeMany<ConsumeT>(
        consumer: () => ConsumeT | null,
        seperator?: TokenType
    ): ConsumeT[] {
        const results = [];
        let result = consumer();
        while (result) {
            results.push(result);
            if (seperator) {
                if (!this.match(seperator)) {
                    break;
                }
            }
            result = consumer();
        }
        return results;
    }

    /** Throws an error. */
    protected error(message: string): never {
        throw new Error(message);
    }
}

/** Parser for SQL based expressions. */
export class ExpressionParser extends BaseParser<Expression> {
    protected parseInternal() {
        return this.expression();
    }

    private expression(): Expression {
        if (this.match("case")) {
            return this.caseExpression();
        }
        // Everything else after case follows parser
        // precedence rules, starting with boolean logic.
        return this.booleanLogic();
    }

    /** Parses a case expression. */
    private caseExpression(): CaseExpression {
        const when = this.consumeMany(() => {
            if (!this.match("when")) {
                return null;
            }
            const when = this.expression();
            this.consume("then");
            const then = this.expression();
            return { when, then };
        });
        let elseExpr;
        if (this.match("else")) {
            elseExpr = this.expression();
        }

        this.consume("end");

        return {
            type: "case",
            when,
            else: elseExpr,
        };
    }
    /** Attempts to parse an OR expression. */
    private booleanLogic(): Expression {
        const left = this.equality();
        return this.binaryOperator(left, ["and", "or"]);
    }

    /** Check for equality expressions. */
    private equality(): Expression {
        const left = this.term();
        return this.binaryOperator(left, ["equal", "lessThan", "greaterThan"]);
    }

    /** Checks for terms (using + and binary -) */
    private term(): Expression {
        const left = this.factor();
        return this.binaryOperator(left, ["plus", "minus"]);
    }

    /** Check for factors (binary using * and /) */
    private factor(): Expression {
        const left = this.unary();
        return this.binaryOperator(left, ["star", "slash"]);
    }

    /** Handles the unary operation `-` */
    private unary(): Expression {
        if (this.match("minus")) {
            return {
                type: "unary",
                operator: "minus",
                expression: this.unary(),
            };
        }
        return this.primary();
    }

    /** Check for primary and highest precedence operations. */
    private primary(): Expression {
        const token = this.consume();

        // Handle literal values.
        if (token.type === "literal") {
            return { type: "value", value: token.literal };
        }

        // Handle variable names
        if (token.type === "identifier") {
            return { type: "variable", name: token.lexeme };
        }

        // Handle groupings
        if (token.type === "leftParen") {
            const expression = this.expression();
            this.consume("rightParen");
            return expression;
        }
        // We don't know what to do with this token.
        this.error(`Unexpected primary token ${token.type}`);
    }

    /** Attempt to construct a binary expression using one of the given operators. */
    private binaryOperator(
        left: Expression,
        operators: TokenType[]
    ): Expression {
        for (const operator of operators) {
            if (this.match(operator)) {
                const right = this.expression();
                return {
                    type: "binary",
                    left,
                    right,
                    operator,
                };
            }
        }
        // No match found, so just return the left
        return left;
    }
}

export class SelectStatementParser extends BaseParser<SelectStatement> {
    protected parseInternal() {
        return this.selectStatement();
    }

    private selectStatement(): SelectStatement {
        this.consume("select");
        const columns: ResultColumn[] = this.consumeMany(() => {
            if (this.match("star")) {
                return { type: "wildcard" };
            }
            const expression = this.applySubParser(ExpressionParser);
            return { type: "expression", expression };
        }, "comma");

        this.consume("from");
        const table = this.tableName();

        let whereClause;
        if (this.match("where")) {
            whereClause = this.applySubParser(ExpressionParser);
        }

        return {
            type: "select",
            selectClause: {
                columns,
            },
            fromClause: { table },
            whereClause,
        };
    }

    private tableName() {
        const token = this.consume("identifier");
        return token.lexeme;
    }
}

/** Parses any kind of statement. */
export class StatementParser extends BaseParser<Statement> {
    protected parseInternal(): Statement {
        const token = this.peek();
        if (!token) {
            this.error("Unexpected end of input.");
        }
        if (token.type === "select") {
            return this.applySubParser(SelectStatementParser);
        }

        this.error(`Unexpected start of statement ${token.type}`);
    }
}

/** Utility function to run the entire parsing. */
export const parse = (input: string) => {
    const tokens = tokenize(input);
    const parser = new StatementParser(tokens, 0);
    const { result } = parser.parse();
    return result;
};

// /**
//  * Parses a query string into a set of statements.
//  * @param query
//  */
// export const parse = (query: string): Statement[] => {
//     const tokens = tokenize(query);
//     const parser = new Parser(tokens);
//     return parser.parse();
// };

// class Parser {
//     private position = 0;
//     constructor(private readonly tokens: Token[]) {}

//     public parse(): Statement[] {
//         const statements: Statement[] = [];

//         while (!this.isAtEnd()) {
//             statements.push(this.statement());
//             // All statements must end with a semi-colon
//             this.consume("semicolon");
//         }

//         return statements;
//     }

//     /** Parses a full statement of any kind.*/
//     public statement(): Statement {
//         const token = this.consume();
//         switch (token.type) {
//             case "select":
//                 return this.selectStatement();
//             case "insert":
//                 return this.insertStatement();
//             case "create":
//                 return this.createStatement();
//             case "update":
//                 return this.updateStatement();
//             default: // Hacky....
//                 // Try parsing as a simple expression statement.
//                 this.position--;
//                 return { type: "expression", expression: this.expression() };
//         }
//     }

//     /**  */

//     private updateStatement(): UpdateStatement {
//         const table = this.table();
//         this.consume("set");
//         // Kind of janky that we need an end token here.
//         const assignments = this.consumeList(() => {
//             const columnName = this.columnName();
//             this.consume("equal");
//             const expression = this.expression();
//             return { columnName, expression };
//         }, "where");
//         let where;
//         if (this.previous().type === "where") {
//             where = this.expression();
//         }

//         return { type: "update", table, assignments, whereClause: where };
//     }

//     private createStatement(): CreateStatement {
//         this.consume("table");
//         const table = this.table();
//         this.consume("leftParen");
//         const columns = this.consumeList(() => {
//             const name = this.columnName();
//             const type = this.columnType();
//             return { name, type };
//         }, "rightParen");
//         return {
//             type: "create",
//             table,
//             columns,
//         };
//     }

//     private columnName() {
//         const token = this.consume("identifier");
//         return token.lexeme;
//     }

//     private columnType(): ColumnType {
//         if (this.match("integer")) {
//             return "integer";
//         }
//         this.error("Unknown column type");
//         // if (this.match('string'))
//     }

//     private insertStatement(): InsertStatement {
//         this.consume("into");
//         const table = this.table();
//         let columns;
//         if (!this.match("values")) {
//             this.consume("leftParen");
//             columns = this.consumeList(() => {
//                 const token = this.consume("identifier");
//                 return token.lexeme;
//             }, "rightParen");
//             this.consume("values");
//         }
//         this.consume("leftParen");
//         const values = this.consumeList(() => this.expression(), "rightParen");

//         return {
//             type: "insert",
//             insertClause: {
//                 table,
//                 columns,
//             },
//             valuesClause: { values },
//         };
//     }

//     /** Parses a select statement specifically. */
//     private selectStatement(): SelectStatement {
//         const selectClause = this.selectClause(); // Note: This consumes the FROM
//         const fromClause = this.fromClause();
//         const whereClause = this.match("where") ? this.expression() : undefined;
//         const orderByClause = this.match("order")
//             ? this.orderByClause()
//             : undefined;
//         return {
//             type: "select",
//             selectClause,
//             fromClause,
//             whereClause,
//             orderByClause,
//         };
//     }

//     private orderByClause(): OrderByClause {
//         this.consume("by");
//         const orderBy: OrderByTerm[] = this.consumeList(() => {
//             const expression = this.expression();
//             let direction: "asc" | "desc" = "asc";
//             if (this.match("asc")) {
//                 direction = "asc";
//             } else if (this.match("desc")) {
//                 direction = "desc";
//             }
//             return {
//                 expression,
//                 direction,
//             };
//         }, "semicolon"); // A bit janky... Will need to revisit.

//         if (this.previous().type === "semicolon") {
//             this.position--; // Give it back in a state where others can actually parse.
//         }

//         return {
//             orderBy,
//         };
//     }
//     private selectClause(): SelectClause {
//         const columns = this.consumeList(() => this.resultColumn(), "from");
//         return { columns };
//     }

//     /** A result column that belongs to a select clause. */
//     private resultColumn(): ResultColumn {
//         if (this.match("star")) {
//             return { type: "wildcard" };
//         }

//         const expression = this.expression();
//         return { type: "expression", expression };
//     }

//     private fromClause(): FromClause {
//         const table = this.table();
//         return { table };
//     }

//     private table(): string {
//         const token = this.consume("identifier");
//         return token.lexeme;
//     }

//     // Expression parsing

//     /**
//      * Parses an expression.
//      * @returns
//      */
//     private expression(): Expression {
//         return this.equality();
//     }

//     private equality(): Expression {
//         const left = this.primary();

//         for (const tokenType of [
//             "greaterThan",
//             "equal",
//             "lessThan",
//             "star",
//             "plus",
//             "slash",
//             "minus", // TODO: Actually pull these out so we get precedence.
//         ] as TokenType[]) {
//             const operator = this.match(tokenType);
//             if (operator) {
//                 const right = this.expression();
//                 return {
//                     type: "binary",
//                     left,
//                     right,
//                     operator: operator.lexeme,
//                 };
//             }
//         }
//         return left;
//     }

//     private primary(): Expression {
//         if (this.match("case")) {
//             return this.caseExpression();
//         }

//         if (this.match("literal")) {
//             return { type: "value", value: this.previous().literal };
//         }
//         if (this.match("identifier")) {
//             return { type: "columnName", name: this.previous().lexeme };
//         }
//         if (this.match("leftParen")) {
//             if (this.match("select")) {
//                 this.consume("select");
//                 const selectStatement = this.selectStatement();
//                 this.consume("rightParen");
//                 return { type: "select", statement: selectStatement };
//             } else {
//                 const expression = this.expression(); // Do I need a special grouping expression?
//                 this.consume("rightParen");
//                 return expression;
//             }
//         }
//         if (this.match("avg") || this.match("count")) {
//             this.consume("leftParen");
//             let argument: Expression | "star";
//             if (this.match("star")) {
//                 argument = "star";
//             } else {
//                 argument = this.expression();
//             }
//             this.consume("rightParen");
//             return {
//                 type: "function",
//                 argument: argument,
//                 name: "avg",
//             };
//         }
//         this.error(`Unhandled primary expression ${this.peekToken().type}`);
//     }

//     private caseExpression(): Expression {
//         const whenList = [];
//         let elseExpression;
//         while (this.match("when")) {
//             const when = this.expression();
//             this.consume("then");
//             const then = this.expression();
//             whenList.push({ when, then });
//         }

//         if (this.match("else")) {
//             elseExpression = this.expression();
//         }

//         this.consume("end");

//         return {
//             type: "case",
//             when: whenList,
//             else: elseExpression,
//         };
//     }

//     // UTILITIES

//     /**
//      * Parses a list of items, seperated by commas.
//      * Returns the parsed syntax nodes
//      */
//     private consumeList<T>(getter: () => T, end: TokenType) {
//         const results = [];
//         while (!this.match(end) && !this.isAtEnd()) {
//             results.push(getter());
//             this.match("comma"); // Note: trailing comms allowed
//         }
//         return results;
//     }

//     /** Consumes a token, with optional type checking */
//     private consume(tokenType?: TokenType) {
//         if (this.isAtEnd()) {
//             this.error("Unexpected end of input");
//         }
//         const token = this.tokens[this.position++];
//         if (tokenType && token.type !== tokenType) {
//             this.error(`Expected ${tokenType} but got ${token.type}`);
//         }
//         return token;
//     }

//     /** Look at the next token. */
//     private peekToken(): Token {
//         return this.tokens[this.position];
//     }

//     /** Look at the previous token. */
//     private previous(): Token {
//         return this.tokens[this.position - 1];
//     }

//     /** Consumes a token if and only if it matches. */
//     private match(tokenType: TokenType): Token | null {
//         if (!this.isAtEnd() && this.peekToken().type === tokenType) {
//             return this.consume(tokenType);
//         }
//         return null;
//     }

//     /** Checks if we are at the end of parsing. */
//     private isAtEnd() {
//         return this.position >= this.tokens.length;
//     }

//     /** Throws an error. */
//     private error(error: string): never {
//         throw new Error(error);
//     }
// }
