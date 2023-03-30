import { Temporal } from "@js-temporal/polyfill";
import { PropertyParameterNode } from "./ast_types.mjs";

export abstract class Type<T, M = any> {
    constructor(readonly value: T, readonly meta?: M) {}

    abstract toICS(): string;

    toJSON() {
        return {
            [`$${this.constructor.name}`]: this.value,
        };
    }
}

export class Text extends Type<string> {
    toICS(): string {
        return this.value;
    }

    private static readonly escapeChars: Record<string, Uint8Array> = {
        "\\": new TextEncoder().encode("\\"),
        ",": new TextEncoder().encode(","),
        ".": new TextEncoder().encode("."),
        n: new TextEncoder().encode("\n"),
        N: new TextEncoder().encode("\n"),
        t: new TextEncoder().encode("\t"),
        r: new TextEncoder().encode("\r"),
        b: new TextEncoder().encode("\b"),
        ";": new TextEncoder().encode(";"),
    };

    static parse(value: string, _node: PropertyParameterNode) {
        const textBufferArray: Uint8Array = new TextEncoder().encode(value);
        const payload: number[] = [];

        for (let index = 0; index < textBufferArray.length; index += 1) {
            const char = textBufferArray[index];
            if (char === "\\".charCodeAt(0)) {
                const nextChar = textBufferArray[index + 1];
                if (String.fromCharCode(nextChar) in Text.escapeChars) {
                    payload.push(
                        ...Text.escapeChars[String.fromCharCode(nextChar)]
                    );
                    index += 1;
                    continue;
                }
            }
            payload.push(char);
        }

        return new Text(new TextDecoder().decode(new Uint8Array(payload)));
        // return new Text(value.replace(/(\\(n|t|r|b|f|v|'|"|;|,|\.))/g, (_, m) => {
        //     switch (m) {
        //         case "\\n": return "\n";
        //         case "\\t": return "\t";
        //         // case "\\r": return "\r";
        //         // case "\\b": return "\b";
        //         // case "\\f": return "\f";
        //         // case "\\v": return "\v";
        //         // case "\\'": return "\'";
        //         // case "\\\"": return "\"";
        //         // case "\\\;": return "\;";
        //         // case "\\\,": return "\,";
        //         // case "\\\.": return "\.";
        //     }
        //     return m
        // }));
    }
}

export class Binary extends Type<string> {
    toICS(): string {
        return this.value.toString();
    }

    toArrayBuffer() {
        return new Uint8Array(Buffer.from(this.value, "base64"));
    }

    static parse(value: string, node: PropertyParameterNode) {
        // const encoding = node.altRepNodes.find(altRep => altRep.name.value === "ENCODING")?.value.value ?? 'BASE64'

        return new Binary(value);
    }
}

export class Boolean extends Type<string> {
    // parse(value: any, properties: Map<string, string>) {
    //     return { $Boolean: value === "TRUE" };
    // }
    toICS(): string {
        return this.value;
    }
}

export class CalendarUserAddress extends Type<string> {
    toICS(): string {
        return this.value;
    }
}

const dateParse = (
    value: string,
    node: PropertyParameterNode
): Date | DateTime | Time => {
    if (DateTime.regExpDateFormat.test(value))
        return DateTime[dateParseSymbol](value, node);
    if (Date.regExpDateFormat.test(value))
        return Date[dateParseSymbol](value, node);
    if (Time.regExpDateFormat.test(value))
        return Time[dateParseSymbol](value, node);
    throw new Error(`Invalid date format ${value}`);
};

const dateParseSymbol = Symbol("dateParse");

export class Date extends Type<{
    fullYear: number;
    month: number;
    monthDay: number;
    timeZone?: string;
}> {
    static readonly regExpDateFormat = /^(\d{4})(\d{2})(\d{2})$/;

    static parse = dateParse;

    static [dateParseSymbol](value: string, node: PropertyParameterNode) {
        const timeZoneID = node.altRepNodes.find(
            (altRep) => altRep.name.value === "TZID"
        )?.value.value;
        const match = Date.regExpDateFormat.exec(value)!;

        return new Date({
            fullYear: Number(match.at(1)!),
            month: Number(match.at(2)!),
            monthDay: Number(match.at(3)!),
            timeZone: timeZoneID,
        });
    }

    toZonedDateTime() {
        return Temporal.ZonedDateTime.from({
            timeZone: this.value.timeZone ?? "UTC",
            year: this.value.fullYear,
            month: this.value.month,
            day: this.value.monthDay,
        });
    }

    /**
     * Return the epoch milliseconds value
     */
    toEpochMilliseconds(): number {
        return this.toZonedDateTime().epochMilliseconds;
    }

    toICS(): string {
        const fullYearStr = this.value.fullYear.toString().padStart(4, "0");
        const monthStr = this.value.month.toString().padStart(2, "0");
        const monthDay = this.value.monthDay.toString().padStart(2, "0");

        return `${fullYearStr}${monthStr}${monthDay}`;
    }
}

