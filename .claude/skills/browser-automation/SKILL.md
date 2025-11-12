---
name: browser-automation
description: AI-powered browser automation with MCP integration for web scraping, form filling, signup automation, credential management, CAPTCHA solving, and pattern learning. Use when you need to automate browser tasks, extract data from websites, manage credentials, or learn from repetitive web interactions.
---

# Browser Automation Agent Skill

This skill provides comprehensive browser automation capabilities through the Claude Agent Browser MCP server. It combines intelligent automation, credential management, CAPTCHA solving, and machine learning to help Claude Code interact with websites autonomously.

## 🎯 When to Use This Skill

Use this skill when you need to:
- **Automate web workflows**: Login, signup, form filling, data extraction
- **Manage credentials**: Store/retrieve passwords and API keys securely
- **Solve CAPTCHAs**: Automatically handle reCAPTCHA and other challenges
- **Learn patterns**: Store and retrieve automation patterns for reuse
- **Collect emails**: Create temporary email accounts for testing
- **Manage browser profiles**: Create stealth profiles with randomized fingerprints
- **Extract data**: Scrape content, API keys, or specific elements from pages

## 🔧 Available MCP Tools

### Browser Automation Tools

#### `browser_navigate`
Navigate to any URL in the browser.
```json
{
  "url": "https://example.com",
  "waitUntil": "networkidle"
}
```

#### `browser_fill_form`
Fill web forms with data, including text inputs, checkboxes, and dropdowns.
```json
{
  "fields": {
    "email": "user@example.com",
    "password": "secure123"
  },
  "selectors": {
    "email": "#email-input",
    "password": "input[type='password']"
  }
}
```

#### `browser_click`
Click elements on the page.
```json
{
  "selector": "#submit-button",
  "waitForNavigation": true
}
```

#### `browser_extract`
Extract text or data from page elements.
```json
{
  "selector": ".api-key-display",
  "attribute": "textContent"
}
```

#### `browser_screenshot`
Capture screenshots of pages.
```json
{
  "fullPage": true,
  "format": "png"
}
```

#### `browser_wait`
Wait for elements or conditions.
```json
{
  "type": "selector",
  "value": "#dynamic-content",
  "timeout": 10000
}
```

### Credential Management Tools

#### `credential_store`
Securely store credentials with AES-256-GCM encryption.
```json
{
  "service": "github",
  "username": "myuser",
  "password": "ghp_1234567890abcdef",
  "notes": "GitHub personal access token"
}
```

#### `credential_retrieve`
Retrieve stored credentials.
```json
{
  "service": "github"
}
```

#### `credential_search`
Search credentials by keyword.
```json
{
  "query": "api",
  "limit": 10
}
```

#### `credential_delete`
Delete stored credentials.
```json
{
  "service": "old-service"
}
```

#### `credential_export` / `credential_import`
Backup and restore credentials, or import from browsers (Chrome, Firefox) and password managers (1Password, LastPass, Bitwarden).

### CAPTCHA Solving Tools

#### `captcha_detect`
Detect CAPTCHA presence on pages.
```json
{
  "url": "https://example.com/signup"
}
```

#### `captcha_solve`
Solve detected CAPTCHAs using AI, API services, or learned patterns.
```json
{
  "type": "recaptcha_v2",
  "sitekey": "6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-",
  "url": "https://example.com",
  "strategy": "auto"
}
```

#### `captcha_train`
Store CAPTCHA patterns for future learning.

### Pattern Learning Tools

#### `pattern_store`
Store automation workflows in AgentDB for reuse.
```json
{
  "domain": "github.com",
  "action": "login",
  "intent": "authenticate user",
  "steps": [
    {"type": "navigate", "url": "https://github.com/login"},
    {"type": "fill", "selector": "#login_field", "field": "username"},
    {"type": "click", "selector": "input[type='submit']"}
  ],
  "success": true
}
```

#### `pattern_search`
Find similar automation patterns using semantic search.
```json
{
  "query": "login to social media",
  "domain": "twitter.com",
  "limit": 5,
  "min_similarity": 0.7
}
```

#### `pattern_retrieve`
Get specific pattern by ID.

#### `pattern_stats`
View learning statistics and success rates.

### Email Collection Tools

#### `email_collect`
Create temporary email accounts for testing.
```json
{
  "provider": "guerrillamail",
  "count": 3,
  "store_credentials": true
}
```

#### `email_check_inbox`
Check temporary email inboxes for verification emails.

### Browser Profile Tools

#### `profile_create`
Create stealth browser profiles with randomized fingerprints.
```json
{
  "name": "stealth-1",
  "randomize": {
    "screen_resolution": true,
    "timezone": true,
    "webgl": true,
    "canvas": true
  }
}
```

#### `profile_list` / `profile_delete`
Manage browser profiles.

### Security & Utility Tools

#### `security_audit`
Audit stored credentials and security settings.

#### `password_generate`
Generate secure random passwords.
```json
{
  "length": 24,
  "uppercase": true,
  "lowercase": true,
  "numbers": true,
  "symbols": true
}
```

#### `username_generate`
Generate random usernames.

#### `agentdb_stats`
View AgentDB statistics and performance metrics.

## 📝 Common Workflows

### Complete Signup & API Key Extraction

