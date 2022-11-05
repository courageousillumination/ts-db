import { ExpressionParser } from "./ExpressionParser";
import { BaseParser } from "./BaseParser";
import { UpdateNode } from "../ast/update";

export class UpdateStatementParser extends BaseParser<UpdateNode> {
    protected parseInternal(): UpdateNode {
        return this.updateStatement();
    }

    private updateStatement(): UpdateNode {
        const start = this.consume("update");
        const table = this.consume("identifier");
        this.consume("set");
        const assignments = this.consumeMany(() => {
            const columnName = this.consume("identifier");
            this.consume("equal");
            const expression = this.applySubParser(ExpressionParser);
            return { columnName: columnName.lexeme, expression };
        }, "comma");
        const where = this.match("where")
            ? this.applySubParser(ExpressionParser)
            : undefined;

        return {
            type: "update",
            table: table.lexeme,
            assignments,
            where,
            start: start.start,
            end: this.previous().end,
        };
    }
}
