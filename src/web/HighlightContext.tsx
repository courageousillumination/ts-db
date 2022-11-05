import { useState, createContext } from "react";

export interface Highlight {
    start: number;
    end: number;
}

interface HighlightContextType {
    setHighlights: (highlights: Highlight[]) => void;
    highlights: Highlight[];
}

export const HighlightContext = createContext<HighlightContextType>({
    setHighlights: () => undefined,
    highlights: [],
});

export const HighlightContextProvider: React.FC<
    React.PropsWithChildren<unknown>
> = ({ children }) => {
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    return (
        <HighlightContext.Provider value={{ setHighlights, highlights }}>
            {children}
        </HighlightContext.Provider>
    );
};
