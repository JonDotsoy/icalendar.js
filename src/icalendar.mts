import { ModuleNode } from "./ast.mjs";

export class VEvent {
    properties = new Map<string, any>();
}

export class ICalendar {
    properties = new Map<string, any>();
    events = new Set<VEvent>();

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
                        const vEvent = new VEvent();

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
