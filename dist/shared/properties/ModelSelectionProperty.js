"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTriggerProperty = exports.modelRefreshProperty = exports.modelSelectionProperty = void 0;
const GitHubCopilotModels_1 = require("../models/GitHubCopilotModels");
exports.modelSelectionProperty = {
    displayName: "Model",
    name: "model",
    type: "options",
    typeOptions: {
        loadOptionsMethod: "getAvailableModels",
        loadOptionsDependsOn: ["refresh"],
    },
    default: GitHubCopilotModels_1.DEFAULT_MODELS.GENERAL,
    required: true,
    description: "Select a model from your subscription or enter a custom model name",
    placeholder: "Select model or type custom name (e.g., gpt-4o, claude-3.5-sonnet)",
    hint: "Models are loaded based on your GitHub Copilot subscription. Use the refresh button to update the list.",
    validateType: "string",
    ignoreValidationDuringExecution: false,
};
exports.modelRefreshProperty = {
    displayName: "Refresh Models",
    name: "refreshModels",
    type: "button",
    typeOptions: {
        action: "refreshModels",
    },
    default: "",
    description: "Click to refresh the list of available models from your subscription",
    displayOptions: {
        show: {
            operation: ["chat"],
        },
    },
};
exports.refreshTriggerProperty = {
    displayName: "Refresh Trigger",
    name: "refresh",
    type: "hidden",
    default: 0,
    description: "Internal field to trigger model list refresh",
};
