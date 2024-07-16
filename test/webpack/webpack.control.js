import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
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
