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
    );

export const specialChars = sortSpecialCharsNames();

console.log(specialChars);
