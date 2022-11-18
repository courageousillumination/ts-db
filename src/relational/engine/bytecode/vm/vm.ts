import { Backend } from "../../../backend/backend";
import { Cursor } from "../../../backend/cursor";
import { Operator } from "../../../parser/ast/expression";
import { OPERATORS } from "../../shared/operators";
import { BytecodeInstruction, OpCode } from "../bytecode";

export class VirtualMachine {
    /** Mixed type stack. */
    public stack: unknown[] = [];

    /** Code being executed. */
    public code: BytecodeInstruction[] = [];

    /** Current program counter. */
    public pc: number = 0;

    /** Open cursors */
    public cursors: Record<number, Cursor> = {};

    constructor(private readonly backend: Backend) {}

    public prepare(code: BytecodeInstruction[]) {
        this.code = code;
    }

    /** Runs the VM until a new row is encountered. */
    public *step() {
        while (this.pc < this.code.length) {
            const result = this.stepInstruction();
            if (result) {
                yield result;
            }
        }
    }

    public stepInstruction() {
        if (this.pc >= this.code.length) {
            return;
        }
        const instruction = this.code[this.pc++];
        switch (instruction.opcode) {
            case OpCode.VALUE:
                this.push(instruction.arguments[0]);
                break;
            case OpCode.OPERATOR:
                this.applyOperator(instruction);
                break;
            case OpCode.OPEN_CURSOR:
                this.openCursor(instruction);
                break;
            case OpCode.REWIND:
                this.rewind(instruction);
                break;
            case OpCode.NEXT:
                this.next(instruction);
                break;
            case OpCode.COLUMN:
                this.column(instruction);
                break;
            case OpCode.RESULT_ROW:
                // NOTE: Only yield here
                return this.resultRow(instruction);

            case OpCode.JUMP_FALSE:
                if (!this.pop()) {
                    this.pc = instruction.arguments[0];
                }
                break;
            case OpCode.JUMP:
                this.pc = instruction.arguments[0];
                break;
            case OpCode.POP:
                this.pop();
                break;
            case OpCode.COPY:
                const value = this.pop();
                this.push(value);
                this.push(value);
                break;
            case OpCode.HALT:
                return;
            default:
                this.error(`Unhandled opcode: ${instruction.opcode}`);
        }
    }

    public debug() {
        console.log(this.code);
        console.log(this.stack);
    }

    private resultRow(instruction: BytecodeInstruction) {
        const row = this.popMany(instruction.arguments[0]);
        return row;
    }

    private column(instruction: BytecodeInstruction) {
        const cursor = this.cursors[instruction.arguments[0]];
        this.push(cursor.getColumnByIndex(instruction.arguments[1]));
    }

    private next(instruction: BytecodeInstruction) {
        const cursor = this.cursors[instruction.arguments[0]];
        if (cursor.next()) {
            this.pc = instruction.arguments[1];
        }
    }

    private rewind(instruction: BytecodeInstruction) {
        const cursor = this.cursors[instruction.arguments[0]];
        if (cursor.isEmpty()) {
            this.pc = instruction.arguments[1];
        } else {
            cursor.rewind();
        }
    }

    private applyOperator(instruction: BytecodeInstruction) {
        const args = this.popMany(instruction.arguments[1]);
        const func = OPERATORS[instruction.arguments[0] as Operator];
        if (!func) {
            this.error("Unexpected operator");
        }
        const result = func(...args);
        this.push(result);
    }

    private openCursor(instruction: BytecodeInstruction) {
        const cursor = this.backend.createCursor(instruction.arguments[1]);
        this.cursors[instruction.arguments[0]] = cursor;
    }

    private error(msg: string): never {
        throw new Error(`Runtime error: ${msg}`);
    }

    private pop() {
        return this.stack.pop();
    }

    private popMany(count: number = 1) {
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(this.stack.pop());
        }
        // Note to make some logic easier we just reverse it here.
        // this means if the stack is [a, b, c] then we get [b,c] to pass to everyone else.
        return result.reverse();
    }

    private push(value: unknown) {
        this.stack.push(value);
    }
}
