// import { Expression, CaseExpression } from "../ast/expression";
import { BaseParser } from "./BaseParser";
// import { SelectStatementParser } from "../parser";
import { ExpressionNode, Operator } from "../ast/expression";
import { DebugToken, TokenType } from "../tokenizer";
import { SelectStatementParser } from "./SelectStatementParser";
import { SelectNode } from "../ast/select";

/** Parser for SQL based expressions. */
export class ExpressionParser extends BaseParser<ExpressionNode> {
    /** @override */
    protected parseInternal() {
        return this.expression();
    }

    /** Parses an expression. */
    private expression(): ExpressionNode {
        return this.booleanLogic();
    }

    /** Parses a boolean logic expression. */
    private booleanLogic(): ExpressionNode {
        if (this.matchAny(["not"])) {
            const start = this.previous().start;
            const argument = this.booleanLogic();
            return {
                type: "expression",
                subType: "operator",
                operator: "not",
                arguments: [argument],
                start,
                end: this.previous().end,
            };
        }

        return this.handleBinaryOperator(() => this.equality(), ["and", "or"]);
    }

    /** Handles the equality precedence level. */
    private equality(): ExpressionNode {
        const value = this.term();

        // Between needs some special handling since it's a ternary operator
        if (
            this.peek()?.type === "between" ||
            this.peek(2)?.type === "between"
        ) {
            const negate = !!this.match("not");
            this.consume("between");
            const left = this.term();
            this.consume("and");
            const right = this.term();
            return {
                type: "expression",
                subType: "operator",
                operator: "between",
                arguments: [value, left, right],
                negate: negate,
                start: value.start,
                end: right.end,
            };
        }

        // In also needs special handling
        if (this.peek()?.type === "in" || this.peek(2)?.type === "in") {
            const negate = !!this.match("not");
            this.consume("in");
            this.consume("leftParen");
            let list: SelectNode | ExpressionNode[];
            if (this.match("select")) {
                list = this.applySubParser(SelectStatementParser);
            } else {
                list = this.consumeMany(() => this.expression(), "comma");
            }
            const right = this.consume("rightParen");
            return {
                type: "expression",
                subType: "in",
                expression: value,
                list,
                negate: negate,
                start: value.start,
                end: right.end,
            };
        }
        return this.handleBinaryOperator(
            () => this.term(),
            [
                "equal",
                "lessThan",
                "greaterThan",
                "lessThanEqual",
                "greaterThanEqual",
                "is",
                "notEqual",
            ],
            value
        );
    }

    private term(): ExpressionNode {
        return this.handleBinaryOperator(
            () => this.factor(),
            ["plus", "minus"]
        );
    }

    /** Handles factors (* and /) */
    private factor(): ExpressionNode {
        return this.handleBinaryOperator(() => this.unary(), ["star", "slash"]);
    }

    /** Handles the unary precedence level. */
    private unary(): ExpressionNode {
        if (this.matchAny(["minus", "plus"])) {
            const start = this.previous().start;
            const argument = this.unary();
            return {
                type: "expression",
                subType: "operator",
                operator: "negate",
                arguments: [argument],
                start,
                end: this.previous().end,
            };
        }
        return this.primary();
    }

    /** Handles the primary tokens (highest precedence). */
    private primary(): ExpressionNode {
        const token = this.consume();
        switch (token.type) {
            case "literal":
                return {
                    type: "expression",
                    subType: "literal-value",
                    value: token.literal,
                    start: token.start,
                    end: token.end,
                };
            case "identifier":
                if (this.peek()?.type === "leftParen") {
                    return this.functionExpression();
                } else {
                    return this.columnExpression();
                }
            case "case":
                return this.caseExpression();
            case "exists":
                this.consume("leftParen");
                return this.nestedSelect(token);
            case "leftParen":
                if (this.peek()?.type === "select") {
                    return this.nestedSelect(token);
                }
                const expression = this.expression();
                this.consume("rightParen");
                return expression;
            default:
                this.error(`Unknown primary token: ${token.type}`);
        }
    }

