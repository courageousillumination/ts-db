import { RelationalClient } from "../../src/relational";
import { parse } from "../../src/relational/parser/parser";
import { loadTestsFromFile } from "./harness";
import { SQLLogicRecord } from "./test-file-parser";

/** Cleans up all white space with a single space. */
const cleanSqlQuery = (x: string) =>
    x
        .split(/\s/g)
        .filter((x) => x.trim().length)
        .join(" ");

const getQueryString = (record: SQLLogicRecord) => {
    const str = record.type === "query" ? record.query : record.statement;
    return cleanSqlQuery(str);
};

describe("sqllogic", () => {
    describe("select1", () => {
        const result = loadTestsFromFile(
            "./test/sqllogic/test-files/select0.sql"
        );
        const values = result.map(getQueryString);

        test.each(values)("parses %s", (value) => {
            parse(value);
        });

        it("executes script", async () => {
            const client = new RelationalClient();
            for (const record of result) {
                const result = await client.execute(getQueryString(record));

                if (record.type === "statement") {
                    // We don't have any expected failures right now.
                    expect(record.expectedResult).toEqual("ok");
                } else if (record.type === "query") {
                    console.log(result);
                }
            }
        });
    });
});
