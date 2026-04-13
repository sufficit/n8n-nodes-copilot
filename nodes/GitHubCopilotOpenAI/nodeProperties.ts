import { INodeProperties } from 'n8n-workflow';
import { CHAT_COMPLETION_PROPERTIES } from './properties/chatCompletionProperties';
import { MODELS_PROPERTIES } from './properties/modelsProperties';

/** Adds operation: [value] to the displayOptions.show of each property. */
function forOperation(props: INodeProperties[], operation: string): INodeProperties[] {
return props.map((p) => ({
...p,
displayOptions: {
...p.displayOptions,
show: {
...p.displayOptions?.show,
operation: [operation],
},
},
}));
}

const OPERATION_PROPERTY: INodeProperties = {
displayName: 'Operation',
name: 'operation',
type: 'options',
noDataExpression: true,
options: [
{
name: 'Chat Completions',
value: 'chatCompletions',
description: 'Send messages and receive AI completions',
action: 'Chat Completions',
},
{
name: 'List Models',
value: 'listModels',
description: 'Return available models in OpenAI-compatible format (GET /v1/models)',
action: 'List Models',
},
],
default: 'chatCompletions',
};

export const nodeProperties: INodeProperties[] = [
OPERATION_PROPERTY,
...forOperation(CHAT_COMPLETION_PROPERTIES, 'chatCompletions'),
...forOperation(MODELS_PROPERTIES, 'listModels'),
];
