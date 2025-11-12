/**
 * Browser Controller - Playwright Integration
 * Provides real browser automation capabilities for MCP tools
 */

import { chromium, Browser, BrowserContext, Page, LaunchOptions } from 'playwright';

export interface BrowserControllerConfig {
  headless?: boolean;
  userDataDir?: string;
  slowMo?: number;
  args?: string[];
}

export interface NavigationResult {
  success: boolean;
  url: string;
  title?: string;
  status?: number;
  [key: string]: unknown;
}

export interface ExtractionResult {
  success: boolean;
  data: unknown;
  error?: string;
}

export class BrowserController {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private pages: Map<string, Page> = new Map();
  private activePage: string | null = null;
  private config: BrowserControllerConfig;
  private isLaunched = false;

  constructor(config: BrowserControllerConfig = {}) {
    this.config = {
      headless: config.headless !== false,
      slowMo: config.slowMo || 0,
      args: config.args || [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ],
      ...config,
    };
  }

  /**
   * Launch browser instance
   */
  async launch(): Promise<void> {
    if (this.isLaunched) {
      console.log('[BrowserController] Browser already launched');
      return;
    }

    try {
      const launchOptions: LaunchOptions = {
        headless: this.config.headless,
        slowMo: this.config.slowMo,
        args: this.config.args,
      };

      if (this.config.userDataDir) {
        // @ts-expect-error - userDataDir exists but type is missing
        launchOptions.userDataDir = this.config.userDataDir;
      }

      this.browser = await chromium.launch(launchOptions);
      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      this.isLaunched = true;
      console.log('[BrowserController] Browser launched successfully');
    } catch (error) {
      console.error('[BrowserController] Failed to launch browser:', error);
      throw error;
    }
  }

  /**
   * Navigate to URL
   */
  async navigate(url: string, pageId?: string): Promise<NavigationResult> {
    if (!this.context) {
      await this.launch();
    }

    try {
      let page: Page;

      if (pageId && this.pages.has(pageId)) {
        page = this.pages.get(pageId)!;
      } else {
        page = await this.context!.newPage();
        const id = pageId || `page_${Date.now()}`;
        this.pages.set(id, page);
        this.activePage = id;
      }

      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      return {
        success: true,
        url: page.url(),
        title: await page.title(),
        status: response?.status(),
      };
    } catch (error) {
      console.error('[BrowserController] Navigation failed:', error);
      return {
        success: false,
        url: url,
        status: 0,
      };
    }
  }

  /**
   * Execute JavaScript in page context
   */
  async executeScript(
    script: string,
    pageId?: string,
    args?: unknown[]
  ): Promise<ExtractionResult> {
    try {
      const page = this.getPage(pageId);
      if (!page) {
        throw new Error('No active page found');
      }

      let result;
      const trimmedScript = script.trim();

      // Detect if script is a function string (arrow or traditional function)
      const functionPatterns = [
        /^function\s*\(/,                    // function()
        /^function\s+\w+\s*\(/,              // function name()
        /^async\s+function\s*\(/,            // async function()
        /^\(\s*\)\s*=>/,                     // () =>
        /^\([^)]+\)\s*=>/,                   // (args) =>
        /^async\s*\(\s*\)\s*=>/,             // async () =>
        /^async\s*\([^)]+\)\s*=>/,           // async (args) =>
      ];

      const isFunctionString = functionPatterns.some((pattern) => pattern.test(trimmedScript));

      if (isFunctionString) {
        // Wrap in IIFE (Immediately Invoked Function Expression)
        if (args && args.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          result = await page.evaluate(`(${trimmedScript})(...arguments)` as any, args);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          result = await page.evaluate(`(${trimmedScript})()` as any);
        }
      } else {
        // Treat as expression or pre-formed function object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await page.evaluate(script as any, args);
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('[BrowserController] Script execution failed:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Wait for selector
   */
  async waitForSelector(
    selector: string,
    pageId?: string,
    timeout = 10000
  ): Promise<boolean> {
    try {
      const page = this.getPage(pageId);
      if (!page) {
        throw new Error('No active page found');
      }

      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.error('[BrowserController] Wait for selector failed:', error);
      return false;
    }
  }

  /**
   * Click element
   */
  async click(selector: string, pageId?: string): Promise<boolean> {
    try {
      const page = this.getPage(pageId);
      if (!page) {
        throw new Error('No active page found');
      }

      await page.click(selector);
      return true;
    } catch (error) {
      console.error('[BrowserController] Click failed:', error);
      return false;
    }
  }

  /**
   * Fill input field
   */
  async fill(
    selector: string,
    value: string,
    pageId?: string
  ): Promise<boolean> {
    try {
      const page = this.getPage(pageId);
      if (!page) {
        throw new Error('No active page found');
      }

      await page.fill(selector, value);
      return true;
    } catch (error) {
      console.error('[BrowserController] Fill failed:', error);
      return false;
    }
  }

  /**
   * Take screenshot
   */
  async screenshot(path: string, pageId?: string): Promise<boolean> {
    try {
      const page = this.getPage(pageId);
      if (!page) {
        throw new Error('No active page found');
      }

      await page.screenshot({ path, fullPage: false });
      return true;
    } catch (error) {
      console.error('[BrowserController] Screenshot failed:', error);
      return false;
    }
  }

  /**
   * Create new page and return ID
   */
  async newPage(): Promise<string> {
    if (!this.context) {
      await this.launch();
    }

    const page = await this.context!.newPage();
    const pageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.pages.set(pageId, page);
    this.activePage = pageId;

    return pageId;
  }

  /**
   * Close specific page
   */
  async closePage(pageId: string): Promise<void> {
    const page = this.pages.get(pageId);
    if (page) {
      await page.close();
      this.pages.delete(pageId);

      // Clear activePage if we just closed it
      if (this.activePage === pageId) {
        this.activePage = this.pages.size > 0
          ? Array.from(this.pages.keys())[0]
          : null;
      }
    }
  }

  /**
   * Get page by ID or return first page
   */
  private getPage(pageId?: string): Page | null {
    if (pageId && this.pages.has(pageId)) {
      return this.pages.get(pageId)!;
    }

    // Return first page if no ID specified
    const firstPage = Array.from(this.pages.values())[0];
    return firstPage || null;
  }

  /**
   * Get the currently active page ID
   * Returns the most recently navigated or created page
   */
  public getActivePage(): string | null {
    // If activePage is set and still exists, return it
    if (this.activePage && this.pages.has(this.activePage)) {
      return this.activePage;
    }

    // Fallback: return first page if available
    if (this.pages.size > 0) {
      this.activePage = Array.from(this.pages.keys())[0];
      return this.activePage;
    }

    return null;
  }

  /**
   * Get all page IDs
   */
  getPageIds(): string[] {
    return Array.from(this.pages.keys());
  }

  /**
   * Close all pages
   */
  async closeAllPages(): Promise<void> {
    for (const page of this.pages.values()) {
      await page.close();
    }
    this.pages.clear();
    this.activePage = null;
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    try {
      await this.closeAllPages();

      if (this.context) {
        await this.context.close();
        this.context = null;
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.isLaunched = false;
      console.log('[BrowserController] Browser closed');
    } catch (error) {
      console.error('[BrowserController] Error closing browser:', error);
    }
  }

  /**
   * Check if browser is launched
   */
  isActive(): boolean {
    return this.isLaunched && this.browser !== null;
  }

  /**
   * Get current page count
   */
  getPageCount(): number {
    return this.pages.size;
  }
}
