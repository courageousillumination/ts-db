// import { Expression } from "./expression";
import { BaseNode } from "./base-node";
import { ExpressionNode } from "./expression";

/** A result column that should be evaluated as an expression. */
export interface ExpressionResultColumn {
    type: "expression";
    expression: ExpressionNode;
}

/** A result column that is a wild card. */
export interface WildCardResultColumn {
    type: "wildcard";
}

/** A result column is either a wildcard or an expression */
export type ResultColumn = WildCardResultColumn | ExpressionResultColumn;

/** Captures way to encode a table in the from statement. */
export interface FromTable {
    /** The real name of the table. */
    tableName: string;

    /** Alias to apply to this table. */
    alias?: string;
}

/** A single term in the order by. */
export interface OrderByTerm {
    expression: ExpressionNode;
    direction?: "asc" | "desc";
}

/** Represents a select statement in the AST. */
export interface SimpleSelectNode extends BaseNode {
    type: "select";
    /** Columns to select. */
    columns: ResultColumn[];
    /** The table to select from. */
    tables: FromTable[];
    /** Where clause */
    where?: ExpressionNode;
    /** Order by list. */
    orderBy?: OrderByTerm[];
}

export interface CompoundSelect {
    type: "compound-select";
    parts: CompoundSelectPart[];
    orderBy?: OrderByTerm[];
}

export interface CompoundSelectPart {
    select: SimpleSelectNode;
    compoundOperator: "union" | "unionAll" | "intersect" | "except" | "initial";
}

export type SelectNode = CompoundSelect | SimpleSelectNode;
