import { z } from "zod";
import * as propertyTypes from "./property_types.mjs";

const ValuePropertyType = z.union([
    z
        .object({
            $Text: z.union([z.string(), z.array(z.string())]),
        })
        .transform((v) => new propertyTypes.Text(v.$Text)),
    z
        .object({
            $Date: z.object({
                fullYear: z.number(),
                month: z.number(),
                monthDay: z.number(),
                timeZone: z.optional(z.string()),
            }),
        })
        .transform((v) => new propertyTypes.Date(v.$Date)),
    z
        .object({
            $Binary: z.string(),
        })
        .transform((v) => new propertyTypes.Binary(v.$Binary)),
    z
        .object({
            $Boolean: z.boolean(),
        })
        .transform((v) => new propertyTypes.Boolean(v.$Boolean)),
    z
        .object({
            $CalendarUserAddress: z.string(),
        })
        .transform(
            (v) => new propertyTypes.CalendarUserAddress(v.$CalendarUserAddress)
        ),
    z
        .object({
            $URI: z.string(),
        })
        .transform((v) => new propertyTypes.URI(v.$URI)),
    z
        .object({
            $UTCOffset: z.string(),
        })
        .transform((v) => new propertyTypes.UTCOffset(v.$UTCOffset)),
    z
        .object({
            $DateTime: z.object({
                fullYear: z.number(),
                month: z.number(),
                monthDay: z.number(),
                hour: z.number(),
                minute: z.number(),
                seconds: z.number(),
                utc: z.boolean(),
                timeZone: z.optional(z.string()),
            }),
        })
        .transform((v) => new propertyTypes.DateTime(v.$DateTime)),

    z
        .object({
            $Time: z.object({
                hour: z.number(),
                minute: z.number(),
                seconds: z.number(),
                utc: z.boolean(),
                timeZone: z.optional(z.string()),
            }),
        })
        .transform((v) => new propertyTypes.Time(v.$Time)),
]);

export interface ICalendarJSONSchema {
    kind: string;
    properties: Record<
        string,
        {
            value: z.TypeOf<typeof ValuePropertyType>;
            parameters?: Record<string, string>;
        }
    >;
    components: ICalendarJSONSchema[];
}

export const VComponentJSONSchema = z.object({
    kind: z.string(),
    properties: z.record(
        z.union([
            ValuePropertyType.transform((t) => ({
                value: t,
                parameters: undefined,
            })),
            z.object({
                value: ValuePropertyType,
                parameters: z.optional(z.record(z.string(), z.string())),
            }),
        ])
    ),
    components: z.array(z.any()),
});
