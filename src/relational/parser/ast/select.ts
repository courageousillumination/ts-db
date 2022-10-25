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
    alias?: string;
}

export interface OrderByTerm {
    expression: Expression;
    direction?: "asc" | "desc";
}
export interface OrderByClause {
    orderBy: OrderByTerm[];
}

export interface SelectStatement {
    type: "select";
    selectClause: SelectClause;
    fromClause: FromClause;
    whereClause?: Expression;
    orderByClause?: OrderByClause;
}
