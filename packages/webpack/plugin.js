import { parseOptions } from "../../common.js";
import Dependency from "webpack/lib/Dependency";

const pluginName = "ThreeMinifierPlugin";

class ThreeReplaceDependency extends Dependency {
    constructor(minifier, file) {
        super();
        this.minifier = minifier;
        this.file = file;
    }
}

ThreeReplaceDependency.Template = class ThreeReplaceTemplate {
    apply(dep, source) {
        const originalSource = source.original().source();
        for (const match of dep.minifier.transformCode(originalSource, dep.file)) {
            source.replace(match.start, match.end - 1, match.replacement);
        }
    }
};

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

    apply(compiler) {
        compiler.hooks.compilation.tap(pluginName, compilation => {
            compilation.dependencyTemplates.set(
                ThreeReplaceDependency,
                new ThreeReplaceDependency.Template()
            );
            compilation.hooks.buildModule.tap(pluginName, module => {
                if (this.minifier.isThreeSource(module.resource)) {
                    module.addDependency(new ThreeReplaceDependency(this.minifier, module.resource));
                }
            });
        });
    }
};
