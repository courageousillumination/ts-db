type Keyword = 'select' | 'from' | 'insert' | 'into' | 'create' | 'table' | 'integer'
type SpecialCharacter = 'star' | 'leftParen' | 'rightParen' | 'comma' | 'semicolon'


export type TokenType = Keyword | SpecialCharacter | 'literal' | 'identifier'
export type Token = {
    type: TokenType
    lexeme: string
    literal?: unknown
}