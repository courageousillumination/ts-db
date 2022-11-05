import { useContext, useEffect, useState } from "react";
import { HighlightContext, HighlightContextProvider } from "./HighlightContext";
import { ParseTree } from "./ParseTree";
import { Source } from "./Source";
import { Tokens } from "./Tokens";

const Main: React.FC = () => {
    const [source, setSource] = useState("");
    const { setHighlights } = useContext(HighlightContext);

    useEffect(() => {
        setHighlights([]);
    }, [source, setHighlights]);
    return (
        <div>
            <h2>Input</h2>
            <textarea
                value={source}
                onChange={(e) => setSource(e.target.value)}
            />
            <h2>Source</h2>
            <Source source={source} />
            <h2>Tokens</h2>
            <Tokens source={source} />
            <h2>Parse Tree</h2>
            <ParseTree source={source} />
        </div>
    );
};

export function App() {
    return (
        <HighlightContextProvider>
            <Main />
        </HighlightContextProvider>
    );
}
