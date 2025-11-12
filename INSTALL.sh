#!/bin/bash
# Claude Agent Browser - Global Installation Script

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║     🤖 Claude Agent Browser - Installation 🤖           ║"
echo "║                                                          ║"
echo "║  AI-Powered Browser Automation for Claude Code          ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build project
echo "🔨 Building project..."
npm run build

if [ ! -f "dist/mcp-bridge/index.js" ]; then
    echo "❌ Error: Build failed - MCP server not found"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Install globally
echo "🌍 Installing globally..."
npm install -g .

echo ""
echo "✅ Installation complete!"
echo ""

# Detect Claude Code config directory
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_DIR="$HOME/.config/claude-code"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    CONFIG_DIR="$APPDATA/claude-code"
else
    CONFIG_DIR="$HOME/.config/claude-code"
fi

MCP_CONFIG="$CONFIG_DIR/mcp_settings.json"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║              🔧 Configuration Required 🔧                ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "To use with Claude Code, add this to your MCP settings:"
echo ""
echo "File: $MCP_CONFIG"
echo ""
echo "{"
echo "  \"mcpServers\": {"
echo "    \"claude-agent-browser\": {"
echo "      \"command\": \"claude-agent-browser\","
echo "      \"args\": [],"
echo "      \"env\": {}"
echo "    }"
echo "  }"
echo "}"
echo ""

# Offer to create config automatically
read -p "Would you like to create this configuration automatically? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    mkdir -p "$CONFIG_DIR"

    if [ -f "$MCP_CONFIG" ]; then
        echo "⚠️  MCP config file already exists. Creating backup..."
        cp "$MCP_CONFIG" "$MCP_CONFIG.backup.$(date +%s)"
        echo "✅ Backup created: $MCP_CONFIG.backup.*"
    fi

    cat > "$MCP_CONFIG" << 'EOF'
{
  "mcpServers": {
    "claude-agent-browser": {
      "command": "claude-agent-browser",
      "args": [],
      "env": {}
    }
  }
}
EOF

    echo "✅ Configuration file created: $MCP_CONFIG"
    echo ""
    echo "🔄 Please restart Claude Code to load the MCP server"
else
    echo "⏭️  Skipping automatic configuration"
    echo "Please manually add the configuration shown above"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║                   ✅ Setup Complete! ✅                  ║"
echo "║                                                          ║"
echo "║  Next steps:                                             ║"
echo "║  1. Restart Claude Code                                  ║"
echo "║  2. Test: Ask Claude to show browser automation tools    ║"
echo "║  3. Read HOW-TO-USE.md for examples                      ║"
echo "║                                                          ║"
echo "║  Quick start:                                            ║"
echo "║  - claude-agent-browser --help                           ║"
echo "║  - npm run email-gauntlet                                ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 Happy automating! 🎉"
echo ""
