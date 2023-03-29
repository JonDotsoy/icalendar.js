import * as lexer from "./lexer.mjs";
import {
    Node,
    ModuleNode,
    PropertyParameterNameNode,
    PropertyParameterValueNode,
    PropertyParameterNode,
    AltRepParamNameNode,
    AltRepParamValueNode,
    AltRepParamNode,
    VComponentNode,
    CommentNode,
} from "./ast_types.mjs";

function tokensToString(payload: Uint8Array, tokens: lexer.Token[]): string {
    return new TextDecoder().decode(
        new Uint8Array(
            tokens.reduce(
                (a: number[], token: lexer.Token): number[] => [
                    ...a,
                    ...payload.subarray(
                        token.span.start.pos,
                        token.span.end.pos
                    ),
                ],
                []
            )
        )
    );
}

class TokenListReader {
    constructor(
        readonly tokenList: lexer.TokenList,
        readonly cursor: { pos: number }
    ) {}

    forward() {
        this.cursor.pos += 1;
    }
    backward() {
        this.cursor.pos -= 1;
    }

    current() {
        const token = this.tokenList.at(this.cursor.pos) ?? null;
        if (token)
            Reflect.set(token, Symbol.for("cursor.pos"), this.cursor.pos);
        return token;
    }

    currentOrLast() {
        const token =
            this.tokenList.at(this.cursor.pos) ?? this.tokenList.at(-1) ?? null;
        if (!token) throw new Error("Token indeterminate");
        return token;
    }

    continueWithByKind(kind: lexer.Kind) {
        return this.tokenList.at(this.cursor.pos + 1)?.kind === kind;
    }
}

class TokenSyntaxError extends Error {
    constructor(token: lexer.Token) {
        super(
            `Invalid token ${token.kind} [${token.span.start.line}:${token.span.start.col} - ${token.span.end.line}:${token.span.end.col}]`,
            { cause: token }
        );
    }
}

class LineContentReader {
    constructor(
        readonly payload: Uint8Array,
        readonly tokenListReader: TokenListReader,
        readonly nodes: Set<Node>
    ) {}

    private _getTokensUntil(conditionBreak: (token: lexer.Token) => boolean) {
        const tokens: lexer.Token[] = [];
        while (true) {
            const token = this.tokenListReader.current();
            if (!token) break;
            if (token.kind === "unfolded") {
                this.tokenListReader.forward();
                continue;
            }
            if (conditionBreak(token)) break;
            tokens.push(token);
            this.tokenListReader.forward();
        }
        return tokens;
    }

    getTokensUntil(...kind: lexer.Kind[]) {
        return this._getTokensUntil((token) => kind.includes(token.kind));
    }

    getTokensUntilNotMatch(...kind: lexer.Kind[]) {
        return this._getTokensUntil((token) => !kind.includes(token.kind));
    }

    tokenIsWord(token: lexer.Token) {
        const kinds: lexer.Kind[] = [
            "word",
            "latinCapitalLetterN",
            "latinCapitalLetterT",
            "latinCapitalLetterX",
            "latinCapitalLetterZ",
            "latinSmallLetterN",
            "hyphenMinus",
        ];

        return kinds.includes(token.kind);
    }

    getTokensMatchKeyword() {
        return this._getTokensUntil((t) => !this.tokenIsWord(t));
    }

    toErrorInvalidExpectedToken(expectedTokenKind: string): never {
        const token = this.tokenListReader.currentOrLast();
        throw new Error(
            `Expected token ${expectedTokenKind} ${token?.span.start.line}:${token?.span.start.col}`
        );
    }

    toErrorInvalidToken(): never {
        const token = this.tokenListReader.currentOrLast();
        throw new Error(
            `Invalid token ${token?.span.start.line}:${token?.span.start.col} (${token?.kind})`
        );
    }

