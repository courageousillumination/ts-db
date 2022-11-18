/**
 * OP CODES
 *
 * Opcodes for expressions
 *
 * - OPERATOR [name] [args]: Handles simple operators. It will pop `args`
 *   arguments off the stack, run the computation according to `name` and
 *   then push the result back on the stack.
 * - VALUE [value]: Push value on to the stack.
 * - JUMP_FALSE [target]: Jump to the target if the top value of the stack is false
 * - JMUP [target]: Unconditional jump
 * - COPY: Copy whatever is on top of the stack
 *
 * Opcodes for basic cursor/backend
 *
 * - OPEN_CURSOR [id]: Creates a new cursor with the given ID. Note that the compiler
 *   must make sure ids are unique.
 * - REWIND [cursor_id] [fall_through]: Rewind to the beginning of the table. If the table
 *   is empty go to `fall_through`
 * - NEXT [cursor_id] [jump]: Advance the cursor to the next row. If the cursor is at
 *   the end of the table, fall through. Otherwise jump to `jump`
 * - COLUMN [cursor_id] [column_index]: Extract the value of the column at the given
 *   cursor. Pushes the value on to the stack.
 * - RESULT_ROW [arg_count]: Create a new result row using the top `arg_count` values
 *   of the stack. This op code will suspend execution until the caller calls `next`.
 * - WRITE_ROW [cursor_id] [arg_count]: Write the top `arg_count` values from the stack into
 *   the open cursor.
 *
 * Opcodes to support sorting
 *
 * - OPEN_SORTER [id]: Opens a new sorter
 * - SORT [id]: Runs a sorter
 * - WRITE_SORT_KEY [id] [arg_count]: Writes the top `arg_count` values from the stack
 *   into a sorter as a key for the current row.
 *
 * Opcodes to support aggregates
 *
 * - AGG_STEP [id]: Runs the step function for an aggregator. Reads a single value off the stack.
 * - AGG_FINAL [id]: Get the final value from an accumulator
 */

export enum OpCode {
    OPERATOR = "operator",
    VALUE = "value",
    JUMP_FALSE = "jump_false",
    JUMP = "jump",
    COPY = "copy",
    POP = "pop",
    HALT = "halt",

    OPEN_CURSOR = "open_cursor",
    REWIND = "rewind",
    NEXT = "next",
    COLUMN = "column",
    RESULT_ROW = "result_row",
    WRITE_ROW = "write_row",

    OPEN_SORTER = "open_sorter",
    SORT = "sort",
    WRITE_SORT_KEY = "write_sort_key",

    AGG_STEP = "agg_step",
    AGG_FINAL = "agg_final",
}

export interface BytecodeInstruction {
    opcode: OpCode;
    arguments: any[];
}
