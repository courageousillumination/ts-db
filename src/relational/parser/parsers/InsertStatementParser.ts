import { ExpressionParser } from "./ExpressionParser";
import { BaseParser } from "./BaseParser";
import { InsertNode } from "../ast/insert";

export class InsertStatementParser extends BaseParser<InsertNode> {
    protected parseInternal() {
        return this.insertStatement();
    }

    /** Parse an insert statement. */
    private insertStatement(): InsertNode {
        const start = this.consume("insert");
        const { table, columns } = this.insertClause();
        const values = this.valuesClause();

        return {
            type: "insert",
            table,
            columns,
            values,
            start: start.start,
            end: this.previous().end,
        };
    }

    /** Handles the inserrt clause of an insert statement. */
    private insertClause() {
        this.consume("into");
        const table = this.consume("identifier");
        let columns;
        if (this.match("leftParen")) {
            columns = this.consumeMany(() => {
                const token = this.consume("identifier");
                return token.lexeme;
            }, "comma");
            this.consume("rightParen");
        }
        return { table: table.lexeme, columns };
    }

    /** Handles the values clause of an insert statement. */
    private valuesClause() {
        this.consume("values");
        this.match("leftParen");
        const values = this.consumeMany(
            () => this.applySubParser(ExpressionParser),
            "comma"
        );
        this.consume("rightParen");
        return values;
    }
}
