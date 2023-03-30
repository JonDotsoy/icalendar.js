import assert from "assert";
import { test } from "node:test";
import { AST } from "../src/ast.mjs";
import { ICalendar, PropertyValue, VComponent } from "../src/icalendar.mjs";
import { Lexer } from "../src/lexer.mjs";
import * as property_typesMjs from "../src/property_types.mjs";
import { createSnapDirectory } from "./snaps/snap.js";

const { snap, demo } = createSnapDirectory(import.meta.url);

test("Parse icalendar (ICS FIle)", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);
    const icalendar = ICalendar.from(ast);

    await snap(t.name).assertSnapOf(icalendar);
    await snap(t.name, undefined, ".ics", false).assertSnapOf(
        icalendar.toICS()
    );
});

test("Parse icalendar (ICS officeholidays FIle)", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);
    const icalendar = ICalendar.from(ast);

    await snap(t.name).assertSnapOf(icalendar);
    await snap(t.name, "json").assertSnapOf(icalendar);
});

test("Parse icalendar (ICS demo FIle)", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const tokens = Lexer.from(payload);
    const ast = AST.from(payload, tokens);
    const icalendar = ICalendar.from(ast);

    await snap(t.name).assertSnapOf(icalendar);
    await snap(t.name, "json").assertSnapOf(icalendar);
});

test("API Create new ICalendar", async (t) => {
    const iCalendar = ICalendar.create();

    iCalendar.properties.set(
        "FOO",
        new PropertyValue(
            new property_typesMjs.Date({
                fullYear: 2023,
                month: 3,
                monthDay: 19,
            })
        )
    );
    const event = new VComponent("EVENT");
    iCalendar.components.add(event);

    await snap(t.name).assertSnapOf(iCalendar);
    await snap(t.name, "json").assertSnapOf(iCalendar);
    await snap(t.name, "object", ".ics", false).assertSnapOf(iCalendar.toICS());
});

test("API Parse and stringify calendar", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const iCalendar = ICalendar.from(payload)!;

    await snap(t.name).assertSnapOf(iCalendar);
    await snap(t.name, "object", ".ics", false).assertSnapOf(iCalendar.toICS());
    await snap(t.name, "json").assertSnapOf(iCalendar);
});

test("parse payload icalendar without endline", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const iCalendar = ICalendar.from(payload)!;

    await snap(t.name).assertSnapOf(iCalendar);
});

test("parse property type time", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const iCalendar = ICalendar.from(payload)!;

    await snap(t.name).assertSnapOf(iCalendar);
});

test("parse property type Text", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const iCalendar = ICalendar.from(payload)!;

    await snap(t.name, undefined, undefined, false).assertSnapOf(
        iCalendar.components.values().next().value.properties.get("DESCRIPTION")
            .value.value
    );
    await snap(t.name, "json", undefined, false).assertSnapOf(
        iCalendar.components.values().next().value.properties.get("DESCRIPTION")
            .value.value
    );
    await snap(t.name, undefined, ".ics", false).assertSnapOf(
        iCalendar.toICS()
    );
});

test("parse property type Text 2", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const iCalendar = ICalendar.from(payload)!;

    assert.equal(new TextDecoder().decode(payload), iCalendar.toICS());
});

test("serialize ICalendar object", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const iCalendar = ICalendar.from(payload);

    await snap(t.name).assertSnapOf(iCalendar);
    await snap(t.name, undefined, ".ics", false).assertSnapOf(
        iCalendar.toICS({
            lineSize: 100,
        })
    );
});

test("Serialize to JSON", async (t) => {
    const payload = await demo(t.name, ".ics").read();

    const iCalendar = ICalendar.from(payload);

    await snap(t.name, undefined, undefined, false).assertSnapOf(
        JSON.stringify(iCalendar, null, 2)
    );
});

test("Deserialize to ICalendar ", async (t) => {
    const payload = JSON.parse(await demo(t.name, ".json").readUTF8());

    const iCalendar = ICalendar.fromJSON(payload);

    await snap(t.name).assertSnapOf(iCalendar);
});
