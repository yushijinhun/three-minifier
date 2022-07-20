const path = require("path");
module.exports = {
	entry: "./index.js",
	output: {
		path: path.resolve(__dirname, "dist_control"),
		filename: "index.js",
	},
	devtool: "source-map",
	mode: "production",
	performance: {
		hints: false
	},
	resolve: {
		alias: {
			"three-addons": "three/examples/jsm",
			"three-nodes": "three/examples/jsm/nodes"
		}
	}
};
