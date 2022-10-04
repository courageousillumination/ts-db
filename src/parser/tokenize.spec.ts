import { tokenize } from "./tokenize"

describe('tokenize', () => {
    describe('keywords', () => {
        it('identifies a select', () => {
            expect(tokenize('select')).toEqual([{ type: 'select' }])
        })

        it('identifies a from', () => {
            expect(tokenize('from')).toEqual([{ type: 'from' }])
        })
    })
    describe("identifiers", () => {
        it('tokenizes an identifier', () => {
            expect(tokenize("foobar")).toEqual([{ type: 'identifier', value: 'foobar' }])
        })
    })
})