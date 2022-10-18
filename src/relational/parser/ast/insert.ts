import { Expression } from "./expression";

export interface InsertStatement {
    type: "insert";
    insertClause: {
        table: string;
        columns?: string[];
    };
    valuesClause: {
        values: Expression[];
    };
}
