export abstract class TYPE<T = any> {
    parse(value: any, properties: Map<string, string>): any {
        return value;
    }
    stringify(
        value: ReturnType<this["parse"]>,
        properties: Map<string, string>
    ): string {
        return value.toString();
    }
}

export type RType<T> = T extends typeof TYPE<infer R> ? R : any;

/** 4.3.1 */
export class Binary extends TYPE {}
/** 4.3.2 */
export class Boolean extends TYPE {
    parse(value: any, properties: Map<string, string>) {
        return value === "TRUE";
    }
}
/** 4.3.3 */
export class CalendarUserAddress extends TYPE {}
/** 4.3.4 */
export class Date extends TYPE {
    parse(value: any) {
        const match = /^(\d{4})(\d{2})(\d{2})$/.exec(value)!;
        return {
            fullYear: Number(match.at(1)!),
            month: Number(match.at(2)!),
            monthDay: Number(match.at(3)!),
        };
    }
    stringify(
        value: ReturnType<this["parse"]>,
        properties: Map<string, string>
    ): string {
        return `${value.fullYear.toString().padStart(4, "0")}${value.month
            .toString()
            .padStart(2, "0")}${value.monthDay.toString().padStart(2, "0")}`;
    }
}
/** 4.3.5 */
export class DateTime extends TYPE {
    parse(value: any) {
        const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(
            value
        )!;

        return {
            fullYear: Number(match.at(1)!),
            month: Number(match.at(2)!),
            monthDay: Number(match.at(3)!),
            hour: Number(match.at(4)!),
            minute: Number(match.at(5)!),
            seconds: Number(match.at(6)!),
            utc: match.at(7) === "Z",
        };
    }
}
/** 4.3.6 */
export class Duration extends TYPE {}
/** 4.3.7 */
export class Float extends TYPE {
    parse(value: any, properties: Map<string, string>) {
        return Number(value);
    }
}
/** 4.3.8 */
export class Integer extends TYPE {
    parse(value: any, properties: Map<string, string>) {
        return Number(value);
    }
}
/** 4.3.9 */
export class PeriodOfTime extends TYPE {}
/** 4.3.10 */
export class RecurrenceRule extends TYPE {}
/** 4.3.11 */
export class Text extends TYPE {}
/** 4.3.12 */
export class Time extends TYPE {}
/** 4.3.13 */
export class URI extends TYPE {}
/** 4.3.14 */
export class UTCOffset extends TYPE {}
