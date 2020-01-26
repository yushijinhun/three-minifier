import json from "@rollup/plugin-json";

export default {
    input: "plugin.js",
    output: {
        file: "build/plugin.js",
        format: "commonjs"
    },
    plugins: [json()],
    external: [
        "@rollup/plugin-node-resolve",
        "path",
        "magic-string"
    ]
};
