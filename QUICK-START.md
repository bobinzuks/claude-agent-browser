# ⚡ Quick Start Guide

**Get Claude Agent Browser running in 5 minutes!**

---

## 🚀 Installation (1 minute)

```bash
# Navigate to project
cd claude-agent-browser

# Run installation script
./INSTALL.sh

# Say 'y' when asked to configure automatically
```

**That's it!** The script will:
- ✅ Install all dependencies
- ✅ Build the project
- ✅ Install globally
- ✅ Configure Claude Code MCP settings

---

## 🔄 Restart Claude Code

After installation, **restart Claude Code** to load the new MCP server.

---

## ✅ Verify Installation

In Claude Code, try:

```
Hey Claude, what browser automation tools do you have available?
```

Claude should respond with a list of browser automation capabilities!

---

## 🎯 Your First Automation (2 minutes)

### Example 1: Fill a Form

```
Claude, I need to fill out a form at example.com/contact.
Use these details:
- Name: John Doe
- Email: john@example.com
- Message: Hello, I'm testing automation!
```

### Example 2: Collect Email Accounts

```
Claude, collect 3 temporary email accounts for testing and save them to a file.
```

### Example 3: Save a Password

```
Claude, store this password securely:
- Service: github.com
- Username: myusername
- Password: MySecurePass123!
```

---

## 📚 Learn More

Once you're comfortable with basics, check out:

1. **HOW-TO-USE.md** - Complete usage guide with all features
2. **README.md** - Project overview and architecture
3. **GAME_STATUS.md** - All completed features and capabilities

---

## 🎮 Try These Commands

### Browser Automation
```
"Navigate to example.com and extract all links"
"Fill the login form with test credentials"
"Click the submit button and wait for redirect"
```

### Email Collection
```
"Get me 5 temporary email addresses"
"Collect emails from different providers"
```

### Password Management
```
"Generate a strong 20-character password"
"Store my Netflix credentials securely"
"Import passwords from my Chrome browser"
```

### Learning & Patterns
```
"Show me what automation patterns you've learned"
"What's the most common action I've performed?"
"Analyze the success rate of my automations"
```

---

## 🆘 Troubleshooting

**Claude can't see the tools?**
1. Check MCP settings: `cat ~/.config/claude-code/mcp_settings.json`
2. Restart Claude Code
3. Verify server installed: `which claude-agent-browser`

**Installation failed?**
```bash
# Clean and try again
rm -rf node_modules dist
npm install
npm run build
```

**Need help?**
- Check HOW-TO-USE.md troubleshooting section
- Review example tests in `src/tests/`

---

## 💡 Pro Tips

1. 🛡️ **Use stealth mode** when scraping sites
2. 🔐 **Always use strong master keys** for vaults
3. 🧠 **Let the system learn** - store successful patterns
4. ⚡ **Cache frequently used data** for speed
5. 🔒 **Run security audits** regularly

---

## 🎉 You're Ready!

Start automating the web with AI! Claude now has powerful browser automation capabilities at its fingertips.

**What will you build?** 🚀

---

**Need more details?** → Read [HOW-TO-USE.md](HOW-TO-USE.md)

**Want examples?** → Check `src/tests/` directory

**Ready to go deep?** → See [README.md](README.md)
