import { parseOptions } from "../../common.js";

const pluginName = "ThreeMinifierPlugin";

export default class ThreeMinifierPlugin {
    constructor(options) {
        this.minifier = parseOptions(options);

        this.resolver = {};
        this.resolver.apply = resolver => {
            resolver.getHook("resolve").tapAsync(pluginName, (request, resolveContext, callback) => {
                resolver.doResolve(resolver.ensureHook("parsedResolve"), request, null, resolveContext,
                    (error, result) => {
                        if (result) {
                            const tranformed = this.minifier.transformModule(result.path);
                            if (tranformed !== null) {
                                resolver.doResolve(resolver.ensureHook("parsedResolve"),
                                    {
                                        ...request,
                                        request: tranformed
                                    },
                                    null, resolveContext, this._clearSideEffects(callback));
                                return;
                            }
                        }
                        this._clearSideEffects(callback)(error, result);
                    }
                );

            });
        }
    }

    _clearSideEffects(callback) {
        return (error, result) => {
            if (result) {
                if (this.minifier.clearSideEffects(result.path)) {
                    result.descriptionFileData.sideEffects = false;
                }
            }
            callback(error, result);
        };
    }

    _transformModule(module) {
        const transformedCode = this.minifier.transformCode(module._source._value, module.resource);
        if (transformedCode !== null) {
            module._source._value = transformedCode;
        }
    }

    apply(compiler) {
        compiler.hooks.compilation.tap(pluginName, compilation => {
            compilation.hooks.optimizeModules.tap(pluginName, modules => {
                for (const module of modules) {
                    this._transformModule(module);
                }
            });
        });
    }
};
