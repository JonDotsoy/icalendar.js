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
        return this.value.replace(/\n/g, "\\n");
    }

    static parse(value: string, _node: PropertyParameterNode) {
        return new Text(value);
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
): Date | DateTime => {
    if (DateTime.regExpDateFormat.test(value))
        return DateTime[dateParseSymbol](value, node);
    if (Date.regExpDateFormat.test(value))
        return Date[dateParseSymbol](value, node);
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
        const match = Date.regExpDateFormat.exec(value)!;

        return new Date({
            fullYear: Number(match.at(1)!),
            month: Number(match.at(2)!),
            monthDay: Number(match.at(3)!),
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
    ): Date | DateTime {
        const match = DateTime.regExpDateFormat.exec(value)!;

        return new DateTime({
            fullYear: Number(match.at(1)!),
            month: Number(match.at(2)!),
            monthDay: Number(match.at(3)!),
            hour: Number(match.at(4)!),
            minute: Number(match.at(5)!),
            seconds: Number(match.at(6)!),
            utc: match.at(7) === "Z",
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

export class Time extends Type<string> {
    toICS(): string {
        return this.value;
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
