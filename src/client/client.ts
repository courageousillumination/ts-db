import { parseExpression } from "../parser/parser";

export class Client {
    public execute(input: string) {
        const expression = parseExpression(input)
        console.log(expression) // TODO: Actually do database stuff.
    }
}