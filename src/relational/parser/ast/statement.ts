import { Expression } from "./expression";
import { SelectStatement } from "./select";

export type Statement =
    | SelectStatement
    | { type: "expression"; expression: Expression };
