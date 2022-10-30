export type SimpleOpCode = "add" | "subtract" | "multiply" | "divide";

/** Operations that work directly on the stack. */
interface SimpleOperation {
    type: SimpleOpCode;
}

/** Pushes a constant on to the stack. */
interface ConstatOperation {
    type: "constant";
    /** The value to be loaded on to the stack. */
    value: unknown;
}

interface ResultRowOperation {
    type: "resultRow";

    /** How many columns should be popped off the stack. */
    columnCount: number;
}

interface OpenCursorOperation {
    type: "openCursor";
}
interface NextOperation {
    type: "next";

    /**
     * Relative offset for jumping.
     * TODO: Look at the value of doing real targeted jumps...
     */
    jump: number;
}

interface ColumnOperation {
    type: "column";
    index: number;
}

export type Operation =
    | ConstatOperation
    | SimpleOperation
    | ResultRowOperation
    | NextOperation
    | OpenCursorOperation
    | ColumnOperation;

export type ByteCode = Operation[];
