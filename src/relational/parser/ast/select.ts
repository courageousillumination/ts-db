import { Expression } from "./expression";

export interface ExpressionResultColumn {
    type: "expression";
    expression: Expression;
}

export interface WildCardResultColumn {
    type: "wildcard";
}

export type ResultColumn = WildCardResultColumn | ExpressionResultColumn;

export interface SelectClause {
    columns: ResultColumn[];
}

export interface FromClause {
    table: string;
}

export interface SelectStatement {
    type: "select";
    selectClause: SelectClause;
    fromClause: FromClause;
    whereClause?: Expression;
}
