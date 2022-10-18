import { Expression } from "./expression";
import { InsertStatement } from "./insert";
import { SelectStatement } from "./select";

export type Statement =
    | SelectStatement
    | InsertStatement
    | { type: "expression"; expression: Expression };
