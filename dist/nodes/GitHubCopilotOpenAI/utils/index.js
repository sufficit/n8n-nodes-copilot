"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugLog = exports.parseOpenAIRequest = exports.convertCopilotResponseToOpenAI = exports.convertOpenAIMessagesToCopilot = exports.mapOpenAIModelToCopilot = void 0;
__exportStar(require("./types"), exports);
var openaiCompat_1 = require("./openaiCompat");
Object.defineProperty(exports, "mapOpenAIModelToCopilot", { enumerable: true, get: function () { return openaiCompat_1.mapOpenAIModelToCopilot; } });
Object.defineProperty(exports, "convertOpenAIMessagesToCopilot", { enumerable: true, get: function () { return openaiCompat_1.convertOpenAIMessagesToCopilot; } });
Object.defineProperty(exports, "convertCopilotResponseToOpenAI", { enumerable: true, get: function () { return openaiCompat_1.convertCopilotResponseToOpenAI; } });
Object.defineProperty(exports, "parseOpenAIRequest", { enumerable: true, get: function () { return openaiCompat_1.parseOpenAIRequest; } });
Object.defineProperty(exports, "debugLog", { enumerable: true, get: function () { return openaiCompat_1.debugLog; } });
