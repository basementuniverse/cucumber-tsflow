(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "underscore"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BindingRegistry = exports.DEFAULT_TAG = exports.DEFAULT_STEP_PATTERN = void 0;
    const _ = require("underscore");
    /**
     * Represents the default step pattern.
     */
    exports.DEFAULT_STEP_PATTERN = "/.*/";
    /**
     * Represents the default tag.
     */
    exports.DEFAULT_TAG = "*";
    /**
     * A metadata registry that captures information about bindings and their bound step bindings.
     */
    class BindingRegistry {
        constructor() {
            this._bindings = new Map();
            this._targetBindings = new Map();
        }
        /**
         * Gets the binding registry singleton.
         *
         * @returns A [[BindingRegistry]].
         */
        static get instance() {
            const BINDING_REGISTRY_SLOTNAME = "__CUCUMBER_TSFLOW_BINDINGREGISTRY";
            const registry = global[BINDING_REGISTRY_SLOTNAME];
            if (!registry) {
                global[BINDING_REGISTRY_SLOTNAME] = new BindingRegistry();
            }
            return registry || global[BINDING_REGISTRY_SLOTNAME];
        }
        /**
         * Updates the binding registry with information about the context types required by a
         * binding class.
         *
         * @param targetPrototype The class representing the binding (constructor function).
         * @param contextTypes An array of [[ContextType]] that define the types of objects that
         * should be injected into the binding class during a scenario execution.
         */
        registerContextTypesForTarget(targetPrototype, contextTypes) {
            if (!contextTypes) {
                return;
            }
            let targetDecorations = this._targetBindings.get(targetPrototype);
            if (!targetDecorations) {
                targetDecorations = {
                    stepBindings: [],
                    contextTypes: []
                };
                this._targetBindings.set(targetPrototype, targetDecorations);
            }
            targetDecorations.contextTypes = contextTypes;
        }
        /**
         * Retrieves the context types that have been registered for a given binding class.
         *
         * @param targetPrototype The class representing the binding (constructor function).
         *
         * @returns An array of [[ContextType]] that have been registered for the specified
         * binding class.
         */
        getContextTypesForTarget(targetPrototype) {
            const targetBinding = this._targetBindings.get(targetPrototype);
            if (!targetBinding) {
                return [];
            }
            return targetBinding.contextTypes;
        }
        /**
         * Updates the binding registry indexes with a step binding.
         *
         * @param stepBinding The step binding that is to be registered with the binding registry.
         */
        registerStepBinding(stepBinding) {
            if (!stepBinding.tag) {
                stepBinding.tag = exports.DEFAULT_TAG;
            }
            const stepPattern = stepBinding.stepPattern
                ? stepBinding.stepPattern.toString()
                : exports.DEFAULT_STEP_PATTERN;
            let tagMap = this._bindings.get(stepPattern);
            if (!tagMap) {
                tagMap = new Map();
                this._bindings.set(stepPattern, tagMap);
            }
            let stepBindings = tagMap.get(stepBinding.tag);
            if (!stepBindings) {
                stepBindings = [];
                tagMap.set(stepBinding.tag, stepBindings);
            }
            if (!stepBindings.some(b => isSameStepBinding(stepBinding, b))) {
                stepBindings.push(stepBinding);
            }
            // Index the step binding for the target
            let targetBinding = this._targetBindings.get(stepBinding.targetPrototype);
            if (!targetBinding) {
                targetBinding = {
                    stepBindings: [],
                    contextTypes: []
                };
                this._targetBindings.set(stepBinding.targetPrototype, targetBinding);
            }
            if (!targetBinding.stepBindings.some(b => isSameStepBinding(stepBinding, b))) {
                targetBinding.stepBindings.push(stepBinding);
            }
            function isSameStepBinding(a, b) {
                return (a.callsite.filename === b.callsite.filename &&
                    a.callsite.lineNumber === b.callsite.lineNumber &&
                    String(a.stepPattern) === String(b.stepPattern));
            }
        }
        /**
         * Retrieves the step bindings that have been registered for a given binding class.
         *
         * @param targetPrototype The class representing the binding (constructor function).
         *
         * @returns An array of [[StepBinding]] objects that have been registered for the specified
         * binding class.
         */
        getStepBindingsForTarget(targetPrototype) {
            const targetBinding = this._targetBindings.get(targetPrototype);
            if (!targetBinding) {
                return [];
            }
            return targetBinding.stepBindings;
        }
        /**
         * Retrieves the step bindings for a given step pattern and collection of tag names.
         *
         * @param stepPattern The step pattern to search.
         * @param tags An array of [[TagName]] to search.
         *
         * @returns An array of [[StepBinding]] that map to the given step pattern and set of tag names.
         */
        getStepBindings(stepPattern, tags) {
            const tagMap = this._bindings.get(stepPattern);
            if (!tagMap) {
                return [];
            }
            const matchingStepBindings = this.mapTagNamesToStepBindings(tags, tagMap);
            if (matchingStepBindings.length > 0) {
                return matchingStepBindings;
            }
            return this.mapTagNamesToStepBindings(["*"], tagMap);
        }
        /**
         * Maps an array of tag names to an array of associated step bindings.
         *
         * @param tags An array of [[TagName]].
         * @param tagMap The map of [[TagName]] -> [[StepBinding]] to use when mapping.
         *
         * @returns An array of [[StepBinding]].
         */
        mapTagNamesToStepBindings(tags, tagMap) {
            const matchingStepBindings = _.flatten(_.map(tags, tag => tagMap.get(tag)));
            return _.reject(matchingStepBindings, stepBinding => stepBinding === undefined);
        }
    }
    exports.BindingRegistry = BindingRegistry;
});
//# sourceMappingURL=binding-registry.js.map