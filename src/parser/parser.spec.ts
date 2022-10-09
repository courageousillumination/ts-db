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

            it('supports order by', () => {
                const result = parseExpression("select foo from table1 order by foo")
                expect(result).toEqual([{
                    type: 'select',
                    select: { columns: ['foo'] },
                    from: { table: 'table1' },
                    orderBy: { orderBy: ['foo'] }
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


    // CASE WHEN c > (SELECT avg(c) FROM t1) THEN a * 2 ELSE b * 10 END
    describe('case expression', () => {
        it('handles a simple case', () => {
            const result = parseExpression('case when 1 then 1 end')
            expect(result).toEqual([{
                type: 'case',
                when: [{
                    condition: 1,
                    result: 1
                }]
            }])
        })

        it('handles an else', () => {

        })
    })
})