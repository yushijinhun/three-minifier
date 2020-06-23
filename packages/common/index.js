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

    class SourceFile {
        constructor(code, file) {
            this.code = code;
            this.file = file;
            this.ast = astParser.parse(code, { sourceType: "module" });
            this.replacements = [];
        }

        transformGLConstants() {
            astWalk.simple(this.ast, {
                MemberExpression: node => {
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
                                    console.info(`three-minifier: GL constant: ${this.code.substring(node.start, node.end)} => ${value}`);
                                }
                                this.replacements.push({
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
        }

        transformGLSL() {
            astWalk.simple(this.ast, {
                TemplateLiteral: node => {
                    if (
                        node.expressions.length === 0 &&
                        node.quasis.length === 1 &&
                        /\/\*\s*glsl\s*\*\/\s*$/.test(this.code.substring(0, node.start))
                    ) {
                        const source = node.quasis[0].value.cooked;
                        this.replacements.push({
                            start: node.start,
                            end: node.end,
                            replacement: JSON.stringify(this.minifyGLSL(source))
                        });
                    }
                }
            });
        }

        minifyGLSL(source) {
            const minifiedSource = source.trim()
                .replace(/\r/g, '')
                .replace(/[ \t]*\/\/.*\n/g, '') // remove //
                .replace(/[ \t]*\/\*[\s\S]*?\*\//g, '') // remove /* */
                .replace(/\n{2,}/g, '\n'); // # \n+ to \n
            if (verbose) {
                console.info(`three-minifier: GLSL source: len ${source.length} => ${minifiedSource.length}`);
            }
            return minifiedSource;
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
                const source = new SourceFile(code, file);
                if (!noCompileGLSL) {
                    source.transformGLSL();
                }
                if (!noCompileGLConstants) {
                    source.transformGLConstants();
                }
                for (const replacement of source.replacements) {
                    yield replacement;
                }
            }
        },
        transformModule(file) {
            if (file.endsWith(threeBundleSuffix)) {
                if (verbose) {
                    console.log(`three-minifier: Redirect module: ${file}`);
                }
                return path.resolve(file, "..", "..", "src", "Three.js");
            } else {
                return null;
            }
        },
        clearSideEffects(file) {
            if (sideEffects === false && (file.endsWith(threeBundleSuffix) || file.includes(threeDirPart))) {
                if (verbose) {
                    console.log(`three-minifier: Clear side-effects: ${file}`);
                }
                return true;
            } else {
                return false;
            }
        }
    };
}
