import { tokenize } from "../tokenizer";
import { SelectStatementParser } from "./SelectStatementParser";

const literal = (value: unknown) => expect.objectContaining({ value });

describe("SelectStatementParser", () => {
    const parseSelect = (expression: string) => {
        const tokens = tokenize(expression);
        const parser = new SelectStatementParser(tokens, 0);
        const { result } = parser.parse();
        return result;
    };

    describe("column parsing", () => {
        it("parses a simple select statement", () => {
            const result = parseSelect("SELECT a FROM table1");
            expect(result).toEqual(
                expect.objectContaining({
                    type: "select",
                    columns: [
                        {
                            type: "expression",
                            expression: expect.objectContaining({
                                subType: "column",
                                columnName: "a",
                            }),
                        },
                    ],
                })
            );
        });

        it("parses a wildcard column", () => {
            const result = parseSelect("SELECT * FROM table1;");
            expect(result).toEqual(
                expect.objectContaining({
                    type: "select",
                    columns: [{ type: "wildcard" }],
                })
            );
        });
    });

    describe("from parsing", () => {
        it("parses a simple table", () => {
            const result = parseSelect("SELECT * from table1");
            expect(result).toEqual(
                expect.objectContaining({
                    table: {
                        tableName: "table1",
                    },
                })
            );
        });

        it("parses an alias", () => {
            const result = parseSelect("SELECT * from table1 as x");
            expect(result).toEqual(
                expect.objectContaining({
                    table: {
                        tableName: "table1",
                        alias: "x",
                    },
                })
            );
        });
    });

    describe("where", () => {
        it("handles the where clause", () => {
            const result = parseSelect("SELECT * FROM table1 WHERE 1;");
            expect(result).toEqual(
                expect.objectContaining({
                    type: "select",
                    where: literal(1),
                })
            );
        });
    });

    describe("order by", () => {
        it("parses simple", () => {
            const result = parseSelect("SELECT * FROM t1 ORDER BY 1");
            expect(result).toEqual(
                expect.objectContaining({
                    orderBy: [{ expression: literal(1), direction: "asc" }],
                })
            );
        });

        it("parses desc", () => {
            const result = parseSelect("SELECT * FROM t1 ORDER BY 1 DESC");
            expect(result).toEqual(
                expect.objectContaining({
                    orderBy: [{ expression: literal(1), direction: "desc" }],
                })
            );
        });
    });
});
