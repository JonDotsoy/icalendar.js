import { test } from "node:test";
import { AST } from "../src/ast.mjs";
import { Lexer } from "../src/lexer.mjs";
import { createSnapDirectory } from "./snaps/snap.js";

const { snap, demo } = createSnapDirectory(import.meta.url);

test("Parse VCALENDAR empty", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);

    await snap(t.name.replace(/\W/g, "_")).assertSnapOf(ast);
});

test("Parse VCALENDAR with simple parameters", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);

    await snap(t.name.replace(/\W/g, "_")).assertSnapOf(ast);
});

test("Parse VCALENDAR with child component", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);

    await snap(t.name).assertSnapOf(ast);
});

test("Parse VCALENDAR with child component and AltRep", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);

    await snap(t.name).assertSnapOf(ast);
});

test("Parse VCALENDAR with long lines", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);

    await snap(t.name).assertSnapOf(ast);
});

test("Parse VCALENDAR with long lines 2", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);

    await snap(t.name).assertSnapOf(ast);
});

test("Parse VCALENDAR infer DATE type", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);

    await snap(t.name).assertSnapOf(ast);
});

test("Parse VCALENDAR from icalendar.org", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);

    await snap(t.name).assertSnapOf(ast);
});

test("parse with empty values", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);

    await snap(t.name).assertSnapOf(ast);
});

test("Complex AltRep values", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);

    await snap(t.name).assertSnapOf(ast);
});

test("AltRep string values", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);

    await snap(t.name).assertSnapOf(ast);
});
