import { RelationalLoadDataFormat } from "./data";

export interface Table {
    name: string;
    columns: string[];
    data: unknown[][];
}

export const createTable = (name: string, data: RelationalLoadDataFormat) => {
    const columns = Object.keys(data[0]);
    const transformedData = data.map((x) => columns.map((y) => x[y]));
    return {
        name,
        columns,
        data: transformedData,
    };
};
