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
    exports.then = exports.when = exports.given = void 0;
    const binding_registry_1 = require("./binding-registry");
    const our_callsite_1 = require("./our-callsite");
    const step_binding_1 = require("./step-binding");
    /**
     * A method decorator that marks the associated function as a 'Given' step.
     *
     * @param stepPattern The regular expression that will be used to match steps.
     * @param tag An optional tag.
     * @param timeout An optional timeout.
     */
    function given(stepPattern, tag, timeout) {
        const callsite = our_callsite_1.Callsite.capture();
        return (target, propertyKey, descriptor) => {
            const stepBinding = {
                stepPattern: stepPattern,
                bindingType: step_binding_1.StepBindingFlags.given,
                targetPrototype: target,
                targetPropertyKey: propertyKey,
                argsLength: target[propertyKey].length,
                callsite: callsite
            };
            if (tag) {
                stepBinding.tag = tag[0] === "@" ? tag : `@${tag}`;
            }
            if (timeout) {
                stepBinding.timeout = timeout;
            }
            binding_registry_1.BindingRegistry.instance.registerStepBinding(stepBinding);
            return descriptor;
        };
    }
    exports.given = given;
    /**
     * A method decorator that marks the associated function as a 'When' step.
     *
     * @param stepPattern The regular expression that will be used to match steps.
     * @param tag An optional tag.
     * @param timeout An optional timeout.
     */
    function when(stepPattern, tag, timeout) {
        const callsite = our_callsite_1.Callsite.capture();
        return (target, propertyKey, descriptor) => {
            const stepBinding = {
                stepPattern: stepPattern,
                bindingType: step_binding_1.StepBindingFlags.when,
                targetPrototype: target,
                targetPropertyKey: propertyKey,
                argsLength: target[propertyKey].length,
                callsite: callsite
            };
            if (tag) {
                stepBinding.tag = tag[0] === "@" ? tag : `@${tag}`;
            }
            if (timeout) {
                stepBinding.timeout = timeout;
            }
            binding_registry_1.BindingRegistry.instance.registerStepBinding(stepBinding);
            return descriptor;
        };
    }
    exports.when = when;
    /**
     * A method decorator that marks the associated function as a 'Then' step.
     *
     * @param stepPattern The regular expression that will be used to match steps.
     * @param tag An optional tag.
     * @param timeout An optional timeout.
     */
    function then(stepPattern, tag, timeout) {
        const callsite = our_callsite_1.Callsite.capture();
        return (target, propertyKey, descriptor) => {
            const stepBinding = {
                stepPattern: stepPattern,
                bindingType: step_binding_1.StepBindingFlags.then,
                targetPrototype: target,
                targetPropertyKey: propertyKey,
                argsLength: target[propertyKey].length,
                callsite: callsite
            };
            if (tag) {
                stepBinding.tag = tag[0] === "@" ? tag : `@${tag}`;
            }
            if (timeout) {
                stepBinding.timeout = timeout;
            }
            binding_registry_1.BindingRegistry.instance.registerStepBinding(stepBinding);
            return descriptor;
        };
    }
    exports.then = then;
});
//# sourceMappingURL=step-definition-decorators.js.map