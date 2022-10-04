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


export type Expression = SelectExpression | InsertIntoExpression