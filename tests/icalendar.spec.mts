import { equal } from "node:assert";
import { readFile, writeFile } from "node:fs/promises";
import { test } from "node:test";
import { AST } from "../src/ast.mjs";
import { ICalendar } from "../src/icalendar.mjs";
import { Lexer } from "../src/lexer.mjs";
import { createSnapDirectory } from "./snaps/snap.js";

const { snap, demo } = createSnapDirectory(import.meta.url);

test("Parse icalendar (ICS FIle)", async (t) => {
    const payload = await demo(t.name, ".ics").read();
    // const location = new URL("sample.ics", import.meta.url);
    // const payload = await readFile(location);
    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);
    const icalendar = ICalendar.from(ast);

    await snap(t.name).assertSnapOf(icalendar);
});

// test("Parse icalendar (ICS officeholidays FIle)", async () => {
//     const payload = await readFile(
//         new URL("officeholidays.ics", import.meta.url)
//     );
//     const tokens = Lexer.from(payload);
//     const ast = AST.from(tokens);
//     const icalendar = ICalendar.from(ast);

//     await snap("Parse_icalendar_ICS_officeholidays_FIle").assertSnapOf(
//         icalendar
//     );
//     await snap("Parse_icalendar_ICS_officeholidays_FIle", "json").assertSnapOf(
//         icalendar
//     );
// });

// test("Parse icalendar (ICS FIle)", async () => {
//     const payload = await readFile(
//         new URL(
//             "/Users/jondotsoy/Downloads/Principal_chonichico@gmail.com.ics",
//             import.meta.url
//         )
//     );
//     const tokens = Lexer.from(payload);
//     const ast = AST.from(tokens);
//     const icalendar = ICalendar.from(ast);

//     await snap("Parse_icalendar_ICS_ME_FIle").assertSnapOf(icalendar);
//     await snap("Parse_icalendar_ICS_ME_FIle", "json").assertSnapOf(icalendar);
// });

// test("API Create new ICalendar", async () => {
//     const iCalendar = ICalendar.from();

//     await snap("API_Create_new_ICalendar").assertSnapOf(iCalendar);
// });
