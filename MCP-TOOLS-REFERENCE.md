# 🔧 MCP TOOLS REFERENCE
## Claude Agent Browser - Complete Tool Documentation

This document lists **all available MCP tools** that Claude Code can use once the Claude Agent Browser MCP server is installed globally.

---

## 📋 Tool Categories

1. [Browser Automation](#browser-automation)
2. [Credential Management](#credential-management)
3. [CAPTCHA Solving](#captcha-solving)
4. [Pattern Learning](#pattern-learning)
5. [Email Collection](#email-collection)
6. [Browser Profiles](#browser-profiles)
7. [Security & Auditing](#security--auditing)

---

## 🌐 Browser Automation

### `browser_navigate`

Navigate to a URL in the browser.

**Input:**
```json
{
  "url": "https://example.com",
  "waitUntil": "networkidle" // optional: load, domcontentloaded, networkidle
}
```

**Output:**
```json
{
  "success": true,
  "finalUrl": "https://example.com",
  "title": "Example Domain"
}
```

---

### `browser_fill_form`

Fill a form with provided data.

**Input:**
```json
{
  "fields": {
    "email": "user@example.com",
    "password": "secure123",
    "agree_tos": true
  },
  "selectors": {
    "email": "#email-input",
    "password": "input[type='password']",
    "agree_tos": "#agree-checkbox"
  }
}
```

**Output:**
```json
{
  "success": true,
  "fieldsFilled": ["email", "password", "agree_tos"],
  "errors": []
}
```

---

### `browser_click`

Click an element on the page.

**Input:**
```json
{
  "selector": "#submit-button",
  "waitForNavigation": true, // optional
  "timeout": 5000 // optional, ms
}
```

**Output:**
```json
{
  "success": true,
  "navigationOccurred": true
}
```

---

### `browser_extract`

Extract text/data from the page.

**Input:**
```json
{
  "selector": ".api-key-display",
  "attribute": "textContent", // or "value", "href", etc.
  "all": false // true to get all matching elements
}
```

**Output:**
```json
{
  "success": true,
  "data": "sk-1234567890abcdef",
  "elements": 1
}
```

---

### `browser_screenshot`

Take a screenshot of the current page.

**Input:**
```json
{
  "fullPage": true,
  "format": "png", // or "jpeg"
  "path": "/tmp/screenshot.png" // optional
}
```

**Output:**
```json
{
  "success": true,
  "path": "/tmp/screenshot.png",
  "base64": "iVBORw0KGgoAAAANSUhEUgAA..." // if no path specified
}
```

---

### `browser_wait`

Wait for an element or condition.

**Input:**
```json
{
  "type": "selector", // or "timeout", "function"
  "value": "#dynamic-content",
  "timeout": 10000,
  "visible": true // optional, wait until visible
}
```

**Output:**
```json
{
  "success": true,
  "elementFound": true,
  "waitTime": 1234
}
```

---

## 🔐 Credential Management

### `credential_store`

Store credentials securely with AES-256-GCM encryption.

**Input:**
```json
{
  "service": "github",
  "username": "myuser",
  "password": "ghp_1234567890abcdef",
  "notes": "GitHub personal access token",
  "metadata": {
    "created_at": "2025-01-26",
    "expires": "2026-01-26"
  }
}
```

**Output:**
```json
{
  "success": true,
  "service": "github",
  "message": "Credential stored successfully"
}
```

---

### `credential_retrieve`

Retrieve stored credentials.

**Input:**
```json
{
  "service": "github"
}
```

**Output:**
```json
{
  "success": true,
  "credential": {
    "service": "github",
    "username": "myuser",
    "password": "ghp_1234567890abcdef",
    "notes": "GitHub personal access token",
    "metadata": {...}
  }
}
```

---

### `credential_search`

Search credentials by keyword.

**Input:**
```json
{
  "query": "api",
  "limit": 10
}
```

**Output:**
```json
{
  "success": true,
  "results": [
    {"service": "github-api", "username": "..."},
    {"service": "openai-api", "username": "..."}
  ],
  "count": 2
}
```

---

### `credential_delete`

Delete stored credentials.

**Input:**
```json
{
  "service": "old-service"
}
```

**Output:**
```json
{
  "success": true,
  "message": "Credential deleted successfully"
}
```

---

### `credential_export`

Export all credentials (encrypted).

**Input:**
```json
{
  "path": "/backup/credentials.json.enc",
  "format": "encrypted" // or "json" (WARNING: plaintext!)
}
```

**Output:**
```json
{
  "success": true,
  "path": "/backup/credentials.json.enc",
  "count": 15
}
```

---

### `credential_import`

Import credentials from file or browser.

**Input:**
```json
{
  "source": "chrome", // or "firefox", "csv", "1password", "lastpass", "bitwarden"
  "path": "/path/to/import.csv" // if source is "csv"
}
```

**Output:**
```json
{
  "success": true,
  "imported": 42,
  "skipped": 3,
  "errors": []
}
```

---

## 🤖 CAPTCHA Solving

### `captcha_detect`

Detect CAPTCHA on current page.

**Input:**
```json
{
  "url": "https://example.com/signup" // optional
}
```

**Output:**
```json
{
  "detected": true,
  "type": "recaptcha_v2",
  "sitekey": "6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-",
  "confidence": 0.95
}
```

---

### `captcha_solve`

Solve detected CAPTCHA.

**Input:**
```json
{
  "type": "recaptcha_v2",
  "sitekey": "6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-",
  "url": "https://example.com",
  "strategy": "auto" // or "ai", "api", "learned", "human"
}
```

**Output:**
```json
{
  "success": true,
  "solution": "03AGdBq24...",
  "strategy_used": "ai",
  "time_taken": 3456,
  "cost": 0.001
}
```

---

### `captcha_train`

Store CAPTCHA pattern for learning.

**Input:**
```json
{
  "type": "recaptcha_v2",
  "solution": "correct_solution",
  "success": true,
  "pattern": {
    "images": [...],
    "prompt": "Select all traffic lights"
  }
}
```

**Output:**
```json
{
  "success": true,
  "pattern_id": "pattern-12345",
  "message": "Pattern stored for future learning"
}
```

---

## 🧠 Pattern Learning

### `pattern_store`

Store automation pattern in AgentDB.

**Input:**
```json
{
  "domain": "github.com",
  "action": "login",
  "intent": "authenticate user",
  "steps": [
    {"type": "navigate", "url": "https://github.com/login"},
    {"type": "fill", "selector": "#login_field", "field": "username"},
    {"type": "fill", "selector": "#password", "field": "password"},
    {"type": "click", "selector": "input[type='submit']"}
  ],
  "success": true,
  "metadata": {
    "browser": "chromium",
    "version": "120.0.0.0",
    "timestamp": "2025-01-26T10:00:00Z"
  }
}
```

**Output:**
```json
{
  "success": true,
  "pattern_id": "pattern-67890",
  "embedding": [0.123, -0.456, ...],
  "message": "Pattern stored successfully"
}
```

---

### `pattern_search`

Search for similar patterns using semantic search.

**Input:**
```json
{
  "query": "login to social media",
  "domain": "twitter.com", // optional
  "limit": 5,
  "min_similarity": 0.7
}
```

**Output:**
```json
{
  "success": true,
  "results": [
    {
      "pattern_id": "pattern-111",
      "domain": "twitter.com",
      "action": "login",
      "similarity": 0.92,
      "steps": [...]
    },
    {
      "pattern_id": "pattern-222",
      "domain": "facebook.com",
      "action": "signin",
      "similarity": 0.85,
      "steps": [...]
    }
  ],
  "count": 2
}
```

---

### `pattern_retrieve`

Get specific pattern by ID.

**Input:**
```json
{
  "pattern_id": "pattern-67890"
}
```

**Output:**
```json
{
  "success": true,
  "pattern": {
    "pattern_id": "pattern-67890",
    "domain": "github.com",
    "action": "login",
    "steps": [...],
    "metadata": {...}
  }
}
```

---

### `pattern_stats`

Get pattern learning statistics.

**Input:**
```json
{
  "domain": "github.com" // optional
}
```

**Output:**
```json
{
  "success": true,
  "total_patterns": 157,
  "by_domain": {
    "github.com": 42,
    "gitlab.com": 15,
    "twitter.com": 100
  },
  "success_rate": 0.94,
  "most_common_actions": ["login", "signup", "profile_update"]
}
```

---

## 📧 Email Collection

### `email_collect`

Collect temporary email accounts automatically.

**Input:**
```json
{
  "provider": "guerrillamail", // or "tempmail", "10minutemail", "mohmal", "auto"
  "count": 3,
  "store_credentials": true
}
```

**Output:**
```json
{
  "success": true,
  "accounts": [
    {
      "email": "test-abc123@guerrillamail.com",
      "password": "generated-password",
      "provider": "guerrillamail",
      "inbox_url": "https://..."
    },
    ...
  ],
  "stored": true
}
```

---

### `email_check_inbox`

Check inbox for new emails.

**Input:**
```json
{
  "email": "test-abc123@guerrillamail.com",
  "provider": "guerrillamail"
}
```

**Output:**
```json
{
  "success": true,
  "emails": [
    {
      "from": "noreply@github.com",
      "subject": "Verify your email",
      "body": "Click here to verify...",
      "timestamp": "2025-01-26T10:05:00Z"
    }
  ],
  "count": 1
}
```

---

## 🎭 Browser Profiles

### `profile_create`

Create stealth browser profile with randomized fingerprint.

**Input:**
```json
{
  "name": "stealth-1",
  "randomize": {
    "screen_resolution": true,
    "timezone": true,
    "language": true,
    "webgl": true,
    "canvas": true,
    "fonts": true
  }
}
```

**Output:**
```json
{
  "success": true,
  "profile_id": "profile-12345",
  "fingerprint": {
    "screen": "1920x1080",
    "timezone": "America/New_York",
    "language": "en-US",
    "webgl_vendor": "Intel Inc.",
    "canvas_hash": "a1b2c3d4..."
  }
}
```

---

### `profile_list`

List all browser profiles.

**Input:**
```json
{}
```

**Output:**
```json
{
  "success": true,
  "profiles": [
    {
      "profile_id": "profile-12345",
      "name": "stealth-1",
      "created_at": "2025-01-26T09:00:00Z",
      "fingerprint": {...}
    }
  ],
  "count": 1
}
```

---

### `profile_delete`

Delete a browser profile.

**Input:**
```json
{
  "profile_id": "profile-12345"
}
```

**Output:**
```json
{
  "success": true,
  "message": "Profile deleted successfully"
}
```

---

## 🔒 Security & Auditing

### `security_audit`

Run security audit on stored credentials and patterns.

**Input:**
```json
{
  "check": ["credentials", "permissions", "encryption", "csp", "inputs"]
}
```

**Output:**
```json
{
  "success": true,
  "issues": [
    {
      "severity": "medium",
      "category": "credentials",
      "message": "5 credentials use weak passwords",
      "recommendation": "Use password generator"
    }
  ],
  "score": 85,
  "passed": true
}
```

---

### `password_generate`

Generate secure random password.

**Input:**
```json
{
  "length": 24,
  "uppercase": true,
  "lowercase": true,
  "numbers": true,
  "symbols": true
}
```

**Output:**
```json
{
  "success": true,
  "password": "Xk9@mP2$vL8#qR5!wN3%",
  "strength": "very_strong",
  "entropy": 128
}
```

---

### `username_generate`

Generate random username.

**Input:**
```json
{
  "format": "adjective-noun-number" // default
}
```

**Output:**
```json
{
  "success": true,
  "username": "swift-tiger-7423"
}
```

---

## 📊 System Tools

### `agentdb_stats`

Get AgentDB statistics.

**Input:**
```json
{}
```

**Output:**
```json
{
  "success": true,
  "stats": {
    "total_patterns": 157,
    "total_actions": 1243,
    "database_size_mb": 12.5,
    "index_size_mb": 3.2,
    "avg_query_time_ms": 15
  }
}
```

---

### `performance_report`

Get performance metrics.

**Input:**
```json
{
  "include": ["cache", "memory", "queries"]
}
```

**Output:**
```json
{
  "success": true,
  "metrics": {
    "cache_hit_rate": 0.87,
    "cache_size_mb": 24.5,
    "memory_used_mb": 156.2,
    "avg_query_time_ms": 12,
    "actions_per_second": 3.5
  }
}
```

---

## 🎯 Usage Examples

### Example 1: Complete Signup Flow

```javascript
// 1. Navigate to signup page
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

// 4. Solve CAPTCHA if present
const captcha = await captcha_detect({});
if (captcha.detected) {
  await captcha_solve({ type: captcha.type, sitekey: captcha.sitekey });
}

// 5. Submit and extract API key
await browser_click({ selector: "#submit" });
await browser_wait({ type: "selector", value: ".api-key" });
const apiKey = await browser_extract({ selector: ".api-key" });

// 6. Store credentials
await credential_store({
  service: "example-com",
  username: username.username,
  password: apiKey.data
});

// 7. Store pattern for learning
await pattern_store({
  domain: "example.com",
  action: "signup",
  success: true,
  steps: [...]
});
```

---

## 📝 Notes

- All tools return `{ success: boolean, ... }` format
- Errors include `{ success: false, error: string, code: string }`
- Sensitive data (passwords, API keys) are never logged
- All credential operations use AES-256-GCM encryption
- Pattern embeddings use 384-dimensional vectors
- CAPTCHA solving may incur API costs depending on strategy

---

**For full usage examples, see:**
- `INSTALL-GLOBAL-MCP.md` - Installation guide
- `HOW-TO-USE.md` - User manual
- `demo-*.ts` - Working code examples
