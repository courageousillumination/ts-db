import promptSync from "prompt-sync";
import { parse } from "../relational";
import { Backend } from "../relational/backend/backend";
import { Interpreter } from "../relational/engine/interpreter/interpreter";

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
    // const client = new RelationalClient();
    if (process.argv.length > 2) {
        const script = process.argv[2];
        // await executeScript(client, script);
    }

    let command = PROMPT("> ");
    const backend = new Backend();
    const interpreter = new Interpreter(backend);

    while (command !== "exit") {
        const parsed = parse(command);
        for (const statement of parsed) {
            // prepare a statement for execution
            interpreter.prepare(statement);

            for (const result of interpreter.step()) {
                // Log each row as it comes out
                console.log(result);
            }

            // Prepare for the next statement
            interpreter.reset();
        }

        command = PROMPT("> ");
    }
};

startRepl().catch(console.error);
