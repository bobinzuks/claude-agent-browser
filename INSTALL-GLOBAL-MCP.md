# 🌍 GLOBAL MCP INSTALLATION GUIDE
## Claude Agent Browser - System-Wide Installation

This guide shows you how to install Claude Agent Browser as a **global MCP server** for Claude Code, enabling browser automation capabilities across all your projects.

---

## 📋 Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **Claude Code** CLI installed
- **Chrome or Chromium** browser

---

## 🚀 Quick Installation

### Step 1: Install Globally via npm

```bash
cd claude-agent-browser
npm install -g .
```

This installs the `claude-agent-browser` command globally and makes it available system-wide.

### Step 2: Configure Claude Code MCP Settings

Add the server to your Claude Code MCP configuration:

**Location:** `~/.config/claude-code/mcp_settings.json` (Linux/Mac)
**Location:** `%APPDATA%\claude-code\mcp_settings.json` (Windows)

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

### Step 3: Restart Claude Code

```bash
# Restart Claude Code to load the new MCP server
claude-code --restart
```

### Step 4: Verify Installation

```bash
# Test that the server starts correctly
claude-agent-browser
```

You should see:
```
Claude Agent Browser MCP Server v1.0.0
Listening on stdio transport...
Server ready!
```

---

## 🔧 Alternative: Local Installation (Without Global)

If you prefer not to install globally:

### Step 1: Build the Project

```bash
cd /media/terry/data/projects/projects/chatgpt-atlas/claude-agent-browser
npm install
npm run build
```

### Step 2: Configure MCP with Absolute Path

```json
{
  "mcpServers": {
    "claude-agent-browser": {
      "command": "node",
      "args": [
        "/media/terry/data/projects/projects/chatgpt-atlas/claude-agent-browser/dist/mcp-bridge/index.js"
      ],
      "env": {}
    }
  }
}
```

---

## 🎯 Available MCP Tools

Once installed, Claude Code can use these tools:

### 1. **browser_automate**
Automate browser interactions (fill forms, click buttons, navigate)

```typescript
{
  "action": "fill_form",
  "url": "https://example.com/signup",
  "fields": {
    "email": "user@example.com",
    "password": "secure123"
  }
}
```

### 2. **credential_store**
Securely store credentials with AES-256 encryption

```typescript
{
  "service": "github",
  "username": "myuser",
  "password": "mypass",
  "notes": "GitHub API account"
}
```

### 3. **credential_retrieve**
Retrieve stored credentials

```typescript
{
  "service": "github"
}
```

### 4. **captcha_solve**
Detect and solve CAPTCHAs

```typescript
{
  "url": "https://example.com",
  "type": "recaptcha_v2"
}
```

### 5. **pattern_store**
Store automation patterns for learning

```typescript
{
  "pattern": {
    "domain": "github.com",
    "action": "login",
    "selectors": {"email": "#login_field"}
  }
}
```

### 6. **pattern_search**
Search for similar automation patterns

```typescript
{
  "query": "login form",
  "limit": 5
}
```

### 7. **email_collect**
Collect temporary email accounts automatically

```typescript
{
  "provider": "guerrillamail",
  "count": 1
}
```

### 8. **browser_profile_create**
Create stealth browser profiles with fingerprint randomization

```typescript
{
  "name": "stealth-profile-1"
}
```

---

## 📚 Usage Examples

### Example 1: Automated GitHub Login

```bash
# In Claude Code, you can now ask:
"Use the browser to log into GitHub with my credentials"
```

Claude Code will:
1. Use `credential_retrieve` to get your GitHub credentials
2. Use `browser_automate` to navigate and fill the login form
3. Use `captcha_solve` if needed
4. Store the automation pattern for future use

### Example 2: Collect Email Accounts

```bash
"Collect 5 temporary email accounts for testing"
```

Claude Code will:
1. Use `email_collect` to automate email account creation
2. Use `credential_store` to save the accounts securely
3. Use `pattern_store` to learn from the automation

### Example 3: API Key Collection

```bash
"Sign up for the OpenWeatherMap API and store the API key"
```

Claude Code will:
1. Use `browser_automate` to navigate the signup flow
2. Extract the API key from the page
3. Use `credential_store` to save it securely

---

## ⚙️ Configuration Options

### Environment Variables

You can configure the MCP server with environment variables:

