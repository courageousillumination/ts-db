import { ColumnDefinition, CreateNode, ColumnType } from "../ast/create";
import { BaseParser } from "./BaseParser";

export class CreateStatementParser extends BaseParser<CreateNode> {
    protected parseInternal() {
        return this.createStatement();
    }

    /** Parses a create statement. */
    private createStatement(): CreateNode {
        const start = this.consume("create");
        this.consume("table");
        const table = this.consume("identifier");
        this.consume("leftParen");
        const columns: ColumnDefinition[] = this.consumeMany(() => {
            const name = this.consume("identifier");
            const type = this.matchAny(["integer", "string", "varchar"]);

            if (this.match("leftParen")) {
                this.consume("literal"); // Yeah just gonna ignore these...
                this.consume("rightParen");
            }
            if (this.match("primary")) {
                this.match("key");
            }
            if (!type) {
                this.error(`Unknown column type ${this.previous().lexeme}`);
            }
            return { name: name.lexeme, type: type.lexeme as ColumnType };
        }, "comma");
        this.consume("rightParen");
        return {
            type: "create",
            table: table.lexeme,
            columns,
            start: start.start,
            end: this.previous().end,
        };
    }
}
