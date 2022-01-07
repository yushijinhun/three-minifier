const { minifyGLSL } = require("./glsl-minifier");
const { debug, warn } = require("./util");

const path = require("path");
const astParser = require("acorn").Parser;
const astWalk = require("acorn-walk");
const glconstants = require("./glconstants.json");

function minifyJavascript(/**@type {string}*/code, /**@type {string}*/file) {
	const ast = astParser.parse(code, { sourceType: "module", ecmaVersion: "latest" });

	/**@type {{start:number,end:number,replacement:string}[]}*/
	const replacements = [];
	function replace(/**@type {acorn.Node}*/node, /**@type {string}*/replacement) {
		if (node.start === node.end && replacement === "") {
			// replace empty string with empty string
			return;
		}
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
						debug(`GL constant: ${code.substring(node.start, node.end)} => ${value}`);
						replace(node, value);
					} else {
						warn(`Unhandled GL constant: ${name}`);
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

			// SubsurfaceScatteringShader patch
			if (
				file.endsWith(path.sep + path.join("node_modules", "three", "examples", "jsm", "shaders", "SubsurfaceScatteringShader.js")) &&
				node.value === "void main() {"
			) {
				replace(node, JSON.stringify("void main(){"));
				debug("Patched SubsurfaceScatteringShader");
			}
		},

		TemplateLiteral: (node, ancestors) => {
			if (speculateGLSL(node, ancestors)) {
				debug(`String template (${node.quasis.length} fragments)`);
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
						debug(`Broken array-style GLSL source due to element at character ${entry.start}`);
						return;
					}
				}
				debug(`Array-style GLSL source: ${lines.length} lines`);
				const source = lines.join("\n");
				replace(node, JSON.stringify(minifyGLSL(source)));
			}
		}
	});
	return replacements;
};

module.exports = {
	minifyJavascript
};
