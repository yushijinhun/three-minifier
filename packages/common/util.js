const verbose = process.env["THREE_MINIFIER_DEBUG"] === "1";

function debug(msg) {
	if (verbose)
		console.log("three-minifier: " + msg);
}

function warn(msg) {
	console.log("three-minifier: " + msg);
}

module.exports = {
	verbose,
	debug,
	warn
}
