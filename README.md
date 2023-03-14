# iCalendar parser

Modern module to parse and stringify iCalendar to Javascript.

## Lexer

**Token allows:**

-   colon
-   equal
-   keyword
-   newline
-   semicolon
-   string
-   string_multiline

**Sample tokenizer:**

```ts
import { Lexer } from "icalendar.js/lexer";

const payload = new TextEncoder().encode(
    "" +
        `DESCRIPTION;ALTREP="http://www.wiz.org":The Fall'98 Wild Wizards\n` +
        ` Conference - - Las Vegas, NV, USA\n`
);

const tokens = Lexer.from(payload);
// =>
// [
//   {
//     kind: 'keyword',
//     span: { start: 0, end: 11 },
//     raw: Uint8Array(11) [
//       68, 69, 83, 67, 82,
//       73, 80, 84, 73, 79,
//       78
//     ],
//     value: 'DESCRIPTION'
//   },
//   {
//     kind: 'semicolon',
//     span: { start: 11, end: 12 },
//     raw: Uint8Array(1) [ 59 ]
//   },
//   {
//     kind: 'keyword',
//     span: { start: 12, end: 18 },
//     raw: Uint8Array(6) [ 65, 76, 84, 82, 69, 80 ],
//     value: 'ALTREP'
//   },
```