export class DateTime extends Type<{
    fullYear: number;
    month: number;
    monthDay: number;
    hour: number;
    minute: number;
    seconds: number;
    utc: boolean;
    timeZone?: string;
}> {
    toICS(): string {
        const fullYearStr = this.value.fullYear.toString().padStart(4, "0");
        const monthStr = this.value.month.toString().padStart(2, "0");
        const monthDayStr = this.value.monthDay.toString().padStart(2, "0");
        const hourStr = this.value.hour.toString().padStart(2, "0");
        const minuteStr = this.value.minute.toString().padStart(2, "0");
        const secondsStr = this.value.seconds.toString().padStart(2, "0");
        const utcStr = this.value.utc ? "Z" : "";

        return `${fullYearStr}${monthStr}${monthDayStr}T${hourStr}${minuteStr}${secondsStr}${utcStr}`;
    }

    static parse = dateParse;

    static readonly regExpDateFormat =
        /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/;

    static [dateParseSymbol](
        value: string,
        node: PropertyParameterNode
    ): DateTime {
        const timeZoneID = node.altRepNodes.find(
            (altRep) => altRep.name.value === "TZID"
        )?.value.value;
        const match = DateTime.regExpDateFormat.exec(value)!;

        return new DateTime({
            fullYear: Number(match.at(1)!),
            month: Number(match.at(2)!),
            monthDay: Number(match.at(3)!),
            hour: Number(match.at(4)!),
            minute: Number(match.at(5)!),
            seconds: Number(match.at(6)!),
            utc: match.at(7) === "Z",
            timeZone: timeZoneID,
        });
    }

    toZonedDateTime() {
        return Temporal.ZonedDateTime.from({
            timeZone: this.value.utc ? "UTC" : this.value.timeZone ?? "UTC",
            year: this.value.fullYear,
            month: this.value.month,
            day: this.value.monthDay,
            hour: this.value.hour,
            minute: this.value.minute,
            second: this.value.seconds,
        });
    }

    /**
     * Return the epoch milliseconds value
     */
    toEpochMilliseconds(): number {
        return this.toZonedDateTime().toInstant().epochMilliseconds;
    }
}

export class Duration extends Type<string> {
    toICS(): string {
        return this.value;
    }
}

export class Float extends Type<string> {
    toICS(): string {
        return this.value;
    }
    // parse(value: any, properties: Map<string, string>) {
    //     return { $Float: Number(value) };
    // }
}

export class Integer extends Type<string> {
    toICS(): string {
        return this.value;
    }
    // parse(value: any, properties: Map<string, string>) {
    //     return { $Integer: Number(value) };
    // }
}

export class PeriodOfTime extends Type<string> {
    toICS(): string {
        return this.value;
    }
}

export class RecurrenceRule extends Type<string> {
    toICS(): string {
        return this.value;
    }
}

// export class Text extends Type<string> { }

export class Time extends Type<{
    hour: number;
    minute: number;
    seconds: number;
    utc: boolean;
    timeZone?: string;
}> {
    toICS(): string {
        const hourStr = this.value.hour.toString().padStart(2, "0");
        const minuteStr = this.value.minute.toString().padStart(2, "0");
        const secondsStr = this.value.seconds.toString().padStart(2, "0");
        const utcStr = this.value.utc ? "Z" : "";

        return `${hourStr}${minuteStr}${secondsStr}${utcStr}`;
    }

    static parse = dateParse;

    static readonly regExpDateFormat = /^(\d{2})(\d{2})(\d{2})(Z)?$/;

    static [dateParseSymbol](value: string, node: PropertyParameterNode): Time {
        const timeZoneID = node.altRepNodes.find(
            (altRep) => altRep.name.value === "TZID"
        )?.value.value;
        const match = Time.regExpDateFormat.exec(value)!;

        return new Time({
            hour: Number(match.at(1)!),
            minute: Number(match.at(2)!),
            seconds: Number(match.at(3)!),
            utc: match.at(4) === "Z",
            timeZone: timeZoneID,
        });
    }
}

export class URI extends Type<string> {
    toICS(): string {
        return this.value;
    }
}

export class UTCOffset extends Type<string> {
    toICS(): string {
        return this.value;
    }
}

const aliasTypeClass = {
    TEXT: Text,
    BINARY: Binary,
    BOOLEAN: Boolean,
    CALENDARUSERADDRESS: CalendarUserAddress,
    DATE: Date,
    DATETIME: DateTime,
    DURATION: Duration,
    FLOAT: Float,
    INTEGER: Integer,
    PERIODOFTIME: PeriodOfTime,
    RECURRENCERULE: RecurrenceRule,
    TIME: Time,
    URI: URI,
    UTCOFFSET: UTCOffset,
};

const isTypeName = (typeName: any): typeName is keyof typeof aliasTypeClass =>
    typeof typeName === "string" && typeName in aliasTypeClass;

export const selectTypeClass = (typeName: any) => {
    if (isTypeName(typeName)) return aliasTypeClass[typeName];
    return null;
};
