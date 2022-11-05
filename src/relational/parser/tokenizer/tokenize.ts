import { Token, TokenType, DebugToken } from "./token";

const isDigit = (x: string) => /^[0-9]+$/i.test(x);
const isAlpha = (x: string) => /^[a-z]+$/i.test(x);
const isAlphaNumeric = (x: string) => /^[a-z0-9]+$/i.test(x);

const KEYWORDS = [
    "select",
    "from",
    "into",
    "insert",
    "create",
    "values",
    "table",
    "integer",
    "order",
    "by",
    "case",
    "when",
    "then",
    "end",
    "where",
    "set",
    "update",
    "asc",
    "desc",
    "else",
    "end",
    "or",
    "and",
    "not",
    "as",
    "exists",
    "between",
    "asc",
    "desc",
];

class Tokenizer {
    /** Current position in the input string. */
    private position = 0;

    /** Tokens that we've accumulated so far. */
    private tokens: DebugToken[] = [];

    /** Line of the current position. */
    private line = 1;

    /** Characters within the line of the current position. */
    private lineOffset = 1;

    /**
     * Tracks where the current token starts
     * Position in the input string, line number, and character offset for the line.
     */
    private tokenStart: [number, number, number] = [0, 0, 0];

    constructor(private readonly input: string) {}

    /** Tokenize the input string. */
    public tokenize(): DebugToken[] {
        while (!this.isAtEnd()) {
            this.tokenStart = [this.position, this.line, this.lineOffset];
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
                return this.string();
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
        const lexeme = this.input.slice(this.tokenStart[0], this.position);
        if (KEYWORDS.includes(lexeme.toLowerCase())) {
            return this.addToken(lexeme.toLowerCase() as TokenType);
        } else {
            return this.addToken("identifier");
        }
    }

    /** Tokenizes a string literal. */
    private string() {
        while (this.input[this.position] !== '"' && !this.isAtEnd()) {
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
            this.input.slice(this.tokenStart[0] + 1, this.position - 1)
        );
    }

    /**
     * Consumes a number.
     * TODO: Add support for decmial numbers.
     */
    private number() {
        while (isDigit(this.input[this.position]) && !this.isAtEnd()) {
            this.advance();
        }
        return this.addToken(
            "literal",
            parseInt(this.input.slice(this.tokenStart[0], this.position))
        );
    }

    /** Look at the next character without advancing. */
    private peek() {
        return this.input[this.position];
    }

    /** Advance to the next character. */
    private advance() {
        this.lineOffset++;
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
            lexeme: this.input.slice(this.tokenStart[0], this.position),
            line: this.tokenStart[1],
            character: this.tokenStart[2],
            positionStart: this.tokenStart[0],
            positionEnd: this.position,
        });
    }

    /** Track that we've started a new line for debugging purposes */
    private nextLine() {
        this.line++;
        this.lineOffset = 1;
    }
}

export const tokenize = (input: string): DebugToken[] => {
    const tokenizer = new Tokenizer(input);
    return tokenizer.tokenize();
};
