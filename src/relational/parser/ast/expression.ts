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

    /** Else expression. */
    else?: Expression;
}

/**
 * Represents a variable. Will mostly be
 * referring to a column, but could also be
 * a function
 * TODO: Is this right?
 */
export interface VariableExpression {
    type: "variable";
    name: string;
}

// TODO

// export interface SelectExpression {
//     type: "select";
//     statement: SelectStatement;
// }

// export interface FunctionExpression {
//     type: "function";
//     name: string;
//     argument: Expression | "star";
// }

export type Expression =
    | ValueExpression
    | BinaryExpression
    | VariableExpression
    | CaseExpression
    | UnaryExpression;
