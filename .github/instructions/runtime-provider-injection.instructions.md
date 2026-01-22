# GitHub Copilot Runtime Provider Injection - Usage Instructions

**Version**: 202501220730  
**Purpose**: Enable GitHub Copilot to appear in n8n v2+ Chat Hub providers list via runtime injection  
**Status**: Experimental - Use with caution

## 🎯 Overview

This feature allows GitHub Copilot to appear in the n8n v2 Chat Hub providers list (alongside OpenAI, Anthropic, etc.) without modifying n8n core code.

**How it works**:
1. Detects if running in n8n v2 or higher
2. If v2+ detected, injects GitHub Copilot into Chat Hub provider registry
3. If v1.x detected, injection is skipped (uses workflow agents approach instead)

## ⚠️ Important Warnings

**This is advanced runtime modification!**

- ⚠️ **Experimental feature** - may break with n8n updates
- ⚠️ **Not officially supported** by n8n team
- ⚠️ **Test thoroughly** after each n8n upgrade
- ⚠️ **May stop working** if n8n changes internal APIs
- ⚠️ **Use at your own risk** in production environments

**When to use**:
- ✅ You want GitHub Copilot in the Chat Hub providers list
- ✅ You're comfortable with experimental features
- ✅ You can monitor and test after n8n updates

**When NOT to use**:
- ❌ You need guaranteed stability
- ❌ You can't test after updates
- ❌ You prefer the safer workflow agents approach

## 🚀 Setup

### Option 1: Automatic Injection (Recommended for Testing)

Set environment variables before starting n8n:

```bash
# Enable auto-injection on module load
export GITHUB_COPILOT_AUTO_INJECT=true

# Enable debug logging (optional)
export GITHUB_COPILOT_DEBUG=true

# Start n8n
n8n start
```

Windows:
```powershell
$env:GITHUB_COPILOT_AUTO_INJECT = "true"
$env:GITHUB_COPILOT_DEBUG = "true"
n8n start
```

### Option 2: Manual Injection (Recommended for Production)

Create a startup script that calls injection manually:

**File**: `inject-github-copilot.js`

```javascript
const { injectGitHubCopilotProvider, getInjectionStatus } = require('n8n-nodes-copilot/shared');

// Inject GitHub Copilot provider
const status = injectGitHubCopilotProvider({
  debug: process.env.GITHUB_COPILOT_DEBUG === 'true'
});

// Log result
console.log('GitHub Copilot Provider Injection Status:');
console.log(`  n8n Version: ${status.n8nVersion}`);
console.log(`  Chat Hub Available: ${status.chatHubAvailable}`);
console.log(`  Success: ${status.success}`);

if (status.error) {
  console.log(`  Error: ${status.error}`);
}

if (status.modifications.length > 0) {
  console.log(`  Modifications:`);
  status.modifications.forEach(mod => console.log(`    - ${mod}`));
}

// Exit with appropriate code
process.exit(status.success ? 0 : 1);
```

Run before starting n8n:
```bash
node inject-github-copilot.js && n8n start
```

### Option 3: Programmatic Injection

In your custom n8n setup script:

```typescript
import { 
  injectGitHubCopilotProvider, 
  isN8nV2OrHigher 
} from 'n8n-nodes-copilot/shared';

// Check version first
if (isN8nV2OrHigher()) {
  console.log('n8n v2+ detected, injecting GitHub Copilot provider...');
  
  const status = injectGitHubCopilotProvider({ debug: true });
  
  if (status.success) {
    console.log('✓ GitHub Copilot provider injected successfully!');
  } else {
    console.warn('✗ Failed to inject GitHub Copilot provider:', status.error);
  }
} else {
  console.log('n8n v1.x detected, using workflow agents approach');
}
```

## 🔍 Verification

### Check Injection Status

```javascript
const { getInjectionStatus, isProviderInjected } = require('n8n-nodes-copilot/shared');

// Check if injected
console.log('Provider injected:', isProviderInjected());

// Get detailed status
const status = getInjectionStatus();
console.log('Injection status:', status);
```

### Verify in n8n UI

1. Open n8n v2 instance
2. Navigate to Chat Hub
3. Open model selector
4. Look for "GitHub Copilot" in providers list

**Expected Result** (if injection successful):
```
✓ OpenAI
✓ Anthropic
✓ Google
✓ GitHub Copilot  ← Should appear here
✓ Azure (API Key)
... (other providers)
```

## 🐛 Troubleshooting

### Injection Not Working

**Symptom**: GitHub Copilot doesn't appear in providers list

