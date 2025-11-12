# How to Use Claude Agent Browser

Complete guide to using the browser automation skill with Claude Code.

## Quick Start

### 1. Installation

```bash
# Navigate to the project
cd /media/terry/data/projects/projects/chatgpt-atlas/claude-agent-browser

# Install dependencies
npm install

# Build the extension and MCP server
npm run build

# Load the Chrome extension:
# 1. Open chrome://extensions in your browser
# 2. Enable "Developer Mode" (toggle in top right)
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

### 2. Verify Installation

```bash
# Test that the MCP server runs
npm start

# Run tests to verify everything works
npm test

# Check test coverage
npm run test:coverage
```

### 3. Using with Claude Code

Once the extension is loaded, you can use any of the MCP tools directly in Claude Code conversations:

```
User: "Use browser_navigate to go to https://github.com"

Claude Code will automatically call the browser_navigate MCP tool,
which communicates with the Chrome extension to perform the action.
```

## Common Tasks

### Task 1: Automate Website Signup

```
User: "Go to https://example.com/signup and create an account.
Store the credentials and API key."

Claude Code will:
1. Navigate to the signup page
2. Generate random username/password
3. Fill the signup form
4. Handle any CAPTCHAs
5. Extract the API key
6. Store credentials securely
7. Save the workflow pattern for future use
```

### Task 2: Login with Stored Credentials

```
User: "Login to GitHub using my stored credentials"

Claude Code will:
1. Retrieve GitHub credentials from vault
2. Search for existing login patterns
3. Navigate to GitHub login page
4. Fill credentials
5. Submit the form
```

### Task 3: Extract Data from a Page

```
User: "Go to https://news.ycombinator.com and extract
the top 10 post titles"

Claude Code will:
1. Navigate to the URL
2. Wait for page load
3. Use browser_extract to get post titles
4. Return structured data
```

### Task 4: Manage Credentials

```
User: "Store my OpenAI API key: sk-..."

Claude Code will:
- Use credential_store to encrypt and save the key

User: "What API keys do I have stored?"

Claude Code will:
- Use credential_search to find all API credentials
- List them (without showing the actual keys)

User: "Retrieve my GitHub credentials"

Claude Code will:
- Use credential_retrieve to get the full credentials
```

### Task 5: Pattern Learning

```
User: "Save the workflow I just used for future logins to example.com"

Claude Code will:
- Use pattern_store to save the automation steps
- Create semantic embeddings for future matching

User: "Show me similar login workflows"

Claude Code will:
- Use pattern_search with semantic similarity
- Return similar patterns from other sites
```

## Available MCP Tools

### Browser Control
- `browser_navigate` - Go to a URL
- `browser_click` - Click elements
- `browser_fill_form` - Fill form fields
- `browser_extract` - Extract data from page
- `browser_screenshot` - Capture screenshots
- `browser_wait` - Wait for elements/conditions

### Credentials
- `credential_store` - Save credentials (encrypted)
- `credential_retrieve` - Get credentials
- `credential_search` - Find credentials by keyword
- `credential_delete` - Remove credentials
- `credential_export` - Backup credentials
- `credential_import` - Import from browsers/password managers

### CAPTCHA
- `captcha_detect` - Detect CAPTCHA on page
- `captcha_solve` - Solve CAPTCHAs automatically
- `captcha_train` - Store CAPTCHA patterns

### Pattern Learning
- `pattern_store` - Save automation workflows
- `pattern_search` - Find similar patterns
- `pattern_retrieve` - Get specific pattern
- `pattern_stats` - View learning statistics

### Email Automation
- `email_collect` - Create temporary email accounts
- `email_check_inbox` - Check for new emails

### Browser Profiles
- `profile_create` - Create stealth profiles
- `profile_list` - List all profiles
- `profile_delete` - Remove profiles

### Security & Utilities
- `security_audit` - Audit security settings
- `password_generate` - Generate secure passwords
- `username_generate` - Generate random usernames
- `agentdb_stats` - View database statistics
- `performance_report` - Get performance metrics

## Advanced Usage

### Creating a Complete Automation Workflow

```
User: "I want to automate signup for multiple AI services and collect their API keys"

Claude Code conversation:
1. User provides list of services
2. For each service:
   - Navigate to signup page
   - Generate unique credentials
   - Fill signup form
   - Solve CAPTCHA if needed
   - Extract API key
   - Store credentials and key
   - Save pattern for future use
3. Export all credentials for backup
```

### Using Browser Profiles for Stealth

```
User: "Create a stealth browser profile and use it to visit example.com"

Claude Code will:
1. Use profile_create with randomized fingerprints
2. Configure the extension to use that profile
3. Navigate with the stealth profile active
```

### Pattern Learning Example

```
User: "Learn the login pattern from github.com and apply it to gitlab.com"

