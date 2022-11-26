import { ColumnDefinition } from "../parser/ast/create";
import { Cursor } from "./cursor";

interface TableColumnDefinition extends ColumnDefinition {
    indexed?: boolean;
}

export interface Table {
    name: string;
    columns: TableColumnDefinition[];
    data: unknown[][];

    indices?: Record<string, Record<any, number[]>>;
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
        // this.indexTable(t);
        const columnNames = columns.map((x) => x.column);
        for (const column of t.columns) {
            if (columnNames.includes(column.name)) {
                column.indexed = true;
            }
        }
    }

    private indexTable(t: Table) {
        for (let i = 0; i < t.columns.length; i++) {
            const column = t.columns[i];
            if (!column.indexed && !column.primary) {
                continue;
            }
            const index: Record<any, number[]> = {};

            for (let j = 0; j < t.data.length; j++) {
                const key = t.data[j][i] as any;
                if (!index[key]) {
                    index[key] = [] as number[];
                }
                index[key].push(j);
            }

            t.indices = { ...(t.indices || {}), [column.name]: index };
            // }
        }
    }

    public createCursor(name: string) {
        const table = this.getTableByName(name);

        // This is a massive hack. But some indexes are not included.
        // So if we have more than 50 items we generate indicies automatically.
        if (table.data.length > 50) {
            for (const column of table.columns) {
                column.indexed = true;
            }
        }

        this.indexTable(table);

        return new Cursor(
            table.data,
            table.columns,
            table.name,
            table.indices || {}
        );
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
