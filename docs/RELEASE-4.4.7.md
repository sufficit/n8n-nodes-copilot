# Release 4.4.7 - 🔄 Legacy File Support & Binary Mode

## Improved
- **GitHub Copilot OpenAI Node** - Enhanced file attachment flexibility:
  - **Restored Compatibility**: `File (URL / Base64)` option restored for manual image inputs (legacy behavior)
  - **New Option**: `File (Binary)` explicitly separates binary file handling from text inputs
  - **Conditional UI**: "Input Binary Field" only appears when `File (Binary)` is selected, keeping the UI clean
  - **Multimodal Support**: Both modes support multimodal messages (text + image)

## Fixed
- Fixed regression where legacy file inputs were being treated as missing binary files
