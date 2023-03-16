import { Lexer } from "../src/lexer.mjs";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createSnapDirectory } from "./snaps/snap.js";

const snap = createSnapDirectory(import.meta.url);

test("tokenizer", async () => {
    const payload = new TextEncoder().encode(
        "" +
            `DESCRIPTION;ALTREP="http://www.wiz.org":The Fall'98 Wild Wizards\n` +
            ` Conference - - Las Vegas, NV, USA\n`
    );

    const tokens = Lexer.from(payload);

    await snap("tokenizer").assertSnapOf(tokens);
});

test("tokenizer (ICS FIle)", async () => {
    const location = new URL("sample.ics", import.meta.url);

    const payload = await readFile(location);

    const tokens = Lexer.from(payload);

    await snap("tokenizer_ICS_FIle").assertSnapOf(tokens);
});

test("tokenizer (ICS officeholidays FIle)", async () => {
    const location = new URL("officeholidays.ics", import.meta.url);

    const payload = await readFile(location);

    const tokens = Lexer.from(payload);

    await snap("tokenizer_ICS_officeholidays_FIle").assertSnapOf(tokens);
});
