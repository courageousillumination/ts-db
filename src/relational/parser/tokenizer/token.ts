type Keyword =
    // Binary operations
    | "and"
    | "not"
    | "or"
    // Equality
    | "equal"
    | "lessThan"
    | "greaterThan"
    // Terms
    | "plus"
    | "minus"
    // Factors
    | "star"
    | "slash"
    // Case expressions
    | "case"
    | "when"
    | "then"
    | "else"
    | "end"
    // literals
    | "literal"
    // Nested SELECT
    | "exists"
    // between
    | "between"
    // SELECT statements
    | "select"
    | "from"
    | "where"
    | "group"
    | "order"
    | "by"
    | "as"
    | "asc"
    | "desc"
    // INSERT statements
    | "insert"
    | "values"
    | "into"
    // CREATE statements
    | "create"
    | "table"
    | "integer"
    | "string"
    // UPDATE statements
    | "update"
    | "set";

type SpecialCharacter =
    | "star"
    | "leftParen"
    | "rightParen"
    | "comma"
    | "semicolon"
    | "equal"
    | "greaterThan"
    | "greaterThanEqual"
    | "plus"
    | "slash"
    | "minus"
    | "lessThan"
    | "lessThanEqual"
    | "dot";

export type TokenType = Keyword | SpecialCharacter | "literal" | "identifier";

export type Token = {
    type: TokenType;
    lexeme: string;
    literal?: unknown;
};

/** Special tokens that include debug information. */
export interface DebugToken extends Token {
    line: number;
    character: number;
    // Raw position in the input string
    positionStart: number;
    positionEnd: number;
}
