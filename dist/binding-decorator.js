(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@cucumber/cucumber", "underscore", "./logger", "./binding-registry", "./managed-scenario-context", "./step-binding"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.binding = void 0;
    const cucumber_1 = require("@cucumber/cucumber");
    const _ = require("underscore");
    const logger_1 = require("./logger");
    const binding_registry_1 = require("./binding-registry");
    const managed_scenario_context_1 = require("./managed-scenario-context");
    const step_binding_1 = require("./step-binding");
    /**
     * The property name of the current scenario context that will be attached to the Cucumber
     * world object.
     */
    const SCENARIO_CONTEXT_SLOTNAME = "__SCENARIO_CONTEXT";
    /**
     * A set of step patterns that have been registered with Cucumber.
     *
     * In order to support scoped (or tagged) step definitions, we must ensure that any step binding is
     * only registered with Cucumber once. The binding function for that step pattern then becomes
     * responsible for looking up and execuing the step binding based on the context that is in scope at
     * the point of invocation.
     */
    const stepPatternRegistrations = new Map();
    // tslint:disable:no-bitwise
    /**
     * A class decorator that marks the associated class as a CucumberJS binding.
     *
     * @param requiredContextTypes An optional array of Types that will be created and passed into the created
     * object for each scenario.
     *
     * An instance of the decorated class will be created for each scenario.
     */
    function binding(requiredContextTypes) {
        return (target) => {
            ensureSystemBindings();
            const bindingRegistry = binding_registry_1.BindingRegistry.instance;
            bindingRegistry.registerContextTypesForTarget(target.prototype, requiredContextTypes);
            const allBindings = [];
            allBindings.push(...bindingRegistry.getStepBindingsForTarget(target));
            allBindings.push(...bindingRegistry.getStepBindingsForTarget(target.prototype));
            allBindings.forEach(stepBinding => {
                if (stepBinding.bindingType & step_binding_1.StepBindingFlags.StepDefinitions) {
                    let stepBindingFlags = stepPatternRegistrations.get(stepBinding.stepPattern.toString());
                    if (stepBindingFlags === undefined) {
                        stepBindingFlags = step_binding_1.StepBindingFlags.none;
                    }
                    if (stepBindingFlags & stepBinding.bindingType) {
                        return;
                    }
                    bindStepDefinition(stepBinding);
                    stepPatternRegistrations.set(stepBinding.stepPattern.toString(), stepBindingFlags | stepBinding.bindingType);
                }
                else if (stepBinding.bindingType & step_binding_1.StepBindingFlags.Hooks) {
                    bindHook(stepBinding);
                }
            });
        };
    }
    exports.binding = binding;
    /**
     * Ensures that the 'cucumber-tsflow' hooks are bound to Cucumber.
     *
     * @param cucumber The cucumber object.
     *
     * The hooks will only be registered with Cucumber once regardless of which binding invokes the
     * function.
     */
    const ensureSystemBindings = _.once(() => {
        cucumber_1.Before(function (scenario) {
            logger_1.default.trace("Setting up scenario context for scenario:", JSON.stringify(scenario));
            this[SCENARIO_CONTEXT_SLOTNAME] = new managed_scenario_context_1.ManagedScenarioContext(scenario.pickle.name, _.map(scenario.pickle.tags, (tag) => tag.name));
        });
        cucumber_1.After(function () {
            const scenarioContext = this[SCENARIO_CONTEXT_SLOTNAME];
            if (scenarioContext) {
                scenarioContext.dispose();
            }
        });
        // Decorate the Cucumber step definition snippet builder so that it uses our syntax
        // let currentSnippetBuilder = cucumberSys.SupportCode.StepDefinitionSnippetBuilder;
        // cucumberSys.SupportCode.StepDefinitionSnippetBuilder = function (step, syntax) {
        //     return currentSnippetBuilder(step, {
        //         build: function (functionName: string, pattern, parameters, comment) {
        //             let callbackName = parameters[parameters.length - 1];
        //             return `@${functionName.toLowerCase()}(${pattern})\n` +
        //                    `public ${functionName}XXX (${parameters.join(", ")}): void {\n` +
        //                    `  // ${comment}\n` +
        //                    `  ${callbackName}.pending();\n` +
        //                    `}\n`;
        //         }
        //     });
        // }
    });
    /**
     * Binds a step definition to Cucumber.
     *
     * @param cucumber The cucumber object.
     * @param stepBinding The [[StepBinding]] that represents a 'given', 'when', or 'then' step definition.
     */
    function bindStepDefinition(stepBinding) {
        const bindingFunc = function () {
            const bindingRegistry = binding_registry_1.BindingRegistry.instance;
            const scenarioContext = this[SCENARIO_CONTEXT_SLOTNAME];
            const matchingStepBindings = bindingRegistry.getStepBindings(stepBinding.stepPattern.toString(), scenarioContext.scenarioInfo.tags);
            if (matchingStepBindings.length > 1) {
                let message = `Ambiguous step definitions for '${matchingStepBindings[0].stepPattern}':\n`;
                matchingStepBindings.forEach(matchingStepBinding => {
                    message =
                        message +
                            `\t\t${String(matchingStepBinding.targetPropertyKey)} (${matchingStepBinding.callsite.toString()})\n`;
                });
                throw new Error(message);
            }
            else if (matchingStepBindings.length === 0) {
                throw new Error(`Cannot find matched step definition for ${stepBinding.stepPattern.toString()} with tag ${scenarioContext.scenarioInfo.tags} in binding registry`);
            }
            const contextTypes = bindingRegistry.getContextTypesForTarget(matchingStepBindings[0].targetPrototype);
            const bindingObject = scenarioContext.getOrActivateBindingClass(matchingStepBindings[0].targetPrototype, contextTypes);
            bindingObject._worldObj = this;
            return bindingObject[matchingStepBindings[0].targetPropertyKey].apply(bindingObject, arguments);
        };
        Object.defineProperty(bindingFunc, "length", {
            value: stepBinding.argsLength
        });
        if (stepBinding.bindingType & step_binding_1.StepBindingFlags.given) {
            if (stepBinding.timeout) {
                cucumber_1.Given(stepBinding.stepPattern, { timeout: stepBinding.timeout }, bindingFunc);
            }
            else {
                cucumber_1.Given(stepBinding.stepPattern, bindingFunc);
            }
        }
        else if (stepBinding.bindingType & step_binding_1.StepBindingFlags.when) {
            if (stepBinding.timeout) {
                cucumber_1.When(stepBinding.stepPattern, { timeout: stepBinding.timeout }, bindingFunc);
            }
            else {
                cucumber_1.When(stepBinding.stepPattern, bindingFunc);
            }
        }
        else if (stepBinding.bindingType & step_binding_1.StepBindingFlags.then) {
            if (stepBinding.timeout) {
                cucumber_1.Then(stepBinding.stepPattern, { timeout: stepBinding.timeout }, bindingFunc);
            }
            else {
                cucumber_1.Then(stepBinding.stepPattern, bindingFunc);
            }
        }
    }
    /**
     * Binds a hook to Cucumber.
     *
     * @param cucumber The cucumber object.
     * @param stepBinding The [[StepBinding]] that represents a 'before', or 'after', step definition.
     */
    function bindHook(stepBinding) {
        const bindingFunc = function () {
            const scenarioContext = this[SCENARIO_CONTEXT_SLOTNAME];
            const contextTypes = binding_registry_1.BindingRegistry.instance.getContextTypesForTarget(stepBinding.targetPrototype);
            const bindingObject = scenarioContext.getOrActivateBindingClass(stepBinding.targetPrototype, contextTypes);
            bindingObject._worldObj = this;
            return bindingObject[stepBinding.targetPropertyKey].apply(bindingObject, arguments);
        };
        const globalBindFunc = () => {
            const targetPrototype = stepBinding.targetPrototype;
            const targetPropertyKey = stepBinding.targetPropertyKey;
            return targetPrototype[targetPropertyKey].apply();
        };
        Object.defineProperty(bindingFunc, "length", {
            value: stepBinding.argsLength
        });
        function bindToCucumberHook(HookFunc) {
            // HookFunc can be: Before, After, BeforeAll, AfterAll
            if (stepBinding.tag === binding_registry_1.DEFAULT_TAG) {
                HookFunc(bindingFunc);
            }
            else {
                HookFunc(String(stepBinding.tag), bindingFunc);
            }
        }
        switch (stepBinding.bindingType) {
            case step_binding_1.StepBindingFlags.before: {
                bindToCucumberHook(cucumber_1.Before);
                break;
            }
            case step_binding_1.StepBindingFlags.after: {
                bindToCucumberHook(cucumber_1.After);
                break;
            }
            case step_binding_1.StepBindingFlags.beforeAll: {
                cucumber_1.BeforeAll(globalBindFunc);
                break;
            }
            case step_binding_1.StepBindingFlags.afterAll: {
                cucumber_1.AfterAll(globalBindFunc);
                break;
            }
        }
    }
});
//# sourceMappingURL=binding-decorator.js.map