import { Engine } from "./engine";

class RelationalClient {
    private readonly engine = new Engine();

    public async execute(input: string) {
        return this.engine.execute(input);
    }
}
export { RelationalClient };
