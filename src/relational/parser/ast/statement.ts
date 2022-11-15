import { CreateIndexNode, CreateNode } from "./create";
import { InsertNode } from "./insert";
import { SelectNode } from "./select";
import { UpdateNode } from "./update";

export type StatementNode =
    | SelectNode
    | UpdateNode
    | CreateNode
    | InsertNode
    | CreateIndexNode;