```javascript
// 1. Navigate to signup
await browser_navigate({ url: "https://example.com/signup" });

// 2. Generate credentials
const username = await username_generate({});
const password = await password_generate({ length: 16 });

// 3. Fill form
await browser_fill_form({
  fields: {
    username: username.username,
    email: `${username.username}@example.com`,
    password: password.password
  }
});

// 4. Handle CAPTCHA
const captcha = await captcha_detect({});
if (captcha.detected) {
  await captcha_solve({ type: captcha.type, sitekey: captcha.sitekey });
}

// 5. Submit and wait for result
await browser_click({ selector: "#submit" });
await browser_wait({ type: "selector", value: ".api-key" });

// 6. Extract API key
const apiKey = await browser_extract({ selector: ".api-key" });

// 7. Store credentials
await credential_store({
  service: "example-com",
  username: username.username,
  password: apiKey.data
});

// 8. Save pattern for learning
await pattern_store({
  domain: "example.com",
  action: "signup",
  success: true,
  steps: [...]
});
```

### Login with Stored Credentials

```javascript
// 1. Retrieve credentials
const creds = await credential_retrieve({ service: "github" });

// 2. Search for existing pattern
const patterns = await pattern_search({
  query: "github login",
  limit: 1,
  min_similarity: 0.8
});

// 3. Execute learned pattern or create new one
if (patterns.results.length > 0) {
  // Use learned pattern
  const pattern = patterns.results[0];
  for (const step of pattern.steps) {
    // Execute each step...
  }
} else {
  // Manual workflow
  await browser_navigate({ url: "https://github.com/login" });
  await browser_fill_form({
    fields: {
      login: creds.credential.username,
      password: creds.credential.password
    }
  });
  await browser_click({ selector: "input[type='submit']" });
}
```

## 🎮 Architecture Overview

The browser automation system consists of:

1. **Chrome Extension** (`extension/`)
   - Background service worker for MCP communication
   - Content scripts for DOM manipulation
   - Popup UI for manual control

2. **MCP Bridge** (`mcp-bridge/`)
   - stdio server for Claude Code integration
   - Message routing and command handling
   - Transport layer for browser ↔ terminal

3. **Training Pipeline** (`training/`)
   - Reinforcement learning for pattern improvement
   - Experience replay and policy updates
   - Success/failure tracking

4. **Security Layer** (`security/`)
   - AES-256-GCM encryption for credentials
   - Secure storage and key management
   - Audit logging

5. **AgentDB Integration**
   - Vector embeddings for semantic search
   - Pattern storage and retrieval
   - 384-dimensional embeddings using hnswlib-node

## 🚀 Setup & Installation

### Prerequisites
- Node.js ≥ 18
- Chrome, Chromium, or Thorium browser
- Claude Code with MCP support

### Installation

```bash
# Clone and install
cd claude-agent-browser
npm install

# Build the extension and MCP server
npm run build

# Start MCP server (for testing)
npm start

# Run tests
npm test
npm run test:coverage

# Load extension in browser:
# 1. Open chrome://extensions
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select claude-agent-browser/dist/
```

### Global MCP Installation

See `INSTALL-GLOBAL-MCP.md` for full instructions on installing as a global MCP server that Claude Code can access automatically.

## 📊 Project Status

This is an active development project following a gamified build quest (see `PLAN.md`). Current features:
- ✅ MCP server implementation
- ✅ Browser automation tools
- ✅ Credential management
- ✅ Pattern learning with AgentDB
- ✅ CAPTCHA detection
- 🚧 CAPTCHA solving (in progress)
- 🚧 Email collection automation
- 🚧 Reinforcement learning pipeline
- 🚧 Browser profile management

## 🔒 Security Notes

- All credentials are encrypted with AES-256-GCM
- Passwords are never logged or transmitted in plaintext
- Credentials stored in `~/.claude-agent-browser/vault/`
- Pattern data stored in `~/.claude-agent-browser/agentdb/`
- Regular security audits recommended via `security_audit` tool

## 📚 Additional Resources

- `MCP-TOOLS-REFERENCE.md` - Complete MCP tool API documentation
- `PLAN.md` - Project roadmap and architecture
- `demo-email-gauntlet.ts` - Email automation example
- `demo-api-vault.ts` - Credential management example
- Tests in `tests/` directory - Usage examples and patterns

## 💡 Best Practices

1. **Use pattern learning**: Store successful workflows for reuse
2. **Handle errors gracefully**: Always check `success` field in responses
3. **Respect rate limits**: Add delays between requests to avoid detection
4. **Use stealth profiles**: For sensitive automation, create randomized profiles
5. **Store credentials**: Always save important credentials/API keys
6. **Audit regularly**: Run `security_audit` to check for weak passwords
7. **Clean up**: Delete unused profiles and old credentials

## 🎯 Example Use Cases

- **API Key Collection**: Automate signup for services and extract API keys
- **Form Testing**: Fill and submit forms repeatedly for QA testing
- **Data Scraping**: Extract structured data from websites
- **Multi-Account Management**: Manage credentials across multiple services
- **Automated Onboarding**: Complete signup flows automatically
- **Browser Testing**: Test web applications with different profiles
- **Research Automation**: Collect data from multiple sources

---

**Version**: 1.0.0
**Status**: Active Development
**License**: MIT
**Maintained by**: Claude Code
