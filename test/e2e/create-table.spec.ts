import { RelationalClient } from "../../src/relational";

describe("CREATE TABLE statements", () => {
    let client: RelationalClient;

    beforeEach(async () => {
        client = new RelationalClient();
    });

    describe("basic functionality", () => {
        it("creates a new table that we can insert into", async () => {
            await client.executeQuery("CREATE TABLE table1 (col1 INTEGER);");
            expect(await client.getTables()).toHaveLength(1);
        });
    });
});
