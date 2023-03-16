import { test } from "node:test";
import { AST } from "../src/ast.mjs";
import { Lexer } from "../src/lexer.mjs";
import { readFile } from "fs/promises";
import { createSnapDirectory } from "./snaps/snap.js";

const snap = createSnapDirectory(import.meta.url);

test("Parse Simple Parameter", async () => {
    const payload = new TextEncoder().encode(`FOO:BIZ`);
    const tokens = Lexer.from(payload);
    const ast = AST.from(tokens);

    await snap("Parse_Simple_Parameter").assertSnapOf(ast);
});

test("Parse Simple Multi Parameter", async () => {
    const payload = new TextEncoder().encode(`` + `FOO:BIZ\n` + `BAZ:TAR\n`);
    const tokens = Lexer.from(payload);
    const ast = AST.from(tokens);

    await snap("Parse_Simple_Multi_Parameter").assertSnapOf(ast);
});

test("Parse Tokens", async () => {
    const payload = new TextEncoder().encode(
        "" +
            `DESCRIPTION;ALTREP="http://www.wiz.org":The Fall'98 Wild Wizards\n` +
            ` Conference - - Las Vegas, NV, USA\n`
    );
    const tokens = Lexer.from(payload);
    const ast = AST.from(tokens);

    await snap("Parse_Tokens").assertSnapOf(ast);
});

test("Parse (ICS FIle)", async () => {
    const location = new URL("sample.ics", import.meta.url);

    const payload = await readFile(location);
    const tokens = Lexer.from(payload);
    const ast = AST.from(tokens);

    await snap("Parse_ICS_FIle").assertSnapOf(ast);
});

test("Parse (ICS officeholidays FIle)", async () => {
    const location = new URL("officeholidays.ics", import.meta.url);

    const payload = await readFile(location);
    const tokens = Lexer.from(payload);
    const ast = AST.from(tokens);

    await snap("Parse_ICS_officeholidays_FIle").assertSnapOf(ast);
});
