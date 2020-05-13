# three-minifier
![GitHub tag (latest SemVer pre-release)](https://img.shields.io/github/v/tag/yushijinhun/three-minifier?color=yellow&include_prereleases&label=version&sort=semver&style=flat-square)
[![Requires node version >= v12.0](https://img.shields.io/badge/requires-node%20≥%20v12.0-brightgreen?style=flat-square&logo=node.js&logoColor=brightgreen)](https://github.com/yushijinhun/three-minifier/issues/3)

Minify THREE.js

## Introduction
This plugin helps projects who use THREE.js shrink their size by:
 * Resolve `three` / `three/build/three.module.js` to `three/src/Three.js`.
    * This makes it possible for bundlers to perform better tree-shaking.
 * Mark `three` as side-effect free.
    * You can turn it off by setting `sideEffects: true` if you need the polyfills in THREE.js.
 * Replace WebGL constants with literals.
    * Can be turned off by setting `noCompileGLConstants: true`.
    * [About this](https://github.com/mrdoob/three.js/blob/95fb8e348948679014f4c6afe2aefc4043b16703/utils/build/rollup.config.js#L3-L169).
 * Minify GLSL files.
    * Can be turned off by setting `noCompileGLSL: true`.
    * [About this](https://github.com/mrdoob/three.js/blob/95fb8e348948679014f4c6afe2aefc4043b16703/utils/build/rollup.config.js#L171-L201).

## Usage

### :warning: Before continuing... :warning:
 * This plugin hasn't been fully tested, and may be **unstable**. Use with caution.  
 * Node.js **>= v12.0** is required.

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
        threeMinifier({/* options */}), // <=== Add plugin on the FIRST line
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
const threeMinifier = new ThreeMinifierResolver({/* options */});
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

## Options
|Name                |Type   |Description                                                                       |
|--------------------|-------|----------------------------------------------------------------------------------|
|sideEffects         |boolean|(default: false) If true, do NOT mark `three` as side-effect free.                |
|noCompileGLConstants|boolean|(default: false) If true, do NOT replace WebGL constants(`_gl.XXX`) with literals.|
|noCompileGLSL       |boolean|(default: false) If true, do NOT minify `.glsl.js` files.                         |
|verbose             |boolean|(default: false) Enable verbose output                                            |

