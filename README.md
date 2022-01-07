# three-minifier
[![GitHub tag (latest SemVer pre-release)](https://img.shields.io/github/v/tag/yushijinhun/three-minifier?color=yellow&include_prereleases&label=version&sort=semver&style=flat-square)](https://github.com/yushijinhun/three-minifier/releases)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/yushijinhun/three-minifier/CI?logo=github&style=flat-square)](https://github.com/yushijinhun/three-minifier/actions?query=workflow%3ACI)

Minify THREE.js

## Introduction
This plugin helps projects who use THREE.js shrink their size by:
 * Resolve `three` / `three/build/three.module.js` to `three/src/Three.js`.
    * This makes it possible for bundlers to perform better tree-shaking.
 * Mark `three` as side-effect free.
 * Replace WebGL constants with literals.
 * Minify GLSL files.

## Requirements
 * node **>= v12.0**
 * three.js **>= r120**
 * Webpack plugin requires Webpack 5

## Usage

### Rollup
```
npm install --save-dev @yushijinhun/three-minifier-rollup
```

`rollup.config.js`:
```javascript
import { threeMinifier } from "@yushijinhun/three-minifier-rollup";
...
export default {
	...
	plugins: [
		threeMinifier(), // <=== Add plugin on the FIRST line
		...
	]
};
```

### Webpack
```
npm install --save-dev @yushijinhun/three-minifier-webpack
```

`webpack.config.js`:
```javascript
const ThreeMinifierPlugin = require("@yushijinhun/three-minifier-webpack");
const threeMinifier = new ThreeMinifierPlugin();
...
module.exports = {
	...
	plugins: [
		threeMinifier, // <=== (1) Add plugin on the FIRST line
		...
	],
	resolve: {
		plugins: [
			threeMinifier.resolver, // <=== (2) Add resolver on the FIRST line
			...
		]
	}
};
```

### Next.js
```
npm install --save-dev @yushijinhun/three-minifier-webpack
```

`next.config.js`:
```js
const ThreeMinifierPlugin = require("@yushijinhun/three-minifier-webpack");

module.exports = {
	webpack: (config, { isServer, dev }) => {
		if (!isServer && !dev) {
			config.cache = false;
			const threeMinifier = new ThreeMinifierPlugin();
			config.plugins.unshift(threeMinifier);
			config.resolve.plugins.unshift(threeMinifier.resolver);
		}
		return config;
	},
};
```

### Vite
Most Rollup plugins [are compatible with Vite](https://vitejs.dev/guide/api-plugin.html#rollup-plugin-compatibility), including three-minifier.

```
npm install --save-dev @yushijinhun/three-minifier-rollup
```

`vite.config.js`:
```js
import { defineConfig } from "vite";
import { threeMinifier } from "@yushijinhun/three-minifier-rollup";

export default defineConfig({
	plugins: [
		{ ...threeMinifier(), enforce: "pre" } // <=== Add plugin here
	]
});
```

### SvelteKit
[SvelteKit](https://kit.svelte.dev/) uses Vite as its build tool, so the setup is similar to Vite.

```
npm install --save-dev @yushijinhun/three-minifier-rollup
```

`svelte.config.js`:
```js
import adapter from "@sveltejs/adapter-auto";
import { threeMinifier } from "@yushijinhun/three-minifier-rollup";

export default {
	kit: {
		adapter: adapter(),
		target: "#svelte",
		vite: {
			plugins: [
				{ ...threeMinifier(), enforce: "pre" } // <=== Add plugin here
			]
		}
	}
};
```

## FAQ
### Does it really work?
Yes!

Consider the following example:
```javascript
import { WebGLRenderer } from "three";
console.log(WebGLRenderer);
```
 * Rollup: 576K => 354K
 * Webpack: 582K => 354K

### Do I need to modify any existing code?
No. These are the acceptable approaches to importing THREE.js:
```javascript
import { ... } from "three";
import { ... } from "three/build/three.module.js";
import { ... } from "three/src/Three";
import { ... } from "three/src/math/vector3";
// or something like these
```

### Does this work with examples jsm modules?
Yes. This plugin solves [mrdoob/three.js#17482](https://github.com/mrdoob/three.js/issues/17482).

You do not need to do any extra work to use examples jsm modules.
```javascript
import { WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// it works well
```

### Will one day I no longer need this plugin?
In order to make THREE.js tree-shakable, efforts have been made by many people on the upstream project.
However, THREE.js hasn't come up with a feasible solution so far. See [related issues](#related-issues--repositories) to learn more.

## Related issues & repositories
 * [Importing examples jsm modules causes bundlers to bundle three.js source code twice _mrdoob/three.js#17482_](https://github.com/mrdoob/three.js/issues/17482)
 * [ReactAreaLights do not seem to work in a module bundler _mrdoob/three.js#17220_](https://github.com/mrdoob/three.js/issues/17220)
 * [Add sideEffects: false flag to package.json to allow tree shaking _mrdoob/three.js#16059_](https://github.com/mrdoob/three.js/issues/16059)
 * [Allow tree-shaking by adding "sideEffects": false flag _mrdoob/three.js#16317_](https://github.com/mrdoob/three.js/pull/16317)
 * [Enable tree-shaking both for the main and examples files _mrdoob/three.js#16301_](https://github.com/mrdoob/three.js/pull/16301)
 * [Support esm on node with conditional exports _mrdoob/three.js#18498_](https://github.com/mrdoob/three.js/pull/18498)
 * [vxna/optimize-three-webpack-plugin](https://github.com/vxna/optimize-three-webpack-plugin)
 * [mattdesl/threejs-tree-shake](https://github.com/mattdesl/threejs-tree-shake)

