const { minifyJavascript } = require("./js-minifier");
const { debug } = require("./util");

const path = require("path");
const threeBundleSuffix = path.sep + path.join("node_modules", "three", "build", "three.module.js");
const threePathPart = path.sep + path.join("node_modules", "three") + path.sep;
const threeAdditionalModules = {
	"three-nodes/": "three/examples/jsm/nodes/",
	"three-addons/": "three/examples/jsm/"
};

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

function transformAdditionalModules(/**@type {string} */module) {
	for (const [prefix, replacement] of Object.entries(threeAdditionalModules)) {
		if (module.startsWith(prefix)) {
			debug(`Redirect additional module: ${module}`);
			return replacement + module.substring(prefix.length);
		}
	}
	return null;
}

module.exports = {
	isThreeSource,
	transformCode,
	transformModule,
	clearSideEffects,
	transformAdditionalModules
};
