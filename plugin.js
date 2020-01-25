import createNodeResolver from "@rollup/plugin-node-resolve";
import * as path from "path";
import * as glconstants from "./glconstants.json";

function transformGLConstants(code, id) {
    return code.replace(/_?gl\.([A-Z0-9_]+)/g, (match, p1) => {
        if (p1 in glconstants) {
            return glconstants[p1];
        } else {
            console.warn(`* Unhandled GL Constant: ${p1}`);
            return match;
        }
    });
};

function transformGLSL(code, id) {
    if (/\.glsl.js$/.test(id) === false)
        return code;
    return code.replace(/\/\* glsl \*\/\`((.*|\n|\r\n)*)\`/,
        (match, p1) => JSON.stringify(
            p1
                .trim()
                .replace(/\r/g, '')
                .replace(/[ \t]*\/\/.*\n/g, '') // remove //
                .replace(/[ \t]*\/\*[\s\S]*?\*\//g, '') // remove /* */
                .replace(/\n{2,}/g, '\n') // # \n+ to \n
        ));
};

export const threeMinifier = (options) => {

    const threeBundlePath = path.resolve("node_modules", "three", "build", "three.module.js");
    const threeEntrypoint = "three/src/Three.js";
    const threeSrcDir = path.resolve("node_modules", "three", "src") + path.sep;
    const nodeResolver = createNodeResolver();

    const sideEffects = options && options.sideEffects === true;
    const noCompileGLConstants = options && options.noCompileGLConstants === true;
    const noCompileGLSL = options && options.noCompileGLSL === true;

    return {
        id: "threeMinifier",
        resolveId: async (moduleName, file) => {
            const result = await nodeResolver.resolveId(moduleName, file);
            if (threeBundlePath === result.id) {
                const targetResult = await nodeResolver.resolveId(threeEntrypoint);
                if (!sideEffects) {
                    targetResult.moduleSideEffects = false;
                }
                return targetResult;
            }
        },
        transform(code, id) {
            if (id.startsWith(threeSrcDir)) {
                if (!noCompileGLConstants) {
                    code = transformGLConstants(code);
                }
                if (!noCompileGLSL) {
                    code = transformGLSL(code, id);
                }
                return {
                    code: code,
                    map: { mappings: '' }
                };
            }
        }
    };
};
