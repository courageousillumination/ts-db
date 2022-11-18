import React, { useState, createContext, useEffect } from "react";

export interface Highlight {
    start: number;
    end: number;
}

interface SourceContextType {
    setHighlights: (highlights: Highlight[]) => void;
    highlights: Highlight[];

    source: string;
    setSource: React.Dispatch<React.SetStateAction<string>>;
}

export const SourceContext = createContext<SourceContextType>({
    setHighlights: () => undefined,
    highlights: [],
    source: "",
    setSource: () => undefined,
});

export const SourceContextProvider: React.FC<
    React.PropsWithChildren<unknown>
> = ({ children }) => {
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [source, setSource] = useState("");

    useEffect(() => {
        setHighlights([]);
    }, [source, setHighlights]);
    return (
        <SourceContext.Provider
            value={{ setHighlights, highlights, source, setSource }}
        >
            {children}
        </SourceContext.Provider>
    );
};
