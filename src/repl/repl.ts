import { promises } from "fs";
import promptSync from "prompt-sync";
import { RelationalClient } from "../relational/client";

const PROMPT = promptSync();

const executeScript = async (client: RelationalClient, script: string) => {
    const content = await promises.readFile(script);
    console.log(content.toString());
    executeCommands(client, content.toString().split("\n"));
};

const executeCommands = async (
    client: RelationalClient,
    commands: string[]
) => {
    for (const command of commands) {
        console.log("> ", command);
        const result = await client.executeQuery(command);
        console.log(result);
    }
};

const startRepl = async () => {
    const client = new RelationalClient();
    if (process.argv.length > 2) {
        const script = process.argv[2];
        await executeScript(client, script);
    }

    let command = PROMPT("> ");
    while (command !== "exit") {
        const result = await client.executeQuery(command);
        console.log(result);
        command = PROMPT("> ");
    }
};

startRepl().catch(console.error);
