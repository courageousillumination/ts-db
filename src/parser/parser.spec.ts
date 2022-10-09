import { parseExpression } from "./parser"

describe('parser', () => {
    describe("select expressions", () => {
        describe("success cases", () => {
            it("parses a select and table", () => {
                const result = parseExpression("select foo from table1")
                expect(result).toEqual([{
                    type: 'select',
                    select: { columns: ['foo'] },
                    from: { table: 'table1' }
                }])
            })
        })
    })

    describe("insert expression", () => {
        describe("success cases", () => {
            it("parses an insert into expression", () => {
                const result = parseExpression('insert into table1 values ( "foo" )')
                expect(result).toEqual([{
                    type: 'insertInto',
                    insertInto: { table: 'table1' },
                    values: { values: ['foo'] }
                }])
            })
            it('parses multiple values', () => {
                const result = parseExpression('insert into table1 values (1, 2)')
                expect(result).toEqual([{
                    type: 'insertInto',
                    insertInto: { table: 'table1' },
                    values: { values: [1, 2] }
                }])
            })
        })
    })

    describe('create table', () => {
        describe('success cases', () => {
            it("parses a create table expression", () => {
                const result = parseExpression("create table foo (column1 integer, column2 integer)")
                expect(result).toEqual([{
                    type: 'createTable',
                    tableName: 'foo',
                    columns: [
                        { name: 'column1', type: 'integer' },
                        { name: 'column2', type: 'integer' }
                    ]
                }])
            })
        })
    })
})