/** The AST nodes that make up expressions. */
import { BaseNode } from "./base-node";
import { SelectNode } from "./select";

/**
 * All expressions use the base type "expression"
 * and have a sub type to help identify what the node itself is.`
 */
interface BaseExpressionNode extends BaseNode {
    type: "expression";
}

export type Operator =
    | "negate"
    | "multiply"
    | "divide"
    | "add"
    | "subtract"
    | "equal"
    | "greaterThan"
    | "greaterThanEqual"
    | "lessThan"
    | "lessThanEqual"
    | "between"
    | "and"
    | "or";

/** A node that has a literal value. */
export interface LiteralValueExpresisonNode extends BaseExpressionNode {
    subType: "literal-value";

    /** The value stored by this expression. */
    value: unknown;
}

/** When/Then pair. */
export interface WhenThen {
    /** When expression. */
    when: ExpressionNode;

    /** Then expression */
    then: ExpressionNode;
}

/** A node for handling case expressions. */
export interface CaseExpressionNode extends BaseExpressionNode {
    subType: "case";

    /** When/Then pairs. */
    when: WhenThen[];

    /** Initial expression. */
    initial?: ExpressionNode;

    /** Else expression. */
    else?: ExpressionNode;
}

/** Expression nodes that involve an operator (unary, binary, and ternary) */
export interface OperatorExpressionNode extends BaseExpressionNode {
    subType: "operator";
    /** The operator to apply */
    operator: Operator;
    /** Arguments to apply to the operator. */
    arguments: ExpressionNode[];
    /** Whether the operator should be negated (at the same precedence). */
    negate?: boolean;
}

/** Expressions for a single column lookup. */
export interface ColumnExpressionNode extends BaseExpressionNode {
    subType: "column";
    /** Name of the column. */
    columnName: string;
    /** Name of the table. */
    tableName?: string;
}

/** A function call expression. */
export interface FunctionCallExpressionNode extends BaseExpressionNode {
    subType: "function-call";

    /** Name of the function to call */
    functionName: string;

    /** Arguments to the function. */
    arguments: ExpressionNode[];

    /** Is this function applied to wildcards. */
    wildcard?: boolean;

    /** Whether this function should use distinct. */
    distinct?: boolean;
}

export interface SelectExpressionNode extends BaseExpressionNode {
    subType: "select";

    /** The select statement to evaluate. */
    statement: SelectNode;

    /** Should this just be checked for existence. */
    exists?: boolean;
}

export type ExpressionNode =
    | LiteralValueExpresisonNode
    | OperatorExpressionNode
    | CaseExpressionNode
    | ColumnExpressionNode
    | FunctionCallExpressionNode
    | SelectExpressionNode;
