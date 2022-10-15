import { RelationalClient } from "../../src/relational";

const DATA = [
    { a: 1, b: "test1" },
    { a: 2, b: "test2" },
];

describe("SELECT statements", () => {
    let client: RelationalClient;

    beforeEach(async () => {
        client = new RelationalClient();
        await client.loadData("table1", DATA);
    });

    describe("SELECT clause", () => {
        it("loads columns and returns the values", async () => {
            const result = await client.executeQuery("SELECT a FROM table1;");
            expect(result).toEqual([[1], [2]]);
        });

        it("respects column order", async () => {
            const result = await client.executeQuery(
                "SELECT b, a FROM table1;"
            );
            expect(result).toEqual([
                ["test1", 1],
                ["test2", 2],
            ]);
        });

        it("supports * select", async () => {
            const result = await client.executeQuery("SELECT * FROM table1;");
            expect(result).toEqual([
                [1, "test1"],
                [2, "test2"],
            ]);
        });

        it("supports expressions", async () => {
            const result = await client.executeQuery(
                "SELECT a > 1 FROM table1;"
            );
            expect(result).toEqual([[false], [true]]);
        });
    });

    describe("WHERE clause", () => {
        it("filters the results", async () => {
            const result = await client.executeQuery(
                "SELECT a FROM table1 WHERE a > 1;"
            );
            expect(result).toEqual([[2]]);
        });
    });
});
