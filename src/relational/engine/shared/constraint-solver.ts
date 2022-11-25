import {
    ExpressionNode,
    OperatorExpressionNode,
} from "../../parser/ast/expression";

export interface ConstantConstraint {
    type: "constant";
    column: string;
    value: unknown;
}

interface ColumnConstraint {
    type: "column";
    column: string;
    rightColumn: string;
}

interface CompoundConstraint {
    type: "and" | "or";
    constraints: Constraint[];
}

interface NullConstraint {
    type: "none";
}

export type Constraint =
    | ConstantConstraint
    | ColumnConstraint
    | CompoundConstraint
    | NullConstraint;

// Flattens out and and ors
const simplifyConstraint = (constraint: Constraint): Constraint => {
    if (
        constraint.type === "none" ||
        constraint.type === "column" ||
        constraint.type === "constant"
    ) {
        return constraint;
    }

    const subConstraints = constraint.constraints.filter(
        (x) => x.type !== "none"
    );
    if (subConstraints.length === 0) {
        return { type: "none" };
    }
    if (subConstraints.length === 1) {
        return subConstraints[0];
    }

    if (constraint.type === "and") {
        // Any and that have a constant will just use that instead.
        const constant = subConstraints.find((x) => x.type === "constant");
        if (constant) {
            return constant;
        }

        // check for a list of constants
        const listOfConstants = subConstraints.find(
            (x) =>
                x.type === "or" &&
                x.constraints.every((y) => y.type === "constant")
        );
        if (listOfConstants) {
            return listOfConstants;
        }
    }

    return constraint;
};

export class ConstraintSolver {
    constructor(private readonly indexedColumns: string[]) {}

    public calculateConstraints(expression: ExpressionNode): Constraint {
        if (expression.subType === "in") {
            if (
                !this.isValidColumn(expression.expression) ||
                !Array.isArray(expression.list)
            ) {
                return { type: "none" };
            }

            if (expression.expression.subType !== "column") {
                return { type: "none" };
            }
            const columnName = expression.expression.columnName;

            return simplifyConstraint({
                type: "or",
                constraints: expression.list.map((x) =>
                    this.simpleConstraint(columnName, x)
                ),
            });
        }

        // No constarints from non-operator expressions.
        if (expression.subType !== "operator") {
            return { type: "none" };
        }

        // 3 kinds of operators can apply constraints: AND, OR, and EQUAL.
        // AND/OR generate compound constraints, and EQUAL generate our
        // base constraints.
        switch (expression.operator) {
            case "and":
            case "or":
                const constraints = expression.arguments.map((x) =>
                    this.calculateConstraints(x)
                );
                return simplifyConstraint({
                    type: expression.operator,
                    constraints,
                });
            case "equal":
                return this.calculateEquiConstraint(expression);
            default:
                return { type: "none" };
        }
    }

    private calculateEquiConstraint(
        expression: OperatorExpressionNode
    ): Constraint {
        // This should be an equiconstraint at this point.
        let [left, right] = expression.arguments;
        if (!this.isValidColumn(left)) {
            if (this.isValidColumn(right)) {
                const temp = right;
                right = left;
                left = temp;
            } else {
                return { type: "none" };
            }
        }

        if (left.subType !== "column") {
            return { type: "none" };
        }

        return this.simpleConstraint(left.columnName, right);
    }

    private simpleConstraint(
        column: string,
        expression: ExpressionNode
    ): Constraint {
        // At this point, left should be a valid column and right should be
        // something else.
        if (expression.subType === "literal-value") {
            // We have a literal value so we can use that directly.
            return {
                type: "constant",
                value: expression.value,
                column: column,
            };
        }

        if (expression.subType === "column") {
            // We have a column, so store that.
            return {
                type: "column",
                column: column,
                rightColumn: expression.columnName,
            };
        }

        return { type: "none" };
    }

    /** Check if an expression node is a valid indexed column. */
    private isValidColumn(expression: ExpressionNode): boolean {
        if (expression.subType !== "column") {
            return false;
        }
        // TODO: Handle tables/aliases...
        return this.indexedColumns.includes(expression.columnName);
    }
}
