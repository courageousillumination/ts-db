import { useContext, useEffect, useMemo, useState } from "react";
import { parse } from "../../relational";
import { Backend } from "../../relational/backend/backend";
import { Complier } from "../../relational/engine/bytecode/compiler/compiler";
import { VirtualMachine } from "../../relational/engine/bytecode/vm/vm";
import { BackendContext } from "../contexts/BackendContext";
import { SourceContext } from "../contexts/SourceContext";
import { DisplayBytecodeInstruction } from "./Bytecode";
const checkedCompile = (source: string, backend: Backend) => {
    try {
        const parsed = parse(source);
        const compiler = new Complier(backend);
        return compiler.compile(parsed[0]);
    } catch (e) {
        return String(e);
    }
};

export const VM: React.FC = () => {
    const [steps, setSteps] = useState(0);
    const [accumulatedResult, setAccumulatedResult] = useState<unknown[]>([]);
    const { source } = useContext(SourceContext);
    const { backend, setCursors } = useContext(BackendContext);
    const [running, setRunning] = useState(false);
    const [rate, setRate] = useState("1");

    const vm = useMemo(() => {
        const bytecode = checkedCompile(source, backend);
        if (typeof bytecode === "string") {
            return null;
        }

        const vm = new VirtualMachine(backend);
        vm.prepare(bytecode);
        return vm;
    }, [source, backend]);

    useEffect(() => {
        const numRate = parseFloat(rate);
        if (!numRate || !running) {
            return;
        }
        const id = setInterval(() => {
            const res = vm?.stepInstruction();
            if (res) {
                setAccumulatedResult((x) => {
                    return [...x, res];
                });
            }
            setSteps((s) => s + 1);
        }, numRate * 1000);
        return () => {
            clearInterval(id);
        };
    }, [running, rate, vm, setSteps]);

    useEffect(() => {
        setSteps(0);
        setAccumulatedResult([]);
        setRunning(false);
    }, [vm, setSteps, setAccumulatedResult]);

    useEffect(() => {
        if (vm?.cursors) {
            setCursors(
                Object.keys(vm.cursors).map((x) => ({
                    id: parseInt(x),
                    cursor: vm.cursors[parseInt(x)],
                }))
            );
        }
    }, [vm?.cursors, steps]);

    if (vm === null) {
        return null;
    }
    return (
        <div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                    onClick={() => {
                        const res = vm.stepInstruction();
                        if (res) {
                            setAccumulatedResult((x) => {
                                return [...x, res];
                            });
                        }
                        setSteps(() => steps + 1);
                    }}
                >
                    Step
                </button>
                <label>Run Rate:</label>
                <input
                    value={`${rate}`}
                    onChange={(e) => {
                        setRate(e.target.value);
                    }}
                />
                <button onClick={() => setRunning(!running)}>
                    {running ? "Stop" : "Run"}{" "}
                </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                    <h5>Bytecode</h5>
                    {vm.code.map((x, i) => {
                        return (
                            <div style={{ display: "flex", gap: "8px" }}>
                                <span
                                    style={{
                                        width: "16px",
                                        fontFamily: "monospace",
                                    }}
                                >
                                    {i === vm.pc ? ">" : null}
                                </span>

                                <DisplayBytecodeInstruction
                                    instruction={x}
                                    index={i}
                                />
                            </div>
                        );
                    })}
                </div>
                <div>
                    <h5>Stack</h5>
                    {vm.stack.map((x) => (
                        <div style={{ fontFamily: "monospace" }}>
                            {JSON.stringify(x)}
                        </div>
                    ))}
                </div>
                <div>
                    <h5>Cursors</h5>
                    {Object.keys(vm.cursors).map((x) => {
                        return (
                            <div style={{ fontFamily: "monospace" }}>
                                {x} {vm.cursors[parseInt(x)].tableName}{" "}
                                {vm.cursors[parseInt(x)].position}
                            </div>
                        );
                    })}
                </div>
                <div>
                    <h5>Result</h5>
                    <div style={{ fontFamily: "monospace" }}>
                        {accumulatedResult.map((x) => (
                            <div>{JSON.stringify(x, undefined, 2)}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
