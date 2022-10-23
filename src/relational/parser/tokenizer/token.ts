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
    | "update"
    | "asc"
    | "desc"
    | "limit"
    | "case"
    | "then"
    | "when"
    | "end"
    | "else"
    | "avg" // Functions as keywords is janky as all hell...
    | "count";

type SpecialCharacter =
    | "star"
    | "leftParen"
    | "rightParen"
    | "comma"
    | "semicolon"
    | "equal"
    | "greaterThan"
    | "plus"
    | "slash"
    | "minus"
    | "lessThan";

export type TokenType = Keyword | SpecialCharacter | "literal" | "identifier";

export type Token = {
    type: TokenType;
    lexeme: string;
    literal?: unknown;
};
