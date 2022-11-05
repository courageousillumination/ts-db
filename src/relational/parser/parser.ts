import { ColumnDefinition, CreateStatement, ColumnType } from "./ast/create";
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

    /** Like match, but returns the first item in the array that matches. */
    protected matchAny(types: TokenType[]) {
        for (const type of types) {
            const result = this.match(type);
            if (result) {
                return result;
            }
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

    /** Returns the previous token (makes some matching easier). */
    protected previous() {
        return this.tokens[this.position - 1];
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
        // TODO: I'm not 100% sure this is correct, but
        // I think case has some of the lowest precedence
        // (and doesn't really make sense in the precedence system?).
        if (this.match("case")) {
            return this.caseExpression();
        }

        return this.booleanLogic();
    }

    /** Parses a case expression. */
    private caseExpression(): CaseExpression {
        let initialExpression;
        if (this.peek()?.type !== "when") {
            initialExpression = this.expression();
        }

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
            initial: initialExpression,
            else: elseExpr,
        };
    }

    /** Attempts to parse an OR expression. */
    private booleanLogic(): Expression {
        let expr = this.equality();
        while (this.matchAny(["and", "or"])) {
            const operator = this.previous();
            const right = this.equality();
            expr = {
                type: "binary",
                left: expr,
                right,
                operator: operator.type,
            };
        }
        return expr;
    }

    /** Check for equality expressions. */
    private equality(): Expression {
        let expr = this.term();

        // Check for the single ternary operator "BETWEEN"
        if (
            this.match("between") ||
            // A bit of a janky way to detect not between
            // And it doesn't even really work. TODO: Fix me.
            (this.match("not") && this.match("between"))
        ) {
            const expression2 = this.term();
            this.consume("and");
            const expression3 = this.term();
            return {
                type: "ternary",
                operator: "between",
                expr1: expr,
                expr2: expression2,
                expr3: expression3,
            };
        }
        while (
            this.matchAny([
                "equal",
                "lessThan",
                "greaterThan",
                "lessThanEqual",
                "greaterThanEqual",
            ])
        ) {
            const operator = this.previous();
            const right = this.term();
            expr = {
                type: "binary",
                left: expr,
                right,
                operator: operator.type,
            };
        }
        return expr;
    }

    /** Checks for terms (using + and binary -) */
    private term(): Expression {
        let expr = this.factor();
        while (this.matchAny(["plus", "minus"])) {
            const operator = this.previous();
            const right = this.factor();
            expr = {
                type: "binary",
                left: expr,
                right,
                operator: operator.type,
            };
        }
        return expr;
    }

    /** Check for factors (binary using * and /) */
    private factor(): Expression {
        let expr = this.unary();
        while (this.matchAny(["star", "slash"])) {
            const operator = this.previous();
            const right = this.unary();
            expr = {
                type: "binary",
                left: expr,
                right,
                operator: operator.type,
            };
        }
        return expr;
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
            // Check for function calls
            if (this.match("leftParen")) {
                const argument: "star" | Expression = this.match("star")
                    ? "star"
                    : this.expression();
                this.consume("rightParen");
                return {
                    type: "function",
                    name: token.lexeme.toLowerCase(),
                    argument,
                };
            }

            // We now enter the column handling. Columns can have an optional
            // table ahead of time. So check if the next token is a '.'. If so
            // the token we have is the table and the next is a column
            if (this.match("dot")) {
                const column = this.consume("identifier");
                return {
                    type: "column",
                    column: column.lexeme,
                    table: token.lexeme,
                };
            } else {
                return { type: "column", column: token.lexeme };
            }
        }

        // Handle groupings
        if (token.type === "leftParen") {
            if (this.peek()?.type === "select") {
                const select = this.applySubParser(SelectStatementParser);
                this.consume("rightParen");
                return { type: "select", statement: select };
            }

            const expression = this.expression();
            this.consume("rightParen");
            return expression;
        }

        // Handle exists (I'm not really sure where this should live...)
        if (token.type === "exists") {
            this.consume("leftParen");
            const select = this.applySubParser(SelectStatementParser);
            this.consume("rightParen");
            return { type: "select", statement: select, exists: true };
        }
        // We don't know what to do with this token.
        this.error(`Unexpected primary token ${token.type}`);
    }
}

/** Parser for handling select statements. */
export class SelectStatementParser extends BaseParser<SelectStatement> {
    protected parseInternal() {
        return this.selectStatement();
    }

    /** Parses a select statement. */
    private selectStatement(): SelectStatement {
        this.consume("select");
        const columns: ResultColumn[] = this.consumeMany(() => {
            if (this.match("star")) {
                return { type: "wildcard" };
            }
            const expression = this.applySubParser(ExpressionParser);
            return { type: "expression", expression };
        }, "comma");

        const fromClause = this.fromClause();

        let whereClause;
        if (this.match("where")) {
            whereClause = this.applySubParser(ExpressionParser);
        }

        const orderByClause = this.orderByClause();

        return {
            type: "select",
            selectClause: {
                columns,
            },
            fromClause,
            whereClause,
            orderByClause,
        };
    }

