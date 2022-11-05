import { BaseNode } from "./base-node";
import { ExpressionNode } from "./expression";

/** Insert statement AST node. */
export interface InsertNode extends BaseNode {
    type: "insert";
    /** Table to insert into. */
    table: string;
    /** Optional column ordering. */
    columns?: string[];
    /** Values to insert */
    values: ExpressionNode[];
}
