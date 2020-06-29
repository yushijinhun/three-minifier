const glslTokenizer = require("glsl-tokenizer");
const { debug } = require("./util");

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
	debug(`GLSL source: len ${source.length} => ${minifiedSource.length}`);
	return minifiedSource;
};

module.exports = {
	minifyGLSL
};
