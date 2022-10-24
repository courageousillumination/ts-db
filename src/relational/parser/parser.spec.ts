import { ExpressionParser, SelectStatementParser } from "./parser";
import { tokenize } from "./tokenizer";

describe("parser", () => {
    // describe("insert", () => {
    //     it("parses an insert with values", () => {
    //         const result = parse("INSERT INTO table1 VALUES (1);");
    //         expect(result).toEqual([
    //             {
    //                 type: "insert",
    //                 insertClause: {
    //                     table: "table1",
    //                 },
    //                 valuesClause: {
    //                     values: [
    //                         {
    //                             type: "value",
    //                             value: 1,
    //                         },
    //                     ],
    //                 },
    //             },
    //         ]);
    //     });

    //     it("parses an insert with custom values order", () => {
    //         const result = parse("INSERT INTO table1 (a) VALUES (1);");
    //         expect(result).toEqual([
    //             {
    //                 type: "insert",
    //                 insertClause: {
    //                     table: "table1",
    //                     columns: ["a"],
    //                 },
    //                 valuesClause: {
    //                     values: [
    //                         {
    //                             type: "value",
    //                             value: 1,
    //                         },
    //                     ],
    //                 },
    //             },
    //         ]);
    //     });
    // });

    // describe("expressions", () => {
    //     it("handles a column name", () => {
    //         const result = parse("foobar;");
    //         expect(result).toEqual([
    //             {
    //                 type: "expression",
    //                 expression: {
    //                     type: "columnName",
    //                     name: "foobar",
    //                 },
    //             },
    //         ]);
    //     });

    //     it("handles a literal expression", () => {
    //         const result = parse("1;");
    //         expect(result).toEqual([
    //             {
    //                 type: "expression",
    //                 expression: {
    //                     type: "value",
    //                     value: 1,
    //                 },
    //             },
    //         ]);
    //     });

    //     it("parses a binary expression", () => {
    //         const result = parse("1 > 2;");
    //         expect(result).toEqual([
    //             {
    //                 type: "expression",
    //                 expression: {
    //                     type: "binary",
    //                     operator: ">",
    //                     left: {
    //                         type: "value",
    //                         value: 1,
    //                     },
    //                     right: {
    //                         type: "value",
    //                         value: 2,
    //                     },
    //                 },
    //             },
    //         ]);
    //     });
    // });

    // describe("compound statements", () => {
    //     it.only("works", () => {
    //         const result = parse(
    //             "SELECT c-d,        CASE WHEN a<b-3 THEN 111 END from TABLE1;"
    //         );
    //     });
    // });

    describe("expression", () => {
        const parseExpression = (expression: string) => {
            const tokens = tokenize(expression);
            const parser = new ExpressionParser(tokens, 0);
            const { result } = parser.parse();
            return result;
        };

        it("handles simple values", () => {
            const result = parseExpression("2");
            expect(result).toEqual({ type: "value", value: 2 });
        });

        describe("precedence", () => {
            it("handles precedence", () => {
                const result = parseExpression("2+3*1");
                expect(result).toEqual({
                    type: "binary",
                    operator: "plus",
                    left: {
                        type: "value",
                        value: 2,
                    },
                    right: {
                        type: "binary",
                        operator: "star",
                        left: { type: "value", value: 3 },
                        right: { type: "value", value: 1 },
                    },
                });
            });

            it("applies groupings", () => {
                const result = parseExpression("(2+3)*1");
                expect(result).toEqual({
                    type: "binary",
                    operator: "star",
                    left: {
                        type: "binary",
                        operator: "plus",
                        left: { type: "value", value: 2 },
                        right: { type: "value", value: 3 },
                    },
                    right: {
                        type: "value",
                        value: 1,
                    },
                });
            });
        });

        describe("case expressions", () => {
            it("handles a simple case", () => {
                const result = parseExpression("CASE WHEN 1 THEN 2 END");
                expect(result).toEqual({
                    type: "case",
                    when: [
                        {
                            when: { type: "value", value: 1 },
                            then: { type: "value", value: 2 },
                        },
                    ],
                });
            });

            it("handles an else case", () => {
                const result = parseExpression("CASE WHEN 1 THEN 2 ELSE 2 END");
                expect(result).toEqual({
                    type: "case",
                    when: [
                        {
                            when: { type: "value", value: 1 },
                            then: { type: "value", value: 2 },
                        },
                    ],
                    else: { type: "value", value: 2 },
                });
            });
        });
    });

    describe("select statement", () => {
        const parseSelect = (expression: string) => {
            const tokens = tokenize(expression);
            const parser = new SelectStatementParser(tokens, 0);
            const { result } = parser.parse();
            return result;
        };

        it("parses a simple select statement", () => {
            const result = parseSelect("SELECT a FROM table1");
            expect(result).toEqual({
                type: "select",
                selectClause: {
                    columns: [
                        {
                            type: "expression",
                            expression: {
                                type: "variable",
                                name: "a",
                            },
                        },
                    ],
                },
                fromClause: {
                    table: "table1",
                },
            });
        });

        it("parses a wildcard statement", () => {
            const result = parseSelect("SELECT * FROM table1;");
            expect(result).toEqual({
                type: "select",
                selectClause: {
                    columns: [{ type: "wildcard" }],
                },
                fromClause: {
                    table: "table1",
                },
            });
        });

        it("parses a where clause", () => {
            const result = parseSelect("SELECT a FROM table1 WHERE 1;");
            expect(result).toEqual({
                type: "select",
                selectClause: {
                    columns: [
                        {
                            type: "expression",
                            expression: {
                                type: "variable",
                                name: "a",
                            },
                        },
                    ],
                },
                fromClause: {
                    table: "table1",
                },
                whereClause: {
                    type: "value",
                    value: 1,
                },
            });
        });
    });
});
