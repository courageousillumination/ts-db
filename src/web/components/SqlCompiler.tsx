import { useContext } from "react";
import { DebugToken, tokenize } from "../../relational";
import { SourceContext } from "../contexts/SourceContext";
import { Bytecode } from "./Bytecode";
import { ParseTree } from "./ParseTree";

const checkedTokenize = (source: string) => {
    try {
        return tokenize(source);
    } catch (e) {
        return `${e}`;
    }
};

const Token: React.FC<{ token: DebugToken }> = ({ token }) => {
    const { highlights } = useContext(SourceContext);
    let isHighlighted = false;
    for (const { start, end } of highlights) {
        if (token.start.position >= start && token.end.position <= end) {
            isHighlighted = true;
        }
    }

    let text: string;

    if (token.type === "identifier") {
        text = `${token.type}(${token.lexeme})`;
    } else if (token.type === "literal") {
        text = `${token.type}(${token.literal})`;
    } else {
        text = `${token.type}`;
    }

    if (isHighlighted) {
        return <mark>{text}</mark>;
    } else {
        return <span>{text}</span>;
    }
};

export const Tokens: React.FC = () => {
    const { setHighlights, source } = useContext(SourceContext);
    const tokens = checkedTokenize(source);
    if (typeof tokens === "string") {
        return <div style={{ fontFamily: "monospace" }}>{tokens}</div>;
    }
    return (
        <div
            style={{
                display: "flex",
                gap: "8px",
                fontFamily: "monospace",
                flexWrap: "wrap",
            }}
        >
            {tokens.map((token, i) => (
                <span
                    key={i}
                    onClick={() => {
                        setHighlights([
                            {
                                start: token.start.position,
                                end: token.end.position,
                            },
                        ]);
                    }}
                >
                    <Token key={i} token={token} />
                </span>
            ))}
        </div>
    );
};

export const SqlCompiler = () => {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "pink",
                padding: "16px",
                margin: "16px",
            }}
        >
            <h3>SQL Compiler</h3>
            <h4>Tokenization</h4>
            <Tokens />
            <h4>Parsing</h4>
            <ParseTree />
            <h4>Bytecode</h4>
            <Bytecode />
        </div>
    );
};
