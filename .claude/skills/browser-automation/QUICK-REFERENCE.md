# Browser Automation - Quick Reference

Fast lookup guide for common tasks and MCP tools.

## 🚀 Quick Commands

### Navigate
```
browser_navigate({ url: "https://example.com" })
```

### Fill Form
```
browser_fill_form({
  fields: { email: "user@example.com", password: "pass123" },
  selectors: { email: "#email", password: "#pass" }
})
```

### Click Element
```
browser_click({ selector: "#submit-button" })
```

### Extract Data
```
browser_extract({ selector: ".api-key", attribute: "textContent" })
```

### Wait for Element
```
browser_wait({ type: "selector", value: "#dynamic-element", timeout: 10000 })
```

### Screenshot
```
browser_screenshot({ fullPage: true, format: "png" })
```

## 🔐 Credentials

### Store
```
credential_store({
  service: "github",
  username: "myuser",
  password: "ghp_token123"
})
```

### Retrieve
```
credential_retrieve({ service: "github" })
```

### Search
```
credential_search({ query: "api", limit: 10 })
```

### Generate Password
```
password_generate({ length: 24, symbols: true })
```

### Generate Username
```
username_generate({})
```

## 🤖 CAPTCHA

### Detect
```
captcha_detect({ url: "https://example.com" })
```

### Solve
```
captcha_solve({
  type: "recaptcha_v2",
  sitekey: "6Le-wvk...",
  strategy: "auto"
})
```

## 🧠 Pattern Learning

### Store Pattern
```
pattern_store({
  domain: "github.com",
  action: "login",
  steps: [...],
  success: true
})
```

### Search Patterns
```
pattern_search({
  query: "login workflow",
  min_similarity: 0.7,
  limit: 5
})
```

### Get Stats
```
pattern_stats({ domain: "github.com" })
```

## 📧 Email

### Collect Temp Email
```
email_collect({
  provider: "guerrillamail",
  count: 1,
  store_credentials: true
})
```

### Check Inbox
```
email_check_inbox({
  email: "temp@guerrillamail.com",
  provider: "guerrillamail"
})
```

## 🎭 Profiles

### Create Stealth Profile
```
profile_create({
  name: "stealth-1",
  randomize: {
    screen_resolution: true,
    timezone: true,
    webgl: true,
    canvas: true
  }
})
```

### List Profiles
```
profile_list({})
```

## 🔒 Security

### Audit
```
security_audit({
  check: ["credentials", "permissions", "encryption"]
})
```

### Stats
```
agentdb_stats({})
performance_report({ include: ["cache", "memory", "queries"] })
```

## 📋 Common Workflows

### Complete Signup
```javascript
// 1. Generate credentials
const user = await username_generate({});
const pass = await password_generate({ length: 16 });

// 2. Navigate & fill
await browser_navigate({ url: "https://service.com/signup" });
await browser_fill_form({
  fields: { username: user.username, password: pass.password }
});

// 3. Solve CAPTCHA
const c = await captcha_detect({});
if (c.detected) await captcha_solve({ type: c.type, strategy: "auto" });

// 4. Submit & extract
await browser_click({ selector: "#submit" });
await browser_wait({ type: "selector", value: ".api-key" });
const key = await browser_extract({ selector: ".api-key" });

// 5. Store
await credential_store({
  service: "service-com",
  username: user.username,
  password: key.data
});
```

### Login with Pattern
```javascript
// 1. Get credentials
const creds = await credential_retrieve({ service: "github" });

// 2. Search pattern
const patterns = await pattern_search({ query: "github login", limit: 1 });

// 3. Execute or create
if (patterns.results.length > 0) {
  // Use learned pattern
  for (const step of patterns.results[0].steps) {
    // Execute step...
  }
} else {
  // Manual login
  await browser_navigate({ url: "https://github.com/login" });
  await browser_fill_form({
    fields: { login: creds.credential.username, password: creds.credential.password }
  });
  await browser_click({ selector: "input[type='submit']" });
}
```

### Data Extraction
```javascript
// 1. Navigate
await browser_navigate({ url: "https://news.ycombinator.com" });

// 2. Wait for content
await browser_wait({ type: "selector", value: ".storylink" });

// 3. Extract all
const titles = await browser_extract({
  selector: ".storylink",
  attribute: "textContent",
  all: true
});
```

## 🎯 Tool Categories

| Category | Tools |
|----------|-------|
| **Browser** | navigate, click, fill_form, extract, screenshot, wait |
| **Credentials** | store, retrieve, search, delete, export, import |
| **CAPTCHA** | detect, solve, train |
| **Patterns** | store, search, retrieve, stats |
| **Email** | collect, check_inbox |
| **Profiles** | create, list, delete |
| **Security** | audit, password_generate, username_generate |
| **System** | agentdb_stats, performance_report |

## 📦 NPM Commands

```bash
npm run build               # Build extension
npm start                   # Start MCP server
npm test                    # Run tests
npm run test:coverage       # Coverage report
npm run lint                # Lint code
npm run email-gauntlet      # Demo: Email automation
```

## 🗂️ File Locations

```
~/.claude-agent-browser/
├── vault/              # Encrypted credentials
├── agentdb/            # Pattern database
└── profiles/           # Browser profiles

claude-agent-browser/
├── dist/               # Built extension (load this in Chrome)
├── src/                # Source code
│   ├── extension/      # Chrome extension
│   ├── mcp-bridge/     # MCP server
│   └── training/       # ML pipeline
└── .claude/skills/     # This skill!
```

## 🔑 Key Concepts

**MCP Tools** - Functions Claude Code can call to control the browser
**Patterns** - Learned workflows stored with semantic embeddings
**Vault** - Encrypted storage for credentials (AES-256-GCM)
**AgentDB** - Vector database for pattern matching
**Stealth Profiles** - Randomized browser fingerprints

## ⚡ Pro Tips

1. Always check `success` field in responses
2. Use `pattern_store` after successful workflows
3. Add delays between actions to avoid detection
4. Run `security_audit` regularly
5. Clean up old patterns and profiles
6. Use `browser_wait` for dynamic content
7. Test with `npm test` before deploying

## 🆘 Troubleshooting

**Extension won't load**: Rebuild with `npm run build`
**Tools not responding**: Check Chrome extension is active
**Credentials not found**: Verify vault at `~/.claude-agent-browser/vault/`
**Pattern search fails**: Check AgentDB with `agentdb_stats`
**CAPTCHA timeout**: Increase timeout or use different strategy

## 📚 More Info

- `SKILL.md` - Complete documentation
- `HOW-TO-USE.md` - Detailed usage guide
- `MCP-TOOLS-REFERENCE.md` - Full API reference
- `PLAN.md` - Architecture overview

---

**Quick Ref v1.0** | Last updated: 2025-10-27
