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

export type Expression =
    | ValueExpression
    | BinaryExpression
    | ColumnNameExpression;
