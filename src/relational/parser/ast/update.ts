import { BaseNode } from "./base-node";
import { ExpressionNode } from "./expression";

/** An assignment for an update statement. */
interface Assignments {
    columnName: string;
    expression: ExpressionNode;
}

/** An update statement. */
export interface UpdateNode extends BaseNode {
    type: "update";
    /** Table to insert into. */
    table: string;
    /** Assignements to make. */
    assignments: Assignments[];
    /** Limitation on the update. */
    where?: ExpressionNode;
}
