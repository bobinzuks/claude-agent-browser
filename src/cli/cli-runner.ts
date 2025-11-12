#!/usr/bin/env node
/**
 * Standalone CLI Runner (No MCP Required)
 * Direct browser automation from command line
 */

import { chromium, Browser, Page } from 'playwright';

interface CLICommand {
  action: 'navigate' | 'fill-form' | 'click' | 'extract' | 'screenshot' | 'signup' | 'login' | 'test';
  args: string[];
}

class BrowserCLI {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
  }

  async close(): Promise<void> {
    await this.browser?.close();
  }

  async navigate(url: string): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');
    console.log(`Navigating to ${url}...`);
    await this.page.goto(url);
    console.log('✅ Navigation complete');
  }

  async fillForm(fields: Record<string, string>): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');
    console.log('Filling form fields...');

    for (const [selector, value] of Object.entries(fields)) {
      await this.page.fill(selector, value);
      console.log(`  ✓ Filled ${selector}`);
    }
    console.log('✅ Form filled');
  }

  async click(selector: string): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');
    console.log(`Clicking ${selector}...`);
    await this.page.click(selector);
    console.log('✅ Click complete');
  }

  async extract(selector: string): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');
    console.log(`Extracting from ${selector}...`);
    const text = await this.page.textContent(selector);
    console.log(`✅ Extracted: ${text}`);
    return text || '';
  }

  async screenshot(path: string): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');
    console.log(`Taking screenshot to ${path}...`);
    await this.page.screenshot({ path, fullPage: true });
    console.log('✅ Screenshot saved');
  }

  async signup(site: string, email: string, password: string): Promise<void> {
    console.log(`🚀 Starting signup flow for ${site}...`);

    // Site-specific signup logic
    if (site === 'github') {
      await this.navigate('https://github.com/signup');
      await this.fillForm({
        '#email': email,
        '#password': password
      });
      await this.click('button[type="submit"]');
    } else {
      console.error(`❌ Unknown site: ${site}`);
    }

    console.log('✅ Signup complete');
  }

  async login(site: string, username: string, password: string): Promise<void> {
    console.log(`🔐 Starting login flow for ${site}...`);

    if (site === 'github') {
      await this.navigate('https://github.com/login');
      await this.fillForm({
        '#login_field': username,
        '#password': password
      });
      await this.click('input[type="submit"]');
    } else {
      console.error(`❌ Unknown site: ${site}`);
    }

    console.log('✅ Login complete');
  }

  async test(url: string): Promise<void> {
    console.log(`🧪 Testing ${url}...`);

    await this.navigate(url);

    const title = await this.page?.title();
    console.log(`  Page title: ${title}`);

    const screenshot = `test-${Date.now()}.png`;
    await this.screenshot(screenshot);

    console.log('✅ Test complete');
  }
}

async function parseCommand(args: string[]): Promise<CLICommand | null> {
  if (args.length === 0) {
    return null;
  }

  const action = args[0] as CLICommand['action'];
  const commandArgs = args.slice(1);

  return { action, args: commandArgs };
}

function printUsage(): void {
  console.log(`
🌐 Browser Automation CLI (Standalone - No MCP Required)

USAGE:
  browser-cli <command> [args...]

COMMANDS:
  navigate <url>                    Navigate to URL
  fill-form <json>                  Fill form (JSON: {"selector": "value"})
  click <selector>                  Click element
  extract <selector>                Extract text from element
  screenshot <path>                 Take screenshot
  signup <site> <email> <password>  Automated signup
  login <site> <user> <password>    Automated login
  test <url>                        Test website

EXAMPLES:
  browser-cli navigate https://github.com
  browser-cli signup github test@example.com password123
  browser-cli login github myuser password123
  browser-cli test https://example.com
  browser-cli screenshot output.png

SITES SUPPORTED:
  - github
  - (more coming soon...)

For MCP integration with Claude Code, use: claude-agent-browser
  `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }

  const command = await parseCommand(args);

  if (!command) {
    console.error('❌ Invalid command');
    printUsage();
    process.exit(1);
  }

  const cli = new BrowserCLI();

  try {
    await cli.init();

    switch (command.action) {
      case 'navigate':
        await cli.navigate(command.args[0]);
        break;

      case 'fill-form':
        const fields = JSON.parse(command.args[0]);
        await cli.fillForm(fields);
        break;

      case 'click':
        await cli.click(command.args[0]);
        break;

      case 'extract':
        await cli.extract(command.args[0]);
        break;

      case 'screenshot':
        await cli.screenshot(command.args[0]);
        break;

      case 'signup':
        await cli.signup(command.args[0], command.args[1], command.args[2]);
        break;

      case 'login':
        await cli.login(command.args[0], command.args[1], command.args[2]);
        break;

      case 'test':
        await cli.test(command.args[0]);
        break;

      default:
        console.error(`❌ Unknown action: ${command.action}`);
        printUsage();
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  } finally {
    await cli.close();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
