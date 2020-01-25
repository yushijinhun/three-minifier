import createNodeResolver from "@rollup/plugin-node-resolve";
import { parseOptions } from "../../common.js";

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
            const compiled = minifier.transformCode(code, id);
            if (compiled !== null) {
                return {
                    code: compiled,
                    map: { mappings: '' }
                };
            }
        }
    };
};
