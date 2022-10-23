/** Used to represent statements in the SQL logic test files. */
export interface SQLLogicStatement {
    type: "statement";

    /** The statement to evaluate. */
    statement: string;

    /** The expected result of executing the statement. */
    expectedResult: "ok" | "error";
}

/** Used to represent queries in the SQL logic test files. */
export interface SQLLogicQuery {
    type: "query";

    /** Result type. */
    resultType: ("integer" | "text" | "float")[];

    /** The actual query to evaluate. */
    query: string;

    /** The sort mode. Defaults to 'nosort */
    sortMode: "nosort" | "rowsort" | "valuesort";

    /** The expected result */
    expectedResult: string;
}

export type SQLLogicRecord = SQLLogicQuery | SQLLogicStatement;

/** Type guard for statement results. */
const isExpectedResult = (value: string): value is "ok" | "error" => {
    return value === "ok" || value === "error";
};

/** Type guard for sort mode. */
const isSortMode = (
    value: string
): value is "nosort" | "rowsort" | "valuesort" => {
    return value === "nosort" || value === "rowsort" || value === "valuesort";
};

const handleResultType = (value: string): ("integer" | "text" | "float")[] => {
    return [...value].map((x) => {
        switch (x) {
            case "I":
                return "integer";
            case "T":
                return "text";
            case "R":
                return "float";
            default:
                throw new Error("Unknown type");
        }
    });
};

export const parseInput = (input: string): SQLLogicRecord[] => {
    const lines = input.split("\n");
    const records: SQLLogicRecord[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        // Handle comments and empty lines
        if (line.startsWith("#") || line.trim().length === 0) {
            i++;
        } else if (line.startsWith("statement")) {
            const [_, result] = line.split(" ");
            if (!isExpectedResult(result)) {
                throw new Error(`Unexpected statement result: ${result}`);
            }
            i++;
            const statementLines = [];
            while (i < lines.length && lines[i].trim().length !== 0) {
                statementLines.push(lines[i++]);
            }
            records.push({
                type: "statement",
                expectedResult: result,
                statement: statementLines.join("\n"),
            });
        } else if (line.startsWith("query")) {
            const [_, typeString, sort, label] = line.split(" ");

            if (!isSortMode(sort)) {
                throw new Error(`Unexpected sort mode: ${sort}`);
            }

            i++; // Consume the 'query' line
            const queryLines = [];
            const resultLines = [];
            while (
                i < lines.length &&
                lines[i].trim() !== "----" &&
                lines[i].trim().length !== 0
            ) {
                queryLines.push(lines[i++]);
            }

            if (lines[i].trim() === "----") {
                i++; // Consume the '----'
                while (i < lines.length && lines[i].trim().length !== 0) {
                    resultLines.push(lines[i++]);
                }
            }

            records.push({
                type: "query",
                sortMode: sort,
                resultType: handleResultType(typeString),
                query: queryLines.join("\n"),
                expectedResult: resultLines.join("\n"),
            });
        } else {
            throw new Error(`Could not handle line: ${line}`);
        }
    }

    return records;
};
