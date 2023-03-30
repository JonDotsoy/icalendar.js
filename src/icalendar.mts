import {
    ModuleNode,
    PropertyParameterNode,
    VComponentNode,
} from "./ast_types.mjs";
import { Lexer } from "./lexer.mjs";
import { AST } from "./ast.mjs";
import * as propertyTypes from "./property_types.mjs";
import { SerializeICSOptions } from "./SerializeICSOptions.mjs";
import { VComponentJSONSchema } from "./ICalendarJSONSchema.mjs";

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

    *_toICS(options?: SerializeICSOptions): Iterable<string> {
        for (const [paramKey, value] of this.parameters.entries()) {
            yield `;${paramKey}=${value}`;
        }

        yield `:${this.value.toICS()}`;
    }

    toICS(options?: SerializeICSOptions): string {
        return Array.from(this._toICS(options)).join("");
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

type LikeICalendarPayload = ModuleNode | ArrayBuffer | Uint8Array;

/**
 * @external https://www.rfc-editor.org/rfc/rfc2445.txt
 */
export class VComponent {
    properties = new Map<string, PropertyValue>();
    components = new Set<VComponent>();

    constructor(readonly kind: string) {}

    *toICSLines(options?: SerializeICSOptions): Iterable<string> {
        yield `BEGIN:${this.kind}`;
        for (const [propKey, propValue] of this.properties.entries()) {
            yield `${propKey}${propValue.toICS()}`;
        }
        for (const vComponent of this.components.values()) {
            yield* vComponent.toICSLines(options);
        }
        yield `END:${this.kind}`;
    }

    toICS(options?: SerializeICSOptions): string {
        return `${Array.from(this.toICSLines(options)).join("\r\n")}\r\n`;
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

    static fromJSON(value: unknown): VComponent {
        const componentJson = VComponentJSONSchema.parse(value);

        const endComponent = new VComponent(componentJson.kind);

        componentJson.components.forEach((component) => {
            endComponent.components.add(VComponent.fromJSON(component));
        });

        Object.entries(componentJson.properties).forEach(([key, value]) => {
            endComponent.properties.set(
                key,
                new PropertyValue(
                    value.value,
                    value.parameters
                        ? new Map(Object.entries(value.parameters))
                        : undefined
                )
            );
        });

        return endComponent;
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

    *toICSLines(options?: SerializeICSOptions): Iterable<string> {
        const lineSize = options?.lineSize ?? 61;
        for (const line of super.toICSLines(options)) {
            yield line.substring(0, lineSize);
            let r = line.substring(lineSize);
            while (r) {
                let a = r.substring(0, lineSize - 1);
                if (!a) break;
                yield ` ${a}`;
                r = r.substring(lineSize - 1);
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
            if (payload instanceof ArrayBuffer) {
                const bff = new Uint8Array(payload);
                const tokens = Lexer.from(bff);
                return AST.from(bff, tokens);
            }
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
