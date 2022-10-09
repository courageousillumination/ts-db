import { Expression } from "./expression"

type ColumnType = 'integer'

interface ColumnDefinition {
    name: string,
    type: ColumnType
}

// Doesn't actually exist in SQL, but whatever.
export interface ExpresisonStatement {
    type: 'expression',
    expression: Expression
}

export interface SelectStatement {
    type: 'select',
    table: string,
    columns: Expression[]
}

export interface InsertStatement {
    type: 'insert',
    table: string,
    values: Expression[]
    columns?: string[]
}

export interface CreateTableStatement {
    type: 'createTable'
    table: string
    columnDefinitions: ColumnDefinition[]
}

export type Statement = ExpresisonStatement | SelectStatement | InsertStatement | CreateTableStatement