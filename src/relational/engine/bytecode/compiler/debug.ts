import { ByteCode, Operation } from "./bytecode";

export const printBytecode = (bytecode: ByteCode): string => {
    return bytecode.map((op, i) => `${i}: ${printOp(op)}`).join("\n");
};

const printOp = (operation: Operation): string => {
    switch (operation.type) {
        case "constant":
            return `${operation.type}\t${operation.value}`;
        case "add":
        case "subtract":
        case "multiply":
        case "divide":
            return `${operation.type}`;
        case "resultRow":
            return `${operation.type}\t${operation.columnCount}`;
        case "next":
            return `${operation.type}\t${operation.jump}`; // TODO
        case "openCursor":
            return `${operation.type}`;
        case "column":
            return `${operation.type}\t${operation.index}`; // TODO
    }
};
