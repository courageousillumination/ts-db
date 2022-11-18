import { useContext, useState } from "react";
import { RelationalClient } from "../../relational";
import { BackendContext } from "../contexts/BackendContext";
import { SourceContext } from "../contexts/SourceContext";
import { Source } from "./Source";
import { VM } from "./VM";

const Result: React.FC<{ engine: "bytecode" | "interpreter" }> = ({
    engine,
}) => {
    const { source } = useContext(SourceContext);
    const { backend } = useContext(BackendContext);

    const client = new RelationalClient(backend, engine);

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

const ResultContainer: React.FC = () => {
    const [engine, setEngine] = useState<"bytecode" | "interpreter">(
        "bytecode"
    );
    return (
        <div>
            <input
                id="interpreter"
                type="checkbox"
                checked={engine === "interpreter"}
                onChange={(e) => {
                    if (e.target.checked) {
                        setEngine("interpreter");
                    } else {
                        setEngine("bytecode");
                    }
                }}
            ></input>
            <label htmlFor="interpreter">Use interpreter</label>
            <Result engine={engine} />
        </div>
    );
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
            <ResultContainer />
            <h4>VM</h4>
            <VM />
        </div>
    );
};
