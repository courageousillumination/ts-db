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
    // Between
    | "between"
    // In
    | "in"
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
    | "index"
    | "table"
    | "integer"
    | "string"
    | "primary"
    | "key"
    | "varchar"
    | "on"
    // UPDATE statements
    | "update"
    | "set"
    // Compound operators
    | "union"
    | "all"
    | "intersect"
    | "except";

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
