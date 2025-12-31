# TODO - Future Enhancements

> **Node**: GitHub Copilot CLI (`n8n-nodes-github-copilot`)  
> **Current Version**: 4.1.2  
> **Node Type**: Community node for n8n workflow automation

## New Operations

### 1. Interactive Session Management
- **Resume Session**: Resume most recent or specific session using `--resume` or `--continue`
- **List Sessions**: List all available sessions to resume
- **Session Info**: Get information about a specific session (duration, commands executed, etc.)

### 2. Version & Configuration
- **Version Info**: Return detailed version information (build, commit, installed modules)
- **Config View**: Display current CLI configuration (`~/.copilot/config.json`)
- **Config Update**: Update specific configuration values

### 3. Custom Instructions & Skills
- **Add Custom Instructions**: Add project-specific instructions for Copilot
- **List Skills**: List available Copilot skills
- **Install Skill**: Install a new skill from repository
- **Remove Skill**: Remove an installed skill

### 4. MCP Server Management
- **List MCP Servers**: List configured MCP servers
- **Add MCP Server**: Add new MCP server configuration
- **Remove MCP Server**: Remove MCP server
- **Test MCP Connection**: Test connectivity to MCP server

### 5. Custom Agents
- **List Agents**: List available custom agents
- **Create Agent**: Create new custom agent with specific configuration
- **Update Agent**: Update agent configuration
- **Delete Agent**: Remove custom agent

### 6. History & Logs
- **Query History**: List recent queries and results
- **Session History**: Get history of all sessions
- **Export Logs**: Export CLI logs to file

### 7. Trust & Security
- **List Trusted Folders**: Show all permanently trusted folders
- **Add Trusted Folder**: Add folder to trusted list
- **Remove Trusted Folder**: Remove folder from trusted list
- **Check Trust Status**: Check if current directory is trusted

## Improvements

### Authentication
- [ ] Support for multiple GitHub accounts/tokens
- [ ] Automatic token refresh when expired
- [ ] Better error messages for authentication failures

### Tool Approval
- [ ] Add `--deny-all-tools` option for maximum security
- [ ] Tool usage history/audit log
- [ ] Custom approval workflows

### Output Formatting
- [ ] Add option to return structured JSON only (remove narrative text)
- [ ] Support for markdown formatting in output
- [ ] Export output to different formats (HTML, PDF, etc.)

### Performance
- [ ] Implement response caching for repeated queries
- [ ] Add streaming support for long-running queries
- [ ] Parallel query execution for batch operations

### Error Handling
- [ ] Retry logic with exponential backoff
- [ ] Better timeout handling with partial results
- [ ] Detailed error codes and troubleshooting guides

## Integration Ideas

### Git Integration
- **Commit Analysis**: Analyze commits and generate summaries
- **PR Review**: Review pull request changes
- **Branch Comparison**: Compare branches and suggest merge strategies

### CI/CD Integration
- **Pipeline Analysis**: Analyze CI/CD pipeline failures
- **Test Generation**: Generate tests based on code changes
- **Deployment Validation**: Validate deployment configurations

### Code Quality
- **Code Review**: Review code for best practices and security issues
- **Refactoring Suggestions**: Suggest refactoring opportunities
- **Dependency Analysis**: Analyze and update project dependencies

## Documentation

- [ ] Add video tutorials for common use cases
- [ ] Create troubleshooting guide
- [ ] Add examples for each operation
- [ ] Document best practices for tool approval
- [ ] Create migration guide from v3.x to v4.x

## Testing

- [ ] Add unit tests for all operations
- [ ] Add integration tests with mock CLI
- [ ] Add E2E tests with real CLI
- [ ] Performance benchmarking

## Community Requests

Track feature requests from GitHub issues here.

---

**Note**: This is a living document. Add new ideas as they come up!
