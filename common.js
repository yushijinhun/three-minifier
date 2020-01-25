import glconstants from "./glconstants.json";
import * as path from "path";

const threeBundleSuffix = path.sep + path.join("node_modules", "three", "build", "three.module.js");
const threeSrcDirPart = path.sep + path.join("node_modules", "three", "src") + path.sep;

function transformGLConstants(code, file) {
    return code.replace(/_?gl\.([A-Z0-9_]+)/g, (match, p1) => {
        if (p1 in glconstants) {
            return glconstants[p1];
        } else {
            console.warn(`* Unhandled GL Constant: ${p1}`);
            return match;
        }
    });
};

function transformGLSL(code, file) {
    if (/\.glsl.js$/.test(file) === false)
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

export function parseOptions(options) {
    if (options === undefined)
        options = null;
    const sideEffects = options !== null && options.sideEffects === true;
    const noCompileGLConstants = options !== null && options.noCompileGLConstants === true;
    const noCompileGLSL = options !== null && options.noCompileGLSL === true;
    return {
        transformCode(code, file) {
            if (file.includes(threeSrcDirPart)) {
                let compiled = code;
                if (!noCompileGLConstants) {
                    compiled = transformGLConstants(compiled);
                }
                if (!noCompileGLSL) {
                    compiled = transformGLSL(compiled, file);
                }
                if (compiled !== code) {
                    return compiled;
                }
            }
            return null;
        },
        transformModule(file) {
            if (file.endsWith(threeBundleSuffix)) {
                return path.resolve(file, "..", "..", "src", "Three.js");
            } else {
                return null;
            }
        },
        clearSideEffects(file) {
            return sideEffects === false && (file.endsWith(threeBundleSuffix) || file.includes(threeSrcDirPart));
        }
    };
}
