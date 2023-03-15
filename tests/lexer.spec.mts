import { Lexer } from "../src/lexer.mjs";
import { test } from "node:test";
import { readFile, writeFile } from "node:fs/promises";
import { equal } from "node:assert/strict";
import { inspect } from "node:util";

const SNAP_WRITE = process.env.SNAP_WRITE === "true";

test("tokenizer", async () => {
    const payload = new TextEncoder().encode(
        "" +
            `DESCRIPTION;ALTREP="http://www.wiz.org":The Fall'98 Wild Wizards\n` +
            ` Conference - - Las Vegas, NV, USA\n`
    );

    const tokens = Lexer.from(payload);

    const snapUrl = new URL(
        "snaps/lexer.spec.mts/tokenizer.snap",
        import.meta.url
    );
    if (SNAP_WRITE)
        await writeFile(snapUrl, inspect(tokens, { depth: Infinity }), "utf-8");
    equal(
        inspect(tokens, { depth: Infinity }),
        await readFile(snapUrl, "utf-8")
    );
});

test("tokenizer (ICS FIle)", async () => {
    const location = new URL("sample.ics", import.meta.url);

    const payload = await readFile(location);

    const tokens = Lexer.from(payload);

    const snapUrl = new URL(
        "snaps/lexer.spec.mts/tokenizer_ICS_FIle.snap",
        import.meta.url
    );
    if (SNAP_WRITE)
        await writeFile(snapUrl, inspect(tokens, { depth: Infinity }), "utf-8");
    equal(
        inspect(tokens, { depth: Infinity }),
        await readFile(snapUrl, "utf-8")
    );
});
