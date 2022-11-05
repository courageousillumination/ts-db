import { useState } from "react";
import { DebugToken, parse, tokenize } from "../relational";
// import { tokenize } from "../relational/parser";

const checkedParse = (input: string) => {
    try {
        return parse(input);
    } catch (e) {
        return `Parse error: ${e}`;
    }
};

const checkedTokenize = (input: string) => {
    try {
        return tokenize(input);
    } catch (e) {
        return `Token error ${e}`;
    }
};

const Token: React.FC<{ token: DebugToken }> = ({ token }) => {
    if (token.type === "identifier") {
        return (
            <span>
                {token.type}({token.lexeme})
            </span>
        );
    }
    if (token.type === "literal") {
        return (
            <span>
                {token.type}({token.literal as string})
            </span>
        );
    }
    return <span>{token.type}</span>;
};
export function App() {
    const [input, setInput] = useState("");
    const [inputHighlight, setInputHighlight] = useState<
        [number, number] | null
    >(null);
    const [tokenHighlight, setTokenHighlight] = useState<number>();
    const tokens = checkedTokenize(input);
    const parsed = checkedParse(input);

    let display: JSX.Element;
    if (inputHighlight !== null) {
        const [start, stop] = inputHighlight;
        const pre = input.slice(0, start);
        const highlight = input.slice(start, stop);
        const end = input.slice(stop);
        display = (
            <pre>
                <span>{pre}</span>
                <span>
                    <mark>{highlight}</mark>
                </span>
                <span>{end}</span>
            </pre>
        );
    } else {
        display = <pre>{input}</pre>;
    }

    return (
        <div>
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            <div>
                <b>Input</b>
            </div>
            <div>{display}</div>
            <div>
                <b>Tokens</b>
            </div>
            <pre style={{ display: "flex", gap: "8px" }}>
                {Array.isArray(tokens) ? (
                    (tokens as DebugToken[]).map((token, i) => {
                        return (
                            <span
                                key={i}
                                onClick={() => {
                                    setInputHighlight([
                                        token.positionStart,
                                        token.positionEnd,
                                    ]);
                                    setTokenHighlight(i);
                                }}
                            >
                                {i === tokenHighlight ? (
                                    <mark>
                                        <span>
                                            <Token token={token} />
                                        </span>
                                    </mark>
                                ) : (
                                    <span>
                                        <Token token={token} />
                                    </span>
                                )}
                            </span>
                        );
                    })
                ) : (
                    <pre>{tokens}</pre>
                )}
            </pre>
            <div>
                <b>Parse Tree</b>
            </div>
            <pre>{JSON.stringify(parsed, undefined, 2)}</pre>
        </div>
    );
}
