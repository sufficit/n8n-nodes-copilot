# Release 4.4.8 - 🎨 Enhanced UI for Binary Files

## Improved
- **GitHub Copilot OpenAI Node** - Improved user experience for file uploads:
  - **Dynamic UI**: Hidden the main `Content` field when `File (Binary)` is selected to avoid confusion with `[object Object]` values.
  - **New Caption Field**: Added a dedicated `Caption` field for image prompts when using binary mode.
  - **Robust Handling**: Automatically ignores `[object Object]` strings if they accidentally slip into the content payload.
  - **Error Prevention**: Fixes `400 Bad Request` errors caused by malformed text content in multimodal messages.
