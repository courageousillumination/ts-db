import { promises } from "fs";
import promptSync from "prompt-sync";
import { parse } from "../relational";
import { Backend } from "../relational/backend/backend";
import { RelationalClient } from "../relational/client";
import { compile } from "../relational/compiler/compiler";
import { printBytecode } from "../relational/compiler/debug";
import { ExpressionParser } from "../relational/parser/parser";
import { tokenize } from "../relational/parser/tokenizer";
import { VM } from "../relational/vm/vm";

const PROMPT = promptSync();

// const executeScript = async (client: RelationalClient, script: string) => {
//     const content = await promises.readFile(script);
//     console.log(content.toString());
//     await executeCommands(client, content.toString().split("\n"));
// };

// const executeCommands = async (
//     client: RelationalClient,
//     commands: string[]
// ) => {
//     for (const command of commands) {
//         console.log("> ", command);
//         const result = await client.executeQuery(command);
//         console.log(result);
//     }
// };

const startRepl = async () => {
    const client = new RelationalClient();
    if (process.argv.length > 2) {
        const script = process.argv[2];
        // await executeScript(client, script);
    }

    let command = PROMPT("> ");
    const backend = new Backend();
    const vm = new VM(backend);
    while (command !== "exit") {
        // const tokens = tokenize(command);
        // const parser = new ExpressionParser(tokens, 0);
        // const { result: parsed } = parser.parse();
        const parsed = parse(command);
        for (const statement of parsed) {
            const bytecode = compile(statement, backend);
            console.log(printBytecode(bytecode));

            vm.loadBytecode(bytecode);
            // Step until we run out of rows
            let result = await vm.step();
            while (result !== null) {
                console.log(result);
                result = await vm.step();
            }
            vm.reset();
        }

        command = PROMPT("> ");
    }
};

startRepl().catch(console.error);
