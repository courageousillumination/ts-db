// import { ColumnDefinition } from "../parser/ast/create";
// import { RelationalLoadDataFormat } from "./data";

import { ColumnDefinition } from "../parser/ast/create";

export class Table {
    // Note that items are stored with JS objects.
    private readonly data: Record<string, any>[] = [];

    constructor(
        public readonly name: string,
        private readonly columns: ColumnDefinition[]
    ) {}

    /** Insert a value into the table. */
    public async insertValue(values: any[], columns?: string[]) {
        const record: Record<string, any> = {};
        const columnNames = columns || this.columns.map((x) => x.name);
        for (let i = 0; i < columnNames.length; i++) {
            record[columnNames[i]] = values[i];
        }
        this.data.push(record);
    }

    /**
     * Get a generator for the rows.
     */
    public getRows() {
        return this.data.map((_, i) => i);
    }

    public getValue(rowId: number, column: string) {
        return this.data[rowId][column];
    }

    /** Get some debugging information about a table. */
    public debug() {
        console.log(this.data);
    }
}
