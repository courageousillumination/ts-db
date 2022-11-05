import { RelationalClient } from "../../src/relational";
import { Backend } from "../../src/relational/backend/backend";

describe("CREATE TABLE statements", () => {
    let client: RelationalClient;
    let backend: Backend;

    beforeEach(async () => {
        backend = new Backend();
        client = new RelationalClient(backend);
    });

    describe("basic functionality", () => {
        it("creates a new table that we can insert into", async () => {
            client.execute("CREATE TABLE table1 (col1 INTEGER)");
            expect(backend.getTableNames()).toHaveLength(1);
        });
    });
});
