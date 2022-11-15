import {
    ColumnDefinition,
    CreateNode,
    ColumnType,
    CreateIndexNode,
} from "../ast/create";
import { DebugToken, Token } from "../tokenizer";
import { BaseParser } from "./BaseParser";

export class CreateStatementParser extends BaseParser<
    CreateNode | CreateIndexNode
> {
    protected parseInternal() {
        return this.createStatement();
    }

    /** Parses a create statement. */
    private createStatement(): CreateNode | CreateIndexNode {
        const start = this.consume("create");

        if (this.match("table")) {
            return this.createTable(start);
        }

        this.consume("index");
        return this.createIndex(start);
    }

    private createTable(start: DebugToken): CreateNode {
        const table = this.consume("identifier");
        this.consume("leftParen");
        const columns: ColumnDefinition[] = this.consumeMany(() => {
            const name = this.consume("identifier");
            const type = this.matchAny(["integer", "string", "varchar"]);
            let primary = false;
            if (this.match("leftParen")) {
                // Yeah just gonna ignore these arguments to varchar for now.
                this.consume("literal");
                this.consume("rightParen");
            }
            if (this.match("primary")) {
                this.match("key");
                primary = true;
            }
            if (!type) {
                this.error(`Unknown column type ${this.previous().lexeme}`);
            }
            return {
                name: name.lexeme,
                type: type.lexeme as ColumnType,
                primary,
            };
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

    private createIndex(start: DebugToken): CreateIndexNode {
        const indexName = this.consume("identifier").lexeme;
        this.consume("on");
        const tableName = this.consume("identifier").lexeme;
        this.consume("leftParen");
        const columns = this.consumeMany(() => {
            const column = this.consume("identifier").lexeme;
            let direction: "asc" | "desc";
            if (this.match("desc")) {
                direction = "desc";
            } else {
                this.match("asc");
                direction = "asc";
            }
            return { column, direction };
        }, "comma");
        this.consume("rightParen");
        return {
            type: "create-index",
            table: tableName,
            index: indexName,
            columns,
            start: start.start,
            end: this.previous().end,
        };
    }
}
