import { inspect } from "util";
import { Token } from "./lexer.mjs";

type Kind =
    | "Module"
    | "PropertyParameter"
    | "PropertyParameterName"
    | "PropertyParameterValue"
    | "AltRepParam"
    | "AltRepParamName"
    | "AltRepParamValue"
    | "VCalendar"
    | "VEvent";

interface Node {
    kind: Kind;
    span: { start: number; end: number };
}

interface ModuleNode extends Node {
    kind: "Module";
    nodes: (PropertyParameterNode | VCalendarNode)[];
}

interface PropertyParameterNameNode extends Node {
    kind: "PropertyParameterName";
    value: string;
}

interface PropertyParameterValueNode extends Node {
    kind: "PropertyParameterValue";
    value: any;
}

interface PropertyParameterNode extends Node {
    kind: "PropertyParameter";
    name: PropertyParameterNameNode;
    value: PropertyParameterValueNode;
    altRepNodes: AltRepParamNode[];
}

interface AltRepParamNameNode extends Node {
    kind: "AltRepParamName";
    value: string;
}

interface AltRepParamValueNode extends Node {
    kind: "AltRepParamValue";
    value: string;
}

interface AltRepParamNode extends Node {
    kind: "AltRepParam";
    name: AltRepParamNameNode;
    value: AltRepParamValueNode;
}

interface VCalendarNode extends Node {
    kind: "VCalendar";
    nodes: PropertyParameterNode[];
}

interface VEventNode extends Node {
    kind: "VEvent";
    nodes: PropertyParameterNode[];
}

export class AST {
    static from(tokens: Token[]): ModuleNode {
        const spanStart = tokens.at(0)?.span.start ?? 0;
        const spanEnd = tokens.at(-1)?.span.end ?? 0;
        let cursor = 0;
        const nodes: ModuleNode["nodes"] = [];

        cursor = this.fromModule(cursor, nodes, tokens);

        const module: ModuleNode = {
            kind: "Module",
            span: {
                start: spanStart,
                end: spanEnd,
            },
            nodes,
        };

        return module;
    }

    static fromModule(
        index: number,
        nodes: (PropertyParameterNode | VCalendarNode | VEventNode)[],
        tokens: Token[],
        closeEnd?: string
    ) {
        let cursor = index;

        while (true) {
            const token = tokens.at(cursor);
            if (!token) break;

            if (token.kind === "keyword") {
                cursor = AST.fromPropertyParameters(cursor, nodes, tokens);
                const lastNode = nodes.at(-1);
                if (
                    closeEnd &&
                    lastNode?.kind === "PropertyParameter" &&
                    lastNode.name.value === "END" &&
                    lastNode.value.value === closeEnd
                ) {
                    nodes.pop();
                    break;
                }
                continue;
            }

            if (token.kind === "newline") {
                cursor += 1;
                continue;
            }

            throw new Error(`Invalid ${token.kind} pos ${cursor}`);
        }

        return cursor;
    }

    static fromAltRepParam(
        index: number,
        nodes: AltRepParamNode[],
        tokens: Token[]
    ): number {
        let cursor = index;

        const altRepPropToken = tokens.at(cursor);
        if (
            altRepPropToken?.kind !== "keyword" &&
            altRepPropToken?.kind !== "string"
        )
            throw new Error("Expect keyword or string");
        cursor += 1;

        if (tokens.at(cursor)?.kind !== "equal")
            throw new Error(
                `Expect an equal token but receive an ${
                    tokens.at(cursor)?.kind
                }`
            );
        cursor += 1;

        const altRepValueToken = tokens.at(cursor);
        if (
            altRepValueToken?.kind !== "keyword" &&
            altRepValueToken?.kind !== "string"
        )
            throw new Error("Expect keyword or string");
        cursor += 1;

        const altRepParam: AltRepParamNode = {
            kind: "AltRepParam",
            span: {
                start: altRepPropToken.span.start,
                end: altRepValueToken.span.end,
            },
            name: {
                kind: "AltRepParamName",
                span: altRepPropToken.span,
                value: altRepPropToken.value,
            },
            value: {
                kind: "AltRepParamValue",
                span: altRepValueToken.span,
                value: altRepValueToken.value,
            },
        };

        nodes.push(altRepParam);

        return cursor;
    }

    static fromPropertyParameters(
        index: number,
        nodes: (PropertyParameterNode | VCalendarNode | VEventNode)[],
        tokens: Token[]
    ): number {
        let cursor = index;

        const paramToken = tokens.at(cursor);
        if (!paramToken) throw new Error(`Invalid token`);
        const snapStart = paramToken.span.start;
        let snapEnd: number;

        const paramName: PropertyParameterNameNode = {
            kind: "PropertyParameterName",
            span: paramToken.span,
            value: paramToken.value,
        };

        const altRepNodes: AltRepParamNode[] = [];

        cursor += 1;

        while (true) {
            const token = tokens.at(cursor);
            if (!token) break;

            if (token.kind === "semicolon") {
                cursor += 1;
                cursor = AST.fromAltRepParam(cursor, altRepNodes, tokens);
                continue;
            }

            if (token.kind === "colon") {
                cursor += 1;
                const token = tokens.at(cursor);
                if (token?.kind !== "string_multiline")
                    throw new Error(`Expected a string_multiline token`);
                const value: PropertyParameterValueNode = {
                    kind: "PropertyParameterValue",
                    span: token.span,
                    value: token.value,
                };
                snapEnd = token.span.end;

                const propertyParameterNode: PropertyParameterNode = {
                    kind: "PropertyParameter",
                    span: {
                        start: snapStart,
                        end: snapEnd,
                    },
                    name: paramName,
                    value,
                    altRepNodes: altRepNodes,
                };

                cursor += 1;

                if (
                    propertyParameterNode.name.value === "BEGIN" &&
                    propertyParameterNode.value.value === "VCALENDAR"
                ) {
                    const vCalendarNodes: VCalendarNode["nodes"] = [];

                    cursor = AST.fromModule(
                        cursor,
                        vCalendarNodes,
                        tokens,
                        "VCALENDAR"
                    );

                    const vCalendarNode: VCalendarNode = {
                        kind: "VCalendar",
                        span: {
                            start: propertyParameterNode.span.start,
                            end:
                                vCalendarNodes.at(-1)?.span.end ??
                                propertyParameterNode.span.end,
                        },
                        nodes: vCalendarNodes,
                    };
                    nodes.push(vCalendarNode);
                    break;
                }

                if (
                    propertyParameterNode.name.value === "BEGIN" &&
                    propertyParameterNode.value.value === "VEVENT"
                ) {
                    const vEventNodes: VEventNode["nodes"] = [];

                    cursor = AST.fromModule(
                        cursor,
                        vEventNodes,
                        tokens,
                        "VEVENT"
                    );

                    const vEventNode: VEventNode = {
                        kind: "VEvent",
                        span: {
                            start: propertyParameterNode.span.start,
                            end:
                                vEventNodes.at(-1)?.span.end ??
                                propertyParameterNode.span.end,
                        },
                        nodes: vEventNodes,
                    };
                    nodes.push(vEventNode);
                    break;
                }

                nodes.push(propertyParameterNode);
                break;
            }

            throw new Error(`Invalid ${token.kind} pos ${cursor}`);
        }

        return cursor;
    }
}
