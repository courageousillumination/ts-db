type Keyword = 'select' | 'from' | 'insert' | 'into' | 'create' | 'table' | 'integer' | 'order' | 'by'
type SpecialCharacter = 'star' | 'leftParen' | 'rightParen' | 'comma' | 'semicolon' | 'greaterThan'


export type TokenType = Keyword | SpecialCharacter | 'literal' | 'identifier'
export type Token = {
    type: TokenType
    lexeme: string
    literal?: unknown
}