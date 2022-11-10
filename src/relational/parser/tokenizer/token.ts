import { WithStartAndEnd } from "../debug/position";

// Possible keywords
type Keyword =
    // Binary operations
    | "and"
    | "not"
    | "or"
    // Equality
    | "equal"
    | "lessThan"
    | "greaterThan"
    | "is"
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
    | "distinct"
    // INSERT statements
    | "insert"
    | "values"
    | "into"
    // CREATE statements
    | "create"
    | "table"
    | "integer"
    | "string"
    | "primary"
    | "key"
    | "varchar"
    // UPDATE statements
    | "update"
    | "set";

/** Special characters. */
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
    | "dot"
    | "notEqual";

/**
 * Possible token types: keywords, special characters, identifiers, and literals.
 */
export type TokenType = Keyword | SpecialCharacter | "literal" | "identifier";

/** A token interpreted from the source. */
export type Token = {
    /** Type of token. */
    type: TokenType;

    /** Raw lexeme from the source. */
    lexeme: string;

    /** Literal value (only if type === 'literal') */
    literal?: unknown;
};

/** A token with debug information. */
export type DebugToken = WithStartAndEnd<Token>;
