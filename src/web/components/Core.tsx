import { useContext } from "react";
import { RelationalClient } from "../../relational";
import { BackendContext } from "../contexts/BackendContext";
import { SourceContext } from "../contexts/SourceContext";
import { Source } from "./Source";
import { VM } from "./VM";

const Result: React.FC = () => {
    const { source } = useContext(SourceContext);
    const { backend } = useContext(BackendContext);
    const client = new RelationalClient(backend, "bytecode");
    try {
        const result = client?.execute(source);
        return (
            <div style={{ fontFamily: "monospace" }}>
                {result.map((x) => (
                    <div>{JSON.stringify(x, undefined, 2)}</div>
                ))}
            </div>
        );
    } catch {
        return null;
    }
};

export const Core = () => {
    const { source, setSource } = useContext(SourceContext);
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "lightgreen",
                padding: "16px",
                margin: "16px",
            }}
        >
            <h3>Core</h3>
            <textarea
                value={source}
                onChange={(e) => setSource(e.currentTarget.value)}
            />
            <h4>Source</h4>
            <Source />
            <h4>Result</h4>
            <Result />
            <h4>VM</h4>
            <VM />
        </div>
    );
};
