import { equal } from "node:assert";
import { readFile, writeFile } from "node:fs/promises";
import { test } from "node:test";
import { inspect } from "node:util";
import { AST } from "../src/ast.mjs";
import { ICalendar } from "../src/icalendar.mjs";
import { Lexer } from "../src/lexer.mjs";

const SNAP_WRITE = process.env.SNAP_WRITE === "true";

test("Parse icalendar (ICS FIle)", async () => {
    const location = new URL("sample.ics", import.meta.url);
    const payload = await readFile(location);
    const tokens = Lexer.from(payload);
    const ast = AST.from(tokens);
    const icalendar = ICalendar.from(ast);

    const snapUrl = new URL(
        "snaps/icalendar.spec.mts/Parse_icalendar.snap",
        import.meta.url
    );

    if (SNAP_WRITE)
        await writeFile(
            snapUrl,
            inspect(icalendar, { depth: Infinity, maxArrayLength: Infinity }),
            "utf-8"
        );
    equal(
        inspect(icalendar, { depth: Infinity, maxArrayLength: Infinity }),
        await readFile(snapUrl, "utf-8")
    );
});

test("Parse icalendar (ICS officeholidays FIle)", async () => {
    const payload = await readFile(
        new URL("officeholidays.ics", import.meta.url)
    );
    const tokens = Lexer.from(payload);
    const ast = AST.from(tokens);
    const icalendar = ICalendar.from(ast);

    const snapUrl = new URL(
        "snaps/icalendar.spec.mts/Parse_icalendar_ICS_officeholidays_FIle.snap",
        import.meta.url
    );
    const snapJsonUrl = new URL(
        "snaps/icalendar.spec.mts/Parse_icalendar_ICS_officeholidays_FIle.snap.json",
        import.meta.url
    );

    if (SNAP_WRITE) {
        await writeFile(
            snapUrl,
            inspect(icalendar, { depth: Infinity, maxArrayLength: Infinity }),
            "utf-8"
        );
        await writeFile(
            snapJsonUrl,
            JSON.stringify(icalendar, null, 2),
            "utf-8"
        );
    }
    equal(
        inspect(icalendar, { depth: Infinity, maxArrayLength: Infinity }),
        await readFile(snapUrl, "utf-8")
    );
});
