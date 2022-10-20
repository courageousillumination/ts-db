import { Expression } from "./expression";

interface Assignments {
    columnName: string;
    expression: Expression;
}

export interface UpdateStatement {
    type: "update";
    table: string;
    assignments: Assignments[];
    whereClause?: Expression;
}
