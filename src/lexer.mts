type likeArray = number[] | Uint8Array;
const arrayIsEqual = (a: likeArray, b: likeArray) =>
    a.length == b.length && a.every((vA, indexA) => vA === b[indexA]);

const charCodeAt = (str: string) => str.charCodeAt(0);
const aCharCode = charCodeAt("a");
const zCharCode = charCodeAt("z");
const ACharCode = charCodeAt("A");
const ZCharCode = charCodeAt("Z");
const _0CharCode = charCodeAt("0");
const _9CharCode = charCodeAt("9");
const alphabetLower = new Array(zCharCode - aCharCode + 1)
    .fill(0)
    .map((_, i) => aCharCode + i);
const alphabetUpper = new Array(ZCharCode - ACharCode + 1)
    .fill(0)
    .map((_, i) => ACharCode + i);
const numbers = new Array(_9CharCode - _0CharCode + 1)
    .fill(0)
    .map((_, i) => _0CharCode + i);

const KEYWORD_CHARS = new Uint8Array([
    charCodeAt("_"),
    charCodeAt("-"),
    ...alphabetLower,
    ...alphabetUpper,
    ...numbers,
]);

type kind =
    | "string_multiline"
    | "string"
    | "keyword"
    | "semicolon"
    | "equal"
    | "newline"
    | "colon";

export interface Token {
    kind: kind;
    span: { start: number; end: number };
    raw: Uint8Array;
    value?: any;
}

export class Lexer {
    static toStringMultiLine(
        index: number,
        tokens: Token[],
        payload: Uint8Array
    ): number {
        let cursor = index;
        const chars: number[] = [];

        while (true) {
            if (cursor >= payload.length) break;
            if (
                arrayIsEqual(payload.subarray(cursor, cursor + 2), [
                    charCodeAt("\n"),
                    charCodeAt(" "),
                ])
            ) {
                cursor += 2;
                chars.push(charCodeAt(" "));
                continue;
            }
            if (payload.at(cursor) === charCodeAt("\n")) break;
            chars.push(payload.at(cursor)!);
            cursor += 1;
        }

        tokens.push({
            kind: "string_multiline",
            span: { start: index, end: cursor },
            raw: payload.subarray(index, cursor),
            value: new TextDecoder().decode(new Uint8Array(chars)),
        });

        return cursor;
    }

    static toString(
        index: number,
        tokens: Token[],
        payload: Uint8Array
    ): number {
        let cursor = index;
        if (payload.at(cursor) !== charCodeAt('"'))
            throw new Error(`Unexpected token ${cursor}`);
        cursor += 1;
        const chars: number[] = [];

        while (true) {
            if (cursor >= payload.length)
                throw new Error(`Unexpected token ${cursor}`);
            if (
                arrayIsEqual(payload.subarray(cursor, cursor + 2), [
                    charCodeAt("\\"),
                    charCodeAt('"'),
                ])
            ) {
                cursor += 2;
                continue;
            }
            if (payload.at(cursor) === charCodeAt('"')) {
                cursor += 1;
                break;
            }

            chars.push(payload.at(cursor)!);
            cursor += 1;
        }

        tokens.push({
            kind: "string",
            span: { start: index, end: cursor },
            raw: new Uint8Array(payload.subarray(index, cursor)),
            value: new TextDecoder().decode(new Uint8Array(chars)),
        });

        return cursor;
    }

    static toKeyWord(index: number, tokens: Token[], payload: Uint8Array) {
        let cursor = index;
        const chars: number[] = [];
        while (true) {
            const char = payload.at(cursor);
            if (!char || !KEYWORD_CHARS.includes(char)) break;
            chars.push(char);
            cursor += 1;
        }
        tokens.push({
            kind: "keyword",
            span: { start: index, end: cursor },
            raw: new Uint8Array(chars),
            value: new TextDecoder().decode(new Uint8Array(chars)),
        });
        return cursor;
    }

    static from(payload: Uint8Array) {
        let cursor = 0;
        const tokens: Token[] = [];
        while (true) {
            if (cursor >= payload.length) break;
            if (KEYWORD_CHARS.includes(payload.at(cursor)!)) {
                cursor = Lexer.toKeyWord(cursor, tokens, payload);
                continue;
            }
            if (charCodeAt(";") === payload.at(cursor)!) {
                tokens.push({
                    kind: "semicolon",
                    span: { start: cursor, end: cursor + 1 },
                    raw: new Uint8Array([payload.at(cursor)!]),
                });
                cursor += 1;
                continue;
            }
            if (charCodeAt("=") === payload.at(cursor)!) {
                tokens.push({
                    kind: "equal",
                    span: { start: cursor, end: cursor + 1 },
                    raw: new Uint8Array([payload.at(cursor)!]),
                });
                cursor += 1;
                continue;
            }
            if (charCodeAt("\n") === payload.at(cursor)!) {
                tokens.push({
                    kind: "newline",
                    span: { start: cursor, end: cursor + 1 },
                    raw: new Uint8Array([payload.at(cursor)!]),
                });
                cursor += 1;
                continue;
            }
            if (charCodeAt(":") === payload.at(cursor)!) {
                tokens.push({
                    kind: "colon",
                    span: { start: cursor, end: cursor + 1 },
                    raw: new Uint8Array([payload.at(cursor)!]),
                });
                cursor += 1;
                cursor = Lexer.toStringMultiLine(cursor, tokens, payload);
                continue;
            }
            if (charCodeAt('"') === payload.at(cursor)!) {
                cursor = Lexer.toString(cursor, tokens, payload);
                continue;
            }
            throw new Error(`unexpected symbol: pos ${cursor}`);
        }

        return tokens;
    }
}
