import { ModuleNode } from "./ast.mjs";

/**
 * @external https://www.rfc-editor.org/rfc/rfc2445.txt
 */
export class VComponent {
    properties = new Map<string, any>();

    get attachment() {
        return this.properties.get("ATTACH") ?? null;
    }
    get categories() {
        return this.properties.get("CATEGORIES") ?? null;
    }
    get classification() {
        return this.properties.get("CLASS") ?? null;
    }
    get comment() {
        return this.properties.get("COMMENT") ?? null;
    }
    get description() {
        return this.properties.get("DESCRIPTION") ?? null;
    }
    get geographicPosition() {
        return this.properties.get("GEO") ?? null;
    }
    get location() {
        return this.properties.get("LOCATION") ?? null;
    }
    get percentComplete() {
        return this.properties.get("PERCENT-COMPLETE") ?? null;
    }
    get priority() {
        return this.properties.get("PRIORITY") ?? null;
    }
    get resources() {
        return this.properties.get("RESOURCES") ?? null;
    }
    get status() {
        return this.properties.get("STATUS") ?? null;
    }
    get summary() {
        return this.properties.get("SUMMARY") ?? null;
    }
    get dateTimeCompleted() {
        return this.properties.get("COMPLETED") ?? null;
    }
    get dateTimeEnd() {
        return this.properties.get("DTEND") ?? null;
    }
    get dateTimeDue() {
        return this.properties.get("DUE") ?? null;
    }
    get dateTimeStart() {
        return this.properties.get("DTSTART") ?? null;
    }
    get duration() {
        return this.properties.get("DURATION") ?? null;
    }
    get freeBusyTime() {
        return this.properties.get("FREEBUSY") ?? null;
    }
    get timeTransparency() {
        return this.properties.get("TRANSP") ?? null;
    }
    get timeZoneIdentifier() {
        return this.properties.get("TZID") ?? null;
    }
    get timeZoneName() {
        return this.properties.get("TZNAME") ?? null;
    }
    get timeZoneOffsetFrom() {
        return this.properties.get("TZOFFSETFROM") ?? null;
    }
    get timeZoneOffsetTo() {
        return this.properties.get("TZOFFSETTO") ?? null;
    }
    get timeZoneURL() {
        return this.properties.get("TZURL") ?? null;
    }
    get attendee() {
        return this.properties.get("ATTENDEE") ?? null;
    }
    get contact() {
        return this.properties.get("CONTACT") ?? null;
    }
    get organizer() {
        return this.properties.get("ORGANIZER") ?? null;
    }
    get recurrenceID() {
        return this.properties.get("RECURRENCE-ID") ?? null;
    }
    get relatedTo() {
        return this.properties.get("RELATED-TO") ?? null;
    }
    get uniformResourceLocator() {
        return this.properties.get("URL") ?? null;
    }
    get uniqueIdentifier() {
        return this.properties.get("UID") ?? null;
    }
    get exceptionDateTimes() {
        return this.properties.get("EXDATE") ?? null;
    }
    get exceptionRule() {
        return this.properties.get("EXRULE") ?? null;
    }
    get recurrenceDateTimes() {
        return this.properties.get("RDATE") ?? null;
    }
    get recurrenceRule() {
        return this.properties.get("RRULE") ?? null;
    }
    get action() {
        return this.properties.get("ACTION") ?? null;
    }
    get repeatCount() {
        return this.properties.get("REPEAT") ?? null;
    }
    get trigger() {
        return this.properties.get("TRIGGER") ?? null;
    }
    get dateTimeCreated() {
        return this.properties.get("CREATED") ?? null;
    }
    get dateTimeStamp() {
        return this.properties.get("DTSTAMP") ?? null;
    }
    get lastModified() {
        return this.properties.get("LAST-MODIFIED") ?? null;
    }
    get sequenceNumber() {
        return this.properties.get("SEQUENCE") ?? null;
    }
    get requestStatus() {
        return this.properties.get("REQUEST-STATUS") ?? null;
    }
}

/**
 * @external https://www.rfc-editor.org/rfc/rfc2445.txt
 */
export class ICalendar {
    properties = new Map<string, any>();
    events = new Set<VComponent>();

    get scale() {
        return this.properties.get("CALSCALE") ?? null;
    }
    get prodId() {
        return this.properties.get("PRODID") ?? null;
    }
    get method() {
        return this.properties.get("METHOD") ?? null;
    }
    get version() {
        return this.properties.get("VERSION") ?? null;
    }

    static from(module: ModuleNode) {
        const iCalendars: ICalendar[] = [];

        for (const node of module.nodes) {
            if (node.kind === "VCalendar") {
                const iCalendar = new ICalendar();

                for (const nodeVCalendar of node.nodes) {
                    if (nodeVCalendar.kind === "PropertyParameter") {
                        iCalendar.properties.set(
                            nodeVCalendar.name.value,
                            nodeVCalendar.value.value
                        );
                    }
                    if (nodeVCalendar.kind === "VEvent") {
                        const vEvent = new VComponent();

                        for (const noveVEvent of nodeVCalendar.nodes) {
                            if (noveVEvent.kind === "PropertyParameter") {
                                vEvent.properties.set(
                                    noveVEvent.name.value,
                                    noveVEvent.value.value
                                );
                            }
                        }

                        iCalendar.events.add(vEvent);
                    }
                }

                iCalendars.push(iCalendar);
            }
        }

        return iCalendars;
    }
}
