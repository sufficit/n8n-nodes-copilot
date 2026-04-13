# Release 4.4.6 - 📎 Automatic Binary File Handling

## Improved
- **GitHub Copilot OpenAI Node** - Enhanced file attachment handling:
  - **Automatic Binary Detection**: Now specifically asks for the "Input Binary Field" when "File" type is selected
  - **Multimodal Support**: Supports sending both text content AND image attachment in a single message
  - **Smart Defaults**: Defaults binary field name to 'data', preventing guessing errors
  - **Better Validation**: Provides clear error messages if the specified binary property is not found
