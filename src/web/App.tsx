import { SourceContextProvider } from "./contexts/SourceContext";
import { Backend } from "./components/Backend";
import { SqlCompiler } from "./components/SqlCompiler";
import { Core } from "./components/Core";
import { BackendContextProvider } from "./contexts/BackendContext";

const Main: React.FC = () => {
    return (
        <div style={{ display: "flex" }}>
            <div style={{ width: "50%" }}>
                <Core />
                <Backend />
            </div>

            <div style={{ width: "50%" }}>
                <SqlCompiler />
            </div>
        </div>
    );
};

export function App() {
    return (
        <BackendContextProvider>
            <SourceContextProvider>
                <Main />
            </SourceContextProvider>
        </BackendContextProvider>
    );
}
