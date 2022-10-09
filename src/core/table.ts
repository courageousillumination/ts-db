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
    public select(columns: string[], orderBy?: (string | number)[]) {
        const indicies = columns.map((x) => this.schema.columns.findIndex(y => x === y.name));
        const modifiedOrderBy = orderBy?.map(x => typeof x === 'number' ? x - 1 : this.schema.columns.findIndex(y => x === y.name))
        const data = this.data.map(x => indicies.map(y => x[y]));
        if (modifiedOrderBy) {
            return data.sort((a, b) => {
                for (const order of modifiedOrderBy) {
                    if (a[order] === b[order]) {
                        continue
                    } else {
                        return a[order] - b[order]
                    }
                }
                return 0
            })
        } else {
            return data
        }
    }
}
