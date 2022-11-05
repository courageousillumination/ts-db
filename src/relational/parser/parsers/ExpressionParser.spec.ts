import { Operator } from "../ast/expression";
import { tokenize } from "../tokenizer";
import { ExpressionParser } from "./ExpressionParser";

const literal = (value: unknown) => expect.objectContaining({ value });
const operator = (type: Operator, args: unknown[]) =>
    expect.objectContaining({
        subType: "operator",
        operator: type,
        arguments: args,
    });

describe("expression", () => {
    const parseExpression = (expression: string) => {
        const tokens = tokenize(expression);
        const parser = new ExpressionParser(tokens, 0);
        const { result, position } = parser.parse();
        expect(position).toEqual(tokens.length);
        return result;
    };

    describe("values", () => {
        it("handles simple values", () => {
            const result = parseExpression("2");
            expect(result).toEqual(literal(2));
        });
    });

    describe("operators", () => {
        describe("unary operators", () => {
            it("handles negation", () => {
                const result = parseExpression("-2");
                expect(result).toEqual(operator("negate", [literal(2)]));
            });

            it("handles multiple negations", () => {
                const result = parseExpression("- -2");
                expect(result).toEqual(
                    operator("negate", [operator("negate", [literal(2)])])
                );
            });
        });

        describe("factor operators", () => {
            it("handles multiplication", () => {
                const result = parseExpression("2 * 3");
                expect(result).toEqual(
                    operator("multiply", [literal(2), literal(3)])
                );
            });
        });

        describe("term operators", () => {
            it("handles addition", () => {
                const result = parseExpression("2 + 3");
                expect(result).toEqual(
                    operator("add", [literal(2), literal(3)])
                );
            });
        });

        describe("equality operators", () => {
            it("handles greater than", () => {
                const result = parseExpression("2 > 3");
                expect(result).toEqual(
                    operator("greaterThan", [literal(2), literal(3)])
                );
            });

            describe("between", () => {
                it("handles between", () => {
                    const result = parseExpression("2 BETWEEN 3 AND 4");
                    expect(result).toEqual(
                        expect.objectContaining({
                            subType: "operator",
                            operator: "between",
                            arguments: [literal(2), literal(3), literal(4)],
                        })
                    );
                });

                it("handles not between", () => {
                    const result = parseExpression("2 NOT BETWEEN 3 AND 4");
                    expect(result).toEqual(
                        expect.objectContaining({
                            subType: "operator",
                            operator: "between",
                            arguments: [literal(2), literal(3), literal(4)],
                            negate: true,
                        })
                    );
                });
            });
        });

        describe("boolean logic", () => {
            it("handles and", () => {
                const result = parseExpression("2 AND 3");
                expect(result).toEqual(
                    operator("and", [literal(2), literal(3)])
                );
            });
        });

        describe("precedence", () => {
            it("handles precedence", () => {
                const result = parseExpression("2+3*1");
                expect(result).toEqual(
                    operator("add", [
                        literal(2),
                        operator("multiply", [literal(3), literal(1)]),
                    ])
                );
            });

            it("applies groupings", () => {
                const result = parseExpression("(2+3)*1");
                expect(result).toEqual(
                    operator("multiply", [
                        operator("add", [literal(2), literal(3)]),
                        literal(1),
                    ])
                );
            });

            it("applies repeated operators", () => {
                const result = parseExpression("1 + 2 + 3");
                expect(result).toEqual(
                    operator("add", [
                        operator("add", [literal(1), literal(2)]),
                        literal(3),
                    ])
                );
            });
        });
    });

    describe("case expressions", () => {
        it("handles a simple case", () => {
            const result = parseExpression("CASE WHEN 1 THEN 2 END");
            expect(result).toEqual(
                expect.objectContaining({
                    subType: "case",
                    when: [{ when: literal(1), then: literal(2) }],
                })
            );
        });

        it("handles the inital expression", () => {
            const result = parseExpression("CASE 1 WHEN 1 THEN 2 END");
            expect(result).toEqual(
                expect.objectContaining({
                    subType: "case",
                    initial: literal(1),
                    when: [{ when: literal(1), then: literal(2) }],
                })
            );
        });

        it("handles an else expression", () => {
            const result = parseExpression("CASE WHEN 1 THEN 2 ELSE 1 END");
            expect(result).toEqual(
                expect.objectContaining({
                    subType: "case",
                    else: literal(1),
                    when: [{ when: literal(1), then: literal(2) }],
                })
            );
        });
    });

    describe("columns", () => {
        it("handles simple column names", () => {
            const result = parseExpression("foo");
            expect(result).toEqual(
                expect.objectContaining({
                    subType: "column",
                    columnName: "foo",
                })
            );
        });

        it("handles a table + column", () => {
            const result = parseExpression("foo.bar");
            expect(result).toEqual(
                expect.objectContaining({
                    subType: "column",
                    columnName: "bar",
                    tableName: "foo",
                })
            );
        });
    });

    describe("function calls", () => {
        it("handles simple functions", () => {
            const result = parseExpression("avg(1)");
            expect(result).toEqual(
                expect.objectContaining({
                    subType: "function-call",
                    functionName: "avg",
                    arguments: [literal(1)],
                })
            );
        });

        it("handles wildcard functions", () => {
            const result = parseExpression("count(*)");
            expect(result).toEqual(
                expect.objectContaining({
                    subType: "function-call",
                    functionName: "count",
                    arguments: [],
                    wildcard: true,
                })
            );
        });

        it("handles distinct functions", () => {
            const result = parseExpression("count(DISTINCT 1)");
            expect(result).toEqual(
                expect.objectContaining({
                    subType: "function-call",
                    functionName: "count",
                    arguments: [literal(1)],
                    distinct: true,
                })
            );
        });
    });

    describe("nested select", () => {
        it("parses a select", () => {
            const result = parseExpression("(SELECT 1 FROM table1)");
            expect(result).toEqual(
                expect.objectContaining({
                    subType: "select",
                    statement: expect.objectContaining({
                        type: "select",
                    }),
                })
            );
        });

        it("parses a select with exists", () => {
            const result = parseExpression("EXISTS (SELECT 1 FROM table1)");
            expect(result).toEqual(
                expect.objectContaining({
                    subType: "select",
                    exists: true,
                    statement: expect.objectContaining({
                        type: "select",
                    }),
                })
            );
        });
    });
});
