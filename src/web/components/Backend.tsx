import { useContext } from "react";
import { Table } from "../../relational/backend/backend";
import { Cursor } from "../../relational/backend/cursor";
import { BackendContext } from "../contexts/BackendContext";

const DisplayTable: React.FC<{
    table: Table;
    cursors: { id: number; cursor: Cursor }[];
}> = ({ table, cursors }) => {
    return (
        <div style={{ margin: 16 }}>
            <h3>{table.name}</h3>
            <table style={{ borderSpacing: "16px" }}>
                <tr>
                    <th>{`Cursors`}</th>
                    {table.columns.map((x) => (
                        <th key={x.name}>{x.name}</th>
                    ))}
                </tr>
                <tbody>
                    {table.data.map((x, i) => {
                        return (
                            <tr>
                                <td>
                                    {cursors
                                        .filter((x) => x.cursor.position === i)
                                        .map((x) => x.id)
                                        .join(",")}
                                </td>
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
    const { backend, cursors } = useContext(BackendContext);
    const tables = backend.getTables();

    console.log(cursors);

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
                    <DisplayTable
                        table={t}
                        key={i}
                        cursors={cursors.filter(
                            (x) => x.cursor.tableName === t.name
                        )}
                    />
                ))}
            </div>
        </div>
    );
};
