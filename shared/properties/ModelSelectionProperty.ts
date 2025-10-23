/**
 * Model Selection Property
 * 
 * Reusable property for model selection across all GitHub Copilot nodes.
 * Supports both dynamic model loading and manual input.
 */

import { INodeProperties } from "n8n-workflow";
import { DEFAULT_MODELS } from "../models/GitHubCopilotModels";

/**
 * Model selection property with dynamic loading and manual input
 * 
 * Features:
 * - Dynamic model loading from user's subscription
 * - Manual input for custom/new models
 * - Refresh button to update model list
 * - Fallback to default models if loading fails
 */
export const modelSelectionProperty: INodeProperties = {
  displayName: "Model",
  name: "model",
  type: "options",
  typeOptions: {
    loadOptionsMethod: "getAvailableModels",
    loadOptionsDependsOn: ["refresh"], // Triggers reload when refresh changes
  },
  default: DEFAULT_MODELS.GENERAL,
  required: true,
  description: "Select a model from your subscription or enter a custom model name",
  placeholder: "Select model or type custom name (e.g., gpt-4o, claude-3.5-sonnet)",
  hint: "Models are loaded based on your GitHub Copilot subscription. Use the refresh button to update the list.",
  // Allow manual input - user can type any model name
  validateType: "string",
  ignoreValidationDuringExecution: false,
};

/**
 * Optional refresh button property
 * Place this after the model property to add a refresh button
 */
export const modelRefreshProperty: INodeProperties = {
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
      operation: ["chat"], // Show only in chat operation
    },
  },
};

/**
 * Helper property to trigger model list refresh
 * This is a hidden field that changes value when refresh button is clicked
 */
export const refreshTriggerProperty: INodeProperties = {
  displayName: "Refresh Trigger",
  name: "refresh",
  type: "hidden",
  default: 0,
  description: "Internal field to trigger model list refresh",
};
