/**
 * Data can be loaded into a table as a list of objects. Each object
 * should have the same keys.
 */
export type RelationalLoadDataFormat = Record<string, number | string>[];

/** Data will be returned as a flat array of values. */
export type RelationalReturnDataFormat = unknown[][];
