import json from "@rollup/plugin-json";

export default {
    input: "plugin.js",
    output: {
        file: "plugin.cjs",
        format: "commonjs"
    },
    plugins: [json()],
    external: [
        "@rollup/plugin-node-resolve",
        "path"
    ]
};
