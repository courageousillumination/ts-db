import { RelationalClient } from "../../src/relational";
import { Backend } from "../../src/relational/backend/backend";

const DATA = [
    { a: 1, b: "test1" },
    { a: 2, b: "test2" },
];

describe("UPDATE statements", () => {
    let client: RelationalClient;

    beforeEach(async () => {
        const backend = new Backend();
        client = new RelationalClient(backend);
        backend.createTable("table1", [
            { name: "a", type: "integer" },
            { name: "b", type: "string" },
        ]);
        const cursor = backend.createCursor("table1");
        cursor.writeRecord([1, "test1"]);
        cursor.writeRecord([2, "test2"]);
    });

    describe("basic functionality", () => {
        it("sets a new value", async () => {
            client.execute('UPDATE table1 SET b = "test3" WHERE a = 2');
            const result = client.execute("SELECT * FROM table1;");
            expect(result).toEqual([
                [1, "test1"], // not updated
                [2, "test3"], // updated
            ]);
        });
    });
});
