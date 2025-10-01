import { IDataObject, IExecuteFunctions } from "n8n-workflow";

export interface OpenAIMessage {
	role: "system" | "user" | "assistant" | "tool";
	content: string;
	name?: string;
	tool_calls?: ToolCall[];
	tool_call_id?: string;
}

export interface ToolCall {
	id: string;
	type: "function";
	function: {
		name: string;
		arguments: string;
	};
}

export interface OpenAITool {
	type: "function";
	function: {
		name: string;
		description: string;
		parameters: IDataObject;
	};
}

export interface OpenAIRequest {
	model: string;
	messages: OpenAIMessage[];
	tools?: OpenAITool[];
	tool_choice?: "auto" | "none" | "required" | { type: "function"; function: { name: string } };
	response_format?: { type: "text" | "json_object" };
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
	frequency_penalty?: number;
	presence_penalty?: number;
	stop?: string | string[];
	stream?: boolean;
	seed?: number;
	user?: string;
}

export interface OpenAIResponse {
	id: string;
	object: "chat.completion";
	created: number;
	model: string;
	choices: Array<{
		index: number;
		message: {
			role: "assistant";
			content: string | null;
			tool_calls?: ToolCall[];
		};
		finish_reason: "stop" | "length" | "tool_calls" | "content_filter";
	}>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

export interface CopilotRequest {
	model: string;
	message: string;
	system_message?: string;
	temperature?: number;
	max_tokens?: number;
	tools?: OpenAITool[];
	tool_choice?: string;
}

export interface CopilotResponse {
	message: string;
	model: string;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
	finish_reason: string;
	tool_calls?: ToolCall[];
}

/**
 * Maps OpenAI model names to GitHub Copilot model names
 */
export function mapOpenAIModelToCopilot(openaiModel: string): string {
  const modelMappings: Record<string, string> = {
    "gpt-4": "gpt-4o",
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
    "gpt-4-turbo": "gpt-4o",
    "gpt-3.5-turbo": "gpt-4o-mini",
    "claude-3-5-sonnet": "claude-3.5-sonnet",
    "claude-3-haiku": "claude-3-haiku",
    "claude-3-opus": "claude-3-opus",
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-1.5-flash": "gemini-1.5-flash",
    "o1-preview": "o1-preview",
    "o1-mini": "o1-mini",
  };

  return modelMappings[openaiModel] || "gpt-4o";
}

/**
 * Converts OpenAI messages array to GitHub Copilot format
 */
export function convertOpenAIMessagesToCopilot(messages: OpenAIMessage[]): {
	message: string;
	system_message?: string;
} {
  let systemMessage = "";
  const userMessages: string[] = [];
  const assistantMessages: string[] = [];

  for (const msg of messages) {
    switch (msg.role) {
    case "system":
      systemMessage += (systemMessage ? "\n\n" : "") + msg.content;
      break;
    case "user":
      userMessages.push(msg.content);
      break;
    case "assistant":
      assistantMessages.push(msg.content);
      break;
    }
  }

  // Build conversation context for Copilot
  let conversationContext = "";

  // Interleave user and assistant messages to maintain conversation flow
  const maxLength = Math.max(userMessages.length, assistantMessages.length);
  for (let i = 0; i < maxLength - 1; i++) {
    if (i < userMessages.length - 1) {
      conversationContext += `User: ${userMessages[i]}\n`;
    }
    if (i < assistantMessages.length) {
      conversationContext += `Assistant: ${assistantMessages[i]}\n`;
    }
  }

  // The final user message is the actual message to send
  const finalUserMessage = userMessages[userMessages.length - 1] || "";

  // Combine conversation context with final message
  const message = conversationContext
    ? `${conversationContext}\nUser: ${finalUserMessage}`
    : finalUserMessage;

  return {
    message,
    system_message: systemMessage || undefined,
  };
}

/**
 * Converts GitHub Copilot response to OpenAI format
 */
export function convertCopilotResponseToOpenAI(
  copilotResponse: CopilotResponse,
  model: string,
): OpenAIResponse {
  const timestamp = Math.floor(Date.now() / 1000);

  return {
    id: `chatcmpl-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    object: "chat.completion",
    created: timestamp,
    model: model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: copilotResponse.message,
          tool_calls: copilotResponse.tool_calls,
        },
        finish_reason: mapFinishReason(copilotResponse.finish_reason),
      },
    ],
    usage: {
      prompt_tokens: copilotResponse.usage.prompt_tokens,
      completion_tokens: copilotResponse.usage.completion_tokens,
      total_tokens: copilotResponse.usage.total_tokens,
    },
  };
}

/**
 * Maps GitHub Copilot finish reasons to OpenAI format
 */
function mapFinishReason(
  copilotReason: string,
): "stop" | "length" | "tool_calls" | "content_filter" {
  switch (copilotReason) {
  case "stop":
  case "end_turn":
    return "stop";
  case "max_tokens":
  case "length":
    return "length";
  case "tool_calls":
  case "function_call":
    return "tool_calls";
  case "content_filter":
  case "safety":
    return "content_filter";
  default:
    return "stop";
  }
}

/**
 * Validates and parses OpenAI request from n8n parameters
 */
export function parseOpenAIRequest(context: IExecuteFunctions, itemIndex: number): OpenAIRequest {
  const model = context.getNodeParameter("model", itemIndex, "gpt-4o") as string;
  const messagesParam = context.getNodeParameter("messages", itemIndex, {
    message: [],
  }) as IDataObject;
  const tools = context.getNodeParameter("tools", itemIndex, "") as string;
  const toolChoice = context.getNodeParameter("tool_choice", itemIndex, "auto") as string;
  const responseFormat = context.getNodeParameter("response_format", itemIndex, "text") as string;
  const temperature = context.getNodeParameter("temperature", itemIndex, 1) as number;
  const maxTokens = context.getNodeParameter("max_tokens", itemIndex, "") as number;
  const topP = context.getNodeParameter("top_p", itemIndex, 1) as number;
  const frequencyPenalty = context.getNodeParameter("frequency_penalty", itemIndex, 0) as number;
  const presencePenalty = context.getNodeParameter("presence_penalty", itemIndex, 0) as number;
  const stop = context.getNodeParameter("stop", itemIndex, "") as string;
  const stream = context.getNodeParameter("stream", itemIndex, false) as boolean;
  const seed = context.getNodeParameter("seed", itemIndex, "") as number;
  const user = context.getNodeParameter("user", itemIndex, "") as string;

  // Parse messages
  const messages: OpenAIMessage[] = [];
  if (messagesParam.message && Array.isArray(messagesParam.message)) {
    for (const msg of messagesParam.message as IDataObject[]) {
      messages.push({
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content as string,
      });
    }
  }

  // Build request object
  const request: OpenAIRequest = {
    model,
    messages,
    temperature,
    top_p: topP,
    frequency_penalty: frequencyPenalty,
    presence_penalty: presencePenalty,
    stream,
  };

  // Add optional parameters
  if (tools) {
    try {
      request.tools = JSON.parse(tools);
      request.tool_choice = toolChoice as
				| "auto"
				| "none"
				| "required"
				| { type: "function"; function: { name: string } };
    } catch (error) {
      throw new Error(
        `Invalid tools JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  if (responseFormat !== "text") {
    request.response_format = { type: responseFormat as "json_object" };
  }

  if (maxTokens) {
    request.max_tokens = maxTokens;
  }

  if (stop) {
    try {
      request.stop = JSON.parse(stop);
    } catch {
      request.stop = stop;
    }
  }

  if (seed) {
    request.seed = seed;
  }

  if (user) {
    request.user = user;
  }

  return request;
}

/**
 * Logs debug information if debug mode is enabled
 */
export function debugLog(
  context: IExecuteFunctions,
  itemIndex: number,
  message: string,
  data?: unknown,
): void {
  const advancedOptions = context.getNodeParameter("advancedOptions", itemIndex, {}) as IDataObject;
  if (advancedOptions.debugMode) {
    console.log(
      `[GitHub Copilot OpenAI Debug] ${message}`,
      data ? JSON.stringify(data, null, 2) : "",
    );
  }
}
