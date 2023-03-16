import path from "node:path"
import fs from "node:fs/promises"
import util from "node:util"
import assert from "node:assert/strict"

const SNAP_WRITE = process.env.SNAP_WRITE === "true";

const SNAPS_DIRECTORY = new URL("./", import.meta.url)

const inspect = (obj: any) => util.inspect(obj, { depth: Infinity, maxArrayLength: Infinity, maxStringLength: Infinity })

export const createSnapDirectory = (from: URL | string) => {
    const directoryLocation = new URL(`${path.basename(from instanceof URL ? from.pathname : from)}/`, SNAPS_DIRECTORY)

    const snap = (name: string, format: "json" | "object" = "object") => {
        let ext: string = ""
        if (format === "json") {
            ext = ".json"
        }

        const snapLocation = new URL(`${name}.snap${ext}`, directoryLocation)

        const write = async (obj: any) => {
            await fs.mkdir(new URL("./", snapLocation), { recursive: true })
            await fs.writeFile(snapLocation, inspect(obj), 'utf-8')
        }

        const read = async (): Promise<string> => {
            return await fs.readFile(snapLocation, 'utf-8')
        }

        const assertSnapOf = async (obj: any) => {
            let snapPayload = obj
            if (format === "json") snapPayload = JSON.stringify(obj, null, 2)
            if (SNAP_WRITE) {
                await write(snapPayload)
            } else {
                assert.strictEqual(inspect(snapPayload), await read())
            }
        }

        return {
            write,
            read,
            assertSnapOf,
        }
    }

    return snap
}




