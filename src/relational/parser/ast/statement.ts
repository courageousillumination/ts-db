import { CreateStatement } from "./create";
import { Expression } from "./expression";
import { InsertStatement } from "./insert";
import { SelectStatement } from "./select";
import { UpdateStatement } from "./update";

export type Statement =
    | SelectStatement
    | InsertStatement
    | CreateStatement
    | UpdateStatement
    | { type: "expression"; expression: Expression };