**Solutions**:

1. **Check n8n version**:
   ```javascript
   const { detectN8nVersion } = require('n8n-nodes-copilot/shared');
   console.log(detectN8nVersion());
   ```
   - Ensure major version is 2 or higher

2. **Enable debug logging**:
   ```bash
   export GITHUB_COPILOT_DEBUG=true
   ```
   - Check console output for error messages

3. **Check Chat Hub availability**:
   ```javascript
   const { isChatHubAvailable } = require('n8n-nodes-copilot/shared');
   console.log('Chat Hub available:', isChatHubAvailable());
   ```

4. **Manual injection**:
   ```javascript
   const { injectGitHubCopilotProvider } = require('n8n-nodes-copilot/shared');
   const status = injectGitHubCopilotProvider({ debug: true, force: true });
   console.log(status);
   ```

### Injection Fails After n8n Update

**Symptom**: Worked before, stopped after updating n8n

**Cause**: n8n internal APIs changed

**Solutions**:

1. **Check for package updates**:
   ```bash
   npm update n8n-nodes-copilot
   ```

2. **Fall back to workflow agents**:
   - Temporarily disable auto-injection
   - Use workflow-based approach until fix is available

3. **Report issue**:
   - Open issue on GitHub: https://github.com/sufficit/n8n-nodes-copilot/issues
   - Include:
     - n8n version
     - Injection status output
     - Error messages

### Provider Appears But No Models

**Symptom**: GitHub Copilot in list, but no models available

**Cause**: Model fetching not implemented for injected provider

**Solution**: This requires additional backend implementation. Use workflow agents approach for full functionality.

## 📊 Version Compatibility

| n8n Version | Injection Support | Notes |
|-------------|-------------------|-------|
| v1.x | ❌ Skipped | Uses workflow agents automatically |
| v2.0 - v2.15 | ⚠️ Experimental | Injection attempted, may work |
| v2.16+ | ⚠️ Unknown | Test thoroughly |
| v3.x+ | ❓ Unknown | Will need testing |

**Recommendation**: Always test after upgrading n8n!

## 🔄 Maintenance

### After n8n Updates

1. **Test injection**:
   ```bash
   GITHUB_COPILOT_DEBUG=true node inject-github-copilot.js
   ```

2. **Verify in UI** (open Chat Hub and check providers list)

3. **Monitor logs** for errors or warnings

4. **Update package** if injection fails:
   ```bash
   npm update n8n-nodes-copilot
   ```

### Monitoring

Create health check script:

```javascript
const { 
  getInjectionStatus, 
  isProviderInjected,
  isN8nV2OrHigher 
} = require('n8n-nodes-copilot/shared');

function healthCheck() {
  const n8nV2 = isN8nV2OrHigher();
  const injected = isProviderInjected();
  const status = getInjectionStatus();
  
  return {
    ok: !n8nV2 || injected, // OK if v1.x OR successfully injected in v2+
    n8nV2,
    injected,
    status
  };
}

setInterval(() => {
  const health = healthCheck();
  if (!health.ok) {
    console.error('GitHub Copilot provider injection unhealthy:', health);
  }
}, 60000); // Check every minute
```

## 🛠️ Advanced Configuration

### Custom Provider Name

Modify injection to use custom display name:

```javascript
const { injectGitHubCopilotProvider } = require('n8n-nodes-copilot/shared');

// Inject with custom configuration
const status = injectGitHubCopilotProvider({
  debug: true,
  // Note: Custom names not yet supported, planned for future
});
```

### Conditional Injection

Only inject in specific environments:

```javascript
if (process.env.NODE_ENV === 'production' && isN8nV2OrHigher()) {
  injectGitHubCopilotProvider({ debug: false });
}
```

## 📚 Related Documentation

- [Version Detection](../../../shared/utils/version-detection.ts) - Source code for version detection
- [Provider Injection](../../../shared/utils/provider-injection.ts) - Source code for runtime injection
- [Chat Hub Integration Research](../../../docs/202501220730-n8n-v2-chat-provider-list-integration-research.md) - Technical analysis

## 🆘 Support

**Issue Tracker**: https://github.com/sufficit/n8n-nodes-copilot/issues

**When reporting issues, include**:
1. n8n version (`n8n --version`)
2. Node.js version (`node --version`)
3. Injection status output
4. Console logs with debug enabled
5. Steps to reproduce

---

**Remember**: This is an experimental feature. The recommended stable approach is using Workflow Agents as documented in [chat-hub-workflow-integration.instructions.md](./chat-hub-workflow-integration.instructions.md).
