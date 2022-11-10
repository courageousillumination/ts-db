import { ColumnDefinition } from "../parser/ast/create";

export class Cursor {
    private position = 0;
    constructor(
        private readonly data: unknown[][],
        private readonly columns: ColumnDefinition[]
    ) {}

    /** Advance to the next row in the table. */
    public next() {
        this.position++;
    }

    public rewind() {
        this.position = 0;
    }

    public seekId(id: unknown) {
        const columnIndex = this.columns.findIndex((x) => x.primary);
        if (!columnIndex) {
            throw new Error("No primary key found");
        }
        // In theory these could be sorted, but scan so whatever.
        return this.data.find((x) => x[columnIndex] === id);
    }

    public getRow() {
        return this.data[this.position];
    }

    public hasData() {
        return this.position < this.data.length;
    }

    public getColumn(name: string) {
        const index = this.columns.findIndex((x) => x.name === name);
        if (index === -1) {
            throw new Error("Could not find column");
        }
        return this.data[this.position][index] || null;
    }

    public writeRecord(record: unknown[]) {
        this.data.push(record);
    }

    public writeColumn(index: number, value: unknown) {
        this.data[this.position][index] = value;
    }
}
