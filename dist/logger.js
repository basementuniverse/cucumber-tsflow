(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "log4js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log4js = require("log4js");
    const logger = log4js.getLogger();
    logger.level = "debug"; // default level is OFF - which means no logs at all.
    exports.default = logger;
});
//# sourceMappingURL=logger.js.map