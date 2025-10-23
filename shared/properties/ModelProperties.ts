/**
 * Shared Model Properties for GitHub Copilot Nodes
 *
 * Provides consistent model selection properties across all GitHub Copilot nodes.
 * All nodes now use the simplified CHAT_MODEL_PROPERTIES for uniform interface.
 */

import { INodeProperties } from "n8n-workflow";
import { DEFAULT_MODELS } from "../models/GitHubCopilotModels";

/**
 * Chat Model Property (for all nodes)
 * Simplified version that allows both list selection and manual entry
 */
export const CHAT_MODEL_PROPERTY: INodeProperties = {
  displayName: "Model",
  name: "model",
  type: "options",
  typeOptions: {
    loadOptionsMethod: "getAvailableModels",
  },
  default: DEFAULT_MODELS.GENERAL,
  description: "Select the GitHub Copilot model to use (loaded dynamically based on your subscription)",
};

/**
 * Manual Model Entry Property
 * Appears when user selects "__manual__" from the dynamic dropdown
 */
export const MANUAL_MODEL_PROPERTY: INodeProperties = {
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

/**
 * Chat Model Properties Set (used by all nodes)
 * Simplified and consistent interface for all GitHub Copilot nodes
 */
export const CHAT_MODEL_PROPERTIES: INodeProperties[] = [
  CHAT_MODEL_PROPERTY,
  MANUAL_MODEL_PROPERTY,
];