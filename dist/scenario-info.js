(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScenarioInfo = void 0;
    /**
     * Provides information about a running Cucumber scenario.
     */
    class ScenarioInfo {
        /**
         * Initializes the [[ScenarioInfo]] object.
         *
         * @param scenarioTitle The string title of the currently running Cucumber scenario.
         * @param tags An array of [[TagName]] representing the tags that are in scope for the currently
         * running Cucumber scenario.
         */
        constructor(scenarioTitle, tags) {
            this.scenarioTitle = scenarioTitle;
            this.tags = tags;
        }
    }
    exports.ScenarioInfo = ScenarioInfo;
});
//# sourceMappingURL=scenario-info.js.map