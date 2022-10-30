export class Cursor {
    private position = 0;
    constructor(private readonly data: unknown[][]) {}

    /** Advance to the next row in the table. */
    public next() {
        this.position++;
    }

    public hasData() {
        return this.position < this.data.length;
    }

    public getColumn(index: number) {
        return this.data[this.position][index] || null;
    }
}
