import { tokenize } from "./tokenize";

describe("tokenize", () => {
    describe("special tokens", () => {
        it("handles special tokens", () => {
            const specialMap = [
                ["*", "star"],
                ["(", "leftParen"],
                [")", "rightParen"],
                [",", "comma"],
                [";", "semicolon"],
            ];
            for (const [value, type] of specialMap) {
                expect(tokenize(value)).toEqual([
                    expect.objectContaining({ type, lexeme: value }),
                ]);
            }
        });
    });

    describe("literals", () => {
        describe("string literals", () => {
            it("parses a string literal", () => {
                expect(tokenize('"foo select baz"')).toEqual([
                    expect.objectContaining({
                        type: "literal",
                        lexeme: '"foo select baz"',
                        literal: "foo select baz",
                    }),
                ]);
            });

            it("throws if unterminated", () => {
                expect(() => tokenize('"no end in site')).toThrow();
            });
        });

        describe("number literals", () => {
            it("parses an int", () => {
                expect(tokenize("1")).toEqual([
                    expect.objectContaining({
                        type: "literal",
                        lexeme: "1",
                        literal: 1,
                    }),
                ]);
            });
        });
    });

    describe("comments", () => {
        it("does not put anything in the tokens", () => {
            expect(tokenize("-- foo bar baz")).toEqual([]);
        });
    });

    describe("keywords", () => {
        it("handles all keywords", () => {
            const keywords = [
                "select",
                "from",
                "into",
                "insert",
                "create",
                "table",
                "integer",
            ];
            for (const keyword of keywords) {
                expect(tokenize(keyword)).toEqual([
                    expect.objectContaining({ type: keyword, lexeme: keyword }),
                ]);
            }
        });

        it("handles upper case versions", () => {
            expect(tokenize("SELECT")).toEqual([
                expect.objectContaining({ type: "select", lexeme: "SELECT" }),
            ]);
        });
    });

    describe("identifiers", () => {
        it("handles an identifier", () => {
            expect(tokenize("foobar")).toEqual([
                expect.objectContaining({
                    type: "identifier",
                    lexeme: "foobar",
                }),
            ]);
        });
    });

    describe("error handling", () => {
        it("throws on unexpected tokens", () => {
            expect(() => tokenize("\0")).toThrow();
        });
    });

    describe("debug information", () => {
        it("includes information on tokens", () => {
            expect(tokenize(" 1")).toEqual([
                expect.objectContaining({ line: 1, character: 2 }),
            ]);
        });

        it("counts lines", () => {
            expect(tokenize("\n\n 1")).toEqual([
                expect.objectContaining({ line: 3, character: 2 }),
            ]);
        });
    });
});
