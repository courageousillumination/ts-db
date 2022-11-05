import { useContext } from "react";
import { DebugToken, tokenize } from "../relational";
import { HighlightContext } from "./HighlightContext";

const checkedTokenize = (source: string) => {
    try {
        return tokenize(source);
    } catch (e) {
        return `${e}`;
    }
};

const Token: React.FC<{ token: DebugToken }> = ({ token }) => {
    const { highlights } = useContext(HighlightContext);
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

export const Tokens: React.FC<{ source: string }> = ({ source }) => {
    const tokens = checkedTokenize(source);
    const { setHighlights } = useContext(HighlightContext);
    if (typeof tokens === "string") {
        return <pre>{tokens}</pre>;
    }
    return (
        <pre style={{ display: "flex", gap: "8px" }}>
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
        </pre>
    );
};
