# Release 4.4.9 - 🐛 Schema Validation Fix

## Fixed
- **GitHub Copilot OpenAI Node** - Critical fix for API Schema Validation Error (400 Bad Request):
  - Removed invalid `type` property from the root message object which was violating the OpenAI API spec.
  - Resolved `invalid_request_body` error when sending multimodal messages (text + image).
  - Ensures strict compliance with OpenAI Chat Completions API format ` { role: "user", content: [...] }`.
