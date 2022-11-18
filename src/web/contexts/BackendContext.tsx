import React, { useState, createContext, useEffect } from "react";
import { Backend } from "../../relational/backend/backend";
import { Cursor } from "../../relational/backend/cursor";

interface BackendContextType {
    backend: Backend;
    cursors: { id: number; cursor: Cursor }[];
    setCursors: (cursors: { id: number; cursor: Cursor }[]) => void;
}

const BACKEND = new Backend();

// Initialize with some data
BACKEND.createTable("t1", [
    { name: "a1", primary: true, type: "integer" },
    { name: "b1", type: "integer" },
]);
BACKEND.createTable("t2", [
    { name: "a2", primary: true, type: "integer" },
    { name: "b2", type: "integer" },
]);

const [t1, t2] = BACKEND.getTables();
t1.data.push([1, 2]);
t1.data.push([2, 4]);
t1.data.push([3, 8]);
t1.data.push([4, 16]);

t2.data.push([1, 2]);
t2.data.push([2, 3]);
t2.data.push([3, 5]);
t2.data.push([4, 8]);

export const BackendContext = createContext<BackendContextType>({
    backend: BACKEND,
    cursors: [],
    setCursors: () => undefined,
});

export const BackendContextProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const [cursors, setCursors] = useState<{ id: number; cursor: Cursor }[]>(
        []
    );
    return (
        <BackendContext.Provider
            value={{ cursors, setCursors, backend: BACKEND }}
        >
            {children}
        </BackendContext.Provider>
    );
};
