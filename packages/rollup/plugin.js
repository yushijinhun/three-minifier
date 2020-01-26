import createNodeResolver from "@rollup/plugin-node-resolve";
import { parseOptions } from "../../common.js";
import MagicString from "magic-string";

export const threeMinifier = (options) => {
    const nodeResolver = createNodeResolver();
    const minifier = parseOptions(options);

    return {
        id: "threeMinifier",

        resolveId: async (moduleName, file) => {
            const origin = await nodeResolver.resolveId(moduleName, file);
            const transformedId = minifier.transformModule(origin.id);
            if (transformedId === null) {
                if (minifier.clearSideEffects(origin.id)) {
                    origin.moduleSideEffects = false;
                    return origin;
                }
            } else {
                const transformed = await nodeResolver.resolveId(transformedId);
                if (minifier.clearSideEffects(transformed.id)) {
                    transformed.moduleSideEffects = false;
                }
                return transformed;
            }
        },

        transform(code, id) {
            if (id && minifier.isThreeSource(id)) {
                const s = new MagicString(code);
                for (const match of minifier.transformCode(code, id)) {
                    s.overwrite(match.start, match.end, match.replacement);
                }
                return {
                    code: s.toString(),
                    map: s.generateMap()
                };
            }
        }
    };
};
