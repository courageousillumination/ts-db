import { CreateStatement } from "./create";
import { Expression } from "./expression";
import { InsertStatement } from "./insert";
import { SelectStatement } from "./select";

export type Statement =
    | SelectStatement
    | InsertStatement
    | CreateStatement
    | { type: "expression"; expression: Expression };
