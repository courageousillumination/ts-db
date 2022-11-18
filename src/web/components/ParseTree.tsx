import { useContext, useState } from "react";
import { parse } from "../../relational";
import { ExpressionNode } from "../../relational/parser/ast/expression";
import {
    SelectNode,
    SimpleSelectNode,
} from "../../relational/parser/ast/select";
import { StatementNode } from "../../relational/parser/ast/statement";
import { SourceContext } from "../contexts/SourceContext";

const checkedParse = (source: string) => {
    try {
        return parse(source);
    } catch (e) {
        return `${e}`;
    }
};

const Expression: React.FC<{ expression: ExpressionNode }> = ({
    expression,
}) => {
    const { setHighlights, highlights } = useContext(SourceContext);
    let isHighlighted = false;
    for (const { start, end } of highlights) {
        if (
            expression.start.position >= start &&
            expression.end.position <= end
        ) {
            isHighlighted = true;
        }
    }
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                setHighlights([
                    {
                        start: expression.start.position,
                        end: expression.end.position,
                    },
                ]);
            }}
            style={{ backgroundColor: isHighlighted ? "yellow" : undefined }}
        >
            <div>
                <div>
                    <b>Subtype: </b>
                    <span>{expression.subType}</span>
                </div>
                {expression.subType === "operator" ? (
                    <div>
                        <b>Operator: </b>
                        <span>{expression.operator}</span>
                        <div>
                            <b>Arguments: </b>
                            <div style={{ paddingLeft: "16px" }}>
                                {expression.arguments.map((x) => (
                                    <Expression expression={x} />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null}
                {expression.subType === "literal-value" ? (
                    <div>
                        <b>Value: </b>
                        <span>{JSON.stringify(expression.value)}</span>
                    </div>
                ) : null}
                {expression.subType === "column" ? (
                    <div>
                        <b>Name: </b>
                        <span>{expression.columnName}</span>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const SelectStatement: React.FC<{ statement: SimpleSelectNode }> = ({
    statement,
}) => {
    const { setHighlights, highlights } = useContext(SourceContext);
    let isHighlighted = false;
    for (const { start, end } of highlights) {
        if (
            statement.start.position >= start &&
            statement.end.position <= end
        ) {
            isHighlighted = true;
        }
    }
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                setHighlights([
                    {
                        start: statement.start.position,
                        end: statement.end.position,
                    },
                ]);
            }}
            style={{ backgroundColor: isHighlighted ? "yellow" : undefined }}
        >
            <div>
                <div>
                    <b>Type: </b>
                    <span>select</span>
                </div>
                <div>
                    <b>Tables:</b>
                    <div style={{ paddingLeft: "16px" }}>
                        {statement.tables.map((x) => {
                            return <div>{x.tableName}</div>;
                        })}
                    </div>
                </div>
                <div>
                    <b>Columns:</b>
                    <div style={{ paddingLeft: "16px" }}>
                        {statement.columns.map((x) => {
                            if (x.type === "expression") {
                                return <Expression expression={x.expression} />;
                            } else {
                                return "wildcard";
                            }
                        })}
                    </div>
                </div>
                {statement.where ? (
                    <div>
                        <b>Where:</b>

                        <div style={{ paddingLeft: "16px" }}>
                            <Expression expression={statement.where} />
                        </div>
                    </div>
                ) : null}

                {statement.orderBy ? (
                    <div>
                        <b>Order By:</b>
                        <div style={{ paddingLeft: "16px" }}>
                            {statement.orderBy.map((x) => {
                                return <Expression expression={x.expression} />;
                            })}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export const Statement: React.FC<{ statement: StatementNode }> = ({
    statement,
}) => {
    switch (statement.type) {
        case "select":
            return <SelectStatement statement={statement} />;
        default:
            return null;
    }
};

export const ParseTree: React.FC = () => {
    const { source } = useContext(SourceContext);
    const parseTree = checkedParse(source);
    const [showRaw, setShowRaw] = useState(false);
    if (typeof parseTree === "string") {
        return <pre>{parseTree}</pre>;
    }
    return (
        <div>
            <div>
                <input
                    id="show-raw"
                    type="checkbox"
                    onChange={() => setShowRaw(!showRaw)}
                    checked={showRaw}
                ></input>
                <label htmlFor="show-raw">Show Raw</label>
            </div>
            {showRaw ? (
                <pre>{JSON.stringify(parseTree, undefined, 2)}</pre>
            ) : (
                parseTree.map((x) => <Statement statement={x} />)
            )}
        </div>
    );
};
