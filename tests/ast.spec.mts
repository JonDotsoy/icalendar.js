import { equal } from "node:assert/strict";
import { test } from "node:test";
import { AST } from "../src/ast.mjs";
import { Lexer } from "../src/lexer.mjs";
import { writeFile, readFile, mkdir } from "fs/promises";
import { inspect } from "node:util";

const SNAP_WRITE = true;

test("Parse Simple Parameter", async () => {
    const payload = new TextEncoder().encode(`FOO:BIZ`);
    const tokens = Lexer.from(payload);
    const ast = AST.from(tokens);

    const snapUrl = new URL(
        "snaps/ast.spec.mts/Parse_Simple_Parameter.snap",
        import.meta.url
    );

    if (SNAP_WRITE)
        await writeFile(
            snapUrl,
            inspect(ast, { depth: Infinity, maxArrayLength: Infinity }),
            "utf-8"
        );
    equal(
        inspect(ast, { depth: Infinity, maxArrayLength: Infinity }),
        await readFile(snapUrl, "utf-8")
    );
});

test("Parse Simple Multi Parameter", async () => {
    const payload = new TextEncoder().encode(`` + `FOO:BIZ\n` + `BAZ:TAR\n`);
    const tokens = Lexer.from(payload);
    const ast = AST.from(tokens);

    const snapUrl = new URL(
        "snaps/ast.spec.mts/Parse_Simple_Multi_Parameter.snap",
        import.meta.url
    );

    if (SNAP_WRITE)
        await writeFile(
            snapUrl,
            inspect(ast, { depth: Infinity, maxArrayLength: Infinity }),
            "utf-8"
        );
    equal(
        inspect(ast, { depth: Infinity, maxArrayLength: Infinity }),
        await readFile(snapUrl, "utf-8")
    );
});

test("Parse Tokens", async () => {
    const payload = new TextEncoder().encode(
        "" +
            `DESCRIPTION;ALTREP="http://www.wiz.org":The Fall'98 Wild Wizards\n` +
            ` Conference - - Las Vegas, NV, USA\n`
    );
    const tokens = Lexer.from(payload);
    const ast = AST.from(tokens);

    const snapUrl = new URL(
        "snaps/ast.spec.mts/Parse_Tokens.snap",
        import.meta.url
    );

    if (SNAP_WRITE)
        await writeFile(
            snapUrl,
            inspect(ast, { depth: Infinity, maxArrayLength: Infinity }),
            "utf-8"
        );
    equal(
        inspect(ast, { depth: Infinity, maxArrayLength: Infinity }),
        await readFile(snapUrl, "utf-8")
    );
});

test("Parse (ICS FIle)", async () => {
    const location = new URL("sample.ics", import.meta.url);

    const payload = await readFile(location);
    const tokens = Lexer.from(payload);
    const ast = AST.from(tokens);

    const snapUrl = new URL(
        "snaps/ast.spec.mts/Parse_ICS_FIle.snap",
        import.meta.url
    );

    if (SNAP_WRITE)
        await writeFile(
            snapUrl,
            inspect(ast, { depth: Infinity, maxArrayLength: Infinity }),
            "utf-8"
        );
    equal(
        inspect(ast, { depth: Infinity, maxArrayLength: Infinity }),
        await readFile(snapUrl, "utf-8")
    );
});