```json
{
  "mcpServers": {
    "claude-agent-browser": {
      "command": "claude-agent-browser",
      "args": [],
      "env": {
        "BROWSER_HEADLESS": "true",
        "AGENTDB_PATH": "/path/to/custom/db",
        "VAULT_MASTER_KEY": "your-secure-master-key",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Available Environment Variables

- `BROWSER_HEADLESS` - Run browser in headless mode (default: `false`)
- `AGENTDB_PATH` - Path to AgentDB database (default: `./agentdb`)
- `VAULT_MASTER_KEY` - Master encryption key for credential vault
- `LOG_LEVEL` - Logging verbosity: `debug`, `info`, `warn`, `error`
- `MAX_PARALLEL_ACTIONS` - Max concurrent browser actions (default: `3`)
- `ACTION_TIMEOUT` - Timeout for browser actions in ms (default: `30000`)

---

## 🔒 Security Best Practices

### 1. Set a Strong Master Key

```bash
# Generate a secure random key
export VAULT_MASTER_KEY=$(openssl rand -base64 32)

# Add to your shell profile
echo "export VAULT_MASTER_KEY='$VAULT_MASTER_KEY'" >> ~/.bashrc
```

### 2. Use Environment-Specific Keys

Don't share master keys between development/production:

```json
{
  "mcpServers": {
    "claude-agent-browser-dev": {
      "command": "claude-agent-browser",
      "env": {
        "VAULT_MASTER_KEY": "${VAULT_KEY_DEV}"
      }
    },
    "claude-agent-browser-prod": {
      "command": "claude-agent-browser",
      "env": {
        "VAULT_MASTER_KEY": "${VAULT_KEY_PROD}"
      }
    }
  }
}
```

### 3. Encrypt AgentDB Storage

```bash
# Use encrypted filesystem for AgentDB
export AGENTDB_PATH="/encrypted/volume/agentdb"
```

---

## 🐛 Troubleshooting

### Server Won't Start

**Problem:** `claude-agent-browser: command not found`

**Solution:**
```bash
# Check if globally installed
npm list -g claude-agent-browser

# If not found, reinstall
cd /media/terry/data/projects/projects/chatgpt-atlas/claude-agent-browser
npm install -g .
```

### MCP Connection Errors

**Problem:** Claude Code can't connect to MCP server

**Solution:**
```bash
# Check MCP settings file exists
cat ~/.config/claude-code/mcp_settings.json

# Test server manually
claude-agent-browser

# Check Claude Code logs
tail -f ~/.config/claude-code/logs/mcp-*.log
```

### Permission Errors

**Problem:** `EACCES: permission denied`

**Solution:**
```bash
# Fix npm global permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Browser Not Found

**Problem:** `Error: Chromium not found`

**Solution:**
```bash
# Install Chromium
# Ubuntu/Debian
sudo apt install chromium-browser

# Mac
brew install --cask chromium

# Or set custom browser path
export CHROMIUM_PATH="/path/to/chrome"
```

---

## 📊 Monitoring & Logs

### View Real-Time Logs

```bash
# MCP server logs
tail -f ~/.config/claude-code/logs/claude-agent-browser.log

# System logs (if using systemd)
journalctl -u claude-agent-browser -f
```

### Enable Debug Logging

```json
{
  "env": {
    "LOG_LEVEL": "debug"
  }
}
```

---

## 🔄 Updating

### Update to Latest Version

```bash
cd /media/terry/data/projects/projects/chatgpt-atlas/claude-agent-browser
git pull origin main
npm install
npm run build
npm install -g .
```

### Auto-Update (Coming Soon)

Automatic updates will be available when published to npm:

```bash
npm update -g claude-agent-browser
```

---

## 📦 Uninstallation

### Remove Global Installation

```bash
npm uninstall -g claude-agent-browser
```

### Remove Configuration

```bash
# Edit MCP settings
nano ~/.config/claude-code/mcp_settings.json

# Remove the "claude-agent-browser" entry
```

### Remove Data

```bash
# Remove AgentDB and credentials (WARNING: Irreversible!)
rm -rf ~/.claude-agent-browser
rm -rf ./agentdb
```

---

## 🎯 What's Next?

Now that Claude Agent Browser is installed globally:

1. **Try automation examples** - See `EXAMPLES.md`
2. **Read the full documentation** - See `HOW-TO-USE.md`
3. **Explore all features** - See `README.md`
4. **Check advanced use cases** - See `ADVANCED-USAGE.md`

---

## 🆘 Getting Help

- **Documentation:** `/media/terry/data/projects/projects/chatgpt-atlas/claude-agent-browser/docs/`
- **Issues:** Report bugs in project README
- **Examples:** See `demo-*.ts` files for working code

---

**Installed successfully? Try this:**

```bash
# In Claude Code:
"Use the browser automation to check if GitHub is accessible"
```

Claude Code will now use your globally installed MCP server! 🎉
