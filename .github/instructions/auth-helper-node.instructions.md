# GitHub Copilot Auth Helper Node - Usage Instructions

**Last Updated**: 2025-01-22  
**Version**: 3.31.0  
**Status**: ✅ Fully Functional

## Purpose

n8n node that generates an interactive HTML page for GitHub Copilot OAuth Device Flow authentication.

**Solves**: "How to implement Device Flow without modifying n8n core?"

## How It Works

### Concept

1. Add "GitHub Copilot Auth Helper" node to an n8n workflow
2. Node generates complete HTML page
3. Save HTML and open in browser
4. Page handles everything automatically:
   - Requests device code from GitHub
   - Shows code to copy
   - Opens GitHub automatically
   - Polls until you authorize
   - Displays token ready to copy
5. Copy token and use in n8n credential

### Advantages

- ✅ **No callback/webhook required** - Pure Device Flow with polling
- ✅ **Runs in browser** - Client-side JavaScript
- ✅ **No n8n core modifications** - Just a normal node
- ✅ **Beautiful interface** - Modern and intuitive design
- ✅ **Completely automatic** - User only needs to authorize
- ✅ **No command line** - Everything visual in browser

## Usage Methods

### Method 1: n8n Workflow (RECOMMENDED)

1. **Create workflow in n8n**:
   ```
   [Manual Trigger] → [GitHub Copilot Auth Helper] → [Execute]
   ```

2. **Execute the node**:
   - Node returns JSON with `html` field

3. **Copy HTML**:
   - Copy entire content of `html` field from output

4. **Save file**:
   - Create file `github-copilot-auth.html`
   - Paste copied HTML
   - Save

5. **Open in browser**:
   - Double-click HTML file
   - OR drag to browser
   - Follow instructions on page

6. **Get token**:
   - Click "Start"
   - Copy displayed code
   - Click "Open GitHub"
   - Authorize on GitHub
   - Wait (page polls automatically)
   - Copy token when it appears

7. **Use in n8n**:
   - Create credential "GitHub Copilot OAuth2 (with Helper)"
   - Paste token
   - Save

### Method 2: Email with HTML (ADVANCED)

If your n8n has Email node configured:

```
[Schedule Trigger]
    ↓
[GitHub Copilot Auth Helper]
    ↓
[Send Email]
  - To: your-email@example.com
  - Subject: "GitHub Copilot - Authentication Page"
  - Attachment: html (from previous output)
```

You receive HTML by email, save and open!

### Method 3: HTTP Response (IF USING WEBHOOK)

If you want to serve directly via webhook:

```
[Webhook Trigger]
    ↓
[GitHub Copilot Auth Helper]
    ↓
[Respond to Webhook]
  - Response Type: HTML
  - Body: {{ $json.html }}
```

Access webhook URL and page opens directly!

## Page Interface

### Modern Design

- 🎨 Beautiful gradient (purple/blue)
- 📱 Responsive (works on mobile)
- 🔢 Numbered and visual steps
- ⚡ Smooth animations
- ✅ Visual feedback for each action

### Visual Flow

```
┌─────────────────────────────────────┐
│  Step 1: Start Authentication      │
│  [▶️ Start]                         │
└─────────────────────────────────────┘
              ↓ (on click)
┌─────────────────────────────────────┐
│  Step 2: Copy the Code              │
│  ┌──────────────────────────────┐  │
│  │      A B C D - 1 2 3 4       │  │ ← Large clickable code
│  └──────────────────────────────┘  │
│  [📋 Copy Code]                     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Step 3: Authorize on GitHub        │
│  [🌐 Open GitHub]                   │
└─────────────────────────────────────┘
              ↓ (opens GitHub)
┌─────────────────────────────────────┐
│  Status: Checking...                │
│  (animated spinner)                 │
│  Attempt 1/180                      │
└─────────────────────────────────────┘
              ↓ (after authorization)
┌─────────────────────────────────────┐
│  ✅ Token Obtained Successfully!    │
│  ┌──────────────────────────────┐  │
│  │  gho_XXXXXXXXXXXXXXXXXXXX     │  │ ← Complete token
│  └──────────────────────────────┘  │
│  [📋 Copy Token]                    │
└─────────────────────────────────────┘
```

## Node Configuration

### Parameters

| Field | Default Value | Description |
|-------|---------------|-------------|
| **Client ID** | `01ab8ac9400c4e429b23` | Official VS Code Client ID |
| **Scopes** | `repo user:email` | Required permissions |
| **Output Format** | `htmlWithInstructions` | Output format |

### Output Formats

1. **Complete HTML File**:
   - Pure HTML only
   - Ready to save as `.html`

2. **HTML + Instructions** (default):
   - Complete HTML
   - + `instructions` field with step-by-step
   - + `clientId` and `scopes` fields for reference

### Output JSON

```json
{
  "html": "<!DOCTYPE html>...",
  "instructions": "1. Copy the HTML content below\n2. Save as...",
  "clientId": "01ab8ac9400c4e429b23",
  "scopes": "repo user:email"
}
```

## Security

### Device Flow OAuth is Secure

- ✅ **No client secret required** - Only public client ID
- ✅ **Explicit authorization** - User sees and authorizes
- ✅ **Token tied to user** - Cannot be reused by others
- ✅ **Expires in ~8 hours** - Periodic renewal necessary

### Standalone HTML

- ✅ **No external server** - Everything runs in browser
- ✅ **Direct requests to GitHub** - No intermediaries
- ✅ **Open source** - You can inspect all code
- ✅ **No tracking** - Does not collect data

## Usage Tips

### Tip 1: Create HTML Template

Save HTML once and reuse:

```bash
# Execute workflow
# Copy HTML
# Save as:
~/.n8n/github-copilot-auth.html

# Reuse whenever you need new token
```

### Tip 2: Create Browser Bookmark

Create a bookmark in browser that opens HTML directly.

### Tip 3: Serve via Webhook

Configure workflow with webhook to have permanent URL:

```
https://your-n8n.com/webhook/github-copilot-auth
```

### Tip 4: Document for Team

If your team uses n8n, document the process:

1. Access: `https://your-n8n.com/workflow/123`
2. Execute workflow "GitHub Copilot Auth"
3. Copy HTML from output
4. Save and open in browser
5. Follow steps on page

## Comparison with Other Solutions

| Aspect | Script `authenticate.js` | Auth Helper Node | Device Flow Credential |
|--------|-------------------------|------------------|------------------------|
| **Works Now** | ✅ Yes | ✅ Yes | ❌ No (requires n8n core) |
| **Interface** | ❌ Terminal | ✅ Browser (beautiful!) | ✅ n8n UI |
| **Ease** | ⚠️ Requires Node.js | ✅ Browser only | ✅ Integrated |
| **Automation** | ⚠️ Manual | ✅ Semi-automatic | ✅ Automatic (future) |
| **Dependencies** | Node.js installed | Browser only | Modified n8n core |

## References

- [GitHub OAuth Device Flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow)
- [n8n Node Development](https://docs.n8n.io/integrations/creating-nodes/)
- [OAuth 2.0 Device Flow Spec](https://datatracker.ietf.org/doc/html/rfc8628)

---

**Version**: 3.31.0  
**Author**: Sufficit Development Team
