import { parseInput } from "./test-file-parser";

describe("harness", () => {
    describe("statements", () => {
        it("handles an ok statement", () => {
            const result = parseInput(`statement ok\nCREATE TABLE\n`);
            expect(result).toEqual([
                {
                    type: "statement",
                    statement: "CREATE TABLE",
                    expectedResult: "ok",
                },
            ]);
        });
    });

    describe("queries", () => {
        it("handles a query", () => {
            const result = parseInput(
                `query I nosort\nSELECT * FROM table\n----\n1\n`
            );
            expect(result).toEqual([
                {
                    type: "query",
                    query: "SELECT * FROM table",
                    sortMode: "nosort",
                    expectedResult: "1",
                    resultType: ["integer"],
                },
            ]);
        });
    });
});
