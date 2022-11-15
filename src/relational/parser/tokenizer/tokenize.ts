import { SourcePosition } from "../debug/position";
import { TokenType, DebugToken } from "./token";

const isDigit = (x: string) => /^[0-9]+$/i.test(x);
const isAlpha = (x: string) => /^[a-z]+$/i.test(x);
const isAlphaNumeric = (x: string) => /^[a-z0-9]+$/i.test(x);

const KEYWORDS = [
    // Logical operators
    "and",
    "not",
    "or",
    // Equality
    "equal",
    "lessThan",
    "greaterThan",
    "is",
    // Terms
    "plus",
    "minus",
    // Factors
    "star",
    "slash",
    // Case expressions
    "case",
    "when",
    "then",
    "else",
    "end",
    // literals
    "literal",
    // Nested SELECT
    "exists",
    // between
    "between",
    // in
    "in",
    // SELECT statements
    "select",
    "from",
    "where",
    "group",
    "order",
    "by",
    "as",
    "asc",
    "desc",
    "distinct",
    // INSERT statements
    "insert",
    "values",
    "into",
    // CREATE statements
    "create",
    "table",
    "index",
    "on",
    "integer",
    "string",
    "primary",
    "key",
    "varchar",
    // UPDATE statements
    "update",
    "set",
    // Other
    "null",
    // Compound operators
    "union",
    "all",
    "intersect",
    "except",
];

class Tokenizer {
    /** Current position in the input string. */
    private position = 0;

    /** Tokens that we've accumulated so far. */
    private tokens: DebugToken[] = [];

    /** Line of the current position. */
    private line = 1;

    /** Characters within the line of the current position. */
    private character = 1;

    /**
     * Tracks where the current token starts
     * Position in the input string, line number, and character offset for the line.
     */
    private tokenStart: SourcePosition = { position: 0, line: 0, character: 0 };

    constructor(private readonly input: string) {}

    /** Tokenize the input string. */
    public tokenize(): DebugToken[] {
        while (!this.isAtEnd()) {
            this.tokenStart = this.getSourcePosition();
            this.scanToken();
        }
        return this.tokens;
    }

    /** Scan for the next token. */
    private scanToken() {
        const char = this.advance();
        switch (char) {
            case "*":
                return this.addToken("star");
            case ".":
                return this.addToken("dot");
            case ",":
                return this.addToken("comma");
            case "(":
                return this.addToken("leftParen");
            case ")":
                return this.addToken("rightParen");
            case ";":
                return this.addToken("semicolon");
            case ">":
                if (this.peek() === "=") {
                    this.advance();
                    return this.addToken("greaterThanEqual");
                }
                return this.addToken("greaterThan");
            case "<":
                if (this.peek() === "=") {
                    this.advance();
                    return this.addToken("lessThanEqual");
                }
                if (this.peek() === ">") {
                    this.advance();
                    return this.addToken("notEqual");
                }
                return this.addToken("lessThan");
            case "=":
                return this.addToken("equal");
            case "+":
                return this.addToken("plus");
            case "/":
                return this.addToken("slash");
            case "-":
                if (this.peek() === "-") {
                    // Comment
                    while (!this.isAtEnd() && this.peek() !== "\n") {
                        this.advance();
                    }
                    return;
                } else {
                    return this.addToken("minus");
                }
            case "\n":
                // Track the extra debug information.
                this.nextLine();
            case " ":
            case "\r":
            case "\t":
                break; // Ignore white space
            case '"':
            case "'": // Both kind of quotes are just parsed a string literals.
                return this.string(char);
            default:
                if (isDigit(char)) {
                    return this.number();
                }
                if (isAlpha(char)) {
                    return this.identifier();
                }
                throw new Error(
                    `Unexpected token at position ${this.position}: ${char}`
                );
        }
    }

    /** Parses an identifier. */
    private identifier() {
        while (isAlphaNumeric(this.input[this.position]) && !this.isAtEnd()) {
            this.advance();
        }
        const lexeme = this.input.slice(
            this.tokenStart.position,
            this.position
        );
        if (lexeme.toLowerCase() === "null") {
            return this.addToken("literal", null);
        } else if (KEYWORDS.includes(lexeme.toLowerCase())) {
            return this.addToken(lexeme.toLowerCase() as TokenType);
        } else {
            return this.addToken("identifier");
        }
    }

    /** Tokenizes a string literal. */
    private string(starter: string) {
        while (this.input[this.position] !== starter && !this.isAtEnd()) {
            const char = this.advance();
            if (char === "\n") {
                this.nextLine();
            }
        }

        if (this.isAtEnd()) {
            throw new Error("Unterminated string literal");
        }

        this.advance(); // Consume the closing quote.
        return this.addToken(
            "literal",
            this.input.slice(this.tokenStart.position + 1, this.position - 1)
        );
    }

    /**
     * Consumes a number.
     */
    private number() {
        while (isDigit(this.input[this.position]) && !this.isAtEnd()) {
            this.advance();
        }
        // Check for the . for decimal numbers.
        if (this.peek() === ".") {
            this.advance();
            while (isDigit(this.input[this.position]) && !this.isAtEnd()) {
                this.advance();
            }
        }

        return this.addToken(
            "literal",
            parseFloat(
                this.input.slice(this.tokenStart.position, this.position)
            )
        );
    }

    /** Look at the next character without advancing. */
    private peek() {
        return this.input[this.position];
    }

    /** Advance to the next character. */
    private advance() {
        this.character++;
        return this.input[this.position++];
    }

    /** Determines if the we are at the end of the input. */
    private isAtEnd(): boolean {
        return this.position >= this.input.length;
    }

    /** Adds a new token to the token list. */
    private addToken(type: TokenType, literal?: unknown) {
        this.tokens.push({
            type,
            literal,
            lexeme: this.input.slice(this.tokenStart.position, this.position),
            start: this.tokenStart,
            end: this.getSourcePosition(),
        });
    }

    /** Track that we've started a new line for debugging purposes */
    private nextLine() {
        this.line++;
        this.character = 1;
    }

    /** Get the current source position. */
    private getSourcePosition(): SourcePosition {
        return {
            position: this.position,
            line: this.line,
            character: this.character,
        };
    }
}

/** Tokenizes an input string. */
export const tokenize = (input: string): DebugToken[] => {
    const tokenizer = new Tokenizer(input);
    return tokenizer.tokenize();
};
