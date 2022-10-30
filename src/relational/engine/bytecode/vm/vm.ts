import { Backend } from "../backend/backend";
import { Cursor } from "../backend/cursor";
import { ByteCode, Operation, SimpleOpCode } from "../compiler/bytecode";

const SIMPLE_FUNCTIONS: Record<SimpleOpCode, any> = {
    add: (a: number, b: number) => a + b,
    subtract: (a: number, b: number) => a - b,
    divide: (a: number, b: number) => a / b,
    multiply: (a: number, b: number) => a * b,
};

export class VM {
    private readonly stack: unknown[] = [];
    private bytecode: ByteCode = [];
    private position: number = 0;
    private cursor?: Cursor;
    constructor(private readonly backend: Backend) {}

    public reset() {
        this.bytecode = [];
        this.position = 0;
    }

    public loadBytecode(bytecode: ByteCode) {
        this.bytecode = bytecode;
    }

    /**
     * Runs to geta single result row. If the program
     * execution is at the end returns null
     */
    public async step(): Promise<unknown[] | null> {
        while (this.position < this.bytecode.length) {
            const op = this.bytecode[this.position++];
            if (op.type !== "resultRow") {
                this.executeOp(op);
            } else {
                const values = this.popMany(op.columnCount);
                return values;
            }
        }
        return null;
    }

    public executeOp(op: Operation): unknown {
        switch (op.type) {
            case "constant":
                return this.stack.push(op.value);
            case "add":
            case "subtract":
            case "divide":
            case "multiply":
                return this.simpleFunc(SIMPLE_FUNCTIONS[op.type], 2);
            case "openCursor":
                this.cursor = this.backend.createCursor();
                return;
            case "next":
                if (!this.cursor) {
                    throw new Error("No open cursor");
                }
                if (this.cursor.canAdvance()) {
                    this.cursor.next();
                    this.position += op.jump - 1; // janky...
                }
                return;
            case "column":
                if (!this.cursor) {
                    throw new Error("No open cursor");
                }
                this.push(this.cursor?.getColumn(op.index));
                return;
            default:
                throw new Error(`Unhandled opcode: ${(op as any).type}`);
        }
    }

    private simpleFunc(
        func: (...args: unknown[]) => unknown,
        argCount: number
    ) {
        const args = this.popMany(argCount);
        const result = func(...args);
        this.push(result);
    }

    private pop() {
        return this.stack.pop();
    }

    private popMany(count: number) {
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(this.pop());
        }
        return result;
    }

    private push(value: unknown) {
        return this.stack.push(value);
    }
}
