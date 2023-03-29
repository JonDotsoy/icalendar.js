import { Temporal } from "@js-temporal/polyfill";
import test from "node:test";
import { ICalendar, PropertyValue, VComponent } from "../src/icalendar.mjs";
import * as propertyTypesMjs from "../src/property_types.mjs";
import { createSnapDirectory } from "./snaps/snap.js";

const { snap } = createSnapDirectory(import.meta.url);

test("property types to date", (t) => {
    const propertyType = new propertyTypesMjs.Date({
        fullYear: 2023,
        month: 3,
        monthDay: 12,
        timeZone: "America/Santiago",
    });

    snap(t.name).assertSnapOf([
        propertyType.toEpochMilliseconds(),
        new Date(propertyType.toEpochMilliseconds()),
        new Date(propertyType.toEpochMilliseconds()).toLocaleString(undefined, {
            timeStyle: "full",
            dateStyle: "full",
            timeZone: "America/Santiago",
        }),
    ]);
});

test("property types to date time", (t) => {
    const propertyType = new propertyTypesMjs.DateTime({
        fullYear: 2023,
        month: 3,
        monthDay: 12,
        hour: 8,
        minute: 12,
        seconds: 40,
        utc: false,
        timeZone: "America/Santiago",
    });

    snap(t.name).assertSnapOf([
        propertyType.toEpochMilliseconds(),
        new Date(propertyType.toEpochMilliseconds()),
        new Date(propertyType.toEpochMilliseconds()).toLocaleString(undefined, {
            timeStyle: "full",
            dateStyle: "full",
            timeZone: "America/Santiago",
        }),
    ]);
});

test("filter events", (t) => {
    const calendar = ICalendar.create();
    const event = new VComponent("VEVENT");

    calendar.components.add(event);

    event.properties.set(
        "SUMMARY",
        new PropertyValue(new propertyTypesMjs.Text(`text`))
    );
    event.properties.set(
        "DTSTART",
        new PropertyValue(
            new propertyTypesMjs.Date({
                fullYear: 2023,
                month: 3,
                monthDay: 12,
            })
        )
    );
    event.properties.set(
        "DTEND",
        new PropertyValue(
            new propertyTypesMjs.Date({
                fullYear: 2023,
                month: 3,
                monthDay: 13,
            })
        )
    );

    snap(t.name, undefined, undefined, true).assertSnapOf(
        Array.from(
            calendar.filterComponentsByRange(
                Temporal.ZonedDateTime.from({
                    timeZone: "UTC",
                    year: 2023,
                    month: 3,
                    day: 10,
                }).epochMilliseconds,
                Temporal.ZonedDateTime.from({
                    timeZone: "UTC",
                    year: 2023,
                    month: 3,
                    day: 15,
                }).epochMilliseconds
            )
        )
    );
});
