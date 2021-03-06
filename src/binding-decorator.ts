import {
  World,
  After,
  AfterAll,
  Before,
  BeforeAll,
  Given,
  Then,
  When
} from "@cucumber/cucumber";
import { messages } from "@cucumber/messages";
import * as _ from "underscore";
import logger from "./logger";

import { BindingRegistry, DEFAULT_TAG } from "./binding-registry";
import { ManagedScenarioContext } from "./managed-scenario-context";
import { StepBinding, StepBindingFlags } from "./step-binding";
import { ContextType, StepPattern, TypeDecorator } from "./types";

interface WritableWorld extends World {
  [key: string]: any;
}

/**
 * The property name of the current scenario context that will be attached to the Cucumber
 * world object.
 */
const SCENARIO_CONTEXT_SLOTNAME: string = "__SCENARIO_CONTEXT";

/**
 * A set of step patterns that have been registered with Cucumber.
 *
 * In order to support scoped (or tagged) step definitions, we must ensure that any step binding is
 * only registered with Cucumber once. The binding function for that step pattern then becomes
 * responsible for looking up and execuing the step binding based on the context that is in scope at
 * the point of invocation.
 */
const stepPatternRegistrations = new Map<StepPattern, StepBindingFlags>();

// tslint:disable:no-bitwise

/**
 * A class decorator that marks the associated class as a CucumberJS binding.
 *
 * @param requiredContextTypes An optional array of Types that will be created and passed into the created
 * object for each scenario.
 *
 * An instance of the decorated class will be created for each scenario.
 */
export function binding(requiredContextTypes?: ContextType[]): TypeDecorator {
  return <T>(target: { new (...args: any[]): T }) => {
    ensureSystemBindings();
    const bindingRegistry = BindingRegistry.instance;
    bindingRegistry.registerContextTypesForTarget(
      target.prototype,
      requiredContextTypes
    );

    const allBindings: StepBinding[] = [];
    allBindings.push(...bindingRegistry.getStepBindingsForTarget(target));
    allBindings.push(
      ...bindingRegistry.getStepBindingsForTarget(target.prototype)
    );

    allBindings.forEach(stepBinding => {
      if (stepBinding.bindingType & StepBindingFlags.StepDefinitions) {
        let stepBindingFlags = stepPatternRegistrations.get(
          stepBinding.stepPattern.toString()
        );
        if (stepBindingFlags === undefined) {
          stepBindingFlags = StepBindingFlags.none;
        }
        if (stepBindingFlags & stepBinding.bindingType) {
          return;
        }
        bindStepDefinition(stepBinding);
        stepPatternRegistrations.set(
          stepBinding.stepPattern.toString(),
          stepBindingFlags | stepBinding.bindingType
        );
      } else if (stepBinding.bindingType & StepBindingFlags.Hooks) {
        bindHook(stepBinding);
      }
    });
  };
}

/**
 * Ensures that the 'cucumber-tsflow' hooks are bound to Cucumber.
 *
 * @param cucumber The cucumber object.
 *
 * The hooks will only be registered with Cucumber once regardless of which binding invokes the
 * function.
 */
