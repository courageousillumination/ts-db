import { Cursor } from "./cursor";

const MOCK_DATA = [
    [1, 2],
    [2, 4],
    [3, 8],
];

/** Represents an in memory backend for ts-db */
export class Backend {
    public createCursor() {
        return new Cursor(MOCK_DATA);
    }

    public getColumnIndex(table: string, column: string) {
        if (column === "x") {
            return 0;
        } else {
            return 1;
        }
    }
}
