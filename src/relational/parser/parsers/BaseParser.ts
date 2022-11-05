import { DebugToken, TokenType } from "../tokenizer";

/** The result of a parse. */
interface ParseResult<T> {
    /** The actual result. */
    result: T;
    /** The position where the parser finished. */
    position: number;
}

type ParserT<TRet> = new (
    tokens: DebugToken[],
    position: number
) => BaseParser<TRet>;

/** A base class for parsers. */
export abstract class BaseParser<T> {
    constructor(
        protected readonly tokens: DebugToken[],
        protected position: number
    ) {}

    /** Runs the parser on the current token string. */
    public parse(): ParseResult<T> {
        return {
            result: this.parseInternal(),
            position: this.position,
        };
    }

    /**
     * @abstract
     * Run the parser and return the core return value for this parser.
     */
    protected abstract parseInternal(): T;

    /**
     * Applies a sub parser.
     * The sub parser will consume tokens and this parser will update
     * its position accordingly.
     */
    protected applySubParser<TRet>(parser: ParserT<TRet>) {
        const instance = new parser(this.tokens, this.position);
        const { result, position } = instance.parse();
        // Update my current token position based on the sub parser.
        this.position = position;
        return result;
    }

    /** Consumes a token, optionally checking the type. */
    protected consume(type?: TokenType) {
        if (this.isAtEnd()) {
            this.error(`Unexpected end of input. Expected ${type}`);
        }

        const token = this.tokens[this.position++];

        if (type && type !== token.type) {
            this.error(`Expected ${type} but found ${token.type}`);
        }
        return token;
    }

    /** Consumes a token, only if it matches a given type */
    protected match(type: TokenType) {
        if (this.peek()?.type === type) {
            return this.consume(type);
        }
        return null;
    }

    /** Like match, but returns the first item in the array that matches. */
    protected matchAny(types: TokenType[]) {
        for (const type of types) {
            const result = this.match(type);
            if (result) {
                return result;
            }
        }
        return null;
    }

    /** Look at the next token, without consuming it. */
    protected peek(count: number = 1) {
        return this.position + (count - 1) >= this.tokens.length
            ? null
            : this.tokens[this.position + (count - 1)];
    }

    /**
     * Returns the previous token.
     * NOTE: This is mainly used to make some matching easier.
     */
    protected previous() {
        return this.tokens[this.position - 1];
    }

    /** Checks if the parser is at the end of the input */
    protected isAtEnd() {
        return this.position >= this.tokens.length;
    }

    /**
     * Consumes many items.
     *
     * This can be used for various kinds of repeated lists.
     * There are two exit conditions:
     *  1) The consumer returns null
     *  2) A seperator is included, but no seperator is found.
     */
    protected consumeMany<ConsumeT>(
        consumer: () => ConsumeT | null,
        seperator?: TokenType
    ): ConsumeT[] {
        const results = [];
        let result = consumer();
        while (result !== null) {
            results.push(result);
            if (seperator) {
                if (!this.match(seperator)) {
                    break;
                }
            }
            result = consumer();
        }
        return results;
    }

    /** Throws an error. */
    protected error(message: string): never {
        throw new Error(message);
    }
}
