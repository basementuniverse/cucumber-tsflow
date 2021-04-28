(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./binding-registry", "./our-callsite", "./step-binding"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterAll = exports.after = exports.beforeAll = exports.before = void 0;
    const binding_registry_1 = require("./binding-registry");
    const our_callsite_1 = require("./our-callsite");
    const step_binding_1 = require("./step-binding");
    /**
     * A method decorator that marks the associated function as a 'Before Scenario' step. The function is
     * executed before each scenario.
     *
     * @param tag An optional tag.
     */
    function before(tag) {
        return createDecoratorFactory(step_binding_1.StepBindingFlags.before, tag);
    }
    exports.before = before;
    /**
     * A method decorator that marks the associated function as a 'Before All Scenario' step. The function is
     * executed before all scenarios are executed.
     *
     * @param tag An optional tag.
     */
    function beforeAll(tag) {
        return createDecoratorFactory(step_binding_1.StepBindingFlags.beforeAll, tag);
    }
    exports.beforeAll = beforeAll;
    /**
     * A method decorator that marks the associated function as an 'After Scenario' step. The function is
     * executed after each scenario.
     *
     * @param tag An optional tag.
     */
    function after(tag) {
        return createDecoratorFactory(step_binding_1.StepBindingFlags.after, tag);
    }
    exports.after = after;
    /**
     * A method decorator that marks the associated function as an 'After All Scenario' step. The function is
     * executed after all scenarios are executed.
     *
     * @param tag An optional tag.
     */
    function afterAll(tag) {
        return createDecoratorFactory(step_binding_1.StepBindingFlags.afterAll, tag);
    }
    exports.afterAll = afterAll;
    function checkTag(tag) {
        return tag;
    }
    function createDecoratorFactory(flag, tag) {
        const callSite = our_callsite_1.Callsite.capture();
        return (target, propertyKey, descriptor) => {
            const stepBinding = {
                stepPattern: "",
                bindingType: flag,
                targetPrototype: target,
                targetPropertyKey: propertyKey,
                argsLength: target[propertyKey].length,
                callsite: callSite
            };
            if (tag) {
                stepBinding.tag = checkTag(tag);
            }
            binding_registry_1.BindingRegistry.instance.registerStepBinding(stepBinding);
            return descriptor;
        };
    }
});
//# sourceMappingURL=hook-decorators.js.map