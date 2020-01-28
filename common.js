import glconstants from "./glconstants.json";
import * as path from "path";

export function parseOptions(options) {
    if (options === undefined)
        options = null;

    const sideEffects = options !== null && options.sideEffects === true;
    const noCompileGLConstants = options !== null && options.noCompileGLConstants === true;
    const noCompileGLSL = options !== null && options.noCompileGLSL === true;
    const verbose = options !== null && options.verbose === true;

    const threeBundleSuffix = path.sep + path.join("node_modules", "three", "build", "three.module.js");
    const threeSrcDirPart = path.sep + path.join("node_modules", "three", "src") + path.sep;

    function* transformGLConstants(code) {
        for (const match of code.matchAll(/_?gl\.(?<name>[A-Z0-9_]+)/)) {
            if (match.groups["name"] in glconstants) {
                const value = glconstants[match.groups["name"]].toString();
                if (verbose) {
                    console.info(`three-minifier: Replace ${match[0]} with ${value}`);
                }
                yield {
                    start: match.index,
                    end: match.index + match[0].length,
                    replacement: value
                };
            } else {
                console.warn(`three-minifier: Unhandled GL constant: ${match.groups["name"]}`);
            }
        }
    }

    function* transformGLSL(code) {
        for (const match of code.matchAll(/(?<comment>\/\* glsl \*\/)(?<outer>\`(?<inner>(?:.*|\n|\r\n)*)\`)/)) {
            const startIndex = match.index + match.groups["comment"].length;
            const endIndex = startIndex + match.groups["outer"].length;
            const text = match.groups["inner"];
            const minifiedText = text.trim()
                .replace(/\r/g, '')
                .replace(/[ \t]*\/\/.*\n/g, '') // remove //
                .replace(/[ \t]*\/\*[\s\S]*?\*\//g, '') // remove /* */
                .replace(/\n{2,}/g, '\n'); // # \n+ to \n

            if (verbose) {
                console.info(`three-minifier: string length ${text.length} => ${minifiedText.length}`);
            }
            yield {
                start: startIndex,
                end: endIndex,
                replacement: JSON.stringify(minifiedText)
            };
        }
    }

    return {
        isThreeSource(file) {
            return file.includes(threeSrcDirPart);
        },
        *transformCode(code, file) {
            if (this.isThreeSource(file)) {
                if (verbose) {
                    console.log(`three-minifier: Processing ${file}`);
                }
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
                if (verbose) {
                    console.log(`three-minifier: Redirect module ${file}`);
                }
                return path.resolve(file, "..", "..", "src", "Three.js");
            } else {
                return null;
            }
        },
        clearSideEffects(file) {
            if (sideEffects === false && (file.endsWith(threeBundleSuffix) || file.includes(threeSrcDirPart))) {
                if (verbose) {
                    console.log(`three-minifier: Clear side-effects of ${file}`);
                }
                return true;
            } else {
                return false;
            }
        }
    };
}
