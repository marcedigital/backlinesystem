"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbLogger = void 0;
exports.logToConsole = logToConsole;
var winston_1 = require("winston");
function logToConsole(level, message, metadata) {
    var timestamp = new Date().toISOString();
    var logMessage = "[".concat(timestamp, "] ").concat(level.toUpperCase(), ": ").concat(message);
    if (metadata) {
        console[level](logMessage, JSON.stringify(metadata, null, 2));
    }
    else {
        console[level](logMessage);
    }
}
exports.dbLogger = (0, winston_1.createLogger)({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }), winston_1.format.printf(function (_a) {
        var timestamp = _a.timestamp, level = _a.level, message = _a.message, metadata = __rest(_a, ["timestamp", "level", "message"]);
        var msg = "[".concat(timestamp, "] ").concat(level, ": ").concat(message);
        var metaStr = Object.keys(metadata).length
            ? " | ".concat(JSON.stringify(metadata))
            : '';
        return msg + metaStr;
    })),
    transports: [
        new winston_1.transports.Console()
    ]
});
