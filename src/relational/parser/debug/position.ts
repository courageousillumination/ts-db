/** Tracks the position of an element in the source code. */
export interface SourcePosition {
    /** Line in the source (1 indexed). */
    line: number;
    /** Character index in the current line (1 indexed). */
    character: number;
    /** The position in the raw string (0 indexed). */
    position: number;
}

/**
 * Utility function that adds the start and end position attributes.
 */
export type WithStartAndEnd<T> = T & {
    start: SourcePosition;
    end: SourcePosition;
};
