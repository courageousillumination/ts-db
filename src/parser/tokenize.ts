import { Token } from "./token";

const handleToken = (input: string): Token => {
    if (input.toLowerCase() === 'select') {
        return { type: 'select' }
    }
    if (input.toLowerCase() === 'from') {
        return { type: 'from' }
    }
    if (input.toLowerCase() === 'insert') {
        return { type: 'insert' }
    }
    if (input.toLowerCase() === 'into') {
        return { type: 'into' }
    }
    if (input.toLowerCase() === '(') {
        return { type: 'leftParen' }
    }
    if (input.toLowerCase() === ')') {
        return { type: 'rightParen' }
    }
    return { type: 'identifier', value: input }
}

export const tokenize = (input: string): Token[] => {
    const words = input.split(" ");
    return words.map(handleToken)
}