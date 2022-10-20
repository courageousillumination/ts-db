import { ColumnDefinition } from "../parser/ast/create";
import { RelationalLoadDataFormat } from "./data";

export interface Table {
    name: string;
    columns: ColumnDefinition[];
    data: unknown[][];
}

export const createTable = (
    name: string,
    columns: ColumnDefinition[]
): Table => {
    return {
        name,
        columns,
        data: [],
    };
};

export const findColumnIndex = (table: Table, columnName: string) => {
    return table.columns.findIndex((x) => x.name === columnName);
};

export const createTableFromData = (
    name: string,
    data: RelationalLoadDataFormat
): Table => {
    const columns = Object.keys(data[0]).map((x): ColumnDefinition => {
        if (typeof x === "number") {
            return { name: x, type: "integer" };
        } else {
            return { name: x, type: "string" };
        }
    });
    const transformedData = data.map((x) => columns.map((y) => x[y.name]));
    return {
        name,
        columns,
        data: transformedData,
    };
};