Claude Code will:
1. Observe/execute GitHub login
2. Store the pattern with semantic embeddings
3. Search for similar patterns when asked to login to GitLab
4. Apply the learned pattern with adaptations
```

## Configuration

### Credential Storage Location
- Default: `~/.claude-agent-browser/vault/`
- Encrypted with AES-256-GCM
- Master key stored securely

### AgentDB Storage
- Default: `~/.claude-agent-browser/agentdb/`
- Vector embeddings: 384 dimensions
- Uses hnswlib-node for fast similarity search

### Extension Settings
Access via the extension popup:
- Enable/disable auto-CAPTCHA solving
- Configure learning mode
- View stored patterns
- Export/import data

## Troubleshooting

### Extension Not Loading
```bash
# Rebuild the extension
npm run build

# Check for errors in chrome://extensions
# Look for the extension in the list
# Click "Details" to see any errors
```

### MCP Server Connection Issues
```bash
# Test the server directly
npm start

# Check that it's responding
# Look for "MCP server listening on stdio" message
```

### Tools Not Working
```bash
# Run diagnostics
npm test

# Check specific tool
npm run test:coverage

# View logs
# Open Chrome DevTools on the extension background page
# Check console for errors
```

### Credential Retrieval Fails
```bash
# Verify vault exists
ls ~/.claude-agent-browser/vault/

# Check permissions
# Vault files should be readable by your user

# Re-import if needed
# Use credential_import to restore from backup
```

## Best Practices

### 1. Security
- Always use `credential_store` for sensitive data
- Run `security_audit` regularly
- Don't share credential exports unencrypted
- Use strong passwords via `password_generate`

### 2. Pattern Learning
- Store successful workflows immediately
- Add descriptive metadata to patterns
- Review and clean old patterns periodically
- Use semantic search to find similar patterns

### 3. CAPTCHA Handling
- Start with "auto" strategy
- Train on successful solutions
- Monitor costs if using API services
- Fall back to manual solving when needed

### 4. Browser Profiles
- Create new profiles for different use cases
- Randomize fingerprints for stealth
- Clean up unused profiles
- Don't reuse profiles across unrelated tasks

### 5. Performance
- Use `browser_wait` to handle dynamic content
- Add delays between actions to avoid detection
- Monitor performance via `performance_report`
- Clean up AgentDB periodically via `pattern_stats`

## Example Scripts

### Complete Signup Flow
```javascript
// 1. Generate credentials
const username = await username_generate({});
const password = await password_generate({ length: 20 });

// 2. Navigate and fill form
await browser_navigate({ url: "https://service.com/signup" });
await browser_fill_form({
  fields: {
    username: username.username,
    email: `${username.username}@temp.com`,
    password: password.password
  }
});

// 3. Handle CAPTCHA
const captcha = await captcha_detect({});
if (captcha.detected) {
  await captcha_solve({
    type: captcha.type,
    strategy: "auto"
  });
}

// 4. Submit and extract key
await browser_click({ selector: "#submit" });
await browser_wait({ type: "selector", value: ".api-key" });
const key = await browser_extract({ selector: ".api-key" });

// 5. Store everything
await credential_store({
  service: "service-com",
  username: username.username,
  password: key.data,
  notes: `Created ${new Date().toISOString()}`
});
```

### Batch Credential Import
```javascript
// Import from Chrome
await credential_import({ source: "chrome" });

// Import from CSV
await credential_import({
  source: "csv",
  path: "/path/to/passwords.csv"
});

// Import from password manager
await credential_import({ source: "1password" });
```

### Pattern Workflow
```javascript
// Store a pattern
await pattern_store({
  domain: "example.com",
  action: "signup",
  intent: "create new account and get API key",
  steps: [
    { type: "navigate", url: "https://example.com/signup" },
    { type: "fill", selector: "#email", field: "email" },
    { type: "fill", selector: "#password", field: "password" },
    { type: "click", selector: "#submit" },
    { type: "extract", selector: ".api-key", field: "apiKey" }
  ],
  success: true
});

// Find similar patterns
const similar = await pattern_search({
  query: "signup and get api key",
  min_similarity: 0.7,
  limit: 5
});

// Apply learned pattern
for (const step of similar.results[0].steps) {
  // Execute each step...
}
```

## NPM Scripts Reference

```bash
# Build
npm run build                 # Build everything
npm run build:extension       # Build extension only

# Development
npm run dev                   # Watch mode for TypeScript
npm start                     # Start MCP server

# Testing
npm test                      # Run all tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report
npm run test:mutation         # Mutation testing

# Code Quality
npm run lint                  # Check code
npm run lint:fix              # Fix issues
npm run format                # Format code
npm run format:check          # Check formatting

# Demos
npm run email-gauntlet        # Email automation demo

# Validation
npm run victory-check         # Check if project is complete
```

## Additional Resources

- `SKILL.md` - Complete skill documentation
- `MCP-TOOLS-REFERENCE.md` - Full API reference
- `PLAN.md` - Project architecture and roadmap
- `demo-email-gauntlet.ts` - Email automation example
- `demo-api-vault.ts` - Credential management example
- `tests/` - Unit and integration tests with usage examples

## Support & Contributing

For issues, questions, or contributions:
1. Check existing documentation first
2. Review test files for examples
3. Run `npm test` to verify your setup
4. See `PLAN.md` for development roadmap

---

**Last Updated**: 2025-10-27
**Skill Version**: 1.0.0
**Compatible with**: Claude Code with MCP support
