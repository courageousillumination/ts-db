import { Operator } from "../../parser/ast/expression";

const bubbleNulls = (func: (a: any, b: any) => any) => {
    return (a: any, b: any) => (a === null || b === null ? null : func(a, b));
};

/** Operator tokens to JS functions. */
export const OPERATORS: Partial<Record<Operator, (...args: any[]) => any>> = {
    multiply: bubbleNulls((a, b) => a * b),
    greaterThan: bubbleNulls((a, b) => a > b),
    lessThan: bubbleNulls((a, b) => a < b),
    lessThanEqual: bubbleNulls((a, b) => a <= b),
    add: bubbleNulls((a, b = undefined) => (b === undefined ? a : a + b)),
    subtract: bubbleNulls((a, b = undefined) => (b === undefined ? -a : a - b)),
    divide: bubbleNulls((a, b) => a / b),
    and: bubbleNulls((a, b) => a && b),
    or: (a, b) => a || b,
    between: (a, b, c) => {
        if (a === null) {
            return null;
        }
        if (b === null || c === null) {
            return false;
        }
        return a >= b && a <= c;
    },
    greaterThanEqual: bubbleNulls((a, b) => a >= b),
    equal: bubbleNulls((a, b) => a === b),
    is: (a, b) => a === b,
    notEqual: (a, b) => a !== b,
    not: (a) => !a,
    negate: bubbleNulls((a) => -a),
};
