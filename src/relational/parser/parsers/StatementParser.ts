import { BaseParser } from "./BaseParser";
import { SelectStatementParser } from "./SelectStatementParser";
import { InsertStatementParser } from "./InsertStatementParser";
import { CreateStatementParser } from "./CreateStatementParser";
import { UpdateStatementParser } from "./UpdateStatementParser";
import { StatementNode } from "../ast/statement";

/** Parses any kind of statement. */
export class StatementParser extends BaseParser<StatementNode[]> {
    protected parseInternal(): StatementNode[] {
        const statements = [];
        while (!this.isAtEnd()) {
            const statement = this.parseStatement();
            statements.push(statement);
            if (!this.isAtEnd()) {
                this.consume("semicolon");
            }
        }
        return statements;
    }

    private parseStatement() {
        const token = this.peek();
        if (!token) {
            this.error("Unexpected end of input.");
        }

        switch (token.type) {
            case "select":
                return this.applySubParser(SelectStatementParser);
            case "insert":
                return this.applySubParser(InsertStatementParser);
            case "create":
                return this.applySubParser(CreateStatementParser);
            case "update":
                return this.applySubParser(UpdateStatementParser);
            default:
                this.error(`Unexpected start of statement ${token.type}`);
        }
    }
}
