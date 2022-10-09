import { promises } from 'fs'
import promptSync from 'prompt-sync'
import { Client } from "../client/client"


const PROMPT = promptSync()


const executeScript = async (client: Client, script: string) => {
    const content = await promises.readFile(script)
    console.log(content.toString())
    executeCommands(client, content.toString().split('\n'))
}

const executeCommands = (client: Client, commands: string[]) => {
    for (const command of commands) {
        console.log("> ", command)
        const result = client.execute(command)
        console.log(result)
    }
}

const startRepl = async () => {

    const client = new Client()
    if (process.argv.length > 2) {
        const script = process.argv[2]
        await executeScript(client, script)
    }


    let command = PROMPT("> ")
    while (command !== 'exit') {
        if (command === 'debug') {
            client.dumpDatabase()
        } else {
            const result = client.execute(command)
            console.log(result)
        }
        command = PROMPT('> ')
    }
}


startRepl().catch(console.error);
