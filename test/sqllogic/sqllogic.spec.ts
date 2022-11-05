import crypto from "crypto";
import sqlite3 from "sqlite3";

import { RelationalClient } from "../../src/relational";
import { Backend } from "../../src/relational/backend/backend";
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
        let backend: Backend;
        let client: RelationalClient;
        let reference: sqlite3.Database;

        const result = loadTestsFromFile(
            "./test/sqllogic/test-files/select1.sql"
        );
        const values = result.map(getQueryString);

        beforeAll(() => {
            backend = new Backend();
            client = new RelationalClient(backend);
            reference = new sqlite3.Database(":memory:");
        });

        test.each(values)("parses %s", (value) => {
            parse(value);
        });

        it.only("executes script", async () => {
            for (const value of values) {
                console.log(value);
                const result = client.execute(value);
                const referenceResult = await new Promise((resolve) => {
                    reference.all(value, (err, rows) => {
                        resolve(rows.map((x) => Object.values(x)));
                    });
                });

                expect(result).toEqual(referenceResult);
            }
        });
    });
});
