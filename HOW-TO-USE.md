# 🎮 How to Use Claude Agent Browser

**Complete guide to installing and using the AI-powered browser automation system**

---

## 📦 Installation

### Option 1: Global Installation (Recommended for Claude Code)

```bash
# Navigate to the project directory
cd /path/to/claude-agent-browser

# Install globally
npm install -g .

# Verify installation
claude-agent-browser --version
```

### Option 2: Local Installation

```bash
# Clone or navigate to project
cd claude-agent-browser

# Install dependencies
npm install

# Build the project
npm run build
```

---

## 🔌 Setup for Claude Code

### Step 1: Configure MCP Server

Create or edit your Claude Code MCP settings file:

**Location:** `~/.config/claude-code/mcp_settings.json` (Linux/Mac) or `%APPDATA%\claude-code\mcp_settings.json` (Windows)

Add this configuration:

```json
{
  "mcpServers": {
    "claude-agent-browser": {
      "command": "node",
      "args": ["/path/to/claude-agent-browser/dist/mcp-bridge/index.js"],
      "env": {}
    }
  }
}
```

**If installed globally:**

```json
{
  "mcpServers": {
    "claude-agent-browser": {
      "command": "claude-agent-browser",
      "args": [],
      "env": {}
    }
  }
}
```

### Step 2: Restart Claude Code

After adding the MCP configuration, restart Claude Code to load the new server.

### Step 3: Verify Connection

In Claude Code, you should now have access to browser automation tools. Try:

```
Claude, can you show me what browser automation tools are available?
```

---

## 🎯 Core Capabilities

### 1. DOM Automation

**Fill forms, click buttons, extract data from web pages**

```typescript
// Example: Fill a login form
await domManipulator.fillField('#username', 'myuser@example.com');
await domManipulator.fillField('#password', 'SecurePass123!');
await domManipulator.clickElement('#login-button');
```

**What you can do:**
- ✅ Fill input fields
- ✅ Click buttons and links
- ✅ Extract text from elements
- ✅ Wait for elements to appear
- ✅ Handle Shadow DOM
- ✅ Navigate iframes

### 2. CAPTCHA Solving

**Automatically detect and solve CAPTCHAs**

```typescript
const solver = new CAPTCHASolver(document);

// Detect CAPTCHA
if (solver.detect()) {
  console.log('CAPTCHA type:', solver.getCaptchaType());

  // Solve it
  const solved = await solver.solve();
  if (solved) {
    console.log('✅ CAPTCHA solved!');
  }
}
```

**Supported types:**
- reCAPTCHA v2
- reCAPTCHA v3
- hCaptcha
- Image CAPTCHAs
- Text CAPTCHAs

### 3. Secure Credential Storage

**Store and manage passwords with AES-256-GCM encryption**

```typescript
const vault = new PasswordVault('your-master-key');

// Store credentials
vault.store('github.com', 'myusername', 'mypassword', 'GitHub account');

// Retrieve credentials
const cred = vault.get('github.com');
console.log(cred.username, cred.password);

// Generate secure passwords
const newPass = vault.generatePassword(16);
```

**Features:**
- 🔐 AES-256-GCM encryption
- 🔑 PBKDF2 key derivation (100k iterations)
- 📊 Password strength validation
- 💾 Import/export encrypted vaults

### 4. Email Collection

**Automatically collect temporary email accounts**

```typescript
const collector = new EmailCollector(document, vault, agentDB);

// Collect emails from multiple providers
const accounts = await collector.collectMultiple(5);

console.log(`Collected ${accounts.length} email accounts!`);
```

**Providers supported:**
- GuerrillaMail
- TempMail
- 10MinuteMail
- Mohmal
- MailDrop

### 5. AI Learning & Pattern Recognition

**System learns from your automation patterns**

```typescript
const agentDB = new AgentDBClient('./db', 384);

// Store action
agentDB.storeAction({
  action: 'fill_form',
  selector: '#email',
  url: 'https://example.com',
  success: true,
  metadata: { provider: 'Example' }
});

// Find similar past actions
const similar = agentDB.findSimilar(query, 5);
```

