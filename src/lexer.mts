let currentPayload: null | PayloadReader = null;

type LikeBuffer = Uint8Array;
const arrayIsEqual = (a: LikeBuffer, b: LikeBuffer) =>
    a.length == b.length && a.every((vA, indexA) => vA === b[indexA]);

const charCodeAt = (str: string) => str.charCodeAt(0);

namespace specialCharsNames {
    /** '\t' */
    export const hTab = new Uint8Array([9]);
    /** '\n' */
    export const lf = new Uint8Array([10]);
    /** '\r' */
    export const cr = new Uint8Array([13]);
    /** '\x16' */
    export const dQuote = new Uint8Array([22]);
    /** ' ' */
    export const space = new Uint8Array([32]);
    /** '=' */
    export const equalSign = new Uint8Array([61]);
    /** '+' */
    export const plusSign = new Uint8Array([43]);
    /** ',' */
    export const comma = new Uint8Array([44]);
    /** '-' */
    export const hyphenMinus = new Uint8Array([45]);
    /** '.' */
    export const period = new Uint8Array([46]);
    /** '/' */
    export const solidus = new Uint8Array([47]);
    /** ':' */
    export const colon = new Uint8Array([58]);
    /** ';' */
    export const semicolon = new Uint8Array([59]);
    /** 'N' */
    export const latinCapitalLetterN = new Uint8Array([78]);
    /** 'T' */
    export const latinCapitalLetterT = new Uint8Array([84]);
    /** 'X' */
    export const latinCapitalLetterX = new Uint8Array([88]);
    /** 'Z' */
    export const latinCapitalLetterZ = new Uint8Array([90]);
    /** '\\' */
    export const backslash = new Uint8Array([92]);
    /** 'n' */
    export const latinSmallLetterN = new Uint8Array([110]);
    /** '\r\n' */
    export const crlf = new Uint8Array([13, 10]);
    /** '\r\n ' */
    export const unfolded = new Uint8Array([13, 10, 32]);
    /** '"' */
    export const dobleQuote = new Uint8Array([34]);
}

const sortSpecialCharsNames = () =>
    Object.fromEntries(
        Object.entries(specialCharsNames).sort((a, b) => {
            if (a[1].length > b[1].length) return -1;
            return 0;
        })
    ) as Record<keyof typeof specialCharsNames, Uint8Array>;

export const specialChars = sortSpecialCharsNames();

export type Kind = keyof typeof specialChars | "word";

export interface Span {
    pos: number;
    col: number;
    line: number;
}

export class Token {
    debug?: string;
    constructor(
        readonly kind: Kind,
        readonly span: {
            start: Span;
            end: Span;
        }
    ) {
        if (currentPayload) {
            this.debug = new TextDecoder().decode(
                new Uint8Array(
                    currentPayload?.payload.subarray(
                        this.span.start.pos,
                        this.span.end.pos
                    )
                )
            );
        }
    }
}

export class CharSyntaxError extends Error {
    constructor(span: Span) {
        super(`Invalid char ${span.line}:${span.col}`, { cause: span });
    }
}

export class PayloadReader {
    private semiSpan: { line: number; col: number };
    constructor(
        readonly payload: LikeBuffer,
        readonly cursor: { pos: number }
    ) {
        this.semiSpan = { line: 1, col: 1 };
    }
    currentChar(): number | null {
        return this.payload.at(this.cursor.pos) ?? null;
    }
    getSnap(at: number = 0): { start: Span; end: Span } {
        const start: Span = { pos: this.cursor.pos, ...this.semiSpan };
        Array(at)
            .fill(0)
            .forEach(() => this.forward());
        const end: Span = { pos: this.cursor.pos, ...this.semiSpan };
        return { start, end };
    }

    forward() {
        this.cursor.pos += 1;
        const char = this.payload.at(this.cursor.pos);
        if (char) {
            if (char === charCodeAt("\n")) {
                this.semiSpan.line += 1;
                this.semiSpan.col = 1;
            } else {
                this.semiSpan.col += 1;
            }
        }
    }

    backward() {
        this.cursor.pos -= 1;
        const char = this.payload.at(this.cursor.pos);
        if (char) {
            if (char === charCodeAt("\n")) {
                this.semiSpan.line -= 1;
                this.semiSpan.col = 1;
            } else {
                this.semiSpan.col -= 1;
            }
        }
    }

    isEnd() {
        return this.cursor.pos >= this.payload.length;
    }

    continueWith(buff: LikeBuffer) {
        return arrayIsEqual(
            this.payload.subarray(
                this.cursor.pos,
                this.cursor.pos + buff.length
            ),
            buff
        );
    }
}

export class TokenList {
    tokens: Token[] = [];

    add(token: Token) {
        this.tokens.push(token);
    }

    at(pos: number) {
        return this.tokens.at(pos);
    }
}

export class TokenListReader {
    constructor(
        readonly tokenList: TokenList,
        readonly cursor: { pos: number }
    ) {}

    current() {
        return this.tokenList.at(this.cursor.pos);
    }
}

export class Lexer {
    tokenListReader: TokenListReader;

    private constructor(
        readonly payloadReader: PayloadReader,
        public tokens: TokenList
    ) {
        this.tokenListReader = new TokenListReader(tokens, { pos: 0 });
    }

    toWord() {
        const chars: number[] = [];
        const startSpan = this.payloadReader.getSnap().start;
        const isEspecialChar = () => {
            for (const [, specialChar] of Object.entries(specialChars)) {
                if (this.payloadReader.continueWith(specialChar)) {
                    return true;
                }
            }
        };
        while (true) {
            if (this.payloadReader.isEnd()) break;
            if (isEspecialChar()) break;
            const char = this.payloadReader.currentChar()!;
            chars.push(char);
            this.payloadReader.forward();
        }
        this.tokens.add(
            new Token("word", {
                start: startSpan,
                end: this.payloadReader.getSnap().end,
            })
        );
        return { toContinue: true };
    }

    toSpecialCharacter() {
        for (const [spacialCharName, specialChar] of Object.entries(
            specialChars
        )) {
            if (this.payloadReader.continueWith(specialChar)) {
                this.tokens.add(
                    new Token(
                        spacialCharName as any,
                        this.payloadReader.getSnap(specialChar.length)
                    )
                );
                return { toContinue: true, specialChar };
            }
        }

        return { toContinue: false };
    }

    parseString() {
        while (true) {
            if (this.payloadReader.isEnd()) return;
            const isSpecialCharacter = this.toSpecialCharacter();
            if (isSpecialCharacter.toContinue) continue;
            if (this.toWord().toContinue) continue;
            throw new CharSyntaxError(this.payloadReader.getSnap().start);
        }
    }

    parse() {
        currentPayload = this.payloadReader;
        while (true) {
            if (this.payloadReader.isEnd()) break;
            if (this.toSpecialCharacter().toContinue) continue;
            if (this.toWord().toContinue) continue;
            throw new CharSyntaxError(this.payloadReader.getSnap().start);
        }
        currentPayload = null;
    }

    static from(payload: Uint8Array) {
        const payloadReader = new PayloadReader(payload, { pos: 0 });
        const tokens: TokenList = new TokenList();

        const lexer = new Lexer(payloadReader, tokens);
        lexer.parse();

        return lexer.tokens;
    }
}
