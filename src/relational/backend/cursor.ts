import { ColumnDefinition } from "../parser/ast/create";

let COLUMN_COUNT = 0;
export class Cursor {
    private position = 0;

    public currentIndexingValue?: { column: number; value: unknown };
    constructor(
        private readonly data: unknown[][],
        private readonly columns: ColumnDefinition[]
    ) {}

    /** Advance to the next row in the table. */
    public next() {
        if (!this.currentIndexingValue) {
            this.position++;
        } else {
            const { column, value } = this.currentIndexingValue;
            do {
                this.position++;
            } while (
                this.position < this.data.length &&
                this.data[this.position][column] !== value
            );
        }
        return this.hasData();
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

    public seekIndex(columnName: string, value: unknown) {
        const columnIndex = this.columns.findIndex(
            (x) => x.name === columnName
        );
        if (columnIndex === -1) {
            throw new Error("No column");
        }
        this.currentIndexingValue = { column: columnIndex, value };
        this.rewind();

        if (this.data[this.position][columnIndex] !== value) {
            this.next();
        }
    }

    public hasColumn(name: string) {
        const columnIndex = this.columns.findIndex((x) => x.name === name);
        return columnIndex !== -1;
    }

    public clearIndex() {
        this.currentIndexingValue = undefined;
    }

    public getRow() {
        return this.data[this.position];
    }

    public hasData() {
        return this.position < this.data.length;
    }

    public getColumnByIndex(index: number) {
        const value = this.data[this.position][index];
        return value !== undefined ? value : null;
    }

    public getColumn(name: string) {
        const index = this.columns.findIndex((x) => x.name === name);
        if (index === -1) {
            throw new Error("Could not find column");
        }
        COLUMN_COUNT++;
        const value = this.data[this.position][index];
        return value !== undefined ? value : null;
    }

    public debug() {
        console.log(COLUMN_COUNT);
    }

    public writeRecord(record: unknown[]) {
        this.data.push(record);
    }

    public writeColumn(index: number, value: unknown) {
        this.data[this.position][index] = value;
    }

    public isEmpty() {
        return this.data.length === 0;
    }
}