**Capabilities:**
- 🧠 Vector database with HNSW indexing
- 🔍 Similarity search for past actions
- 📈 Pattern recognition
- 🎓 Reinforcement learning

### 6. Browser Profiles & Stealth

**Create multiple identities with randomized fingerprints**

```typescript
const profileManager = new ProfileManager();
await profileManager.initialize();

// Create stealth profile
const profile = await profileManager.createProfile('my-identity', {
  randomizeFingerprint: true
});

// Profile has unique:
// - Screen resolution
// - Timezone
// - Language
// - WebGL vendor/renderer
// - User agent
```

### 7. Security & Performance

**Built-in security auditing and performance optimization**

```typescript
// Security audit
const auditor = new SecurityAuditor();
const report = await auditor.audit();

// Performance optimization
const optimizer = new PerformanceOptimizer();
optimizer.cacheResult('key', data);
const cached = optimizer.getCachedResult('key');
```

---

## 🚀 Usage Examples

### Example 1: Automate Login

```typescript
import { DOMManipulator } from 'claude-agent-browser';

const dom = new DOMManipulator(document);

// Navigate to login page
window.location.href = 'https://example.com/login';

// Wait for form
await dom.waitForElement('#login-form', 5000);

// Fill credentials
dom.fillField('#email', 'user@example.com');
dom.fillField('#password', 'SecurePassword123!');

// Click login
dom.clickElement('#submit-button');

console.log('✅ Login automation complete!');
```

### Example 2: Collect Email Accounts

```typescript
import { EmailCollector, PasswordVault, AgentDBClient } from 'claude-agent-browser';

const vault = new PasswordVault('master-key');
const agentDB = new AgentDBClient('./db', 384);
const collector = new EmailCollector(document, vault, agentDB);

// Collect 5 email accounts
const accounts = await collector.collectMultiple(5);

// Export results
console.log(collector.exportAccounts());

// Credentials are stored in encrypted vault
vault.exportVault();
```

### Example 3: Import Passwords

```typescript
import { CredentialImporter, PasswordVault } from 'claude-agent-browser';

const vault = new PasswordVault('master-key');
const importer = new CredentialImporter(vault);

// Import from Chrome
const chromeResult = await importer.importFromChrome();
console.log(`Imported ${chromeResult.imported} credentials from Chrome`);

// Import from CSV file
const csvResult = await importer.importFromCSV('./passwords.csv');

// Import from 1Password
const opResult = await importer.importFrom1Password('./1password-export.json');

console.log('✅ All passwords imported and encrypted!');
```

### Example 4: Pattern Learning

```typescript
import { AgentDBClient, PatternRecognizer, ReinforcementLearner } from 'claude-agent-browser';

const agentDB = new AgentDBClient('./db', 384);
const recognizer = new PatternRecognizer(agentDB);
const learner = new ReinforcementLearner();

// Store successful action
agentDB.storeAction({
  action: 'click_button',
  selector: '#submit',
  url: 'https://example.com',
  success: true
});

// Learn from experience
learner.storeExperience({
  state: { url: 'https://example.com' },
  action: 'click_button',
  reward: 10,
  nextState: { url: 'https://example.com/success' },
  done: true,
  timestamp: new Date().toISOString()
});

// Recognize patterns
const pattern = recognizer.recognizePattern([...actions]);
console.log('Intent:', pattern?.intent);
console.log('Confidence:', pattern?.confidence);
```

---

## 🔧 Command Line Usage

### Start MCP Server

```bash
# If installed globally
claude-agent-browser

# If local installation
npm start

# Or directly
node dist/mcp-bridge/index.js
```

### Run Demos

```bash
# Email collection demo
npm run email-gauntlet

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

---

## 🎨 Using with Claude Code

Once configured, Claude Code can use all capabilities through natural language:

### Example Conversations

**Collect email accounts:**
```
You: "Collect 5 temporary email accounts and save them to a file"

Claude: I'll use the email collector to get 5 temporary email accounts...
[Executes automation]
Done! Collected 5 accounts and saved to EMAIL_ACCOUNTS.json
```

**Fill a form:**
```
You: "Go to example.com/signup and fill the form with test data"

