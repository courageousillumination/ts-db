import { RelationalClient } from "../../src/relational";

const DATA = [
    { a: 1, b: "test1" },
    { a: 2, b: "test2" },
];

describe("INSERT statements", () => {
    let client: RelationalClient;

    beforeEach(async () => {
        client = new RelationalClient();
        await client.loadData("table1", DATA);
    });

    describe("basic functionality", () => {
        it("works without column names", async () => {
            const result = await client.executeQuery(
                'INSERT INTO table1 VALUES (1, "foo")'
            );
            expect(result).toEqual([[1, "foo"]]);
            const selectResult = await client.executeQuery(
                "SELECT * FROM table1"
            );
            expect(selectResult).toContainEqual([1, "foo"]);
        });

        it("supports changing column names", async () => {
            const result = await client.executeQuery(
                'INSERT INTO table1 (b, a) VALUES ("foo", 1)'
            );
            expect(result).toEqual([[1, "foo"]]);
            const selectResult = await client.executeQuery(
                "SELECT * FROM table1"
            );
            expect(selectResult).toContainEqual([1, "foo"]);
        });
    });
});
