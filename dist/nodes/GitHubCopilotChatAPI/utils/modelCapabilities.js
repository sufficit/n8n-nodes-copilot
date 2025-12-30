"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_CAPABILITIES = void 0;
exports.validateModelCapabilities = validateModelCapabilities;
exports.getSupportedModels = getSupportedModels;
exports.getModelInfo = getModelInfo;
exports.MODEL_CAPABILITIES = {
    'gpt-5': {
        supportsImages: true,
        supportsAudio: false,
        maxContextTokens: 200000,
        description: 'OpenAI GPT-5 with image support via GitHub Copilot API',
    },
    'gpt-5-mini': {
        supportsImages: true,
        supportsAudio: false,
        maxContextTokens: 128000,
        description: 'OpenAI GPT-5 Mini with image support via GitHub Copilot API',
    },
    'gpt-4.1-copilot': {
        supportsImages: true,
        supportsAudio: false,
        maxContextTokens: 128000,
        description: 'OpenAI GPT-4.1 with image support via GitHub Copilot API',
    },
    'claude-opus-4.1': {
        supportsImages: false,
        supportsAudio: false,
        maxContextTokens: 200000,
        description: 'Anthropic Claude Opus 4.1 - Text only via GitHub Copilot API',
    },
    'claude-3.5-sonnet': {
        supportsImages: false,
        supportsAudio: false,
        maxContextTokens: 200000,
        description: 'Anthropic Claude 3.5 Sonnet - Text only via GitHub Copilot API',
    },
    'gemini-2.5-pro': {
        supportsImages: true,
        supportsAudio: false,
        maxContextTokens: 1000000,
        description: 'Google Gemini 2.5 Pro with image support via GitHub Copilot API',
    },
    'gemini-2.0-flash': {
        supportsImages: true,
        supportsAudio: true,
        maxContextTokens: 1000000,
        description: 'Google Gemini 2.0 Flash with multimodal support via GitHub Copilot API',
    },
    'grok-code-fast-1': {
        supportsImages: false,
        supportsAudio: false,
        maxContextTokens: 128000,
        description: 'xAI Grok Code Fast 1 - Text only via GitHub Copilot API',
    },
    o3: {
        supportsImages: false,
        supportsAudio: false,
        maxContextTokens: 200000,
        description: 'OpenAI o3 - Text only via GitHub Copilot API',
    },
    'o3-mini': {
        supportsImages: false,
        supportsAudio: false,
        maxContextTokens: 128000,
        description: 'OpenAI o3-mini - Text only via GitHub Copilot API',
    },
};
function validateModelCapabilities(model, includeImage, includeAudio) {
    const capabilities = exports.MODEL_CAPABILITIES[model];
    if (!capabilities) {
        return {
            isValid: false,
            errorMessage: `Unknown model: ${model}. Please check if the model name is correct.`,
        };
    }
    const warnings = [];
    let isValid = true;
    let errorMessage;
    if (includeImage && !capabilities.supportsImages) {
        isValid = false;
        errorMessage = `Model ${model} does not support image input. Please disable image upload or choose a different model (e.g., GPT-5, Gemini 2.5 Pro).`;
    }
    if (includeAudio && !capabilities.supportsAudio) {
        isValid = false;
        errorMessage = `Model ${model} does not support audio input. Please disable audio upload or choose a different model (e.g., GPT-5, Gemini 2.5 Pro).`;
    }
    if (model.includes('claude') && (includeImage || includeAudio)) {
        warnings.push('Claude models typically work best with text-only input via GitHub Copilot API.');
    }
    if (model.includes('grok') && (includeImage || includeAudio)) {
        warnings.push('Grok models are optimized for coding tasks and work best with text input.');
    }
    return {
        isValid,
        errorMessage,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}
function getSupportedModels(requireImages = false, requireAudio = false) {
    return Object.entries(exports.MODEL_CAPABILITIES)
        .filter(([, capabilities]) => {
        if (requireImages && !capabilities.supportsImages)
            return false;
        if (requireAudio && !capabilities.supportsAudio)
            return false;
        return true;
    })
        .map(([model]) => model);
}
function getModelInfo(model) {
    return exports.MODEL_CAPABILITIES[model] || null;
}
