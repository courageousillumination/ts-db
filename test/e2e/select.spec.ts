import { RelationalClient } from "../../src/relational";
import { Backend } from "../../src/relational/backend/backend";

const DATA = [
    { a: 1, b: "test1" },
    { a: 2, b: "test2" },
];

describe("SELECT statements", () => {
    let client: RelationalClient;
    let backend: Backend;

    beforeEach(async () => {
        backend = new Backend();
        client = new RelationalClient(backend);

        backend.createTable("table1", [
            { name: "a", type: "integer" },
            { name: "b", type: "string" },
        ]);
        const cursor = backend.createCursor("table1");
        cursor.writeRecord([1, "test1"]);
        cursor.writeRecord([2, "test2"]);
    });

    describe("SELECT clause", () => {
        it("loads columns and returns the values", async () => {
            const result = client.execute("SELECT a FROM table1");
            expect(result).toEqual([[1], [2]]);
        });

        it("respects column order", async () => {
            const result = client.execute("SELECT b, a FROM table1");
            expect(result).toEqual([
                ["test1", 1],
                ["test2", 2],
            ]);
        });

        it("supports * select", async () => {
            const result = client.execute("SELECT * FROM table1");
            expect(result).toEqual([
                [1, "test1"],
                [2, "test2"],
            ]);
        });

        it("supports expressions", async () => {
            const result = client.execute("SELECT a > 1 FROM table1");
            expect(result).toEqual([[false], [true]]);
        });
    });

    describe("WHERE clause", () => {
        it("filters the results", async () => {
            const result = client.execute("SELECT a FROM table1 WHERE a > 1");
            expect(result).toEqual([[2]]);
        });
    });

    describe("comma joins", () => {
        beforeEach(() => {
            backend.createTable("table2", [
                { name: "a", type: "integer" },
                { name: "b", type: "string" },
            ]);
            const cursor = backend.createCursor("table2");
            cursor.writeRecord([2, "table2 test1"]);
            cursor.writeRecord([4, "table2 test2"]);
        });

        it("creates the cross product", () => {
            const result = client.execute("SELECT * FROM table1, table2");
            expect(result).toHaveLength(4);
        });
    });

    describe("with index", () => {});
});
