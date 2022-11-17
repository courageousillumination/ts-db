import { Backend } from "../backend/backend";
import { Complier } from "../engine/bytecode/compiler/compiler";
import { VirtualMachine } from "../engine/bytecode/vm/vm";
import { Interpreter } from "../engine/interpreter/interpreter";
import { parse } from "../parser";

class RelationalClient {
    private readonly interpreter: Interpreter;
    private readonly compiler: Complier;
    private readonly vm: VirtualMachine;

    constructor(backend: Backend) {
        this.interpreter = new Interpreter(backend);
        this.compiler = new Complier(backend);
        this.vm = new VirtualMachine(backend);
    }

    public execute(input: string) {
        const parsed = parse(input);
        let result: unknown[][] = [];
        for (const statement of parsed) {
            // Using byte code
            const bytecode = this.compiler.compile(statement);
            this.vm.prepare(bytecode);

            result = [];
            for (const row of this.vm.step()) {
                result.push(row);
            }

            // Using tree-walk interpreter

            // this.interpreter.prepare(statement);
            // result = [];
            // for (const row of this.interpreter.step()) {
            //     result.push(row);
            // }
            // this.interpreter.reset();
        }
        return result;
    }
}
export { RelationalClient };
