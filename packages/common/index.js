const glconstants = require("./glconstants.json");
const path = require("path");
const astParser = require("acorn").Parser;
const astWalk = require("acorn-walk");

exports.parseOptions = function (options) {
    if (options === undefined)
        options = null;

    const sideEffects = options !== null && options.sideEffects === true;
    const noCompileGLConstants = options !== null && options.noCompileGLConstants === true;
    const noCompileGLSL = options !== null && options.noCompileGLSL === true;
    const verbose = options !== null && options.verbose === true;

    const threeBundleSuffix = path.sep + path.join("node_modules", "three", "build", "three.module.js");
    const threeDirPart = path.sep + path.join("node_modules", "three") + path.sep;

    function transformGLConstants(code) {
        const replacements = [];
        const ast = astParser.parse(code, { sourceType: "module" });
        astWalk.simple(ast, {
            MemberExpression(node) {
                if (
                    node.object.type === "Identifier" &&
                    (node.object.name === "gl" || node.object.name === "_gl") &&
                    node.property.type === "Identifier"
                ) {
                    const name = node.property.name;
                    if (/^[A-Z0-9_]+$/.test(name)) {
                        if (name in glconstants) {
                            const value = glconstants[name].toString();
                            if (verbose) {
                                console.info(`three-minifier: Replace ${code.substring(node.start, node.end)} with ${value}`);
                            }
                            replacements.push({
                                start: node.start,
                                end: node.end,
                                replacement: value
                            });
                        } else {
                            console.warn(`three-minifier: Unhandled GL constant: ${name}`);
                        }
                    }
                }
            }
        });
        return replacements;
    }

    function* transformGLSL(code) {
        for (const match of code.matchAll(/(?<comment>\/\* glsl \*\/)(?<outer>\`(?<inner>(?:.*|\n|\r\n)*)\`)/g)) {
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
            return file.includes(threeDirPart);
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
                    for (const replacement of transformGLConstants(code)) {
                        yield replacement;
                    }
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
            if (sideEffects === false && (file.endsWith(threeBundleSuffix) || file.includes(threeDirPart))) {
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
