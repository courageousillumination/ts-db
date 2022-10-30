import { Backend } from "../backend/backend";
import { Expression } from "../parser/ast/expression";
import { Statement } from "../parser/ast/statement";
import { TokenType } from "../parser/tokenizer";
import { ByteCode, Operation, SimpleOpCode } from "./bytecode";

const getOpcodeFromOperator = (operator: TokenType): SimpleOpCode => {
    switch (operator) {
        case "star":
            return "multiply";
        case "plus":
            return "add";
        case "slash":
            return "divide";
        case "minus":
            return "subtract";
        default:
            throw new Error(`Unknown operator: ${operator}`);
    }
};

export const compile = (statement: Statement, backend: Backend): ByteCode => {
    switch (statement.type) {
        case "select":
            // Hacked together for now
            let loopBody: ByteCode = [];
            for (const column of statement.selectClause.columns) {
                if (column.type === "wildcard") {
                    // TODO: Read from the backend about all of the columns on the table.
                    continue;
                }
                loopBody = [
                    ...compileExpression(column.expression, backend),
                    ...loopBody,
                ];
            }
            // Put in the last piecs of the loop.
            const code: Operation[] = [
                { type: "openCursor" },
                ...loopBody,
                {
                    type: "resultRow",
                    columnCount: statement.selectClause.columns.length,
                },
                { type: "next", jump: -(loopBody.length + 1) },
            ];
            return code;
        default:
            throw new Error(`Unhandled statement ${statement.type}`);
    }
};

// TODO: Add statements later.
export const compileExpression = (
    expression: Expression,
    backend: Backend
): ByteCode => {
    switch (expression.type) {
        case "value":
            return [{ type: "constant", value: expression.value }];
        case "binary":
            const left = compileExpression(expression.left, backend);
            const right = compileExpression(expression.right, backend);
            return [
                ...right,
                ...left,
                { type: getOpcodeFromOperator(expression.operator) },
            ];
        case "column":
            return [
                {
                    type: "column",
                    index: backend.getColumnIndex("foo", expression.column),
                },
            ]; // TODO: Actually do this lookup.
        default:
            throw Error("Unable to compile expression");
    }
};
