import { BaseNode } from "./base-node";
import { OrderByTerm } from "./select";

/** Types of columns. */
export type ColumnType = "integer" | "string";

/** A single column definition */
export interface ColumnDefinition {
    /** Name of the column. */
    name: string;
    /** Type of the column. */
    type: ColumnType;
    /** Whether this column should be marked as the primary column. */
    primary?: boolean;
}

export interface CreateNode extends BaseNode {
    type: "create";
    /** Name of the table to create. */
    table: string;
    /** Columns definitions */
    columns: ColumnDefinition[];
}

export interface CreateIndexNode extends BaseNode {
    type: "create-index";

    table: string;

    index: string;

    columns: { column: string; direction: "asc" | "desc" }[];
}
