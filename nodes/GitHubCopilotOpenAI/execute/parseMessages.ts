import { IDataObject, IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { getImageMimeType } from '../../GitHubCopilotChatAPI/utils';

export interface ParsedMessages {
	messages: Array<{ role: string; content: any }>;
	requestBodyFromJson: IDataObject | undefined;
}

/**
 * Parses messages from JSON input mode (string or direct object/array).
 */
function parseJsonMode(messagesJson: any): ParsedMessages {
	let parsed: any;

	if (typeof messagesJson === 'object') {
		parsed = messagesJson;
		console.log('📥 Received messages as direct object/array (no parsing needed)');
	} else {
		parsed = JSON.parse(messagesJson as string);
		console.log('📥 Parsed messages from JSON string');
	}

	if (Array.isArray(parsed)) {
		return { messages: parsed, requestBodyFromJson: undefined };
	} else if (parsed.messages && Array.isArray(parsed.messages)) {
		console.log('📥 Full OpenAI request body received:', JSON.stringify(parsed, null, 2));
		return { messages: parsed.messages, requestBodyFromJson: parsed };
	}
	return { messages: parsed, requestBodyFromJson: undefined };
}

/**
 * Processes a binary file message into OpenAI vision format.
 */
async function processBinaryMessage(
	context: IExecuteFunctions,
	items: INodeExecutionData[],
	msg: IDataObject,
	message: any,
	itemIndex: number,
): Promise<void> {
	const keyToUse = (msg.binaryPropertyName as string) || 'data';
	const binaryKeyData = items[itemIndex].binary;

	if (!binaryKeyData?.[keyToUse]) {
		const available = binaryKeyData ? Object.keys(binaryKeyData).join(', ') : 'none';
		throw new NodeOperationError(
			context.getNode(),
			`Binary property '${keyToUse}' not found. Available binary properties: ${available}`,
			{ itemIndex },
		);
	}

	try {
		const binaryData = binaryKeyData[keyToUse];
		let mimeType = binaryData.mimeType || 'application/octet-stream';
		const buffer = await context.helpers.getBinaryDataBuffer(itemIndex, keyToUse);

		// Detect/fix mime type for Vision API
		if (!mimeType.startsWith('image/')) {
			const detected = getImageMimeType(buffer);
			if (detected !== 'application/octet-stream') {
				mimeType = detected;
			} else {
				console.warn(
					`⚠️ Could not detect image type for '${keyToUse}', using image/jpeg fallback`,
				);
				if (mimeType === 'application/octet-stream') mimeType = 'image/jpeg';
			}
		}

		// Force image/* prefix for schema compliance
		if (!mimeType.startsWith('image/')) {
			console.warn(`⚠️ Forcing '${mimeType}' to 'image/jpeg' for schema compliance`);
			mimeType = 'image/jpeg';
		}

		const base64 = buffer.toString('base64');
		const dataUrl = `data:${mimeType};base64,${base64}`;
		const contentArray: any[] = [];
		const caption = msg.caption as string;

		if (caption?.trim()) {
			contentArray.push({ type: 'text', text: caption });
		} else if (
			message.content?.trim() &&
			message.content !== '[object Object]'
		) {
			contentArray.push({ type: 'text', text: message.content });
		}

		contentArray.push({ type: 'image_url', image_url: { url: dataUrl, detail: 'auto' } });

		message.role = 'user';
		message.content = contentArray;
		delete message.type;

		console.log(`📎 Attached binary file '${keyToUse}' (${mimeType}) as image_url`);
	} catch (err) {
		if (err instanceof NodeOperationError) throw err;
		const errorMessage = err instanceof Error ? err.message : String(err);
		throw new NodeOperationError(
			context.getNode(),
			`Failed to read binary file '${keyToUse}': ${errorMessage}`,
			{ itemIndex },
		);
	}
}

/**
 * Parses messages from manual UI input mode.
 */
async function parseManualMode(
	context: IExecuteFunctions,
	items: INodeExecutionData[],
	i: number,
): Promise<Array<{ role: string; content: any }>> {
	const messagesParam = context.getNodeParameter('messages', i, { message: [] }) as IDataObject;
	console.log('📥 Manual mode - messagesParam:', JSON.stringify(messagesParam, null, 2));

	const messages: Array<{ role: string; content: any }> = [];

	if (messagesParam.message && Array.isArray(messagesParam.message)) {
		for (const msg of messagesParam.message as IDataObject[]) {
			const message: any = {
				role: msg.role as string,
				content: msg.content as string,
			};

			const msgType = (msg.type as string) || 'text';

			if (msgType === 'file_binary') {
				await processBinaryMessage(context, items, msg, message, i);
			} else if (msgType === 'file') {
				// Legacy: type='file' for backward compatibility
				message.type = 'file';
			}

			messages.push(message);
		}
	}

	console.log('📥 Manual mode - parsed messages:', JSON.stringify(messages, null, 2));
	return messages;
}

/**
 * Validates that messages don't use unsupported format (file inside content array).
 */
export function validateMessages(
	messages: Array<{ role: string; content: any }>,
	context: IExecuteFunctions,
	itemIndex: number,
): void {
	for (const msg of messages) {
		if (Array.isArray((msg as any).content)) {
			for (const contentItem of (msg as any).content) {
				if (contentItem.type === 'file') {
					throw new NodeOperationError(
						context.getNode(),
						`❌ GitHub Copilot API Error: File attachments cannot be used inside 'content' array.\n\n` +
							`✅ CORRECT FORMAT (GitHub Copilot - message level):\n` +
							`[{"role": "user", "content": "data:image/png;base64,...", "type": "file"}]`,
						{ itemIndex },
					);
				}
			}
		}
	}
}

/**
 * Normalizes message content: auto-converts plain objects to JSON strings.
 */
export function normalizeMessages(messages: Array<{ role: string; content: any }>): void {
	for (let idx = 0; idx < messages.length; idx++) {
		const msg = messages[idx] as any;
		if (
			msg.content !== null &&
			msg.content !== undefined &&
			typeof msg.content === 'object' &&
			!Array.isArray(msg.content)
		) {
			msg.content = JSON.stringify(msg.content, null, 2);
			console.log(`🔄 Auto-converted message[${idx}].content from object to JSON string`);
		}
	}
}

/**
 * Main entry point: parses, validates and normalizes messages based on input mode.
 */
export async function parseMessages(
	context: IExecuteFunctions,
	items: INodeExecutionData[],
	i: number,
): Promise<ParsedMessages> {
	const messagesInputMode = context.getNodeParameter('messagesInputMode', i, 'manual') as string;

	let result: ParsedMessages;

	if (messagesInputMode === 'json') {
		const messagesJson = context.getNodeParameter('messagesJson', i, '[]');
		try {
			result = parseJsonMode(messagesJson);
		} catch (error) {
			throw new Error(
				`Failed to parse messages JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	} else {
		const messages = await parseManualMode(context, items, i);
		result = { messages, requestBodyFromJson: undefined };
	}

	if (result.messages.length === 0) {
		result.messages.push({ role: 'user', content: 'Hello! How can you help me?' });
	}

	console.log('📤 Final messages being sent to API:', JSON.stringify(result.messages, null, 2));

	validateMessages(result.messages, context, i);
	normalizeMessages(result.messages);

	return result;
}
