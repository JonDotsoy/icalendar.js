import path from "node:path"
import fs from "node:fs/promises"
import util from "node:util"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const SNAP_WRITE = process.env.SNAP_WRITE === "true";

const SNAPS_DIRECTORY = new URL("./", import.meta.url)

const utilInspect = (obj: any) => util.inspect(obj, { depth: Infinity, maxArrayLength: Infinity, maxStringLength: Infinity })

export const createSnapDirectory = (from: URL | string) => {
    const directoryLocation = new URL(`${path.basename(from instanceof URL ? from.pathname : from)}/`, SNAPS_DIRECTORY)

    if (!existsSync(directoryLocation)) mkdirSync(directoryLocation, { recursive: true })

    const snap = (nameArg: string, format: "json" | "object" = "object", ext: `.${string}` | `` = "", useInspect: boolean = true) => {
        const name = nameArg.replace(/\W/g, "_")

        if (format === "json") {
            ext = ".json"
            useInspect = false
        }

        const snapLocation = new URL(`${name}.snap${ext}`, directoryLocation)
        const inspect = useInspect ? utilInspect : (v: any) => v

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

    const demo = (nameArg: string, ext: `.${string}` = ".txt") => {
        const name = nameArg.replace(/\W/g, "_")

        const snapLocation = new URL(`${name}.demo${ext}`, directoryLocation)

        if (!existsSync(snapLocation)) writeFileSync(snapLocation, new Uint8Array([]))

        const readUTF8 = async (): Promise<string> => {
            return await fs.readFile(snapLocation, 'utf-8')
        }

        const read = async (): Promise<Uint8Array> => {
            return await fs.readFile(snapLocation)
        }

        return {
            read,
            readUTF8,
        }
    }

    return { snap, demo }
}




