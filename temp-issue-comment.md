## 🎉 Done! Migrated to New GitHub Copilot CLI with Programmatic Mode

**Version 4.0.0** is now ready! This is a **BREAKING CHANGE** as requested.

### ✅ What Changed

1. **New Copilot CLI**: Migrated from deprecated `gh copilot` extension to new standalone `copilot` CLI
2. **Programmatic Mode** (as you requested!): Uses `copilot -p "prompt" [tool-flags]`
3. **Unified Interface**: Single 'Query' operation instead of multiple operations
4. **Tool Approval**: Fine-grained control over what Copilot can execute automatically

### 🚀 New Features

- **Agentic Mode**: Copilot can plan and execute complex multi-step tasks
- **Tool Control**: Choose safety level (manual approval, shell-only, write-only, allow-all, custom)
- **Configurable Timeout**: Set max execution time
- **Better Errors**: Clear installation/auth messages

### 📦 Installation

```bash
npm install -g @github/copilot  # or brew install copilot-cli
copilot  # authenticate with /login command
```

### 📝 Migration

Old workflows need updates (node version 1→2):
- Old: Operation "suggest" + language "python"
- New: Single prompt: "Write a Python function that..."

See [CHANGELOG](https://github.com/sufficit/n8n-nodes-copilot/blob/main/CHANGELOG.md#400---2025-12-31--breaking-change) for full migration guide.

### ⚠️ Security

The new CLI can execute commands/modify files. Use appropriate tool approval setting for your use case. See [GitHub docs](https://docs.github.com/en/copilot/concepts/agents/about-copilot-cli#security-considerations).

Enjoy the programmatic mode! 🚀
