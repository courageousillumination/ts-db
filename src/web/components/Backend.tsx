import { useContext } from "react";
import { Table } from "../../relational/backend/backend";
import { BackendContext } from "../contexts/BackendContext";

const DisplayTable: React.FC<{ table: Table }> = ({ table }) => {
    return (
        <div style={{ margin: 16 }}>
            <h3>{table.name}</h3>
            <table>
                <th>
                    {table.columns.map((x) => (
                        <td key={x.name}>{x.name}</td>
                    ))}
                </th>
                <tbody>
                    {table.data.map((x, i) => {
                        return (
                            <tr>
                                {x.map((y, j) => (
                                    <td key={j}>{JSON.stringify(y)}</td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export const Backend = () => {
    const { backend } = useContext(BackendContext);
    const tables = backend.getTables();
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "lightblue",
                padding: "16px",
                margin: "16px",
            }}
        >
            <h3>Backend</h3>
            <div style={{ display: "flex" }}>
                {tables.map((t, i) => (
                    <DisplayTable table={t} key={i} />
                ))}
            </div>
        </div>
    );
};
