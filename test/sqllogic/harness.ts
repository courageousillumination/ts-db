import { readFileSync } from "fs";
import { parseInput } from "./test-file-parser";

export const loadTestsFromFile = (fileName: string) => {
    const value = readFileSync(fileName);
    return parseInput(value.toString());
};
