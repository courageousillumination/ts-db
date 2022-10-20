export type ColumnType = "integer" | "string";
export interface ColumnDefinition {
    name: string;
    type: ColumnType;
}

export interface CreateStatement {
    type: "create";
    table: string;
    columns: ColumnDefinition[];
}