    /** handles an order by. */
    private orderByClause(): OrderByClause | undefined {
        if (!this.match("order")) {
            return undefined;
        }
        this.match("by");
        const terms: OrderByTerm[] = this.consumeMany(() => {
            const expr = this.applySubParser(ExpressionParser);
            let direction: "asc" | "desc";
            if (this.match("desc")) {
                direction = "desc";
            } else {
                this.match("asc");
                direction = "asc";
            }
            return { expression: expr, direction };
        }, "comma");
        return { orderBy: terms };
    }

    /** Parses the from clause with optional alias. */
    private fromClause() {
        this.consume("from");
        const table = this.tableName();

        const alias = this.match("as") ? this.consume("identifier") : undefined;
        return {
            table,
            alias: alias?.lexeme,
        };
    }

    private tableName() {
        const token = this.consume("identifier");
        return token.lexeme;
    }
}

export class InsertStatementParser extends BaseParser<InsertStatement> {
    protected parseInternal() {
        return this.insertStatement();
    }

    private insertStatement(): InsertStatement {
        const insertClause = this.insertClause();
        const valuesClause = this.valuesClause();

        return {
            type: "insert",
            insertClause,
            valuesClause,
        };
    }

    /** Handles the inserrt clause of an insert statement. */
    private insertClause() {
        this.consume("insert");
        this.consume("into");
        const table = this.consume("identifier");
        let columns;
        if (this.match("leftParen")) {
            columns = this.consumeMany(() => {
                const token = this.consume("identifier");
                return token.lexeme;
            }, "comma");
            this.consume("rightParen");
        }
        return { table: table.lexeme, columns };
    }

    /** Handles the values clause of an insert statement. */
    private valuesClause() {
        this.consume("values");
        this.match("leftParen");
        const values = this.consumeMany(() => {
            return this.applySubParser(ExpressionParser);
        }, "comma");
        this.consume("rightParen");
        return { values };
    }
}

export class CreateStatementParser extends BaseParser<CreateStatement> {
    protected parseInternal() {
        return this.createStatement();
    }

    private createStatement(): CreateStatement {
        this.consume("create");
        this.consume("table");
        const table = this.consume("identifier");
        this.consume("leftParen");
        const columns: ColumnDefinition[] = this.consumeMany(() => {
            const name = this.consume("identifier");
            const type = this.matchAny(["integer"]);
            if (!type) {
                this.error(`Unknown column type ${this.previous().lexeme}`);
            }
            return { name: name.lexeme, type: type.lexeme as ColumnType };
        }, "comma");
        this.consume("rightParen");
        return { type: "create", table: table.lexeme, columns };
    }
}

export class UpdateStatementParser extends BaseParser<UpdateStatement> {
    protected parseInternal(): UpdateStatement {
        return this.updateStatement();
    }

    private updateStatement(): UpdateStatement {
        this.consume("update");
        const table = this.consume("identifier");
        this.consume("set");
        const assignments = this.consumeMany(() => {
            const columnName = this.consume("identifier");
            this.consume("equal");
            const expression = this.applySubParser(ExpressionParser);
            return { columnName: columnName.lexeme, expression };
        }, "comma");
        const whereClause = this.match("where")
            ? this.applySubParser(ExpressionParser)
            : undefined;

        return {
            type: "update",
            table: table.lexeme,
            assignments,
            whereClause,
        };
    }
}

/** Parses any kind of statement. */
export class StatementParser extends BaseParser<Statement[]> {
    protected parseInternal(): Statement[] {
        const statements = [];
        while (!this.isAtEnd()) {
            const statement = this.parseStatement();
            statements.push(statement);
            if (!this.isAtEnd()) {
                this.consume("semicolon");
            }
        }
        return statements;
    }

    private parseStatement() {
        const token = this.peek();
        if (!token) {
            this.error("Unexpected end of input.");
        }

        switch (token.type) {
            case "select":
                return this.applySubParser(SelectStatementParser);
            case "insert":
                return this.applySubParser(InsertStatementParser);
            case "create":
                return this.applySubParser(CreateStatementParser);
            case "update":
                return this.applySubParser(UpdateStatementParser);
            default:
                this.error(`Unexpected start of statement ${token.type}`);
        }
    }
}

/** Utility function to run the entire parsing. */
export const parse = (input: string) => {
    const tokens = tokenize(input);
    const parser = new StatementParser(tokens, 0);
    const { result, position } = parser.parse();
    if (position < tokens.length) {
        throw new Error(
            `Parser did not consume all input; ending token ${position}`
        );
    }
    return result;
};
