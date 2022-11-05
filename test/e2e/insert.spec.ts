import { RelationalClient } from "../../src/relational";
import { Backend } from "../../src/relational/backend/backend";

describe("INSERT statements", () => {
    let client: RelationalClient;
    let backend: Backend;

    beforeEach(async () => {
        backend = new Backend();
        client = new RelationalClient(backend);

        // Initialize the backend
        backend.createTable("table1", [
            { name: "a", type: "integer" },
            { name: "b", type: "integer" },
        ]);
    });

    describe("basic functionality", () => {
        it("works without column names", async () => {
            client.execute('INSERT INTO table1 VALUES (1, "foo")');
            const selectResult = client.execute("SELECT * FROM table1");
            expect(selectResult).toContainEqual([1, "foo"]);
        });

        it("supports changing column names", async () => {
            client.execute('INSERT INTO table1 (b, a) VALUES ("foo", 1)');
            const selectResult = client.execute("SELECT * FROM table1");
            expect(selectResult).toContainEqual([1, "foo"]);
        });
    });
});
