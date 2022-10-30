import { useState } from "react";
import { parse } from "../relational";

const checkedParse = (input: string) => {
    try {
        return parse(input);
    } catch (e) {
        return `Parse error: ${e}`;
    }
};

export function App() {
    const [input, setInput] = useState("");
    const parsed = checkedParse(input);

    return (
        <div>
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            <pre>{JSON.stringify(parsed, undefined, 2)}</pre>
        </div>
    );
}
