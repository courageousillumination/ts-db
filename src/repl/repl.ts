import promptSync from 'prompt-sync'
import { Client } from "../client/client"


const PROMPT = promptSync()

const startRepl = () => {
    const client = new Client()
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


startRepl()