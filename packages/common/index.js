const { minifyJavascript } = require("./js-minifier");
const { debug } = require("./util");

const path = require("path");
const threeBundleSuffix = path.sep + path.join("node_modules", "three", "build", "three.module.js");
const threePathPart = path.sep + path.join("node_modules", "three") + path.sep;

function isThreeSource(/**@type {string}*/file) {
	return file.includes(threePathPart);
};

function* transformCode(/**@type {string}*/code, /**@type {string}*/file) {
	if (isThreeSource(file)) {
		debug(`Processing ${file}`);
		for (const replacement of minifyJavascript(code, file)) {
			yield replacement;
		}
	}
};

function transformModule(/**@type {string}*/file) {
	if (file.endsWith(threeBundleSuffix)) {
		debug(`Redirect module: ${file}`);
		return path.resolve(file, "..", "..", "src", "Three.js");
	} else {
		return null;
	}
};

function clearSideEffects(/**@type {string}*/file) {
	if (file.endsWith(threeBundleSuffix) || file.includes(threePathPart)) {
		debug(`Clear side-effects: ${file}`);
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