const ensureSystemBindings = _.once(() => {
  Before(function(this: WritableWorld, scenario) {
    logger.trace(
      "Setting up scenario context for scenario:",
      JSON.stringify(scenario)
    );

    this[SCENARIO_CONTEXT_SLOTNAME] = new ManagedScenarioContext(
      scenario.pickle.name!,
      _.map(
        scenario.pickle.tags!,
        (tag: messages.Pickle.IPickleTag) => tag.name!
      )
    );
  });

  After(function(this: WritableWorld) {
    const scenarioContext = this[
      SCENARIO_CONTEXT_SLOTNAME
    ] as ManagedScenarioContext;

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
function bindStepDefinition(stepBinding: StepBinding): void {
  const bindingFunc = function(this: WritableWorld): any {
    const bindingRegistry = BindingRegistry.instance;

    const scenarioContext = this[
      SCENARIO_CONTEXT_SLOTNAME
    ] as ManagedScenarioContext;

    const matchingStepBindings = bindingRegistry.getStepBindings(
      stepBinding.stepPattern.toString(),
      scenarioContext.scenarioInfo.tags
    );

    if (matchingStepBindings.length > 1) {
      let message = `Ambiguous step definitions for '${
        matchingStepBindings[0].stepPattern
      }':\n`;

      matchingStepBindings.forEach(matchingStepBinding => {
        message =
          message +
          `\t\t${String(
            matchingStepBinding.targetPropertyKey
          )} (${matchingStepBinding.callsite.toString()})\n`;
      });

      throw new Error(message);
    } else if (matchingStepBindings.length === 0) {
      throw new Error(
        `Cannot find matched step definition for ${stepBinding.stepPattern.toString()} with tag ${
          scenarioContext.scenarioInfo.tags
        } in binding registry`
      );
    }

    const contextTypes = bindingRegistry.getContextTypesForTarget(
      matchingStepBindings[0].targetPrototype
    );
    const bindingObject = scenarioContext.getOrActivateBindingClass(
      matchingStepBindings[0].targetPrototype,
      contextTypes
    );

    bindingObject._worldObj = this;

    return (bindingObject[
      matchingStepBindings[0].targetPropertyKey
    ] as () => void).apply(bindingObject, arguments as any);
  };

  Object.defineProperty(bindingFunc, "length", {
    value: stepBinding.argsLength
  });

  if (stepBinding.bindingType & StepBindingFlags.given) {
    if (stepBinding.timeout) {
      Given(
        stepBinding.stepPattern,
        { timeout: stepBinding.timeout },
        bindingFunc
      );
    } else {
      Given(stepBinding.stepPattern, bindingFunc);
    }
  } else if (stepBinding.bindingType & StepBindingFlags.when) {
    if (stepBinding.timeout) {
      When(
        stepBinding.stepPattern,
        { timeout: stepBinding.timeout },
        bindingFunc
      );
    } else {
      When(stepBinding.stepPattern, bindingFunc);
    }
  } else if (stepBinding.bindingType & StepBindingFlags.then) {
    if (stepBinding.timeout) {
      Then(
        stepBinding.stepPattern,
        { timeout: stepBinding.timeout },
        bindingFunc
      );
    } else {
      Then(stepBinding.stepPattern, bindingFunc);
    }
  }
}

/**
 * Binds a hook to Cucumber.
 *
 * @param cucumber The cucumber object.
 * @param stepBinding The [[StepBinding]] that represents a 'before', or 'after', step definition.
 */
function bindHook(stepBinding: StepBinding): void {
  const bindingFunc = function(this: any): any {
    const scenarioContext = this[
      SCENARIO_CONTEXT_SLOTNAME
    ] as ManagedScenarioContext;
    const contextTypes = BindingRegistry.instance.getContextTypesForTarget(
      stepBinding.targetPrototype
    );
    const bindingObject = scenarioContext.getOrActivateBindingClass(
      stepBinding.targetPrototype,
      contextTypes
    );

    bindingObject._worldObj = this;

    return (bindingObject[stepBinding.targetPropertyKey] as () => void).apply(
      bindingObject,
      arguments as any
    );
  };

  const globalBindFunc = () => {
    const targetPrototype = stepBinding.targetPrototype;
    const targetPropertyKey = stepBinding.targetPropertyKey;
    return targetPrototype[targetPropertyKey].apply();
  };

  Object.defineProperty(bindingFunc, "length", {
    value: stepBinding.argsLength
  });

  function bindToCucumberHook(HookFunc: any) {
    // HookFunc can be: Before, After, BeforeAll, AfterAll
    if (stepBinding.tag === DEFAULT_TAG) {
      HookFunc(bindingFunc);
    } else {
      HookFunc(String(stepBinding.tag), bindingFunc);
    }
  }

  switch (stepBinding.bindingType) {
    case StepBindingFlags.before: {
      bindToCucumberHook(Before);
      break;
    }
    case StepBindingFlags.after: {
      bindToCucumberHook(After);
      break;
    }
    case StepBindingFlags.beforeAll: {
      BeforeAll(globalBindFunc);
      break;
    }
    case StepBindingFlags.afterAll: {
      AfterAll(globalBindFunc);
      break;
    }
  }
}
