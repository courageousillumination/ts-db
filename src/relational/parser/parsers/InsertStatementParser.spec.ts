import { tokenize } from "../tokenizer";
import { InsertStatementParser } from "./InsertStatementParser";

const literal = (value: unknown) => expect.objectContaining({ value });

describe("insert", () => {
    const parseInsert = (insert: string) => {
        const tokens = tokenize(insert);
        const parser = new InsertStatementParser(tokens, 0);
        const { result } = parser.parse();
        return result;
    };

    it("parses an insert with values", () => {
        const result = parseInsert("INSERT INTO table1 VALUES (1);");
        expect(result).toEqual(
            expect.objectContaining({
                type: "insert",
                table: "table1",
                values: [literal(1)],
            })
        );
    });

    it("parses an insert with custom values order", () => {
        const result = parseInsert("INSERT INTO table1 (a) VALUES (1);");
        expect(result).toEqual(
            expect.objectContaining({
                type: "insert",
                table: "table1",
                columns: ["a"],
                values: [literal(1)],
            })
        );
    });
});
