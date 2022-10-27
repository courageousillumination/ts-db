import { ExpressionParser } from "../parser/parser";
import { tokenize } from "../parser/tokenizer";
import { Engine } from "./engine";

describe("engine", () => {
    describe("expression handling", () => {
        const evaluateExpression = async (input: string) => {
            const engine = new Engine();
            const tokens = tokenize(input);
            const parser = new ExpressionParser(tokens, 0);
            const { result: expression } = parser.parse();
            const result = await engine.evaluateExpression(expression);
            return result;
        };

        it("evaluates values", async () => {
            expect(await evaluateExpression("1")).toEqual(1);
        });

        it("handles binary operations", async () => {
            expect(await evaluateExpression("2 * 2")).toEqual(4);
        });

        it("handles unary", async () => {
            expect(await evaluateExpression("-1")).toEqual(-1);
        });

        it("handles between", async () => {
            expect(await evaluateExpression("1 BETWEEN 0 AND 2")).toBeTruthy();
        });

        it("handles case statements", async () => {
            expect(
                await evaluateExpression("CASE WHEN 0 THEN 2 WHEN 1 THEN 3 END")
            ).toEqual(3);
        });
    });
});
