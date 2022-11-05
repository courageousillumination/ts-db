import { ExpressionParser } from "./ExpressionParser";
import { BaseParser } from "./BaseParser";
import {
    FromTable,
    OrderByTerm,
    ResultColumn,
    SelectNode,
} from "../ast/select";

/** Parser for handling select statements. */
export class SelectStatementParser extends BaseParser<SelectNode> {
    protected parseInternal() {
        return this.selectStatement();
    }

    /** Parses a select statement. */
    private selectStatement(): SelectNode {
        const start = this.consume("select");
        const columns = this.columns();
        this.consume("from");
        const table = this.table();
        const where = this.match("where")
            ? this.applySubParser(ExpressionParser)
            : undefined;
        const orderBy = this.orderBy();

        return {
            type: "select",
            columns,
            table,
            where,
            orderBy,
            start: start.start,
            end: this.previous().end,
        };
    }

    /** Consumes the columns for a select statement. */
    private columns(): ResultColumn[] {
        return this.consumeMany(() => {
            if (this.match("star")) {
                return { type: "wildcard" };
            } else {
                return {
                    type: "expression",
                    expression: this.applySubParser(ExpressionParser),
                };
            }
        }, "comma");
    }

    /** Gets a table and optional alias. */
    private table(): FromTable {
        const tableName = this.consume("identifier").lexeme;
        const alias = this.match("as")
            ? this.consume("identifier").lexeme
            : undefined;
        return { tableName, alias };
    }

    /** Handles an order by. */
    private orderBy(): OrderByTerm[] | undefined {
        if (!this.match("order")) {
            return undefined;
        }

        this.consume("by");
        return this.consumeMany(() => {
            const expr = this.applySubParser(ExpressionParser);
            let direction: "asc" | "desc";
            if (this.match("desc")) {
                direction = "desc";
            } else {
                this.match("asc");
                direction = "asc";
            }
            return { expression: expr, direction };
        }, "comma");
    }
}
