export interface ColumnSchema {
    name: string
    type: 'integer'
}

export interface TableSchema {
    columns: ColumnSchema[]
}