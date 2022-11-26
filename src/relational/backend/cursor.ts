import { ColumnDefinition } from "../parser/ast/create";

let COLUMN_COUNT = 0;
export class Cursor {
    public position = 0;

    private indexPosition = 0;

    public currentIndexingValue?: { column: string; value: unknown };
    constructor(
        private readonly data: unknown[][],
        private readonly columns: ColumnDefinition[],
        public readonly tableName: string,
        private readonly indices: Record<string, Record<any, number[]>>
    ) {}

    /** Advance to the next row in the table. */
    public next() {
        if (!this.currentIndexingValue) {
            this.position++;
        } else {
            const { column, value } = this.currentIndexingValue;
            const indexValues = this.indices[column][value as any];
            if (indexValues && this.indexPosition < indexValues.length - 1) {
                this.indexPosition++;
                this.position = indexValues[this.indexPosition];
                return true;
            } else {
                this.position = this.data.length + 1;
                return false;
            }
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
        this.currentIndexingValue = { column: columnName, value };

        this.indexPosition = 0;

        const indexValues = this.indices[columnName][value as any];
        if (indexValues && indexValues.length > 0) {
            this.position = indexValues[0];
        } else {
            this.position = this.data.length + 1;
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

    public hasNext() {
        return this.position < this.data.length - 1;
    }

    public isValid() {
        if (this.position >= this.data.length) {
            return false;
        }

        if (!this.currentIndexingValue) {
            return true;
        }

        const { column, value } = this.currentIndexingValue;
        const indexValues = this.indices[column][value as any];
        return indexValues && this.indexPosition < indexValues.length;
    }

    public hasNextIndex() {
        if (!this.currentIndexingValue) {
            return false;
        }

        const { column, value } = this.currentIndexingValue;

        const indexValues = this.indices[column][value as any];
        return indexValues && this.indexPosition < indexValues.length - 1;
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
