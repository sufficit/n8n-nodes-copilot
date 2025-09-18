# 20250918 - GitHub Copilot Token Behavior Discovery

## 🔍 Research Question
Does the GitHub Copilot token affect model response quality or just access permissions?

## 🧪 Testing Method
- Tested same models with different tokens
- 5 attempts per model for statistical reliability
- Compared success rates on working models only

## 📊 Key Findings

### Token Impact on Access
**GitHub CLI Token:**
- Access: 2/13 models (15%)
- Working: GPT-5, GPT-5 mini

**Enterprise Token:**
- Access: 11/13 models (85%)
- Working: GPT-5, GPT-5 mini, Claude Sonnet 4, o4-mini, etc.

### Token Impact on Quality
**GPT-5 mini:** 100% success rate (both tokens)
**GPT-5:** 100% success rate (both tokens)

## ✅ Conclusion
**Token affects ACCESS, not QUALITY**
- Token = "access key" to different model collections
- Same model = same performance regardless of token
- Quality/reliability unchanged between tokens

## 💡 Practical Implications
1. Choose token for model variety, not performance
2. Working models maintain consistent behavior
3. Enterprise tokens provide more options, not better responses
4. TPM quotas vary by token/organization, not model quality