Claude: I'll navigate to the signup page and fill the form...
[Uses DOM manipulator]
Form filled successfully!
```

**Check security:**
```
You: "Run a security audit on the stored credentials"

Claude: Running security audit...
[Executes security auditor]
Report: No critical issues found. 2 medium priority recommendations.
```

---

## 📁 File Structure

```
claude-agent-browser/
├── dist/                       # Compiled output
│   └── mcp-bridge/
│       └── index.js           # MCP server entry point
├── src/
│   ├── extension/             # Browser automation
│   │   ├── content/
│   │   │   ├── dom-manipulator.ts
│   │   │   ├── email-collector.ts
│   │   │   └── api-collector.ts
│   │   ├── background/
│   │   │   ├── message-bridge.ts
│   │   │   └── chrome-bridge.ts
│   │   └── lib/
│   │       ├── captcha-solver.ts
│   │       ├── password-vault.ts
│   │       ├── api-vault.ts
│   │       └── credential-importer.ts
│   ├── mcp-bridge/            # MCP integration
│   │   ├── index.ts
│   │   ├── mcp-server.ts
│   │   └── mcp-message-bridge.ts
│   ├── training/              # AI/ML components
│   │   ├── agentdb-client.ts
│   │   ├── reinforcement-learning.ts
│   │   └── pattern-recognizer.ts
│   ├── setup/                 # Browser setup
│   │   ├── browser-installer.ts
│   │   ├── browser-profile-manager.ts
│   │   └── stealth-config.ts
│   ├── security/
│   │   └── security-auditor.ts
│   └── performance/
│       └── performance-optimizer.ts
├── tests/                     # Test suites
├── README.md                  # Project overview
├── HOW-TO-USE.md             # This file
└── package.json              # Package configuration
```

---

## 🔐 Security Best Practices

1. **Master Keys:** Always use strong, unique master keys for password vaults
2. **Permissions:** Only grant necessary browser permissions
3. **Data Storage:** Encrypted data is stored locally - keep backups secure
4. **API Keys:** Never hardcode API keys - use environment variables
5. **Updates:** Keep dependencies updated for security patches

---

## 🐛 Troubleshooting

### MCP Server Won't Start

```bash
# Check if build succeeded
npm run build

# Check for errors
node dist/mcp-bridge/index.js

# Verify path in MCP settings
which claude-agent-browser
```

### Claude Code Can't Find Tools

1. Check MCP settings file location
2. Restart Claude Code
3. Verify server is running: `ps aux | grep claude-agent-browser`

### Tests Failing

```bash
# Clean and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
npm test
```

### Import Errors

Make sure all dependencies are installed:
```bash
npm install
```

---

## 📚 Further Resources

- **README.md** - Project overview and quick start
- **GAME_STATUS.md** - Complete feature list and achievements
- **PLAN.md** - Development roadmap
- **src/tests/** - Example code and usage patterns

---

## 🎯 Quick Reference

| Task | Command/Code |
|------|-------------|
| Install globally | `npm install -g .` |
| Start MCP server | `claude-agent-browser` |
| Run tests | `npm test` |
| Fill form field | `dom.fillField('#id', 'value')` |
| Click element | `dom.clickElement('#button')` |
| Store password | `vault.store('service', 'user', 'pass')` |
| Solve CAPTCHA | `await solver.solve()` |
| Collect emails | `await collector.collectMultiple(5)` |
| Import passwords | `await importer.importFromChrome()` |

---

## 💡 Tips & Tricks

1. **Use profiles** for different identities to avoid tracking
2. **Enable stealth mode** when scraping to avoid detection
3. **Store training data** to improve automation over time
4. **Cache results** for better performance
5. **Run security audits** regularly
6. **Back up encrypted vaults** before importing/exporting

---

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review example code in `src/tests/`
3. Check `GAME_STATUS.md` for feature status
4. File an issue with detailed error logs

---

**🎊 Congratulations! You're ready to automate the web with AI! 🎊**

Built with ❤️ by Claude Code for the Princess 👸
