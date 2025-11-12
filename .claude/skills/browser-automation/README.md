# Browser Automation Skill - Documentation Index

Complete documentation for the Claude Code browser automation skill.

## 📚 Documentation Structure

```
.claude/skills/browser-automation/
├── SKILL.md                    # Main skill definition (START HERE)
├── HOW-TO-USE.md              # Complete usage guide
├── QUICK-REFERENCE.md         # Quick lookup guide
├── README.md                  # This file
└── examples/
    ├── workflow-signup.md     # Signup automation example
    └── workflow-login.md      # Login automation example
```

## 🚀 Quick Start

1. **Start Here**: Read `SKILL.md` for overview and capabilities
2. **Setup**: Follow installation instructions in `HOW-TO-USE.md`
3. **Reference**: Use `QUICK-REFERENCE.md` for quick lookups
4. **Examples**: Check `examples/` for real-world workflows

## 📖 Document Purposes

### SKILL.md
- **Purpose**: Main skill definition for Claude Code
- **Contains**:
  - Skill metadata (name, description)
  - Complete list of MCP tools
  - Architecture overview
  - Use cases and best practices
- **When to use**: Understanding what the skill can do

### HOW-TO-USE.md
- **Purpose**: Comprehensive usage guide
- **Contains**:
  - Installation instructions
  - Common tasks and workflows
  - Configuration options
  - Troubleshooting guide
  - NPM commands reference
- **When to use**: Setting up or learning how to use the skill

### QUICK-REFERENCE.md
- **Purpose**: Fast lookup guide
- **Contains**:
  - Command syntax examples
  - Tool categories table
  - Common workflow snippets
  - File locations
  - Pro tips
- **When to use**: Quick reference during development

### examples/workflow-signup.md
- **Purpose**: Complete signup automation example
- **Contains**:
  - Step-by-step workflow
  - Complete working script
  - Error handling examples
  - Variations (temp email, stealth profiles)
- **When to use**: Implementing signup automation

### examples/workflow-login.md
- **Purpose**: Login with pattern learning example
- **Contains**:
  - Pattern-based login workflow
  - Manual fallback
  - Multi-service login
  - 2FA support
- **When to use**: Implementing login automation

## 🎯 Getting Started

### For First-Time Users

```bash
# 1. Read the main skill definition
cat SKILL.md

# 2. Follow installation guide
cat HOW-TO-USE.md | less

# 3. Try a simple example
# (Follow examples in QUICK-REFERENCE.md)
```

### For Experienced Users

```bash
# Quick command lookup
cat QUICK-REFERENCE.md | grep "browser_navigate"

# Find specific workflow
cat examples/workflow-signup.md
```

## 🔧 Available MCP Tools

Quick reference - see `SKILL.md` for complete documentation:

| Category | Tools |
|----------|-------|
| Browser | navigate, click, fill_form, extract, screenshot, wait |
| Credentials | store, retrieve, search, delete, export, import |
| CAPTCHA | detect, solve, train |
| Patterns | store, search, retrieve, stats |
| Email | collect, check_inbox |
| Profiles | create, list, delete |
| Security | audit, password_generate, username_generate |
| System | agentdb_stats, performance_report |

## 📋 Common Use Cases

1. **Automate Signup & API Key Extraction**
   - See: `examples/workflow-signup.md`
   - Tools: browser_navigate, browser_fill_form, credential_store

2. **Login with Stored Credentials**
   - See: `examples/workflow-login.md`
   - Tools: credential_retrieve, pattern_search, browser_fill_form

3. **Web Scraping & Data Extraction**
   - See: `QUICK-REFERENCE.md` → Data Extraction
   - Tools: browser_navigate, browser_wait, browser_extract

4. **Credential Management**
   - See: `HOW-TO-USE.md` → Task 4
   - Tools: credential_store, credential_search, credential_retrieve

5. **Pattern Learning**
   - See: `HOW-TO-USE.md` → Task 5
   - Tools: pattern_store, pattern_search

## 🛠️ Project Files

Additional reference files in the main project:

- `MCP-TOOLS-REFERENCE.md` - Complete MCP API documentation
- `PLAN.md` - Project architecture and roadmap
- `demo-email-gauntlet.ts` - Email automation demo
- `demo-api-vault.ts` - Credential vault demo
- `package.json` - NPM scripts and dependencies
- `tests/` - Unit and integration tests

## 💡 Tips

1. **Start simple**: Try `browser_navigate` first
2. **Use examples**: Copy and adapt example workflows
3. **Check success fields**: Always validate responses
4. **Learn patterns**: Store successful workflows for reuse
5. **Read tests**: Check `tests/` directory for more examples

## 🆘 Troubleshooting

See `HOW-TO-USE.md` → Troubleshooting section for:
- Extension not loading
- MCP server connection issues
- Tool failures
- Credential retrieval problems

## 📝 Contributing

To add new examples or improve documentation:

1. Follow existing structure and format
2. Include working code examples
3. Add error handling
4. Update this README if adding new files

## 🔗 Related Resources

- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/)

---

**Documentation Version**: 1.0.0
**Last Updated**: 2025-10-27
**Maintained by**: Claude Code
**License**: MIT

## Quick Links

- [Main Skill Definition](SKILL.md)
- [Usage Guide](HOW-TO-USE.md)
- [Quick Reference](QUICK-REFERENCE.md)
- [Signup Example](examples/workflow-signup.md)
- [Login Example](examples/workflow-login.md)
