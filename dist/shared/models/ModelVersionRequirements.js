"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MODEL_REQUIREMENTS = exports.MODEL_VERSION_REQUIREMENTS = void 0;
exports.getModelRequirements = getModelRequirements;
exports.modelSupportsEndpoint = modelSupportsEndpoint;
exports.getRecommendedEndpoint = getRecommendedEndpoint;
exports.validateModelEndpoint = validateModelEndpoint;
exports.getMinVSCodeVersion = getMinVSCodeVersion;
exports.isPreviewModel = isPreviewModel;
exports.getAdditionalHeaders = getAdditionalHeaders;
exports.MODEL_VERSION_REQUIREMENTS = {
    "gpt-5-codex": {
        minVSCodeVersion: "1.104.1",
        supportedEndpoints: ["/responses"],
        preview: true,
        notes: "Preview model requiring VS Code 1.104.1 or newer. Only supports /responses endpoint."
    },
    "gpt-5": {
        minVSCodeVersion: "1.95.0",
        supportedEndpoints: ["/chat/completions", "/responses"],
        preview: false,
    },
    "gpt-5-mini": {
        minVSCodeVersion: "1.95.0",
        supportedEndpoints: ["/chat/completions", "/responses"],
        preview: false,
    },
    "o3": {
        minVSCodeVersion: "1.95.0",
        supportedEndpoints: ["/chat/completions", "/responses"],
        preview: true,
    },
    "o3-2025-04-16": {
        minVSCodeVersion: "1.95.0",
        supportedEndpoints: ["/chat/completions", "/responses"],
        preview: true,
    },
    "o4-mini": {
        minVSCodeVersion: "1.95.0",
        supportedEndpoints: ["/chat/completions", "/responses"],
        preview: true,
    },
    "o4-mini-2025-04-16": {
        minVSCodeVersion: "1.95.0",
        supportedEndpoints: ["/chat/completions", "/responses"],
        preview: true,
    },
};
exports.DEFAULT_MODEL_REQUIREMENTS = {
    minVSCodeVersion: "1.95.0",
    supportedEndpoints: ["/chat/completions", "/responses"],
    preview: false,
};
function getModelRequirements(model) {
    return exports.MODEL_VERSION_REQUIREMENTS[model] || exports.DEFAULT_MODEL_REQUIREMENTS;
}
function modelSupportsEndpoint(model, endpoint) {
    const requirements = getModelRequirements(model);
    return requirements.supportedEndpoints.includes(endpoint);
}
function getRecommendedEndpoint(model) {
    const requirements = getModelRequirements(model);
    return requirements.supportedEndpoints[0] || "/chat/completions";
}
function validateModelEndpoint(model, endpoint) {
    if (!modelSupportsEndpoint(model, endpoint)) {
        const requirements = getModelRequirements(model);
        throw new Error(`Model "${model}" does not support endpoint "${endpoint}". ` +
            `Supported endpoints: ${requirements.supportedEndpoints.join(", ")}`);
    }
}
function getMinVSCodeVersion(model) {
    const requirements = getModelRequirements(model);
    return requirements.minVSCodeVersion;
}
function isPreviewModel(model) {
    const requirements = getModelRequirements(model);
    return requirements.preview || false;
}
function getAdditionalHeaders(model) {
    const requirements = getModelRequirements(model);
    return requirements.additionalHeaders || {};
}
