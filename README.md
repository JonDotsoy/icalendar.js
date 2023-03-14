# iCalendar parser

Modern module to parse and stringify iCalendar to Javascript.

## AST

**Kind Allows:**

-   Module
-   PropertyParameter
-   PropertyParameterName
-   PropertyParameterValue
-   AltRepParam
-   AltRepNameParam
-   AltRepValueParam

**Sample Parser:**

```ts
const payload = new TextEncoder().encode(
    "" +
        `DESCRIPTION;ALTREP="http://www.wiz.org":The Fall'98 Wild Wizards\n` +
        ` Conference - - Las Vegas, NV, USA\n`
);
const tokens = Lexer.from(payload);
const ast = AST.from(tokens);
// =>
// {
//   kind: 'Module',
//   span: { start: 0, end: 100 },
//   nodes: [
//     {
//       kind: 'PropertyParameter',
//       span: { start: 0, end: 99 },
//       name: {
//         kind: 'PropertyParameterName',
//         span: { start: 0, end: 11 },
//         value: 'DESCRIPTION'
//       },
//       value: {
//         kind: 'PropertyParameterValue',
//         span: { start: 40, end: 99 },
//         value: "The Fall'98 Wild Wizards Conference - - Las Vegas, NV, USA"
//       },
//       altRepNodes: [
//         {
//           kind: 'AltRepParam',
```

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

> Look this full [sample](https://codesandbox.io/p/sandbox/loving-snyder-r647mw?file=%2Fapp%2Fcalendar.ics&selection=%5B%7B%22endColumn%22%3A30%2C%22endLineNumber%22%3A9%2C%22startColumn%22%3A30%2C%22startLineNumber%22%3A9%7D%5D)
