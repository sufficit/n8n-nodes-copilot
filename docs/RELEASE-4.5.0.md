# Release 4.5.0 - List Models Operation (OpenAI Node)

## New Features

- **GitHub Copilot OpenAI Node** — Added new `List Models` operation (equivalent to OpenAI `GET /v1/models`):
  - Returns all models available via GitHub Copilot API in OpenAI-compatible format
  - Filter options: `all`, `enabled` (default), `chat`, `embeddings`
  - Response includes `_meta` block with totals and filter applied
  - Subtitle in n8n UI dynamically shows operation name or model depending on selected operation

## Refactoring

- **GitHubCopilotOpenAI** node internals split into focused modules (~400 lines each):
  - `execute/chatCompletion.ts` — chat completion execution logic
  - `execute/parseMessages.ts` — message parsing and normalization
  - `execute/listModels.ts` — list models operation
  - `utils/modelsApi.ts` — fetch models in OpenAI format
  - `properties/chatCompletionProperties.ts` — chat UI properties
  - `properties/modelsProperties.ts` — models filter property
  - `nodeProperties.ts` — operation selector with `forOperation()` helper

## Other Changes

- Moved all `RELEASE-*.md` files to `docs/` folder
- Updated `RELEASES.md` with correct workflow trigger reference
