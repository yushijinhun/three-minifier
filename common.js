import glconstants from "./glconstants.json";
import * as path from "path";

const threeBundleSuffix = path.sep + path.join("node_modules", "three", "build", "three.module.js");
const threeSrcDirPart = path.sep + path.join("node_modules", "three", "src") + path.sep;

function* transformGLConstants(code) {
    for (const match of code.matchAll(/_?gl\.(?<name>[A-Z0-9_]+)/)) {
        if (match.groups["name"] in glconstants) {
            yield {
                start: match.index,
                end: match.index + match[0].length,
                replacement: glconstants[match.groups["name"]].toString()
            };
        } else {
            console.warn(`* Unhandled GL Constant: ${match.groups["name"]}`);
        }
    }
}

function* transformGLSL(code) {
    for (const match of code.matchAll(/(?<comment>\/\* glsl \*\/)(?<outer>\`(?<inner>(?:.*|\n|\r\n)*)\`)/)) {
        yield {
            start: match.index + match.groups["comment"].length,
            end: match.index + match.groups["comment"].length + match.groups["outer"].length,
            replacement: JSON.stringify(
                match.groups["inner"]
                    .trim()
                    .replace(/\r/g, '')
                    .replace(/[ \t]*\/\/.*\n/g, '') // remove //
                    .replace(/[ \t]*\/\*[\s\S]*?\*\//g, '') // remove /* */
                    .replace(/\n{2,}/g, '\n') // # \n+ to \n
            )
        };
    }
}

export function parseOptions(options) {
    if (options === undefined)
        options = null;
    const sideEffects = options !== null && options.sideEffects === true;
    const noCompileGLConstants = options !== null && options.noCompileGLConstants === true;
    const noCompileGLSL = options !== null && options.noCompileGLSL === true;
    return {
        isThreeSource(file) {
            return file.includes(threeSrcDirPart);
        },
        *transformCode(code, file) {
            if (this.isThreeSource(file)) {
                if (/\.glsl.js$/.test(file)) {
                    if (!noCompileGLSL) {
                        yield* transformGLSL(code);
                    }
                }
                if (!noCompileGLConstants) {
                    yield* transformGLConstants(code);
                }
            }
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
