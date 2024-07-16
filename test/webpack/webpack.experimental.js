import path from "node:path";
import { fileURLToPath } from "node:url";
import ThreeMinifierPlugin from "@yushijinhun/three-minifier-webpack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const threeMinifier = new ThreeMinifierPlugin();

export default {
	entry: "./index.js",
	plugins: [threeMinifier],
	output: {
		path: path.resolve(__dirname, "dist_experimental"),
		filename: "index.js",
	},
	resolve: {
		plugins: [threeMinifier.resolver],
	},
	devtool: "source-map",
	mode: "production",
	performance: {
		hints: false
	}
};