    parseNextAltRepParamValueNode(): AltRepParamValueNode {
        const firstToken = this.tokenListReader.current();
        if (!firstToken)
            this.toErrorInvalidExpectedToken("colon, semicolon or dobleQuote");
        const isString = firstToken.kind === "dobleQuote";

        if (isString) this.tokenListReader.forward();
        const tokens = isString
            ? this.getTokensUntil("dobleQuote")
            : this.getTokensUntil("colon", "semicolon");
        if (isString) this.tokenListReader.forward();

        const altRepParamValueNode: AltRepParamValueNode = {
            kind: "AltRepParamValue",
            span: {
                start: tokens.at(0)!.span.start,
                end: tokens.at(-1)!.span.end,
            },
            value: tokensToString(this.payload, tokens),
        };

        return altRepParamValueNode;
    }

    parseNextAltRepParamNameNode(): AltRepParamNameNode {
        const AltRepParamNameTokens = this.getTokensMatchKeyword();

        const altRepParamNameNode: AltRepParamNameNode = {
            kind: "AltRepParamName",
            span: {
                start: AltRepParamNameTokens.at(0)!.span.start,
                end: AltRepParamNameTokens.at(-1)!.span.end,
            },
            value: tokensToString(this.payload, AltRepParamNameTokens),
        };

        return altRepParamNameNode;
    }

    parseNextAltRepParam(): AltRepParamNode {
        const altRepParamNameNode = this.parseNextAltRepParamNameNode();

        if (this.tokenListReader.current()?.kind !== "equalSign")
            this.toErrorInvalidExpectedToken("equalSign");
        this.tokenListReader.forward();

        const altRepParamValueNode = this.parseNextAltRepParamValueNode();

        const altRepParamNode: AltRepParamNode = {
            kind: "AltRepParam",
            span: {
                start: altRepParamNameNode.span.start,
                end: altRepParamValueNode.span.end,
            },
            name: altRepParamNameNode,
            value: altRepParamValueNode,
        };

        return altRepParamNode;
    }

    parseNextPropertyParameterValueNode(): PropertyParameterValueNode {
        const propertyParameterValueTokens: lexer.Token[] =
            this.getTokensUntil("crlf");

        if (!propertyParameterValueTokens.length)
            return {
                kind: "PropertyParameterValue",
                span: {
                    start: this.tokenListReader.currentOrLast().span.end,
                    end: this.tokenListReader.currentOrLast().span.end,
                },
                value: "",
            };

        const propertyParameterValueNode: PropertyParameterValueNode = {
            kind: "PropertyParameterValue",
            span: {
                start: propertyParameterValueTokens.at(0)!.span.start,
                end: propertyParameterValueTokens.at(-1)!.span.end,
            },
            value: tokensToString(this.payload, propertyParameterValueTokens),
        };

        return propertyParameterValueNode;
    }

    parseNextPropertyParameter(): PropertyParameterNode {
        const altRepNodes: AltRepParamNode[] = [];

        const propertyParameterNameTokens = this.getTokensMatchKeyword();

        if (!propertyParameterNameTokens.length) this.toErrorInvalidToken();

        const propertyParameterNameNode: PropertyParameterNameNode = {
            kind: "PropertyParameterName",
            span: {
                start: propertyParameterNameTokens.at(0)!.span.start,
                end: propertyParameterNameTokens.at(-1)!.span.end,
            },
            value: tokensToString(this.payload, propertyParameterNameTokens),
        };

        while (this.tokenListReader.current()?.kind === "semicolon") {
            this.tokenListReader.forward();
            const altRepParam = this.parseNextAltRepParam();
            altRepNodes.push(altRepParam);
        }

        if (this.tokenListReader.current()?.kind !== "colon")
            this.toErrorInvalidExpectedToken("colon");
        this.tokenListReader.forward();

        const propertyParameterValueNode =
            this.parseNextPropertyParameterValueNode();

        return {
            kind: "PropertyParameter",
            altRepNodes,
            span: {
                start: propertyParameterNameNode.span.start,
                end:
                    propertyParameterValueNode?.span.end ??
                    propertyParameterNameNode.span.end,
            },
            name: propertyParameterNameNode,
            value: propertyParameterValueNode,
        };
    }

