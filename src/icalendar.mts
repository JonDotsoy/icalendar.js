import {
    ModuleNode,
    PropertyParameterNode,
    VComponentNode,
} from "./ast_types.mjs";
import { Lexer } from "./lexer.mjs";
import { AST } from "./ast.mjs";
import * as propertyTypes from "./property_types.mjs";

const defaultTypeToPropertyName = {
    DTEND: propertyTypes.Date,
    DTSTAMP: propertyTypes.DateTime,
    DTSTART: propertyTypes.Date,
};

const isPropertyName = (
    propName: string
): propName is keyof typeof defaultTypeToPropertyName =>
    propName in defaultTypeToPropertyName;

const determinatePropertyType = (node: PropertyParameterNode) => {
    const propName = node.name.value;
    const altRepValue = node.altRepNodes.find(
        (altRep) => altRep.name.value === "VALUE"
    )?.value.value;

    const altRepTypeClass = propertyTypes.selectTypeClass(altRepValue);

    if (altRepTypeClass) return altRepTypeClass;

    if (isPropertyName(propName)) return defaultTypeToPropertyName[propName];

    return propertyTypes.Text;
};

const withParser = (
    value: any
): value is {
    parse: (value: string, node: PropertyParameterNode) => any;
} => typeof value === "function" && typeof value.parse === "function";

export class PropertyValue {
    constructor(
        readonly value: propertyTypes.Type<any>,
        readonly parameters = new Map<string, string>()
    ) {}

    *_toICS(): Iterable<string> {
        for (const [paramKey, value] of this.parameters.entries()) {
            yield `;${paramKey}=${value}`;
        }

        yield `:${this.value.toICS()}`;
    }

    toICS(): string {
        return Array.from(this._toICS()).join("");
    }

    toJSON() {
        if (this.parameters.size === 0) return this.value.toJSON();
        return {
            value: this.value,
            parameters: Object.fromEntries(this.parameters),
        };
    }

    static from(node: PropertyParameterNode) {
        const PropertyType = determinatePropertyType(node);

        return new PropertyValue(
            withParser(PropertyType)
                ? PropertyType.parse(node.value.value, node)
                : new PropertyType(node.value.value),
            new Map(
                node.altRepNodes.map((altRep) => [
                    altRep.name.value,
                    altRep.value.value,
                ])
            )
        );
    }
}

type LikeICalendarPayload = ModuleNode | Uint8Array;

/**
 * @external https://www.rfc-editor.org/rfc/rfc2445.txt
 */
export class VComponent {
    properties = new Map<string, PropertyValue>();
    components = new Set<VComponent>();

    constructor(readonly kind: string) {}

    *toICSLines(): Iterable<string> {
        yield `BEGIN:${this.kind}`;
        for (const [propKey, propValue] of this.properties.entries()) {
            yield `${propKey}${propValue.toICS()}`;
        }
        for (const vComponent of this.components.values()) {
            yield* vComponent.toICSLines();
        }
        yield `END:${this.kind}`;
    }

    toICS(): string {
        return `${Array.from(this.toICSLines()).join("\r\n")}\r\n`;
    }

    toString(): string {
        return this.toICS();
    }

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

    *filterComponentsByRange(
        epochMillisecondsFrom: number,
        epochMillisecondsTo: number
    ): any {
        for (const component of this.components) {
            const propertyTypeToEpochMilliseconds = (value: unknown) =>
                value instanceof propertyTypes.Date ||
                value instanceof propertyTypes.DateTime
                    ? value.toEpochMilliseconds()
                    : null;

            const dtStartEpochMilliseconds = propertyTypeToEpochMilliseconds(
                component.properties.get("DTSTART")?.value
            );
            const dtEndEpochMilliseconds = propertyTypeToEpochMilliseconds(
                component.properties.get("DTEND")?.value
            );

            if (
                dtStartEpochMilliseconds &&
                dtEndEpochMilliseconds &&
                epochMillisecondsFrom <= dtStartEpochMilliseconds &&
                dtEndEpochMilliseconds <= epochMillisecondsTo
            ) {
                yield component;
            }
        }
    }

    *toICSLines(): Iterable<string> {
        for (const line of super.toICSLines()) {
            yield line.substring(0, 61);
            let r = line.substring(61);
            while (r) {
                let a = r.substring(0, 60);
                if (!a) break;
                yield ` ${a}`;
                r = r.substring(60);
            }
        }
    }

    static parseVComponent(node: VComponentNode) {
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

    static from(payload: LikeICalendarPayload) {
        const toAST = () => {
            if (payload instanceof Uint8Array) {
                const tokens = Lexer.from(payload);
                return AST.from(payload, tokens);
            }
            return payload;
        };

        const iCalendar = ICalendar.fromMultiple(toAST()).at(0);

        if (!iCalendar) {
            throw new Error();
        }

        return iCalendar;
    }

    static create() {
        return new ICalendar(new VComponent("VCALENDAR"));
    }

    static fromMultiple(module: ModuleNode) {
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
