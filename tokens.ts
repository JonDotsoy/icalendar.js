
type likeArray = number[] | Uint8Array
const arrayIsEqual = (a: likeArray, b: likeArray) => a.length == b.length && a.every((vA, indexA) => vA === b[indexA])

const charCodeAt = (str: string) => str.charCodeAt(0)
const aCharCode = charCodeAt('a')
const zCharCode = charCodeAt('z')
const ACharCode = charCodeAt('A')
const ZCharCode = charCodeAt('Z')
const _0CharCode = charCodeAt('0')
const _9CharCode = charCodeAt('9')
const alphabetLower = new Array(zCharCode - aCharCode + 1).fill(0).map((_, i) => aCharCode + i)
const alphabetUpper = new Array(ZCharCode - ACharCode + 1).fill(0).map((_, i) => ACharCode + i)
const numbers = new Array(_9CharCode - _0CharCode + 1).fill(0).map((_, i) => _0CharCode + i)

const KEYCHAR = new Uint8Array([
    charCodeAt('_'),
    charCodeAt('-'),
    ...alphabetLower,
    ...alphabetUpper,
    ...numbers,
])

interface Token {
    kind: string
    pos: number
    value: Uint8Array
}

export class ICS_TOKENS {
    static toRawValue(index: number, tokens: Token[], payload: Uint8Array): number {
        let cursor = index
        const chars: number[] = []

        while (true) {
            if (cursor >= payload.length) break
            if (
                arrayIsEqual(
                    payload.subarray(cursor, cursor + 2),
                    [charCodeAt('\n'), charCodeAt(' ')]
                )
            ) {
                cursor += 2
                chars.push(charCodeAt(' '))
                continue
            }
            if (payload.at(cursor) === charCodeAt("\n")) break
            chars.push(payload.at(cursor)!)
            cursor += 1
        }

        tokens.push({
            kind: "rawvalue",
            pos: index,
            value: new Uint8Array(chars),
        });

        return cursor
    }

    static toString(index: number, tokens: Token[], payload: Uint8Array): number {
        let cursor = index
        if (payload.at(cursor) !== charCodeAt('"')) throw new Error(`Unexpected token ${cursor}`)
        cursor += 1
        const chars: number[] = []

        while (true) {
            if (cursor >= payload.length) throw new Error(`Unexpected token ${cursor}`)
            if (
                arrayIsEqual(
                    payload.subarray(cursor, cursor + 2),
                    [charCodeAt('\\'), charCodeAt('"')]
                )
            ) {
                cursor += 2
                continue
            }
            if (payload.at(cursor) === charCodeAt('"')) {
                cursor += 1
                break
            }

            chars.push(payload.at(cursor)!)
            cursor += 1
        }

        tokens.push({
            kind: "string",
            pos: index,
            value: new Uint8Array(chars),
        });

        return cursor
    }

    static toKeyChar(index: number, tokens: Token[], payload: Uint8Array) {
        let cursor = index
        const chars: number[] = []
        while (true) {
            const char = payload.at(cursor)
            if (!char || !KEYCHAR.includes(char)) break
            chars.push(char)
            cursor += 1
        }
        tokens.push({
            kind: "keychars",
            pos: index,
            value: new Uint8Array(chars)
        })
        return cursor
    }

    static from(payload: Uint8Array) {
        let cursor = 0
        const tokens: Token[] = []
        while (true) {
            if (cursor >= payload.length) break
            if (KEYCHAR.includes(payload.at(cursor)!)) {
                cursor = ICS_TOKENS.toKeyChar(cursor, tokens, payload)
                continue
            }
            if (charCodeAt(';') === payload.at(cursor)!) {
                tokens.push({ kind: "semicolon", pos: cursor, value: new Uint8Array([payload.at(cursor)!]) })
                cursor += 1
                continue
            }
            if (charCodeAt('=') === payload.at(cursor)!) {
                tokens.push({ kind: "equal", pos: cursor, value: new Uint8Array([payload.at(cursor)!]) })
                cursor += 1
                continue
            } if (charCodeAt('\n') === payload.at(cursor)!) {
                tokens.push({ kind: "newline", pos: cursor, value: new Uint8Array([payload.at(cursor)!]) })
                cursor += 1
                continue
            }
            if (charCodeAt(':') === payload.at(cursor)!) {
                tokens.push({ kind: "colon", pos: cursor, value: new Uint8Array([payload.at(cursor)!]) })
                cursor += 1
                cursor = ICS_TOKENS.toRawValue(cursor, tokens, payload)
                continue
            }
            if (charCodeAt('"') === payload.at(cursor)!) {
                cursor = ICS_TOKENS.toString(cursor, tokens, payload)
                continue
            }
            for (const token of tokens) {
                console.log(`${token.kind} [${token.pos}]: ${Deno.inspect(new TextDecoder().decode(token.value))}`)
            }
            throw new Error(`unexpected symbol: pos ${cursor}`)
        }

        return tokens
    }
}