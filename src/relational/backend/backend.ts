import { ColumnDefinition } from "../parser/ast/create";
import { Cursor } from "./cursor";

interface Table {
    name: string;
    columns: ColumnDefinition[];
    data: unknown[][];
}

/** Represents an in memory backend for ts-db */
export class Backend {
    private tables: Table[] = [];

    public createTable(name: string, columns: ColumnDefinition[]) {
        this.tables.push({ name, columns, data: [] });
    }
    public createCursor(name: string) {
        return new Cursor(this.getTableByName(name).data);
    }

    public getColumnIndex(name: string, column: string) {
        const table = this.getTableByName(name);
        const index = table.columns.findIndex((x) => x.name === column);
        if (index === -1) {
            throw new Error(`Could not find column named ${column}`);
        }
        return index;
    }

    public getTableNames() {
        return this.tables.map((x) => x.name);
    }

    public getColumns(table: string) {
        return this.getTableByName(table).columns;
    }

    private getTableByName(name: string) {
        const table = this.tables.find((x) => x.name === name);
        if (!table) {
            throw new Error(`Could not find table with name ${name}`);
        }
        return table;
    }
}
