"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAT_MODEL_PROPERTIES = exports.MANUAL_MODEL_PROPERTY = exports.CHAT_MODEL_PROPERTY = void 0;
const GitHubCopilotModels_1 = require("../models/GitHubCopilotModels");
exports.CHAT_MODEL_PROPERTY = {
    displayName: "Model",
    name: "model",
    type: "options",
    typeOptions: {
        loadOptionsMethod: "getAvailableModels",
    },
    default: GitHubCopilotModels_1.DEFAULT_MODELS.GENERAL,
    description: "Select the GitHub Copilot model to use (loaded dynamically based on your subscription)",
};
exports.MANUAL_MODEL_PROPERTY = {
    displayName: "Custom Model Name",
    name: "customModel",
    type: "string",
    default: "",
    placeholder: "gpt-4o, claude-3.5-sonnet, grok-code-fast-1, etc.",
    description: "Enter the model name manually. This is useful for new/beta models not yet in the list.",
    hint: "Examples: gpt-4o, gpt-4o-mini, claude-3.5-sonnet, gemini-2.0-flash-exp, grok-code-fast-1",
    displayOptions: {
        show: {
            model: ["__manual__"],
        },
    },
};
exports.CHAT_MODEL_PROPERTIES = [
    exports.CHAT_MODEL_PROPERTY,
    exports.MANUAL_MODEL_PROPERTY,
];
