const glconstants = require("./glconstants.json");
const path = require("path");
const astParser = require("acorn").Parser;
const astWalk = require("acorn-walk");
const glslTokenizer = require("glsl-tokenizer");

exports.parseOptions = function (options) {
    if (options === undefined)
        options = null;

    const verbose = options !== null && options.verbose === true;

    const threeBundleSuffix = path.sep + path.join("node_modules", "three", "build", "three.module.js");
    const threeDirPart = path.sep + path.join("node_modules", "three") + path.sep;

    class SourceFile {
        constructor(/**@type {string}*/code, /**@type {string}*/file) {
            this.code = code;
            this.file = file;
            this.ast = astParser.parse(code, { sourceType: "module" });

            /**@type {{start:number,end:number,replacement:string}[]}*/
            this.replacements = [];
        }

        transform() {
            astWalk.ancestor(this.ast, {

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
                                this.replace(node, value);
                            } else {
                                console.warn(`three-minifier: Unhandled GL constant: ${name}`);
                            }
                        }
                    }
                },

                Literal: (node, ancestors) => {
                    if (
                        typeof node.value === "string" &&
                        this.speculateGLSL(node, ancestors)
                    ) {
                        this.replace(node, JSON.stringify(this.minifyGLSL(node.value)));
                    }
                },

                TemplateLiteral: (node, ancestors) => {
                    if (
                        node.expressions.length === 0 &&
                        node.quasis.length === 1 &&
                        this.speculateGLSL(node, ancestors)
                    ) {
                        const source = node.quasis[0].value.cooked;
                        this.replace(node, JSON.stringify(this.minifyGLSL(source)));
                    }
                },

                CallExpression: (node, ancestors) => {
                    if (
                        this.speculateGLSL(node, ancestors) &&
                        node.arguments.length === 1 &&
                        node.arguments[0].type === "Literal" &&
                        node.arguments[0].value === "\n" &&
                        node.callee.type === "MemberExpression" &&
                        node.callee.property.type === "Identifier" &&
                        node.callee.property.name === "join" &&
                        node.callee.object.type === "ArrayExpression"
                    ) {
                        const lines = [];
                        for (const entry of node.callee.object.elements) {
                            if (entry.type === "Literal" && typeof entry.value === "string") {
                                lines.push(entry.value);
                            } else {
                                if (verbose) {
                                    console.warn(`three-minifier: Broken array-style GLSL source due to element at character ${entry.start}`);
                                }
                                return;
                            }
                        }
                        if (verbose) {
                            console.info(`three-minifier: Array-style GLSL source: ${lines.length} lines`);
                        }
                        const source = lines.join("\n");
                        this.replace(node, JSON.stringify(this.minifyGLSL(source)));
                    }
                }
            });
        }

        replace(/**@type {acorn.Node}*/node, /**@type {string}*/replacement) {
            this.replacements.push({
                start: node.start,
                end: node.end,
                replacement: replacement
            });
        }

        speculateGLSL(/**@type {acorn.Node}*/node, /**@type {acorn.Node[]}*/ancestors) {
            const k = ancestors.length - 1; // assert ancestors[k] === node
            return /\/\*\s*glsl\s*\*\/\s*$/.test(this.code.substring(0, node.start)) || // /* glsl */ ...
                (k >= 1 &&
                    ancestors[k - 1].type === "Property" &&
                    ancestors[k - 1].key.type === "Identifier" && (
                        ancestors[k - 1].key.name === "vertexShader" || // vertexShader: ...
                        ancestors[k - 1].key.name === "fragmentShader")) || // fragmentShader: ...
                (k >= 1 &&
                    ancestors[k - 1].type === "NewExpression" &&
                    ancestors[k - 1].callee.type === "Identifier" &&
                    ancestors[k - 1].arguments[0] === node && (
                        ancestors[k - 1].callee.name === "FunctionNode" || // new FunctionNode(...)
                        ancestors[k - 1].callee.name === "ExpressionNode") // new ExpressionNode(...)
                );
        }

        minifyGLSL(/**@type {string}*/source) {
            const output = [];
            let prevType = null; // type of last non-whitespace token (not block-comment, line-comment or whitespace)
            let pendingWhitespace = false; // have we skipped any whitespace token since last non-whitespace token?
            for (const token of glslTokenizer(source)) {
                if (token.type === "eof") {
                    break;
                } else if (token.type === "block-comment" || token.type === "line-comment" || token.type === "whitespace") {
                    pendingWhitespace = true;
                } else {
                    if (token.type === "operator") {
                        output.push(token.data);
                    } else if (token.type === "preprocessor") {
                        if (!(
                            prevType == null ||
                            prevType == "preprocessor"
                        )) {
                            output.push("\n")
                        }
                        output.push(this.minifyGLSLPreprocessor(token.data));
                        output.push("\n")
                    } else {
                        if (pendingWhitespace && !(
                            prevType == null ||
                            prevType == "preprocessor" ||
                            prevType == "operator"
                        )) {
                            output.push(" ");
                        }
                        output.push(token.data);
                    }
                    pendingWhitespace = false;
                    prevType = token.type;
                }
            }
            const minifiedSource = output.join("").trim();

            if (verbose) {
                console.info(`three-minifier: GLSL source: len ${source.length} => ${minifiedSource.length}`);
            }
            return minifiedSource;
        }

        minifyGLSLPreprocessor(/**@type {string}*/source) {
            source = source
                .replace(/\/\/.*$/, "")
                .replace(/\/\*.*?\*\//g, "")
                .trim();

            const preprocessor = /^#\w+/.exec(source)[0];
            switch (preprocessor) {
                case "#define":
                case "#if":
                case "#elif":
                    return preprocessor + " " +
                        source.substring(preprocessor.length).trim()
                            .replace(/(?<=\W)\s+/g, "")
                            .replace(/\s+(?=\W)/g, "")
                            .replace(/\s+/g, " ");

                default:
                    return source;
            }
        }
    }

    return {
        isThreeSource(/**@type {string}*/file) {
            return file.includes(threeDirPart);
        },
        *transformCode(/**@type {string}*/code, /**@type {string}*/file) {
            if (this.isThreeSource(file)) {
                if (verbose) {
                    console.log(`three-minifier: Processing ${file}`);
                }
                const source = new SourceFile(code, file);
                source.transform();
                for (const replacement of source.replacements) {
                    yield replacement;
                }
            }
        },
        transformModule(/**@type {string}*/file) {
            if (file.endsWith(threeBundleSuffix)) {
                if (verbose) {
                    console.log(`three-minifier: Redirect module: ${file}`);
                }
                return path.resolve(file, "..", "..", "src", "Three.js");
            } else {
                return null;
            }
        },
        clearSideEffects(/**@type {string}*/file) {
            if (file.endsWith(threeBundleSuffix) || file.includes(threeDirPart)) {
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
