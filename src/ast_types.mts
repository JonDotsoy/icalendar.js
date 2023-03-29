import { Span } from "./lexer.mjs";

type Kind =
    | "Module"
    | "PropertyParameter"
    | "PropertyParameterName"
    | "PropertyParameterValue"
    | "AltRepParam"
    | "AltRepParamName"
    | "AltRepParamValue"
    | "VComment"
    | "VComponent";

export interface Node {
    kind: Kind;
    span: { start: Span; end: Span };
}

export interface ModuleNode extends Node {
    kind: "Module";
    nodes: (PropertyParameterNode | VComponentNode)[];
}

export interface PropertyParameterNameNode extends Node {
    kind: "PropertyParameterName";
    value: string;
}

export interface PropertyParameterValueNode extends Node {
    kind: "PropertyParameterValue";
    value: any;
    // tokens: lexer.Token[]
}

export interface PropertyParameterNode extends Node {
    kind: "PropertyParameter";
    name: PropertyParameterNameNode;
    value: PropertyParameterValueNode;
    altRepNodes: AltRepParamNode[];
}

export interface AltRepParamNameNode extends Node {
    kind: "AltRepParamName";
    value: string;
}

export interface AltRepParamValueNode extends Node {
    kind: "AltRepParamValue";
    value: string;
}

export interface AltRepParamNode extends Node {
    kind: "AltRepParam";
    name: AltRepParamNameNode;
    value: AltRepParamValueNode;
}

export interface VComponentNode extends Node {
    kind: "VComponent";
    componentKind: string;
    nodes: (VComponentNode | PropertyParameterNode)[];
}

export interface CommentNode extends Node {
    kind: "VComment";
    value: string;
}
