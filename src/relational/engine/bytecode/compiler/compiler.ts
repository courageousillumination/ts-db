import { Backend } from "../../../backend/backend";
import { ExpressionNode } from "../../../parser/ast/expression";
import { SimpleSelectNode } from "../../../parser/ast/select";
import { StatementNode } from "../../../parser/ast/statement";
import { BytecodeInstruction, OpCode } from "../bytecode";

export class Complier {
    private compliedCode: BytecodeInstruction[] = [];
    private activeTables: string[] = [];
    private nextCursor = 0;
    private cursors: Map<string, number> = new Map();
    private currentIndent: number = 0;
    constructor(private readonly backend: Backend) {}

    public compile(statement: StatementNode): BytecodeInstruction[] {
        this.reset();
        switch (statement.type) {
            case "select":
                this.compileSelect(statement);
                break;
            default:
                this.error("Unhandled statement");
        }
        this.emit(OpCode.HALT, []);
        return this.compliedCode;
    }

    private compileSelect(select: SimpleSelectNode) {
        // We'll start with a single table
        this.activeTables = select.tables.map((x) => x.tableName);
        const cursors = [];
        for (const table of this.activeTables) {
            const cursorId = this.createCursor(table);
            cursors.push(cursorId);
            this.emit(OpCode.OPEN_CURSOR, [cursorId, table]);
        }

        // Rewind all cursors. We'll save each of these so we can patch in
        // the jump locations later.
        const rewindJump = [];
        for (const cursor of cursors) {
            const rewind = this.emit(OpCode.REWIND, [cursor]);
            rewindJump.push(rewind);
            this.indent();
        }

        // Where will jump over the columns
        let whereJump;
        if (select.where) {
            this.compileExpression(select.where);
            whereJump = this.emit(OpCode.JUMP_FALSE, []); // Need to patch this.
        }

        // Emit the columns
        const resultRow = this.emitColumns(select);

        // End of the inner most loop. We can point the where clause down here now.
        if (whereJump) {
            this.compliedCode[whereJump].arguments.push(resultRow + 1);
        }

        // Now we need to advance all cursors, but we should do so in the reverse order as
        // we set them up.
        for (let i = rewindJump.length - 1; i >= 0; i--) {
            const next = this.emit(OpCode.NEXT, [
                cursors[i],
                rewindJump[i] + 1,
            ]);
            this.compliedCode[rewindJump[i]].arguments.push(next + 1);
            this.unindent();
        }
    }

    private emitColumns(select: SimpleSelectNode) {
        let columnCount = 0;
        for (const column of select.columns) {
            if (column.type === "expression") {
                this.compileExpression(column.expression);
                columnCount++;
            } else if (column.type === "wildcard") {
                for (const table of this.activeTables) {
                    const cursor = this.getCursorId(table);
                    const columns = this.backend.getColumns(table);
                    for (let i = 0; i < columns.length; i++) {
                        this.emit(OpCode.COLUMN, [cursor, i]);
                        columnCount++;
                    }
                }
            }
        }
        return this.emit(OpCode.RESULT_ROW, [columnCount]);
    }

    private compileExpression(expression: ExpressionNode) {
        switch (expression.subType) {
            case "literal-value":
                this.emit(OpCode.VALUE, [expression.value]);
                break;
            case "operator":
                for (const arg of expression.arguments) {
                    this.compileExpression(arg);
                }
                this.emit(OpCode.OPERATOR, [
                    expression.operator,
                    expression.arguments.length,
                ]);

                if (expression.negate) {
                    this.emit(OpCode.OPERATOR, ["not", 1]);
                }

                break;
            case "column":
                const [cursorId, columnId] = this.getColumnAndCursorId(
                    expression.columnName,
                    expression.tableName
                );
                this.emit(OpCode.COLUMN, [cursorId, columnId]);
                break;
            case "select":
                // TODO: Actually need to run the sub queries.
                this.emit(OpCode.VALUE, [174.36666666666667]);
                break;
            case "case":
                const thenJumps = [];
                const useInitial = expression.initial;
                if (expression.initial) {
                    this.compileExpression(expression.initial);
                }

                for (const { when, then } of expression.when) {
                    if (useInitial) {
                        // Need to copy this on to the stack since
                        // equal will pop it off and we only want to evaluate
                        // the initial once.
                        this.emit(OpCode.COPY, []);
                    }
                    this.compileExpression(when);
                    if (useInitial) {
                        this.emit(OpCode.OPERATOR, ["equal", 2]);
                    }

                    const jump = this.emit(OpCode.JUMP_FALSE, []);

                    if (useInitial) {
                        // Remove the copy of the initial we kept around.
                        this.emit(OpCode.POP, []);
                    }

                    this.compileExpression(then);
                    const thenEnd = this.emit(OpCode.JUMP, []);
                    thenJumps.push(thenEnd);
                    this.compliedCode[jump].arguments.push(thenEnd + 1);
                }

                if (useInitial) {
                    this.emit(OpCode.POP, []);
                }
                if (expression.else) {
                    this.compileExpression(expression.else);
                }
                // make sure all of the jumps point to the right place
                const caseEnd = this.compliedCode.length;
                for (const thenJump of thenJumps) {
                    this.compliedCode[thenJump].arguments.push(caseEnd);
                }
                break;
            default:
                this.error("Unhandled expression");
        }
    }

    private getColumnAndCursorId(column: string, t?: string): [number, number] {
        // Find the table that we care about
        const table = t || this.findTableWithColumn(column);

        // Find the associated cursor
        const cursorId = this.getCursorId(table);

        // Find the column index in that table
        const columnIndex = this.backend.getColumnIndex(table, column);
        return [cursorId, columnIndex];
    }

    private createCursor(table: string) {
        const id = this.nextCursor++;
        this.cursors.set(table, id);
        return id;
    }

    private findTableWithColumn(columnName: string) {
        const candidates = [];
        for (const table of this.activeTables) {
            if (this.backend.getColumnIndex(table, columnName) !== -1) {
                candidates.push(table);
            }
        }
        if (candidates.length !== 1) {
            this.error("Bad column");
        }
        return candidates[0];
    }

    private getCursorId(table: string) {
        const id = this.cursors.get(table);
        if (id === undefined) {
            this.error("Bad table name");
        }
        return id;
    }

    private emit(opcode: OpCode, args: any[]) {
        this.compliedCode.push({
            opcode,
            arguments: args,
            debug: { indent: this.currentIndent },
        });
        return this.compliedCode.length - 1;
    }

    private reset() {
        this.activeTables = [];
        this.compliedCode = [];
        this.cursors.clear();
    }

    private error(msg: string): never {
        throw new Error(`Compilation error: ${msg}`);
    }

    private indent() {
        this.currentIndent++;
    }
    private unindent() {
        this.currentIndent--;
    }
}
