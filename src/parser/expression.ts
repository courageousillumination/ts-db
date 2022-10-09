export interface SelectClause {
    columns: string[]
}

export interface FromClause {
    table: string
}

export interface InsertIntoClause {
    table: string
}

export interface ValuesClause {
    values: unknown[] // Can be varying types
}


export type ColumnType = 'integer'

export interface ColumnSchema {
    name: string,
    type: ColumnType
}

export interface SelectExpression {
    type: 'select'
    select: SelectClause
    from: FromClause
    // Other optional clauses can go here
}

export interface InsertIntoExpression {
    type: 'insertInto'
    insertInto: InsertIntoClause
    values: ValuesClause
}



export interface CreateTableExpression {
    type: 'createTable',
    tableName: string
    columns: ColumnSchema[]
}

export type Expression = SelectExpression | InsertIntoExpression | CreateTableExpression