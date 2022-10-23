import { Token, TokenType } from "./token";

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
    "avg",
    "where",
    "set",
    "update",
    "asc",
    "desc",
    "else",
    "end",
    "count",
];

class Tokenizer {
    private position = 0;
    private tokens: Token[] = [];
    private start = 0;
    constructor(private readonly input: string) {}

    public tokenize(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.position;
            this.scanToken();
        }
        return this.tokens;
    }

    private scanToken() {
        const char = this.advance();
        switch (char) {
            case "*":
                return this.addToken("star");
            case ",":
                return this.addToken("comma");
            case "(":
                return this.addToken("leftParen");
            case ")":
                return this.addToken("rightParen");
            case ";":
                return this.addToken("semicolon");
            case ">":
                return this.addToken("greaterThan");
            case "<":
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

    private identifier() {
        while (isAlphaNumeric(this.input[this.position]) && !this.isAtEnd()) {
            this.advance();
        }
        const lexeme = this.input.slice(this.start, this.position);
        if (KEYWORDS.includes(lexeme.toLowerCase())) {
            return this.addToken(lexeme.toLowerCase() as TokenType);
        } else {
            return this.addToken("identifier");
        }
    }

    /** Tokenizes a string literal. */
    private string() {
        while (this.input[this.position] !== '"' && !this.isAtEnd()) {
            this.advance();
        }

        if (this.isAtEnd()) {
            throw new Error("Unterminated string literal");
        }

        this.advance();
        return this.addToken(
            "literal",
            this.input.slice(this.start + 1, this.position - 1)
        );
    }

    private number() {
        while (isDigit(this.input[this.position]) && !this.isAtEnd()) {
            this.advance();
        }
        // No decimals yet
        return this.addToken(
            "literal",
            parseInt(this.input.slice(this.start, this.position))
        );
    }

    private peek() {
        return this.input[this.position];
    }

    private advance() {
        return this.input[this.position++];
    }

    private isAtEnd(): boolean {
        return this.position >= this.input.length;
    }

    private addToken(type: TokenType, literal?: unknown) {
        this.tokens.push({
            type,
            literal,
            lexeme: this.input.slice(this.start, this.position),
        });
    }
}

export const tokenize = (input: string): Token[] => {
    const tokenizer = new Tokenizer(input);
    return tokenizer.tokenize();
};
