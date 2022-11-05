import { RelationalClient } from "../../src/relational";

const DATA = [
    { a: 1, b: "test1" },
    { a: 2, b: "test2" },
];

describe("UPDATE statements", () => {
    let client: RelationalClient;

    beforeEach(async () => {
        // client = new RelationalClient();
        // await client.loadData("table1", DATA);
    });

    describe("basic functionality", () => {
        it.only("sets a new value", async () => {
            // await client.executeQuery(
            //     'UPDATE table1 SET b = "test3" WHERE a = 2'
            // );
            // const result = await client.executeQuery("SELECT * FROM table1;");
            // expect(result).toEqual([
            //     [1, "test1"], // not updated
            //     [2, "test3"], // updated
            // ]);`
        });
    });
});
