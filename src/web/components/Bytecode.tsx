import { useContext } from "react";
import { parse } from "../../relational";
import { Backend } from "../../relational/backend/backend";
import { BytecodeInstruction } from "../../relational/engine/bytecode/bytecode";
import { Complier } from "../../relational/engine/bytecode/compiler/compiler";
import { BackendContext } from "../contexts/BackendContext";
import { SourceContext } from "../contexts/SourceContext";

const checkedCompile = (source: string, backend: Backend) => {
    try {
        const parsed = parse(source);
        const compiler = new Complier(backend);
        return compiler.compile(parsed[0]);
    } catch (e) {
        return String(e);
    }
};

export const DisplayBytecodeInstruction: React.FC<{
    instruction: BytecodeInstruction;
}> = ({ instruction }) => {
    return (
        <div style={{ fontFamily: "monospace" }}>
            <span>{instruction.opcode}</span>
            <span>{JSON.stringify(instruction.arguments)}</span>
        </div>
    );
};

export const Bytecode: React.FC = () => {
    const { backend } = useContext(BackendContext);
    const { source } = useContext(SourceContext);
    const bytecode = checkedCompile(source, backend);
    if (typeof bytecode === "string") {
        return <div style={{ fontFamily: "monospace" }}>{bytecode}</div>;
    }
    return (
        <div>
            {bytecode.map((x, i) => (
                <DisplayBytecodeInstruction instruction={x} key={i} />
            ))}
        </div>
    );
};