    parseNextComment(): CommentNode {
        const token = this.tokenListReader.current();
        if (token?.kind !== "semicolon")
            throw this.toErrorInvalidExpectedToken("semicolon");
        const start = token.span.start;
        const defaultEnd = token.span.end;
        this.tokenListReader.forward();
        const tokenValues: lexer.Token[] = [];
        while (true) {
            const token = this.tokenListReader.current();
            if (!token) break;
            if (token.kind === "crlf") {
                this.tokenListReader.forward();
                break;
            }
            tokenValues.push(token);
            this.tokenListReader.forward();
        }

        return {
            kind: "VComment",
            span: {
                start,
                end: tokenValues.at(-1)?.span.end ?? defaultEnd,
            },
            value: tokensToString(this.payload, tokenValues),
        };
    }

    parseNextLineContent() {
        while (true) {
            const token = this.tokenListReader.current();
            if (!token) return null;
            if (token?.kind === "semicolon") return this.parseNextComment();
            if (this.tokenIsWord(token))
                return this.parseNextPropertyParameter();
            if (token?.kind === "crlf") {
                this.tokenListReader.forward();
                continue;
            }
            this.toErrorInvalidToken();
        }
    }
}

export class AST {
    lineContentReader: LineContentReader;

    private constructor(
        readonly payload: Uint8Array,
        readonly tokenListReader: TokenListReader,
        readonly nodes: Set<Node>
    ) {
        this.lineContentReader = new LineContentReader(
            payload,
            tokenListReader,
            nodes
        );
    }

    toErrorInvalidExpectedToken(expectedTokenKind: string): never {
        const token = this.tokenListReader.currentOrLast();
        throw new Error(
            `Expected token ${expectedTokenKind} ${token?.span.start.line}:${token?.span.start.col}`
        );
    }

    toErrorInvalidToken(): never {
        const token = this.tokenListReader.currentOrLast();
        throw new Error(
            `Invalid token ${token?.span.start.line}:${token?.span.start.col} (${token?.kind})`
        );
    }

    parseComponent(beginNode: PropertyParameterNode): VComponentNode {
        let endNode: Node | null = null;
        const nodes: (VComponentNode | PropertyParameterNode)[] = [];
        const componentKind = beginNode.value?.value;

        if (!componentKind) this.toErrorInvalidToken();

        while (true) {
            const lineContent = this.lineContentReader.parseNextLineContent();
            if (!lineContent) break;
            if (lineContent.kind === "VComment") continue;
            if (
                lineContent.kind === "PropertyParameter" &&
                lineContent.name.value === "BEGIN"
            ) {
                nodes.push(this.parseComponent(lineContent));
                continue;
            }
            if (
                lineContent.kind === "PropertyParameter" &&
                lineContent.name.value === "END" &&
                lineContent.value?.value === componentKind
            ) {
                endNode = lineContent;
                break;
            }
            if (lineContent.kind === "PropertyParameter") {
                nodes.push(lineContent);
                continue;
            }
            throw this.toErrorInvalidToken();
        }

        if (!endNode) throw new Error(`Expected a END:${componentKind}`);

        return {
            kind: "VComponent",
            componentKind,
            nodes,
            span: {
                start: beginNode.span.start,
                end: endNode.span.start,
            },
        };
    }

    parse(): ModuleNode {
        const nodes: (PropertyParameterNode | VComponentNode)[] = [];
        while (true) {
            const lineContent = this.lineContentReader.parseNextLineContent();
            if (!lineContent) break;
            if (lineContent.kind === "VComment") continue;
            if (
                lineContent.kind === "PropertyParameter" &&
                lineContent.name.value === "BEGIN"
            ) {
                nodes.push(this.parseComponent(lineContent));
                continue;
            }
            this.toErrorInvalidToken();
        }

        return {
            kind: "Module",
            nodes,
            span: {
                start: nodes.at(0)!.span.start,
                end: nodes.at(-1)!.span.end,
            },
        };
    }

    static from(payload: Uint8Array, tokens: lexer.TokenList): ModuleNode {
        const ast = new AST(
            payload,
            new TokenListReader(tokens, { pos: 0 }),
            new Set()
        );
        const moduleNode = ast.parse();
        return moduleNode;
    }
}
