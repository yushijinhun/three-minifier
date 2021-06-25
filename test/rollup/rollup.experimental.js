import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import { threeMinifier } from "@yushijinhun/three-minifier-rollup";

export default {
	input: "index.js",
	output: {
		file: "dist_experimental/index.js",
		format: "umd",
		sourcemap: true,
		compact: true
	},
	plugins: [
		threeMinifier(),
		nodeResolve(),
		terser()
	]
};
