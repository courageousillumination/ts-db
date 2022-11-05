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

const testFile = "./test/sqllogic/test-files/select1.sql";
const records = loadTestsFromFile(testFile);
const queriesAndStatements = records.map(getQueryString);
const queries = records.filter((x) => x.type === "query").map(getQueryString);
const statements = records
    .filter((x) => x.type === "statement")
    .map(getQueryString);

/** Runs the All command as a promise. */
const sqliteAll = (db: sqlite3.Database, input: string) => {
    return new Promise((resolve) => {
        db.all(input, (err, rows) => {
            resolve(rows.map((x) => Object.values(x)));
        });
    });
};

describe("sqllogic", () => {
    describe("select1", () => {
        describe("parsing", () => {
            test.each(queriesAndStatements)("parses %s", (x) => {
                parse(x);
            });
        });

        xdescribe("execution", () => {
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