    /**
     * Handles the CASE construction.
     */
    private caseExpression(): ExpressionNode {
        const start = this.previous().start;

        // Set up the initial expression
        const initialExpression =
            this.peek()?.type === "when" ? undefined : this.expression();

        this.consume("when"); // Initial when case
        // Consume as many when/then pairs as we can.
        const when = this.consumeMany(() => {
            const when = this.expression();
            this.consume("then");
            const then = this.expression();
            return { when, then };
        }, "when");

        // Check for the optional else expression.
        const elseExpr = this.match("else") ? this.expression() : undefined;
        this.consume("end");

        return {
            type: "expression",
            subType: "case",
            when,
            initial: initialExpression,
            else: elseExpr,
            start,
            end: this.previous().end,
        };
    }

    /** Parses a column expression. */
    private columnExpression(): ExpressionNode {
        const previous = this.previous();
        let columnName, tableName;
        if (this.match("dot")) {
            columnName = this.consume("identifier").lexeme;
            tableName = previous.lexeme;
        } else {
            columnName = previous.lexeme;
            tableName = undefined;
        }

        return {
            type: "expression",
            subType: "column",
            columnName,
            tableName,
            start: previous.start,
            end: this.previous().end,
        };
    }

    /** Parses a function call */
    private functionExpression(): ExpressionNode {
        const previous = this.previous();
        let args: ExpressionNode[] = [];
        let wildcard = false;
        let distinct = false;

        this.match("leftParen");

        // Arguments are either star or a single
        // expression. We don't support airity above
        // 1 right now.
        if (this.match("star")) {
            wildcard = true;
        } else {
            if (this.match("distinct")) {
                distinct = true;
            }

            args = this.consumeMany(() => this.expression(), "comma");
        }

        this.match("rightParen");

        return {
            type: "expression",
            subType: "function-call",
            functionName: previous.lexeme,
            arguments: args,
            distinct,
            wildcard,
            start: previous.start,
            end: this.previous().end,
        };
    }

    private nestedSelect(start: DebugToken): ExpressionNode {
        const statement = this.applySubParser(SelectStatementParser);
        this.consume("rightParen");
        return {
            type: "expression",
            subType: "select",
            exists: start.type === "exists",
            statement,
            start: start.start,
            end: this.previous().end,
        };
    }
    /**
     * Handle a simple binary operator.
     * This takes in the lower level of precedence
     * and the tokens we should check for.
     * If no tokens are matched this just falls through to the lower
     * level.
     */
    private handleBinaryOperator(
        lower: () => ExpressionNode,
        tokens: TokenType[],
        initial?: ExpressionNode
    ): ExpressionNode {
        let value = initial || lower();
        while (this.matchAny(tokens)) {
            const operator = this.previous();
            // TODO: this isn't always true... but eh it'll
            // probably be fine.
            const isNegative = !!this.match("not");
            const right = lower();
            value = {
                type: "expression",
                subType: "operator",
                operator: this.getOperatorFromToken(operator.type),
                arguments: [value, right],
                start: value.start,
                end: this.previous().end,
                negate: isNegative,
            };
        }
        return value;
    }

    /** Get an operator type from a token type */
    private getOperatorFromToken(tokenType: TokenType): Operator {
        switch (tokenType) {
            case "star":
                return "multiply";
            case "slash":
                return "divide";
            case "plus":
                return "add";
            case "minus":
                return "subtract";
            case "equal":
            case "lessThan":
            case "lessThanEqual":
            case "greaterThan":
            case "greaterThanEqual":
            case "and":
            case "or":
            case "is":
            case "notEqual":
                return tokenType;
            default:
                this.error(`Bad operator: ${tokenType}`);
        }
    }
}
