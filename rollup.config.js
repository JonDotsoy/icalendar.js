import swcModule from "rollup-plugin-swc";

/** @type {import("rollup-plugin-swc")["default"]} */
const swc = swcModule.default;

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
    input: { lexer: "src/lexer.mts" },
    plugins: [
        swc({
            jsc: {
                parser: {
                    syntax: "typescript",
                },
            },
        }),
    ],
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
};

export default config;
