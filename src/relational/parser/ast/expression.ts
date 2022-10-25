import { TokenType } from "../tokenizer";
import { SelectStatement } from "./select";

/** An expression that is a literal value. */
export interface ValueExpression {
    type: "value";

    /** Value (as a JS value.) */
    value: unknown;
}

/** An expression with two sides and an operator. */
export interface BinaryExpression {
    type: "binary";

    /** Left side of the expression. */
    left: Expression;

    /** Right side of the expression. */
    right: Expression;

    /** Operator will be a token type */
    operator: TokenType;
}

/** An expression with a single operator. */
export interface UnaryExpression {
    type: "unary";

    /** The operator. */
    operator: TokenType;

    /** The expression to apply the operator over. */
    expression: Expression;
}

/** An operator with three arguments (just BETWEEN) */
export interface TernaryExpression {
    type: "ternary";

    /** The operator */
    operator: TokenType;

    /** All three expressions in order. */
    expr1: Expression;
    expr2: Expression;
    expr3: Expression;
}

/** A single When/Then case in a CASE expression. */
export interface CaseWhen {
    /** Expression for evaluating the condition. */
    when: Expression;

    /** Resulting expression. */
    then: Expression;
}

/** A CASE expression with When/Then pairs and an optional ELSE. */
export interface CaseExpression {
    type: "case";
    /** When/Then pairs. */
    when: CaseWhen[];

    /**
     * Initial expression that should be compared against all cases.
     * If omitted cases are checked for truthiness.
     */
    initial?: Expression;

    /** Else expression. */
    else?: Expression;
}

/**
 * Represents a column (optional table)
 */
export interface ColumnExpression {
    type: "column";

    /** Column name. */
    column: string;

    /** Optional table where this column exists. */
    table?: string;
}

/**
 * Represents a function call expression.
 * Can have a single argument which is either an expression
 * or the `*` special.
 */
export interface FunctionExpression {
    type: "function";
    name: string;
    argument: Expression | "star";
}

/** Represents a nested select statement. */
export interface SelectStatementExpression {
    type: "select";

    /** Is this checking for existence? */
    exists?: boolean;

    /** The select statement to be executed. */
    statement: SelectStatement;
}

export type Expression =
    | ValueExpression
    | BinaryExpression
    | ColumnExpression
    | TernaryExpression
    | CaseExpression
    | UnaryExpression
    | FunctionExpression
    | SelectStatementExpression;
