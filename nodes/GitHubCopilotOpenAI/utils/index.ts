// OpenAI compatibility utilities
export * from "./types";

// Helper functions
export {
  mapOpenAIModelToCopilot,
  convertOpenAIMessagesToCopilot,
  convertCopilotResponseToOpenAI,
  parseOpenAIRequest,
  debugLog,
} from "./openaiCompat";
