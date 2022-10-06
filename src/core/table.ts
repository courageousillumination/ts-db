import { TableSchema } from "./schema";

export class Table {
    // Data will be an array of records
    private readonly data: any[] = [];

    constructor(private readonly schema: TableSchema) { }
    public insertInto(values: unknown[]) {
        this.data.push(values);
    }

    // Note: This returns an array of arrays. You'll have to remap them
    // manually if you want column names.
    public select(columns: string[]) {
        const indicies = columns.map((x) => this.schema.columns.findIndex(y => x === y.name));
        return this.data.map(x => indicies.map(y => x[y]));
    }
}
