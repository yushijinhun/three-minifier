import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

export default {
	input: "index.js",
	output: {
		file: "dist_control/index.js",
		format: "umd",
		sourcemap: true,
		compact: true
	},
	plugins: [
		nodeResolve(),
		terser()
	]
};
