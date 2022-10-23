import { SelectStatement } from "./select";

export interface ValueExpression {
    type: "value";
    value: unknown;
}

export interface ColumnNameExpression {
    type: "columnName";
    name: string;
}

export interface BinaryExpression {
    type: "binary";
    left: Expression;
    right: Expression;
    operator: string;
}

export interface CaseWhen {
    when: Expression;
    then: Expression;
}

export interface CaseExpression {
    type: "case";
    when: CaseWhen[];
    else?: Expression;
}

export interface SelectExpression {
    type: "select";
    statement: SelectStatement;
}

export interface FunctionExpression {
    type: "function";
    name: string;
    argument: Expression | "star";
}

export type Expression =
    | ValueExpression
    | BinaryExpression
    | ColumnNameExpression
    | CaseExpression
    | SelectExpression
    | FunctionExpression;
