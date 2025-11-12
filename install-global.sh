#!/bin/bash

# ═══════════════════════════════════════════════════════════════════
# CLAUDE AGENT BROWSER - GLOBAL MCP INSTALLATION SCRIPT
# ═══════════════════════════════════════════════════════════════════

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
cat << "EOF"
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║   ███████  CLAUDE AGENT BROWSER  ███████                     ║
  ║   Global MCP Server Installation                             ║
  ║                                                               ║
  ║   🤖 AI-Powered Browser Automation                            ║
  ║   🔐 Secure Credential Management                             ║
  ║   🧠 Pattern Learning with AgentDB                            ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Functions
print_step() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✔ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✖ $1${NC}"
}

# Check prerequisites
print_step "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    echo "Please install Node.js >= 18 from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version is $NODE_VERSION, but >= 18 is required"
    exit 1
fi
print_success "Node.js $(node --version) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm $(npm --version) detected"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the claude-agent-browser directory"
    exit 1
fi
print_success "Found package.json"

# Build the project
print_step "Building Claude Agent Browser..."
npm install
npm run build
print_success "Build completed"

# Install globally
print_step "Installing globally..."
npm install -g .
print_success "Installed globally as 'claude-agent-browser'"

# Test installation
print_step "Testing installation..."
if command -v claude-agent-browser &> /dev/null; then
    print_success "claude-agent-browser command is available"
else
    print_error "Installation failed - command not found in PATH"
    exit 1
fi

# Detect Claude Code config directory
print_step "Detecting Claude Code configuration..."

CLAUDE_CONFIG_DIR=""
if [ -d "$HOME/.config/claude-code" ]; then
    CLAUDE_CONFIG_DIR="$HOME/.config/claude-code"
elif [ -d "$HOME/Library/Application Support/claude-code" ]; then
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/claude-code"
elif [ -d "$APPDATA/claude-code" ]; then
    CLAUDE_CONFIG_DIR="$APPDATA/claude-code"
fi

if [ -z "$CLAUDE_CONFIG_DIR" ]; then
    print_warning "Claude Code config directory not found"
    echo "You'll need to manually configure MCP settings"
else
    print_success "Found Claude Code config at: $CLAUDE_CONFIG_DIR"

    # Create MCP settings
    MCP_SETTINGS_FILE="$CLAUDE_CONFIG_DIR/mcp_settings.json"

    if [ -f "$MCP_SETTINGS_FILE" ]; then
        print_warning "MCP settings file already exists"
        echo "Please manually add claude-agent-browser to $MCP_SETTINGS_FILE"
    else
        print_step "Creating MCP settings file..."
        mkdir -p "$CLAUDE_CONFIG_DIR"
        cat > "$MCP_SETTINGS_FILE" << 'JSON'
{
  "mcpServers": {
    "claude-agent-browser": {
      "command": "claude-agent-browser",
      "args": [],
      "env": {}
    }
  }
}
JSON
        print_success "Created $MCP_SETTINGS_FILE"
    fi
fi

# Generate master encryption key
print_step "Generating secure master encryption key..."
MASTER_KEY=$(openssl rand -base64 32 2>/dev/null || echo "")

if [ -z "$MASTER_KEY" ]; then
    print_warning "Could not generate master key (openssl not found)"
    print_warning "Please set VAULT_MASTER_KEY manually"
else
    print_success "Master key generated"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}IMPORTANT: Save this master encryption key securely!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}export VAULT_MASTER_KEY='$MASTER_KEY'${NC}"
    echo ""
    echo "Add this to your shell profile (~/.bashrc or ~/.zshrc):"
    echo ""
    echo -e "${BLUE}echo \"export VAULT_MASTER_KEY='$MASTER_KEY'\" >> ~/.bashrc${NC}"
    echo ""
fi

# Summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✔ INSTALLATION COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Set your master encryption key:"
echo -e "   ${BLUE}export VAULT_MASTER_KEY='<your-key>'${NC}"
echo ""
echo "2. Restart Claude Code:"
echo -e "   ${BLUE}claude-code --restart${NC}"
echo ""
echo "3. Test the MCP server:"
echo -e "   ${BLUE}claude-agent-browser${NC}"
echo ""
echo "4. Use browser automation in Claude Code:"
echo -e "   ${YELLOW}\"Use the browser to navigate to example.com\"${NC}"
echo ""
echo "Documentation:"
echo "  • Installation Guide: INSTALL-GLOBAL-MCP.md"
echo "  • MCP Tools Reference: MCP-TOOLS-REFERENCE.md"
echo "  • User Manual: HOW-TO-USE.md"
echo "  • Examples: demo-*.ts"
echo ""
echo -e "${GREEN}Happy automating! 🤖${NC}"
echo ""
