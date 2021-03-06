var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "underscore", "./scenario-context", "./scenario-context"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ManagedScenarioContext = void 0;
    const _ = require("underscore");
    const scenario_context_1 = require("./scenario-context");
    /**
     * Represents a [[ScenarioContext]] implementation that manages a collection of context objects that
     * are created and used by binding classes during a running Cucumber scenario.
     */
    class ManagedScenarioContext {
        constructor(scenarioTitle, tags) {
            this._activeObjects = new Map();
            this._scenarioInfo = new scenario_context_1.ScenarioInfo(scenarioTitle, tags);
        }
        /**
         * Gets information about the scenario.
         *
         */
        get scenarioInfo() {
            return this._scenarioInfo;
        }
        getOrActivateBindingClass(targetPrototype, contextTypes) {
            return this.getOrActivateObject(targetPrototype, () => {
                return this.activateBindingClass(targetPrototype, contextTypes);
            });
        }
        dispose() {
            this._activeObjects.forEach((value) => {
                if (typeof value.dispose === "function") {
                    value.dispose();
                }
            });
        }
        activateBindingClass(targetPrototype, contextTypes) {
            const invokeBindingConstructor = (args) => {
                switch (contextTypes.length) {
                    case 0:
                        return new targetPrototype.constructor();
                    case 1:
                        return new targetPrototype.constructor(args[0]);
                    case 2:
                        return new targetPrototype.constructor(args[0], args[1]);
                    case 3:
                        return new targetPrototype.constructor(args[0], args[1], args[2]);
                    case 4:
                        return new targetPrototype.constructor(args[0], args[1], args[2], args[3]);
                    case 5:
                        return new targetPrototype.constructor(args[0], args[1], args[2], args[3], args[4]);
                    case 6:
                        return new targetPrototype.constructor(args[0], args[1], args[2], args[3], args[4], args[5]);
                    case 7:
                        return new targetPrototype.constructor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
                    case 8:
                        return new targetPrototype.constructor(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
                    case 9:
                        return new targetPrototype.constructor(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
                    case 10:
                        return new targetPrototype.constructor(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
                }
            };
            const contextObjects = _.map(contextTypes, contextType => this.getOrActivateObject(contextType.prototype, () => {
                return new contextType();
            }));
            return invokeBindingConstructor(contextObjects);
        }
        getOrActivateObject(targetPrototype, activatorFunc) {
            let activeObject = this._activeObjects.get(targetPrototype);
            if (activeObject) {
                return activeObject;
            }
            activeObject = activatorFunc();
            this._activeObjects.set(targetPrototype, activeObject);
            return activeObject;
        }
    }
    exports.ManagedScenarioContext = ManagedScenarioContext;
    __exportStar(require("./scenario-context"), exports);
});
//# sourceMappingURL=managed-scenario-context.js.map