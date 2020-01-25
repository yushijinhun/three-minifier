import createNodeResolver from "@rollup/plugin-node-resolve";
import * as path from "path";

export const threeMinifier = (options) => {

    const threeBundlePath = path.resolve("node_modules", "three", "build", "three.module.js");
    const threeEntrypoint = "three/src/Three.js";
    const nodeResolver = createNodeResolver();
    const noSideEffects = options && options.noSideEffects === true;

    return {
        id: "threeMinifier",
        resolveId: async (moduleName, file) => {
            const result = await nodeResolver.resolveId(moduleName, file);
            if (threeBundlePath === result.id) {
                const targetResult = await nodeResolver.resolveId(threeEntrypoint);
                if (noSideEffects) {
                    targetResult.moduleSideEffects = false;
                }
                return targetResult;
            } else {
                return undefined;
            }
        }
    };
};
