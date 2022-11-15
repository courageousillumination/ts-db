import { ExpressionParser } from "./ExpressionParser";
import { BaseParser } from "./BaseParser";
import {
    CompoundSelect,
    CompoundSelectPart,
    FromTable,
    OrderByTerm,
    ResultColumn,
    SelectNode,
    SimpleSelectNode,
} from "../ast/select";

/** Parser for handling select statements. */
export class SelectStatementParser extends BaseParser<
    SelectNode | CompoundSelect
> {
    protected parseInternal() {
        return this.selectStatement();
    }

    /** Parses a select statement. */
    private selectStatement(): SelectNode {
        const select = this.selectCore();

        const compoundSelects: CompoundSelectPart[] = [];

        while (this.matchAny(["union", "except", "intersect"])) {
            const previous = this.previous().type;
            let compoundOperator: any;
            switch (previous) {
                case "union":
                    if (this.match("all")) {
                        compoundOperator = "unionAll";
                    } else {
                        compoundOperator = "union";
                    }
                    break;
                default:
                    compoundOperator = previous;
            }

            const select = this.selectCore();
            compoundSelects.push({ select, compoundOperator });
        }

        // Group and order by come after all of the compounds
        const orderBy = this.orderBy();

        if (compoundSelects.length === 0) {
            return { ...select, orderBy, end: this.previous().end };
        } else {
            return {
                type: "compound-select",
                parts: [
                    { select, compoundOperator: "initial" },
                    ...compoundSelects,
                ],
                orderBy,
            };
        }
    }

    private selectCore(): SimpleSelectNode {
        const start = this.consume("select");
        const columns = this.columns();
        this.consume("from");
        const tables = this.tables();
        const where = this.match("where")
            ? this.applySubParser(ExpressionParser)
            : undefined;
        return {
            type: "select",
            columns,
            tables,
            where,
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

    /** Read tables */
    private tables(): FromTable[] {
        return this.consumeMany(() => {
            return this.table();
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
