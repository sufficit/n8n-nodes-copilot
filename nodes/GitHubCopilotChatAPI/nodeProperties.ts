import { INodeProperties } from "n8n-workflow";
import { DEFAULT_MODELS } from "../../shared/models/GitHubCopilotModels";
import { CHAT_MODEL_PROPERTIES } from "../../shared/properties/ModelProperties";
import { loadAvailableModels } from "../../shared/models/DynamicModelLoader";

export const nodeProperties: INodeProperties[] = [
  {
    displayName: "Operation",
    name: "operation",
    type: "options",
    noDataExpression: true,
    options: [
      {
        name: "Chat Completion",
        value: "chat",
        description: "Send messages to GitHub Copilot Chat API",
      },
    ],
    default: "chat",
  },
  // Model properties (shared across nodes)
  ...CHAT_MODEL_PROPERTIES,
  {
    displayName: "Message",
    name: "message",
    type: "string",
    typeOptions: {
      rows: 4,
    },
    default: "",
    placeholder: "What can I help you with?",
    description: "The message to send to the AI model",
  },
  {
    displayName: "System Message",
    name: "systemMessage",
    type: "string",
    typeOptions: {
      rows: 3,
    },
    default: "",
    placeholder: "You are a helpful assistant...",
    description: "System message to set the behavior of the AI model",
  },
  // Image options
  {
    displayName: "Include Image",
    name: "includeMedia",
    type: "boolean",
    default: false,
    description:
			"Whether to include an image file in the message. Supported formats: PNG, JPEG, GIF, WebP.",
  },
  {
    displayName: "Image Source",
    name: "mediaSource",
    type: "options",
    displayOptions: {
      show: {
        includeMedia: [true],
      },
    },
    options: [
      {
        name: "Manual Input",
        value: "manual",
        description: "Provide image as base64 string or file path",
      },
      {
        name: "URL",
        value: "url",
        description: "Download image from URL",
      },
      {
        name: "Binary Data",
        value: "binary",
        description: "Use binary data from previous node",
      },
    ],
    default: "manual",
    description: "Source of the image data",
  },
  {
    displayName: "Image File",
    name: "mediaFile",
    type: "string",
    displayOptions: {
      show: {
        includeMedia: [true],
        mediaSource: ["manual"],
      },
    },
    default: "",
    placeholder: "Paste base64 string or file path",
    description:
			"Image file as base64 string or file path. Supported formats: PNG, JPEG, GIF, WebP.",
  },
  {
    displayName: "Image URL",
    name: "mediaUrl",
    type: "string",
    displayOptions: {
      show: {
        includeMedia: [true],
        mediaSource: ["url"],
      },
    },
    default: "",
    placeholder: "https://example.com/image.jpg",
    description: "URL of the image file to download. Supported formats: PNG, JPEG, GIF, WebP.",
  },
  {
    displayName: "Image Binary Property",
    name: "mediaBinaryProperty",
    type: "string",
    displayOptions: {
      show: {
        includeMedia: [true],
        mediaSource: ["binary"],
      },
    },
    default: "data",
    placeholder: "data",
    description: "Name of the binary property containing the image file",
  },
  // Advanced options
  {
    displayName: "Advanced Options",
    name: "advancedOptions",
    type: "collection",
    placeholder: "Add Field",
    default: {},
    options: [
      {
        displayName: "Temperature",
        name: "temperature",
        type: "number",
        typeOptions: {
          minValue: 0,
          maxValue: 2,
          numberPrecision: 2,
        },
        default: 1,
        description: "Controls randomness of the response. Higher values make output more random.",
      },
      {
        displayName: "Max Tokens",
        name: "max_tokens",
        type: "number",
        typeOptions: {
          minValue: 1,
          maxValue: 128000,
        },
        default: 4096,
        description: "Maximum number of tokens to generate in the response",
      },
      {
        displayName: "Top P",
        name: "top_p",
        type: "number",
        typeOptions: {
          minValue: 0,
          maxValue: 1,
          numberPrecision: 2,
        },
        default: 1,
        description: "Alternative to temperature, controls diversity via nucleus sampling",
      },
      {
        displayName: "Auto Retry on 403 Error",
        name: "enableRetry",
        type: "boolean",
        default: true,
        description:
					"Automatically retry requests when hitting TPM (Transactions Per Minute) quota limits (HTTP 403)",
      },
      {
        displayName: "Max Retry Attempts",
        name: "maxRetries",
        type: "number",
        default: 3,
        description: "Maximum number of retry attempts for 403 errors",
        displayOptions: {
          show: {
            enableRetry: [true],
          },
        },
      },
    ],
  },
];
