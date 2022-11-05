import { tokenize } from "./tokenizer";
import { StatementParser } from "./parsers/StatementParser";

/** Utility function to run the entire parsing. */
export const parse = (input: string) => {
    const tokens = tokenize(input);
    const parser = new StatementParser(tokens, 0);
    const { result, position } = parser.parse();
    if (position < tokens.length) {
        throw new Error(
            `Parser did not consume all input; ending token ${position}`
        );
    }
    return result;
};
