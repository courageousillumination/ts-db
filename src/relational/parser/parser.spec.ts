import { parse } from "./parser";

describe("parser", () => {
    describe("statements", () => {
        describe("select statement", () => {
            it("parses a simple select statement", () => {
                const result = parse("SELECT a FROM table1;");
                expect(result).toEqual([
                    {
                        type: "select",
                        selectClause: {
                            columns: [
                                {
                                    type: "expression",
                                    expression: {
                                        type: "columnName",
                                        name: "a",
                                    },
                                },
                            ],
                        },
                        fromClause: {
                            table: "table1",
                        },
                    },
                ]);
            });

            it("parses a wildcard statement", () => {
                const result = parse("SELECT * FROM table1;");
                expect(result).toEqual([
                    {
                        type: "select",
                        selectClause: {
                            columns: [{ type: "wildcard" }],
                        },
                        fromClause: {
                            table: "table1",
                        },
                    },
                ]);
            });

            it("parses a where clause", () => {
                const result = parse("SELECT a FROM table1 WHERE 1;");
                expect(result).toEqual([
                    {
                        type: "select",
                        selectClause: {
                            columns: [
                                {
                                    type: "expression",
                                    expression: {
                                        type: "columnName",
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
                    },
                ]);
            });
        });
    });

    describe("insert", () => {
        it("parses an insert with values", () => {
            const result = parse("INSERT INTO table1 VALUES (1);");
            expect(result).toEqual([
                {
                    type: "insert",
                    insertClause: {
                        table: "table1",
                    },
                    valuesClause: {
                        values: [
                            {
                                type: "value",
                                value: 1,
                            },
                        ],
                    },
                },
            ]);
        });

        it("parses an insert with custom values order", () => {
            const result = parse("INSERT INTO table1 (a) VALUES (1);");
            expect(result).toEqual([
                {
                    type: "insert",
                    insertClause: {
                        table: "table1",
                        columns: ["a"],
                    },
                    valuesClause: {
                        values: [
                            {
                                type: "value",
                                value: 1,
                            },
                        ],
                    },
                },
            ]);
        });
    });

    describe("expressions", () => {
        it("handles a column name", () => {
            const result = parse("foobar;");
            expect(result).toEqual([
                {
                    type: "expression",
                    expression: {
                        type: "columnName",
                        name: "foobar",
                    },
                },
            ]);
        });

        it("handles a literal expression", () => {
            const result = parse("1;");
            expect(result).toEqual([
                {
                    type: "expression",
                    expression: {
                        type: "value",
                        value: 1,
                    },
                },
            ]);
        });

        it("parses a binary expression", () => {
            const result = parse("1 > 2;");
            expect(result).toEqual([
                {
                    type: "expression",
                    expression: {
                        type: "binary",
                        operator: ">",
                        left: {
                            type: "value",
                            value: 1,
                        },
                        right: {
                            type: "value",
                            value: 2,
                        },
                    },
                },
            ]);
        });
    });
});
