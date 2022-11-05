import { Backend } from "../backend/backend";
import { Interpreter } from "../engine/interpreter/interpreter";
import { parse } from "../parser";

class RelationalClient {
    private readonly interpreter: Interpreter;
    constructor(backend: Backend) {
        this.interpreter = new Interpreter(backend);
    }

    public execute(input: string) {
        const parsed = parse(input);
        let result: unknown[][] = [];
        for (const statement of parsed) {
            this.interpreter.prepare(statement);
            result = [];
            for (const row of this.interpreter.step()) {
                result.push(row);
            }
            this.interpreter.reset();
        }
        return result;
    }
}
export { RelationalClient };
