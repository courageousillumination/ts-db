import { parse } from "../../src/relational/parser/parser";
import { loadTestsFromFile } from "./harness";

describe("sqllogic", () => {
    describe("select1", () => {
        const result = loadTestsFromFile(
            "./test/sqllogic/test-files/select1.sql"
        );
        const values = result
            .map((x) => (x.type === "query" ? x.query : x.statement))
            // .slice(0, 32) // TODO: Remove
            .map((x) => x.replace(/\n/g, " ")); // Replace new lines for easier reading

        test.each(values)("parses %s", (value) => {
            parse(value);
        });
    });
});
