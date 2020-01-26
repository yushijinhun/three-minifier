# three-minifier
Minify THREE.js

> **This plugin hasn't been fully tested, and may be UNSTABLE. Use with caution.**

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
        threeMinifier({/* options */}), // <=== Add plugin
    ]
};
```
> If you are using **@rollup/plugin-node-resolve**, make sure to put `threeMinifier()` before it.

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
        threeMinifier // <=== (1) Add plugin
    ],
    resolve: {
        plugins: [
            threeMinifier.resolver // <=== (2) Add resolver
        ]
    }
};
```

## Options
|Name                |Type   |Description                                                                       |
|--------------------|-------|----------------------------------------------------------------------------------|
|sideEffects         |boolean|(default: false) If true, do NOT mark `three` as side-effect free.                |
|noCompileGLConstants|boolean|(default: false) If true, do NOT replace WebGL constants(`_gl.XXX`) with literals.|
|noCompileGLSL       |boolean|(default: false) If true, do NOT minify `.glsl.js` files.                         |

