import { TokenType } from "./token"

export interface NumberLiteral {
    type: 'number'
    value: number
}

export interface StringLiteral {
    type: 'string'
    value: string
}

export type Literal = NumberLiteral | StringLiteral

export type LiteralExpression = {
    type: 'literal'
    literal: Literal
}

export type IdentifierExpression = {
    type: 'identifier',
    identifier: string
}

export type BinaryExpression = {
    type: 'binary',
    operator: TokenType,
    left: Expression,
    right: Expression
}

export type GroupingExpression = {
    type: 'grouping'
    expression: Expression
}



export type Expression = LiteralExpression | BinaryExpression | GroupingExpression | IdentifierExpression