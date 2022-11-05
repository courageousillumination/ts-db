/** Utilites for debugging the tokenizer. */

import { Token, DebugToken } from "./token";

/** Strip debug information from a token. */
export const stripDebugInformation = (token: DebugToken): Token => {
    return { type: token.type, lexeme: token.lexeme, literal: token.literal };
};
