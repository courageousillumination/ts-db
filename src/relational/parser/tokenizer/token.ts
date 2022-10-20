type Keyword =
    | "select"
    | "from"
    | "insert"
    | "into"
    | "create"
    | "table"
    | "integer"
    | "order"
    | "by"
    | "values"
    | "where"
    | "set"
    | "update";

type SpecialCharacter =
    | "star"
    | "leftParen"
    | "rightParen"
    | "comma"
    | "semicolon"
    | "equal"
    | "greaterThan";

export type TokenType = Keyword | SpecialCharacter | "literal" | "identifier";

export type Token = {
    type: TokenType;
    lexeme: string;
    literal?: unknown;
};
