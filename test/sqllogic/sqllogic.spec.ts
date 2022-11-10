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

/** Get the query string from a record. */
const getQueryString = (record: SQLLogicRecord) => {
    const str = record.type === "query" ? record.query : record.statement;
    return cleanSqlQuery(str);
};

/** Runs the All command as a promise. */
const sqliteAll = (db: sqlite3.Database, input: string) => {
    return new Promise((resolve) => {
        db.all(input, (err, rows) => {
            resolve(rows.map((x) => Object.values(x)));
        });
    });
};

const FILE_BASE = "./test/sqllogic/test-files/";

const testFiles = [
    // "select0.sql",
    "select1.sql",
    "select2.sql",
    "select3.sql",

    // Select5 works in theory, but it is super slow because of the
    // way the code is set up. Some optimizations might be needed.
    // "select5.sql",
];

describe("sqllogic", () => {
    describe.each(testFiles)("%s", (testFile) => {
        const records = loadTestsFromFile(FILE_BASE + testFile);
        const queriesAndStatements = records.map(getQueryString);
        const queries = records
            .filter((x) => x.type === "query")
            .map(getQueryString);
        const statements = records
            .filter((x) => x.type === "statement")
            .map(getQueryString);

        describe("parsing", () => {
            test.each(queriesAndStatements)("parses %s", (x) => {
                parse(x);
            });
        });

        describe("execution", () => {
            let client: RelationalClient;
            let reference: sqlite3.Database;
            beforeAll(async () => {
                // We start by priming with the statements. Since
                // we're really testing the select logic, we don't have
                // explicit tests for the statements.
                const backend = new Backend();
                client = new RelationalClient(backend);
                reference = new sqlite3.Database(":memory:");
                for (const statement of statements) {
                    client.execute(statement);
                    await sqliteAll(reference, statement);
                }
            });

            test.each(queries)("executes %s", async (x) => {
                const result = client.execute(x);
                const referenceResult = await sqliteAll(reference, x);
                expect(result).toEqual(referenceResult);
            });
        });
    });
});
