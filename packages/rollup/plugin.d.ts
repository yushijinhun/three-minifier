import { Plugin } from "rollup";

export declare function threeMinifier(options: {
    sideEffects?: boolean;
    noCompileGLConstants?: boolean;
    noCompileGLSL?: boolean;
    verbose?: boolean;
}): Plugin;
