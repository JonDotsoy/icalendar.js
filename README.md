# icalendar.js

Modern module to parse and stringify iCalendar to Javascript.

## Features of iCalendar.js:

-   Parse an `ICalendar` object from a BufferArray
-   Serialize to **RFC 5545** ICS format from an `ICalendar` object
-   Deserialize from **RFC 5545** ICS format to an `ICalendar` object
-   Provides an API to filter components of an `ICalendar` object

## Installing

Using npm:

```shell
$ npm add icalendar.js
```

On Deno

```ts
import { ICalendar } from "npm:icalendar.js";
```

## Example

```ts
import { ICalendar } from "icalendar.js";

const res = await fetch("https:source/....ics");
const payload = await res.arrayBuffer();
const icalendar = ICalendar.from(payload);

icalendar.filterComponentsByRange(Date.UTC(2023, 2, 10), Date.UTC(2023, 2, 15));
```

Create a new `ICalendar` object and write a ICS file.

```ts
import { ICalendar, VComponent, PropertyValue } from "icalendar.js";
import * as propertyTypes from "icalendar.js/property_types";

const calendar = ICalendar.create();
const event = new VComponent("VEVENT");

calendar.components.add(event);

event.properties.set(
    "SUMMARY",
    new PropertyValue(new propertyTypes.Text(`text`))
);
event.properties.set(
    "DTSTART",
    new PropertyValue(
        new propertyTypes.Date({
            fullYear: 2023,
            month: 3,
            monthDay: 12,
        })
    )
);
event.properties.set(
    "DTEND",
    new PropertyValue(
        new propertyTypes.Date({
            fullYear: 2023,
            month: 3,
            monthDay: 13,
        })
    )
);

fs.writeFile("myfile.ics", iCalendar.toICS());
```

## Parse ICS File

**Sample Load:**

```ts
import { ICalendar } from "icalendar.js";

const location = new URL("sample.ics", import.meta.url);
const payload = await readFile(location);
const icalendar = ICalendar.from(payload);
// =>
// ICalendar
//   kind: 'VCALENDAR',
//   properties: Map(9) {
//     'VERSION' => PropertyValue { value: '2.0', parameters: Map(0) {} },
//     'PRODID' => PropertyValue {
//       value: '-//Office Holidays Ltd.//EN',
//       parameters: Map(0) {}
//     },
//     'X-WR-CALNAME' => PropertyValue {
//       value: 'International Holidays',
//       parameters: Map(0) {}
//     },
//     'X-WR-CALDESC' => PropertyValue {
//       value: 'Public Holidays in International. Provided by http://www.officeholidays.com',
//       parameters: Map(0) {}
//     },
//     'REFRESH-INTERVAL' => PropertyValue {
//       value: 'PT48H',
//       parameters: Map(1) { 'VALUE' => 'DURATION' }
//     },
// ...
```

## AST

**Kind Allows:**

-   Module
-   PropertyParameter
-   PropertyParameterName
-   PropertyParameterValue
-   AltRepParam
-   AltRepParamName
-   AltRepParamValue

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
// ...
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
// ...
```

> Look this full
> [sample](https://codesandbox.io/p/sandbox/loving-snyder-r647mw?file=%2Fapp%2Fcalendar.ics&selection=%5B%7B%22endColumn%22%3A30%2C%22endLineNumber%22%3A9%2C%22startColumn%22%3A30%2C%22startLineNumber%22%3A9%7D%5D)
