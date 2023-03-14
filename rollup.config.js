import swcModule from "rollup-plugin-swc";
import dts from "rollup-plugin-dts";

/** @type {import("rollup-plugin-swc")["default"]} */
const swc = swcModule.default;

const input = {
    lexer: "src/lexer.mts"
}

/**
 * @type {import('rollup').RollupOptions}
 */
const config = [
    {
        input,
        plugins: dts(),
        output: {
            entryFileNames: "[name].d.ts",
            dir: "dist",
            format: "esm",
        }
    },
    {
        input,
        plugins: swc({
            jsc: {
                parser: {
                    syntax: "typescript",
                },
            },
        }),
        output: [
            {
                entryFileNames: "[name].cjs",
                dir: "dist",
                format: "commonjs",
            },
            {
                entryFileNames: "[name].mjs",
                dir: "dist",
                format: "esm",
            },
        ],
    }
];

export default config;
