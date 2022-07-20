import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import alias from "@rollup/plugin-alias";

export default {
	input: "index.js",
	output: {
		file: "dist_control/index.js",
		format: "umd",
		sourcemap: true,
		compact: true
	},
	plugins: [
		alias({
			entries: [
				{ find: "three-addons", replacement: "three/examples/jsm" },
				{ find: "three-nodes", replacement: "three/examples/jsm/nodes" }
			]
		}),
		nodeResolve(),
		terser()
	]
};
