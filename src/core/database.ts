import { TableSchema } from "./schema"
import { Table } from "./table"



/** Simple in memory database */
export class Database {
    private database = new Map<string, Table>()


    public createTable(name: string, schema: TableSchema) {
        const table = new Table(schema)
        this.database.set(name, table)
    }

    public insertInto(tableName: string, values: unknown[]) {
        const table = this.database.get(tableName)
        return table?.insertInto(values)
    }

    public select(tableName: string, columns: string[]) {
        const table = this.database.get(tableName)
        return table?.select(columns)
    }
}

