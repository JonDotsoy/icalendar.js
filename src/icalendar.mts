import { ModuleNode } from "./ast.mjs";

/**
 * @external https://www.rfc-editor.org/rfc/rfc2445.txt
 */
export class VComponent {
    properties = new Map<string, any>();

    /** 4.8.1.1 */ get attachment() {
        return this.properties.get("ATTACH") ?? null;
    }
    /** 4.8.1.2 */ get categories() {
        return this.properties.get("CATEGORIES") ?? null;
    }
    /** 4.8.1.3 */ get classification() {
        return this.properties.get("CLASS") ?? null;
    }
    /** 4.8.1.4 */ get comment() {
        return this.properties.get("COMMENT") ?? null;
    }
    /** 4.8.1.5 */ get description() {
        return this.properties.get("DESCRIPTION") ?? null;
    }
    /** 4.8.1.6 */ get geographicPosition() {
        return this.properties.get("GEO") ?? null;
    }
    /** 4.8.1.7 */ get location() {
        return this.properties.get("LOCATION") ?? null;
    }
    /** 4.8.1.8 */ get percentComplete() {
        return this.properties.get("PERCENT-COMPLETE") ?? null;
    }
    /** 4.8.1.9 */ get priority() {
        return this.properties.get("PRIORITY") ?? null;
    }
    /** 4.8.1.10 */ get resources() {
        return this.properties.get("RESOURCES") ?? null;
    }
    /** 4.8.1.11 */ get status() {
        return this.properties.get("STATUS") ?? null;
    }
    /** 4.8.1.12 */ get summary() {
        return this.properties.get("SUMMARY") ?? null;
    }
    /** 4.8.2.1 */ get dateTimeCompleted() {
        return this.properties.get("COMPLETED") ?? null;
    }
    /** 4.8.2.2 */ get dateTimeEnd() {
        return this.properties.get("DTEND") ?? null;
    }
    /** 4.8.2.3 */ get dateTimeDue() {
        return this.properties.get("DUE") ?? null;
    }
    /** 4.8.2.4 */ get dateTimeStart() {
        return this.properties.get("DTSTART") ?? null;
    }
    /** 4.8.2.5 */ get duration() {
        return this.properties.get("DURATION") ?? null;
    }
    /** 4.8.2.6 */ get freeBusyTime() {
        return this.properties.get("FREEBUSY") ?? null;
    }
    /** 4.8.2.7 */ get timeTransparency() {
        return this.properties.get("TRANSP") ?? null;
    }
    /** 4.8.3.1 */ get timeZoneIdentifier() {
        return this.properties.get("TZID") ?? null;
    }
    /** 4.8.3.2 */ get timeZoneName() {
        return this.properties.get("TZNAME") ?? null;
    }
    /** 4.8.3.3 */ get timeZoneOffsetFrom() {
        return this.properties.get("TZOFFSETFROM") ?? null;
    }
    /** 4.8.3.4 */ get timeZoneOffsetTo() {
        return this.properties.get("TZOFFSETTO") ?? null;
    }
    /** 4.8.3.5 */ get timeZoneURL() {
        return this.properties.get("TZURL") ?? null;
    }
    /** 4.8.4.1 */ get attendee() {
        return this.properties.get("ATTENDEE") ?? null;
    }
    /** 4.8.4.2 */ get contact() {
        return this.properties.get("CONTACT") ?? null;
    }
    /** 4.8.4.3 */ get organizer() {
        return this.properties.get("ORGANIZER") ?? null;
    }
    /** 4.8.4.4 */ get recurrenceID() {
        return this.properties.get("RECURRENCE-ID") ?? null;
    }
    /** 4.8.4.5 */ get relatedTo() {
        return this.properties.get("RELATED-TO") ?? null;
    }
    /** 4.8.4.6 */ get uniformResourceLocator() {
        return this.properties.get("URL") ?? null;
    }
    /** 4.8.4.7 */ get uniqueIdentifier() {
        return this.properties.get("UID") ?? null;
    }
    /** 4.8.5.1 */ get exceptionDateTimes() {
        return this.properties.get("EXDATE") ?? null;
    }
    /** 4.8.5.2 */ get exceptionRule() {
        return this.properties.get("EXRULE") ?? null;
    }
    /** 4.8.5.3 */ get recurrenceDateTimes() {
        return this.properties.get("RDATE") ?? null;
    }
    /** 4.8.5.4 */ get recurrenceRule() {
        return this.properties.get("RRULE") ?? null;
    }
    /** 4.8.6.1 */ get action() {
        return this.properties.get("ACTION") ?? null;
    }
    /** 4.8.6.2 */ get repeatCount() {
        return this.properties.get("REPEAT") ?? null;
    }
    /** 4.8.6.3 */ get trigger() {
        return this.properties.get("TRIGGER") ?? null;
    }
    /** 4.8.7.1 */ get dateTimeCreated() {
        return this.properties.get("CREATED") ?? null;
    }
    /** 4.8.7.2 */ get dateTimeStamp() {
        return this.properties.get("DTSTAMP") ?? null;
    }
    /** 4.8.7.3 */ get lastModified() {
        return this.properties.get("LAST-MODIFIED") ?? null;
    }
    /** 4.8.7.4 */ get sequenceNumber() {
        return this.properties.get("SEQUENCE") ?? null;
    }
    /** 4.8.8.2 */ get requestStatus() {
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
