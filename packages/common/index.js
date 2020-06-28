const glslTokenizer = require("glsl-tokenizer");
const verbose = process.env["THREE_MINIFIER_DEBUG"] === "1";

function minifyGLSLPreprocessor(/**@type {string}*/source) {
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
};

function minifyGLSL(/**@type {string}*/source) {
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
                output.push(minifyGLSLPreprocessor(token.data));
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
        console.log(`three-minifier: GLSL source: len ${source.length} => ${minifiedSource.length}`);
    }
    return minifiedSource;
};

const astParser = require("acorn").Parser;
const astWalk = require("acorn-walk");
const glconstants = require("./glconstants.json");

function minifyThreeSource(/**@type {string}*/code) {
    const ast = astParser.parse(code, { sourceType: "module" });

    /**@type {{start:number,end:number,replacement:string}[]}*/
    const replacements = [];
    function replace(/**@type {acorn.Node}*/node, /**@type {string}*/replacement) {
        replacements.push({
            start: node.start,
            end: node.end,
            replacement: replacement
        });
    };

    function speculateGLSL(/**@type {acorn.Node}*/node, /**@type {acorn.Node[]}*/ancestors) {
        const k = ancestors.length - 1; // assert ancestors[k] === node
        return /\/\*\s*glsl\s*\*\/\s*$/.test(code.substring(0, node.start)) || // /* glsl */ ...
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
    };

    astWalk.ancestor(ast, {

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
                            console.log(`three-minifier: GL constant: ${code.substring(node.start, node.end)} => ${value}`);
                        }
                        replace(node, value);
                    } else {
                        console.warn(`three-minifier: Unhandled GL constant: ${name}`);
                    }
                }
            }
        },

        Literal: (node, ancestors) => {
            if (
                typeof node.value === "string" &&
                speculateGLSL(node, ancestors)
            ) {
                replace(node, JSON.stringify(minifyGLSL(node.value)));
            }
        },

        TemplateLiteral: (node, ancestors) => {
            if (speculateGLSL(node, ancestors)) {
                if (verbose) {
                    console.log(`three-minifier: String template (${node.quasis.length} fragments)`);
                }
                for (let idx = 0; idx < node.quasis.length; idx++) {
                    /**@type {string}*/
                    const sourceFragment = node.quasis[idx].value.cooked;
                    let minifiedFragment = minifyGLSL(sourceFragment);
                    if (idx > 0 && /^\s*\n/.test(sourceFragment)) {
                        minifiedFragment = "\n" + minifiedFragment;
                    }
                    if (!node.quasis[idx].tail && /\n\s*$/.test(sourceFragment) && minifiedFragment !== "\n") {
                        minifiedFragment += "\n";
                    }
                    replace(node.quasis[idx], minifiedFragment);
                }
            }
        },

        CallExpression: (node, ancestors) => {
            if (
                speculateGLSL(node, ancestors) &&
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
                            console.log(`three-minifier: Broken array-style GLSL source due to element at character ${entry.start}`);
                        }
                        return;
                    }
                }
                if (verbose) {
                    console.log(`three-minifier: Array-style GLSL source: ${lines.length} lines`);
                }
                const source = lines.join("\n");
                replace(node, JSON.stringify(minifyGLSL(source)));
            }
        }
    });
    return replacements;
};

const path = require("path");
const threeBundleSuffix = path.sep + path.join("node_modules", "three", "build", "three.module.js");
const threePathPart = path.sep + path.join("node_modules", "three") + path.sep;

function isThreeSource(/**@type {string}*/file) {
    return file.includes(threePathPart);
};

function* transformCode(/**@type {string}*/code, /**@type {string}*/file) {
    if (isThreeSource(file)) {
        if (verbose) {
            console.log(`three-minifier: Processing ${file}`);
        }
        for (const replacement of minifyThreeSource(code)) {
            yield replacement;
        }
    }
};

function transformModule(/**@type {string}*/file) {
    if (file.endsWith(threeBundleSuffix)) {
        if (verbose) {
            console.log(`three-minifier: Redirect module: ${file}`);
        }
        return path.resolve(file, "..", "..", "src", "Three.js");
    } else {
        return null;
    }
};

function clearSideEffects(/**@type {string}*/file) {
    if (file.endsWith(threeBundleSuffix) || file.includes(threePathPart)) {
        if (verbose) {
            console.log(`three-minifier: Clear side-effects: ${file}`);
        }
        return true;
    } else {
        return false;
    }
};

module.exports = {
    isThreeSource,
    transformCode,
    transformModule,
    clearSideEffects
};
