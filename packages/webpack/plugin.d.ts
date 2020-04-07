import { WebpackPluginInstance } from "webpack/declarations/WebpackOptions";
import { Compiler } from "webpack"

declare class ThreeMinifierPlugin implements WebpackPluginInstance {
    constructor(options: {
        sideEffects?: boolean;
        noCompileGLConstants?: boolean;
        noCompileGLSL?: boolean;
        verbose?: boolean;
    })
    apply: (compiler: Compiler) => void;

    readonly resolver: WebpackPluginInstance;
}

export = ThreeMinifierPlugin;
