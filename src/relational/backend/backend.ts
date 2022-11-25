import { ColumnDefinition } from "../parser/ast/create";
import { Cursor } from "./cursor";

interface TableColumnDefinition extends ColumnDefinition {
    indexed?: boolean;
}

export interface Table {
    name: string;
    columns: TableColumnDefinition[];
    data: unknown[][];
}

/** Represents an in memory backend for ts-db */
export class Backend {
    private tables: Table[] = [];

    public createTable(name: string, columns: ColumnDefinition[]) {
        this.tables.push({ name, columns, data: [] });
    }

    public createIndex(
        table: string,
        columns: { column: string; direction: "asc" | "desc" }[]
    ) {
        const t = this.getTableByName(table);
        const columnNames = columns.map((x) => x.column);
        for (const column of t.columns) {
            if (columnNames.includes(column.name)) {
                column.indexed = true;
            }
        }
    }

    public createCursor(name: string) {
        const table = this.getTableByName(name);
        return new Cursor(table.data, table.columns, table.name);
    }

    public getColumnIndex(name: string, column: string) {
        const table = this.getTableByName(name);
        const index = table.columns.findIndex((x) => x.name === column);
        return index;
    }

    public getTableNames() {
        return this.tables.map((x) => x.name);
    }

    public getColumns(table: string) {
        return this.getTableByName(table).columns;
    }

    // ONLY FOR DISPLAY/DEMO USE
    public getTables() {
        return this.tables;
    }

    private getTableByName(name: string) {
        const table = this.tables.find((x) => x.name === name);
        if (!table) {
            throw new Error(`Could not find table with name ${name}`);
        }
        return table;
    }
}
