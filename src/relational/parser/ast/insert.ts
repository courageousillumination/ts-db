import { Expression } from "./expression";

export interface InsertStatement {
    type: "insert";
    insertClause: {
        table: string;
    };
    valuesClause: {
        values: Expression[];
    };
}
