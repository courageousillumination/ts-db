import {
    ExpressionParser,
    InsertStatementParser,
    SelectStatementParser,
} from "./parser";
import { tokenize } from "./tokenizer";

describe("parser", () => {
    describe("insert", () => {
        const parseInsert = (insert: string) => {
            const tokens = tokenize(insert);
            const parser = new InsertStatementParser(tokens, 0);
            const { result } = parser.parse();
            return result;
        };

        it("parses an insert with values", () => {
            const result = parseInsert("INSERT INTO table1 VALUES (1);");
            expect(result).toEqual({
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
            });
        });

        it("parses an insert with custom values order", () => {
            const result = parseInsert("INSERT INTO table1 (a) VALUES (1);");
            expect(result).toEqual({
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
            });
        });
    });

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

        describe("columns", () => {
            it("handles simple column names", () => {
                const result = parseExpression("foo");
                expect(result).toEqual({ type: "column", column: "foo" });
            });

            it("handles a table + column", () => {
                const result = parseExpression("foo.bar");
                expect(result).toEqual({
                    type: "column",
                    column: "bar",
                    table: "foo",
                });
            });
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

            it("applies repeated operators", () => {
                const result = parseExpression("1 + 2 + 3");
                expect(result).toEqual({
                    type: "binary",
                    operator: "plus",
                    left: {
                        type: "binary",
                        operator: "plus",
                        left: { type: "value", value: 1 },
                        right: { type: "value", value: 2 },
                    },
                    right: { type: "value", value: 3 },
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

            it("handles the inital expression", () => {
                const result = parseExpression("CASE 1 WHEN 1 THEN 2 END");
                expect(result).toEqual({
                    type: "case",
                    initial: { type: "value", value: 1 },
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

        describe("nested select", () => {
            it("parses a select", () => {
                const result = parseExpression("(SELECT 1 FROM table1)");
                expect(result).toEqual({
                    type: "select",
                    statement: {
                        type: "select",
                        fromClause: {
                            table: "table1",
                        },
                        selectClause: {
                            columns: [
                                {
                                    type: "expression",
                                    expression: { type: "value", value: 1 },
                                },
                            ],
                        },
                    },
                });
            });

            it("parses a select with exists", () => {
                const result = parseExpression("EXISTS (SELECT 1 FROM table1)");
                expect(result).toEqual({
                    type: "select",
                    exists: true,
                    statement: {
                        type: "select",
                        fromClause: {
                            table: "table1",
                        },
                        selectClause: {
                            columns: [
                                {
                                    type: "expression",
                                    expression: { type: "value", value: 1 },
                                },
                            ],
                        },
                    },
                });
            });
        });

        describe("between", () => {
            it("handles the between", () => {
                const result = parseExpression("1 BETWEEN 1+2 AND 2");
                expect(result).toEqual({
                    type: "ternary",
                    operator: "between",
                    expr1: { type: "value", value: 1 },
                    expr2: {
                        type: "binary",
                        operator: "plus",
                        left: { type: "value", value: 1 },
                        right: { type: "value", value: 2 },
                    },
                    expr3: { type: "value", value: 2 },
                    isNegative: false,
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
                                type: "column",
                                column: "a",
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
                                type: "column",
                                column: "a",
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

        it("parses table alias", () => {
            const result = parseSelect("SELECT * FROM t1 as x");
            expect(result).toEqual({
                type: "select",
                selectClause: {
                    columns: [{ type: "wildcard" }],
                },
                fromClause: {
                    table: "t1",
                    alias: "x",
                },
            });
        });

        it("handles order by", () => {
            const result = parseSelect("SELECT * FROM t1 ORDER BY 1");
            expect(result).toEqual({
                type: "select",
                selectClause: {
                    columns: [{ type: "wildcard" }],
                },
                fromClause: {
                    table: "t1",
                },
                orderByClause: {
                    orderBy: [
                        {
                            direction: "asc",
                            expression: { type: "value", value: 1 },
                        },
                    ],
                },
            });
        });
        it("handles arbitray selects", () => {
            parseSelect(
                "SELECT c, (SELECT count(*) FROM t1 AS x WHERE x.c>t1.c AND x.d<t1.d)   FROM t1  WHERE b>c    AND (e>a AND e<b)    AND d>e  ORDER BY 1,2            "
            );
        });
    });
});
