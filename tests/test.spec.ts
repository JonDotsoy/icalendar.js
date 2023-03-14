import { ICS_TOKENS } from "../ics_tokens.ts"

interface Event {
    start?: string,
}

interface ICalendar {
    prodId?: string
    version?: string
    calScale?: string
    method?: string
    name?: string
    description?: string
    timezone?: string
    events: Event[]
}

const dictEventProps = {
    "DTSTART": "start",
} satisfies Record<string, keyof Event>

const readEvent = (lines: Iterator<string>) => {
    const event: Event = {}

    while (true) {
        const next = lines.next()
        if (next.done) break
        if (next.value === "END:VEVENT") break
        for (const [propKey, eventProp] of Object.entries(dictEventProps)) {
            if (next.value.startsWith(`${propKey}:`)) event[eventProp] = next.value.slice(`${propKey}:`.length)
        }
    }

    return event
}

const dictCalendarProps = {
    "PRODID": "prodId",
    "VERSION": "version",
    "CALSCALE": "calScale",
    "METHOD": "method",
    "X-WR-CALNAME": "name",
    "X-WR-TIMEZONE": "timezone",
    "X-WR-CALDESC": "description",
} satisfies Record<string, keyof ICalendar>

const readCalendar = (lines: Iterator<string>) => {
    const calendar: ICalendar = {
        events: []
    }

    while (true) {
        const next = lines.next()
        if (next.done) break
        if (next.value === "BEGIN:VEVENT") calendar.events.push(readEvent(lines))
        for (const [propKey, calendarProp] of Object.entries(dictCalendarProps)) {
            if (next.value.startsWith(`${propKey}:`)) calendar[calendarProp] = next.value.slice(`${propKey}:`.length)
        }
    }

    return calendar
}

/**
 * @external https://www.w3.org/2002/12/cal/rfc2445#sec4.2
 */
class PropertyParameters {
    constructor(readonly property: string, readonly value: any, readonly meta: any | Record<string, string>) { }
    static fromLine(line: string) {
        const exp = /^([^\:]+):(.+)$/.exec(line)
        if (!exp) return null
        const matchMeta = /^([^;]+);(([^\=]+)=([^\;]+))*/.exec(exp.at(1)!)
        return new PropertyParameters(matchMeta?.at(1) ?? exp.at(1)!, exp.at(2)!, matchMeta)
    }
}


Deno.test("asd", () => {
    const payload = new TextEncoder().encode(
        `DESCRIPTION;ALTREP="http://www.wiz.org":The Fall'98 Wild Wizards\n` +
        ` Conference - - Las Vegas, NV, USA`
    )

    const tokens = ICS_TOKENS.from(payload)
})

Deno.test("load ics", async () => {
    const location = new URL("sample.ics", import.meta.url)

    const payload = await Deno.readFile(location)
    const tokens = ICS_TOKENS.from(payload)

    //     console.log(tokens)

    //     // if (lines.next().value !== "BEGIN:VCALENDAR") throw new Error("Invalid lines format")

    //     // const calendar = readCalendar(lines)

    //     // console.log(calendar)
})
