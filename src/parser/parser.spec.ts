import { parseExpression, parse } from "./parser"

const literalExpression = (value: number) => (
    {
        type: 'literal',
        literal: {
            type: 'number',
            value
        }
    }
)

const identifierExpression = (value: string) => (
    {
        type: 'identifier',
        identifier: value
    }
)

describe('parser', () => {
    describe('expressions', () => {
        describe('literal', () => {
            // Note: A bare expresison is not a valid SQL statement.
            it('parses a numeric literal', () => {
                const result = parse('1;')
                expect(result).toEqual([{
                    type: 'expression',
                    expression: literalExpression(1)
                }])
            })

            it('parses a string literal', () => {
                const result = parse('"1";')
                expect(result).toEqual([{
                    type: 'expression',
                    expression: {
                        type: 'literal',
                        literal: {
                            type: 'string',
                            value: '1'
                        }
                    }
                }])
            })
        })

        describe('binary operators', () => {
            describe('multiplicaton', () => {
                it('applies multiplication', () => {
                    expect(parse('1 * 2;')).toEqual([
                        {
                            type: 'expression',
                            expression: {
                                type: 'binary',
                                operator: 'star',
                                left: literalExpression(1),
                                right: literalExpression(2)
                            }
                        }])
                })
            })
        })

        describe('nested', () => {
            it('supports nested expressions', () => {
                expect(parse('1 * (2 * 3);')).toEqual([{
                    type: 'expression',
                    expression: {
                        type: 'binary',
                        operator: 'star',
                        left: literalExpression(1),
                        right: {
                            type: 'grouping',
                            expression: {
                                type: 'binary',
                                operator: 'star',
                                left: literalExpression(2),
                                right: literalExpression(3)
                            }
                        }
                    }
                }])
            })
        })
    })

    describe('select statement', () => {
        it('parses a simple select', () => {
            const result = parse('SELECT foo FROM table1;')
            expect(result).toEqual([{
                type: 'select',
                table: 'table1',
                columns: [
                    identifierExpression('foo')
                ]
            }])
        })

        it('parses multple columns', () => {
            const result = parse('SELECT foo, bar FROM table1;')
            expect(result).toEqual([{
                type: 'select',
                table: 'table1',
                columns: [
                    identifierExpression('foo'),
                    identifierExpression('bar')
                ]
            }])
        })
    })

    describe('insert statement', () => {
        it('parses insert into', () => {
            const result = parse('INSERT INTO table1 VALUES (1, 2);')
            expect(result).toEqual([{
                type: 'insert',
                table: 'table1',
                values: [literalExpression(1), literalExpression(2)]
            }])
        })

        it('handles column names', () => {
            const result = parse('INSERT INTO table1 (a, b) VALUES (1, 2);')
            expect(result).toEqual([{
                type: 'insert',
                table: 'table1',
                columns: ['a', 'b'],
                values: [literalExpression(1), literalExpression(2)]
            }])
        })
    })

    describe('create table statement', () => {
        it("parses a create table statement", () => {
            const result = parse("CREATE TABLE foo (column1 INTEGER, column2 INTEGER);")
            expect(result).toEqual([{
                type: 'createTable',
                table: 'foo',
                columnDefinitions: [
                    { name: 'column1', type: 'integer' },
                    { name: 'column2', type: 'integer' }
                ]
            }])
        })
    })



    // xdescribe("select expressions", () => {
    //     describe("success cases", () => {
    //         it("parses a select and table", () => {
    //             const result = parseExpression("select foo from table1")
    //             expect(result).toEqual([{
    //                 type: 'select',
    //                 select: { columns: ['foo'] },
    //                 from: { table: 'table1' }
    //             }])
    //         })

    //         it('supports order by', () => {
    //             const result = parseExpression("select foo from table1 order by foo")
    //             expect(result).toEqual([{
    //                 type: 'select',
    //                 select: { columns: ['foo'] },
    //                 from: { table: 'table1' },
    //                 orderBy: { orderBy: ['foo'] }
    //             }])
    //         })
    //     })
    // })

    // xdescribe("insert expression", () => {
    //     describe("success cases", () => {
    //         it("parses an insert into expression", () => {
    //             const result = parseExpression('insert into table1 values ( "foo" )')
    //             expect(result).toEqual([{
    //                 type: 'insertInto',
    //                 insertInto: { table: 'table1' },
    //                 values: { values: ['foo'] }
    //             }])
    //         })
    //         it('parses multiple values', () => {
    //             const result = parseExpression('insert into table1 values (1, 2)')
    //             expect(result).toEqual([{
    //                 type: 'insertInto',
    //                 insertInto: { table: 'table1' },
    //                 values: { values: [1, 2] }
    //             }])
    //         })
    //     })
    // })

    xdescribe('create table', () => {
        describe('success cases', () => {

        })
    })


    // // CASE WHEN c > (SELECT avg(c) FROM t1) THEN a * 2 ELSE b * 10 END
    // xdescribe('case expression', () => {
    //     it('handles a simple case', () => {
    //         const result = parseExpression('case when 1 then 1 end')
    //         expect(result).toEqual([{
    //             type: 'case',
    //             when: [{
    //                 condition: 1,
    //                 result: 1
    //             }]
    //         }])
    //     })

    //     it('handles an else', () => {

    //     })
    // })
})