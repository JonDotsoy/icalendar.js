import * as ast from "./ast.mjs";
import * as propertyTypes from "./property_types.mjs";

const typeNameToPropertyTypes = {
    BINARY: new propertyTypes.Binary(),
    BOOLEAN: new propertyTypes.Boolean(),
    "CAL-ADDRESS": new propertyTypes.CalendarUserAddress(),
    DATE: new propertyTypes.Date(),
    "DATE-TIME": new propertyTypes.DateTime(),
    DURATION: new propertyTypes.Duration(),
    FLOAT: new propertyTypes.Float(),
    INTEGER: new propertyTypes.Integer(),
    PERIOD: new propertyTypes.PeriodOfTime(),
    RECUR: new propertyTypes.RecurrenceRule(),
    TEXT: new propertyTypes.Text(),
    TIME: new propertyTypes.Time(),
    URI: new propertyTypes.URI(),
    "UTC-OFFSET": new propertyTypes.UTCOffset(),
} satisfies Record<string, propertyTypes.TYPE>;

const isTypeNameValid = (
    val: any
): val is keyof typeof typeNameToPropertyTypes =>
    typeof val === "string" && val in typeNameToPropertyTypes;

const typeNameByPropertyName = {
    ACTION: "TEXT",
    ATTENDEE: "TEXT",
    COMPLETED: "DATE-TIME",
    CONTACT: "TEXT",
    CREATED: "DATE-TIME",
    DTEND: "TEXT",
    DTSTAMP: "DATE-TIME",
    DTSTART: "TEXT",
    DUE: "TEXT",
    DURATION: "TEXT",
    EXDATE: "TEXT",
    EXRULE: "TEXT",
    FREEBUSY: "TEXT",
    GEO: "TEXT",
    "LAST-MODIFIED": "DATE-TIME",
    LOCATION: "TEXT",
    ORGANIZER: "TEXT",
    "PERCENT-COMPLETE": "INTEGER",
    PRIORITY: "INTEGER",
    RDATE: "TEXT",
    "RECURRENCE-ID": "TEXT",
    "RELATED-TO": "TEXT",
    REPEAT: "INTEGER",
    "REQUEST-STATUS": "TEXT",
    RESOURCES: "TEXT",
    RRULE: "TEXT",
    SEQUENCE: "INTEGER",
    STATUS: "TEXT",
    SUMMARY: "TEXT",
    TRANSP: "TEXT",
    TRIGGER: "TEXT",
    TZID: "TEXT",
    TZNAME: "TEXT",
    TZOFFSETFROM: "TEXT",
    TZOFFSETTO: "TEXT",
    TZURL: "TEXT",
    UID: "TEXT",
    URL: "TEXT",
    "X-MS-OLK-FORCEINSPECTOROPEN": "BOOLEAN",
    "X-MICROSOFT-CDO-IMPORTANCE": "INTEGER",
    "X-MICROSOFT-DISALLOW-COUNTER": "BOOLEAN",
    "X-MS-OLK-ALLOWEXTERNCHECK": "BOOLEAN",
    "X-MS-OLK-AUTOFILLLOCATION": "BOOLEAN",
    "X-MICROSOFT-CDO-ALLDAYEVENT": "BOOLEAN",
    "X-MICROSOFT-MSNCALENDAR-ALLDAYEVENT": "BOOLEAN",
    "X-MS-OLK-CONFTYPE": "INTEGER",
} satisfies Record<string, keyof typeof typeNameToPropertyTypes>;

const isTypeNameKeyValid = (
    val: any
): val is keyof typeof typeNameByPropertyName =>
    typeof val === "string" && val in typeNameByPropertyName;
const inferTypeName = (val: any) => {
    if (isTypeNameKeyValid(val)) return typeNameByPropertyName[val];
    return null;
};

export class PropertyValue {
    private constructor(
        readonly value: any,
        readonly parameters = new Map<string, string>()
    ) {}

    toJSON() {
        if (this.parameters.size === 0) return this.value;
        return {
            value: this.value,
            parameters: Object.fromEntries(this.parameters),
        };
    }

    static from(node: ast.PropertyParameterNode) {
        const parameters = new Map<string, string>();
        for (const altRep of node.altRepNodes) {
            parameters.set(altRep.name.value, altRep.value.value);
        }
        const parameterValue =
            parameters.get("VALUE") ?? inferTypeName(node.name.value);
        const propertyType = isTypeNameValid(parameterValue)
            ? typeNameToPropertyTypes[parameterValue]
            : typeNameToPropertyTypes.TEXT;
        return new PropertyValue(
            propertyType.parse(node.value.value, parameters),
            parameters
        );
    }
}

class PropertyAlias {
    private constructor(
        readonly name: string,
        readonly type: typeof propertyTypes.TYPE
    ) {}

    static for<T extends typeof propertyTypes.TYPE<any>>(
        name: string,
        type: T
    ): propertyTypes.RType<T> {
        return new PropertyAlias(name, type) as any;
    }
}

const customProperties = (entry: Record<string, any>) => {
    for (const [propKey, propValue] of Object.entries(entry)) {
        if (propValue instanceof PropertyAlias) {
            Object.defineProperty(entry, propKey, {
                enumerable: true,
                get() {},
                set(v: any) {
                    // return null
                },
            });
        }
    }
};

/**
 * @external https://www.rfc-editor.org/rfc/rfc2445.txt
 */
export class VComponent {
    properties = new Map<string, PropertyValue>();
    components = new Set<VComponent>();

    constructor(readonly kind: string) {}

    toJSON() {
        return {
            kind: this.kind,
            properties: Object.fromEntries(this.properties),
            components: Array.from(this.components),
        };
    }
}

/**
 * @external https://www.rfc-editor.org/rfc/rfc2445.txt
 */
export class ICalendar extends VComponent {
    private constructor(node: VComponent) {
        super("VCALENDAR");
        this.properties = node.properties;
        this.components = node.components;
    }

    static parseVComponent(node: ast.VComponentNode) {
        const vComponent = new VComponent(node.componentKind);

        for (const subNode of node.nodes) {
            if (subNode.kind === "PropertyParameter") {
                vComponent.properties.set(
                    subNode.name.value,
                    PropertyValue.from(subNode)
                );
            }
            if (subNode.kind === "VComponent") {
                vComponent.components.add(ICalendar.parseVComponent(subNode));
            }
        }

        return vComponent;
    }

    static from(module: ast.ModuleNode) {
        return ICalendar.fromMultiple(module).at(0) ?? null;
    }

    static fromMultiple(module: ast.ModuleNode) {
        const iCalendars: ICalendar[] = [];

        for (const node of module.nodes) {
            if (
                node.kind === "VComponent" &&
                node.componentKind === "VCALENDAR"
            ) {
                const vComponent = ICalendar.parseVComponent(node);
                iCalendars.push(new ICalendar(vComponent));
            }
        }

        return iCalendars;
    }
}
