/**
 * Click Factory Controller
 *
 * Extends BrowserController to add 4-in-1 split-screen
 * factory mode for parallel form processing.
 *
 * Integrates with AgentDB for pattern learning and success tracking.
 */

import { type BrowserContext, type Page, type Frame, chromium, type Browser } from 'playwright';
import { BrowserController } from '../../mcp-bridge/browser-controller';
import { SPADetector } from './utils/spa-detector';
import { AgentDBAdapter } from './adapters/agentdb-adapter';

export type FactoryMode = 'phase1-auto' | 'phase2-human';
export type GridSize = 4 | 8;

export interface ClickFactoryConfig {
  mode: FactoryMode;
  batchSize: GridSize;
  useAgentDB: boolean;
  sessionId?: string;
}

export interface BatchSite {
  url: string;
  name: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  network?: string;
  compliance_level?: number;
}

export interface BatchResult {
  site: BatchSite;
  success: boolean;
  fieldsDetected: number;
  fieldsFilled: number;
  submitted: boolean;
  error?: string;
  duration: number;
}

export interface FactoryStats {
  batchesCompleted: number;
  sitesProcessed: number;
  sitesSucceeded: number;
  sitesFailed: number;
  totalDuration: number;
  successRate: number;
  avgTimePerSite: number;
}

/**
 * Click Factory Controller
 *
 * Manages 4-iframe split-screen automation:
 * - Phase 1: Full automation (ToS-safe training)
 * - Phase 2: Human-in-loop (real networks)
 */
export class ClickFactoryController extends BrowserController {
  private db?: AgentDBAdapter;
  private factoryConfig: ClickFactoryConfig;
  private spaDetector: SPADetector;
  private factoryBrowser: Browser | null = null;
  private stats = {
    batchesCompleted: 0,
    sitesProcessed: 0,
    sitesSucceeded: 0,
    sitesFailed: 0,
    totalDuration: 0
  };

  constructor(config: Partial<ClickFactoryConfig> = {}) {
    super({
      headless: false,
      slowMo: 0
    });

    this.factoryConfig = {
      mode: 'phase2-human',
      batchSize: 4,
      useAgentDB: true,
      ...config
    };

    // Initialize utility classes
    this.spaDetector = new SPADetector();
  }

  /**
   * Initialize Click Factory with AgentDB
   */
  async initialize(): Promise<void> {
    await this.launch();

    // Launch separate browser for factory operations
    this.factoryBrowser = await chromium.launch({
      headless: false,
      slowMo: 0,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ]
    });

    if (this.factoryConfig.useAgentDB) {
      this.db = new AgentDBAdapter('sqlite');
      await this.db.initialize();
      console.log('[ClickFactory] AgentDB initialized - patterns will be learned');
    }

    console.log(`[ClickFactory] Mode: ${this.factoryConfig.mode}`);
    console.log(`[ClickFactory] Grid: ${this.factoryConfig.batchSize === 4 ? '2x2' : '2x4'}`);
  }

  /**
   * V6: Process site in direct navigation mode (no iframe)
   * Used as fallback when iframe embedding is blocked
   */
  protected async processSiteDirectly(
    site: BatchSite,
    userData: any
  ): Promise<BatchResult> {
    const startTime = Date.now();
    console.log(`  🔄 FALLBACK: Processing ${site.name} in direct navigation mode`);

    const context = await this.createFactoryContext();

    try {
      const page = await context.newPage();

      // Navigate directly to the site
      await page.goto(site.url, {
        waitUntil: 'domcontentloaded',
        timeout: this.getAdaptiveTimeout(site.difficulty || 'easy')
      });

      // Wait for network idle
      await page.waitForLoadState('networkidle', {
        timeout: this.getAdaptiveTimeout(site.difficulty || 'easy')
      }).catch(() => {
        console.log(`    ⏱️  Network not idle, continuing anyway`);
      });

      // SPA hydration detection
      const framework = await this.spaDetector.detectFramework(page.mainFrame());
      if (framework !== 'unknown') {
        console.log(`    🎯 SPA: ${framework}`);
        await this.spaDetector.waitForHydration(page.mainFrame(), { framework });
        await page.waitForTimeout(3000);
      } else {
        await page.waitForTimeout(2000);
      }

      // Wait for form fields
      try {
        await page.waitForSelector('input, textarea, select', {
          timeout: 10000,
          state: 'attached'
        });
        console.log(`    ✅ Form fields detected`);
      } catch (e) {
        console.log(`    ⚠️  No form fields found`);
      }

      // Close any about:blank popups before filling
      const allPages = context.pages();
      for (const p of allPages) {
        if (p !== page && (p.url() === 'about:blank' || p.url() === '')) {
          await p.close().catch(() => {});
        }
      }

      // Bring target page to front
      await page.bringToFront();
      await page.waitForTimeout(200);

      // Auto-fill form
      const { detected, filled } = await this.autoFillForm(page.mainFrame(), userData);

      const result: BatchResult = {
        site,
        success: filled > 0,
        fieldsDetected: detected,
        fieldsFilled: filled,
        submitted: false,
        duration: Date.now() - startTime
      };

      // Record to AgentDB
      if (this.db && result.success) {
        await this.recordToAgentDB(site, result);
      }

      // Screenshot for verification (optional)
      await page.screenshot({
        path: `./screenshots/${site.name.replace(/[^a-z0-9]/gi, '_')}_direct.png`,
        fullPage: false
      }).catch(() => {});

      await page.waitForTimeout(2000);
      await context.close();

      return result;

    } catch (error: any) {
      await context.close();
      return {
        site,
        success: false,
        fieldsDetected: 0,
        fieldsFilled: 0,
        submitted: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Process a batch of sites in 2x2 or 2x4 grid
   * V6: Enhanced with automatic fallback to direct navigation for blocked iframes
   * V7: Added blank page detection to skip processing pages with no form fields
   */
  async processBatch(sites: BatchSite[], userData: any): Promise<BatchResult[]> {
    if (sites.length > this.factoryConfig.batchSize) {
      throw new Error(`Batch size exceeds ${this.factoryConfig.batchSize}`);
    }

    const batchStart = Date.now();
    console.log(`\n[Batch ${this.stats.batchesCompleted + 1}] Processing ${sites.length} sites...`);

    // V7: Filter out blank pages (sites with no form fields)
    const filteredSites = await this.filterBlankPages(sites);

    if (filteredSites.length === 0) {
      console.log('  ⊘  All sites in batch are blank pages (no form fields) - SKIPPING');
      return sites.map(site => ({
        site,
        success: false,
        fieldsDetected: 0,
        fieldsFilled: 0,
        submitted: false,
        error: 'BLANK_PAGE: No form fields detected',
        duration: 0
      }));
    }

    if (filteredSites.length < sites.length) {
      console.log(`  ⚠️  Filtered out ${sites.length - filteredSites.length} blank pages`);
    }

    // Create context with X-Frame-Options bypass
    const context = await this.createFactoryContext();
    const page = await context.newPage();

    // Build grid HTML with filtered sites
    const html = this.buildGridHTML(filteredSites);
    // V4: Increase timeout for setContent + retry logic
    try {
      await page.setContent(html, { timeout: 90000 });
    } catch (e) {
      console.log('    ⚠️  setContent timeout, retrying with waitUntil: domcontentloaded...');
      await page.setContent(html, { timeout: 120000, waitUntil: 'domcontentloaded' });
    }

    // Fullscreen
    await page.keyboard.press('F11');
    await page.waitForTimeout(3000);

    // Process each iframe
    const results: BatchResult[] = [];
    const frames = page.frames();
    const blockedSites: BatchSite[] = [];

    for (let i = 0; i < filteredSites.length; i++) {
      const site = filteredSites[i];
      const frame = frames[i + 1]; // Skip main frame

      if (!frame) continue;

      console.log(`  [${i + 1}/${filteredSites.length}] ${site.name || site.url}`);
      const result = await this.processSite(frame, site, userData);

      // V6: Check if iframe was blocked
      if (result.error && result.error.includes('IFRAME_BLOCKED')) {
        console.log(`    ↪️  Queueing for direct navigation fallback`);
        blockedSites.push(site);
      }

      results.push(result);

      // Record to AgentDB (only if successful)
      if (this.db && result.success) {
        await this.recordToAgentDB(site, result);
      }
    }

    // Mode-specific submission for successful iframe loads
    if (this.factoryConfig.mode === 'phase2-human') {
      await this.humanSubmitWorkflow(page, frames.slice(1, sites.length + 1));
    } else {
      await this.autoSubmitAll(frames.slice(1, sites.length + 1));
    }

    await page.waitForTimeout(2000);
    await context.close();

    // V6: Process blocked sites using direct navigation fallback
    if (blockedSites.length > 0) {
      console.log(`\n🔄 FALLBACK MODE: Processing ${blockedSites.length} iframe-blocked sites directly...`);

      for (const blockedSite of blockedSites) {
        const directResult = await this.processSiteDirectly(blockedSite, userData);

        // Replace the failed iframe result with direct navigation result
        const index = results.findIndex(r => r.site.url === blockedSite.url);
        if (index !== -1) {
          results[index] = directResult;
        }
      }
    }

    this.updateStats(results, Date.now() - batchStart);
    return results;
  }

  /**
   * V7: Filter out blank pages (navigation pages with no form fields)
   * This prevents wasting time on DemoQA Elements/Forms navigation pages
   */
  private async filterBlankPages(sites: BatchSite[]): Promise<BatchSite[]> {
    const blankPagePatterns = [
      /\/elements\/?$/i,        // DemoQA Elements page
      /\/forms\/?$/i,           // DemoQA Forms page
      /\/widgets\/?$/i,         // DemoQA Widgets page
      /\/interaction\/?$/i,     // DemoQA Interactions page
      /\/book-store\/?$/i,      // DemoQA Book Store page
      /navigation/i,            // Generic navigation pages
      /index\/?$/i              // Index pages
    ];

    return sites.filter(site => {
      // Check if URL matches any blank page pattern
      const isBlankPage = blankPagePatterns.some(pattern => pattern.test(site.url));

      if (isBlankPage) {
        console.log(`  ⊘  Skipping blank page: ${site.name} (${site.url})`);
        return false;
      }

      return true;
    });
  }

  /**
   * V6: Check if iframe loaded successfully or was blocked
   */
  private async checkIframeRestriction(frame: Frame, timeout: number = 5000): Promise<boolean> {
    try {
      // Try to access the frame's URL - if blocked, this will fail
      const frameUrl = frame.url();

      // Check if frame is about:blank (indicates iframe blocking)
      if (frameUrl === 'about:blank') {
        return true; // Iframe is blocked
      }

      // Try to wait for body element
      await frame.waitForSelector('body', { timeout: timeout });

      // Check for frame-busting scripts or X-Frame-Options violations
      const isBlocked = await frame.evaluate(() => {
        // Check if top !== self (frame busting detection)
        if (window.top !== window.self) {
          try {
            // Some sites redirect to about:blank or throw errors
            return document.body === null || document.body.children.length === 0;
          } catch {
            return true; // Access denied indicates blocking
          }
        }
        return false;
      }).catch(() => true); // If evaluate fails, iframe is likely blocked

      return isBlocked;
    } catch (error) {
      console.log(`    🚫 Iframe restriction detected: ${(error as Error).message}`);
      return true; // Assume blocked on any error
    }
  }

  /**
   * Process single site in one iframe (V4: Adaptive timeouts + enhanced detection)
   * V6: Enhanced with iframe restriction detection and fallback handling
   */
  private async processSite(
    frame: Frame,
    site: BatchSite,
    userData: any
  ): Promise<BatchResult> {
    const startTime = Date.now();

    try {
      // V5: Adaptive timeout based on difficulty
      const loadTimeout = this.getAdaptiveTimeout(site.difficulty || 'easy');
      await frame.waitForLoadState('domcontentloaded', { timeout: loadTimeout });

      // V6: Check if iframe is blocked by X-Frame-Options or frame-busting
      const isIframeBlocked = await this.checkIframeRestriction(frame, loadTimeout);

      if (isIframeBlocked) {
        console.log(`    🚫 IFRAME BLOCKED - Site cannot be loaded in iframe`);
        console.log(`    ⚠️  This site requires direct navigation (non-iframe mode)`);

        return {
          site,
          success: false,
          fieldsDetected: 0,
          fieldsFilled: 0,
          submitted: false,
          error: 'IFRAME_BLOCKED: Site restricts iframe embedding. Use direct navigation mode.',
          duration: Date.now() - startTime
        };
      }

      // V5: Wait for network idle for better SPA support
      await frame.waitForLoadState('networkidle', { timeout: loadTimeout }).catch(() => {
        console.log(`    ⏱️  Network not idle after ${loadTimeout}ms, continuing anyway`);
      });

      // V5: CRITICAL FIX - Wait for body element to ensure iframe content loaded
      await frame.waitForSelector('body', { timeout: loadTimeout }).catch(() => {
        console.log(`    ⚠️  Body element not found, continuing anyway`);
      });

      // V5: Additional wait for iframe DOM to be ready
      const isDOMReady = await frame.evaluate(`document.readyState === 'complete'`);
      if (!isDOMReady) {
        console.log(`    ⏳ Waiting for DOM ready state...`);
        await frame.waitForTimeout(2000);
      }

      // SPA hydration detection
      const framework = await this.spaDetector.detectFramework(frame);
      if (framework !== 'unknown') {
        console.log(`    🎯 SPA: ${framework}`);
        await this.spaDetector.waitForHydration(frame, { framework });
        // V5: Extra wait for SPAs (OrangeHRM, SauceDemo fix)
        await frame.waitForTimeout(3000);
      } else {
        // V5: Standard wait increased to ensure content loaded
        await frame.waitForTimeout(5000);
      }

      // V5: Wait for at least one input field to appear (critical for iframes)
      try {
        await frame.waitForSelector('input, textarea, select', {
          timeout: 10000,
          state: 'attached'
        });
        console.log(`    ✅ Form fields detected in DOM`);
      } catch (e) {
        console.log(`    ⚠️  No form fields appeared after waiting`);
      }

      // V4: Check for shadow DOM
      const hasShadowDOM = await this.checkShadowDOM(frame);
      if (hasShadowDOM) {
        console.log(`    🌑 Shadow DOM detected`);
      }

      // Auto-fill with self-healing selectors
      const { detected, filled } = await this.autoFillForm(frame, userData);

      return {
        site,
        success: filled > 0,
        fieldsDetected: detected,
        fieldsFilled: filled,
        submitted: false,
        duration: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        site,
        success: false,
        fieldsDetected: 0,
        fieldsFilled: 0,
        submitted: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * V4: Get adaptive timeout based on site difficulty
   */
  private getAdaptiveTimeout(difficulty: string): number {
    const timeouts = {
      'easy': 15000,      // 15s for simple forms
      'medium': 30000,    // 30s for standard forms
      'hard': 45000,      // 45s for complex SPAs
      'expert': 60000     // 60s for very complex sites
    };
    return timeouts[difficulty as keyof typeof timeouts] || 30000;
  }

  /**
   * V4: Check for Shadow DOM presence
   */
  private async checkShadowDOM(frame: Frame): Promise<boolean> {
    try {
      return await frame.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_ELEMENT
        );
        let node: Node | null;
        while ((node = walker.nextNode())) {
          if ((node as Element).shadowRoot) {
            return true;
          }
        }
        return false;
      });
    } catch {
      return false;
    }
  }

  /**
   * V5: Get site-specific selectors for known problematic sites
   * These selectors are prioritized and tried first
   */
  private getSiteSpecificSelectors(url: string): Record<string, string[]> {
    const selectors: Record<string, string[]> = {};

    // HerokuApp Form Auth - https://the-internet.herokuapp.com/login
    if (url.includes('the-internet.herokuapp.com')) {
      selectors.username = ['#username', 'input[name="username"]'];
      selectors.password = ['#password', 'input[name="password"]'];
      selectors.email = ['#username']; // Uses username field for email
    }

    // TestPages Form - https://testpages.herokuapp.com/styled/forms/form-test.html
    else if (url.includes('testpages.herokuapp.com')) {
      selectors.username = ['input[name="username"]', '#username'];
      selectors.password = ['input[name="password"]', '#password'];
      selectors.firstName = ['input[name="firstname"]', 'input[name="name"]'];
    }

    // SauceDemo Login - https://www.saucedemo.com/
    else if (url.includes('saucedemo.com')) {
      selectors.username = [
        '#user-name',
        '[data-test="username"]',
        'input[placeholder*="Username" i]'
      ];
      selectors.password = [
        '#password',
        '[data-test="password"]',
        'input[placeholder*="Password" i]'
      ];
    }

    // UI Playground Text - http://uitestingplayground.com/textinput
    else if (url.includes('uitestingplayground.com/textinput')) {
      selectors.username = [
        '#newButtonName',
        'input[type="text"]',
        'input.form-control'
      ];
    }

    // OrangeHRM Demo - https://opensource-demo.orangehrmlive.com/
    else if (url.includes('orangehrmlive.com')) {
      selectors.username = [
        'input[name="username"]',
        'input[placeholder*="Username" i]',
        '.oxd-input'
      ];
      selectors.password = [
        'input[name="password"]',
        'input[placeholder*="Password" i]',
        'input[type="password"]'
      ];
    }

    // Lambda Simple Form - https://www.lambdatest.com/selenium-playground/simple-form-demo
    else if (url.includes('lambdatest.com') && url.includes('simple-form-demo')) {
      selectors.username = [
        '#user-message',
        'input[placeholder*="Please enter your Message"]',
        'input[type="text"]'
      ];
      selectors.message = [
        '#user-message',
        '#showInput'
      ];
    }

    return selectors;
  }

  /**
   * Auto-fill form using self-healing selectors with comprehensive field support
   * V5: Enhanced with Shadow DOM piercing and SPA hydration awareness
   */
  private async autoFillForm(
    frame: Frame,
    userData: any
  ): Promise<{ detected: number; filled: number }> {
    let detected = 0;
    let filled = 0;

    // V5: Enhanced field detection including Shadow DOM piercing
    // Using string evaluation to avoid TypeScript decorator issues
    const hasFormFields = await frame.evaluate(`(() => {
      let fieldCount = 0;

      // Helper to search for fields in a root (document or shadow root)
      const searchFields = (root) => {
        const inputs = root.querySelectorAll(
          'input[type="text"], input[type="email"], input[type="password"], ' +
          'input[type="tel"], input[type="url"], input[type="number"], input[type="search"], ' +
          'input[type="date"], input[type="time"], input[type="datetime-local"], ' +
          'input[type="month"], input[type="week"], input[type="color"], ' +
          'input[type="range"], input[type="file"], ' +
          'input:not([type]), textarea, select'
        );
        return inputs.length;
      };

      // Search main document
      fieldCount += searchFields(document);

      // V5: Pierce Shadow DOM - search all shadow roots
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT
      );
      let node;
      while ((node = walker.nextNode())) {
        const element = node;
        if (element.shadowRoot) {
          fieldCount += searchFields(element.shadowRoot);
        }
      }

      return fieldCount > 0;
    })()`);

    if (!hasFormFields) {
      console.log('    ⊘  No fillable form fields detected (searched Shadow DOM)');
      return { detected: 0, filled: 0 };
    }

    // V5: Get URL-specific selectors for known problematic sites
    const currentUrl = await frame.url();
    const siteSpecificSelectors = this.getSiteSpecificSelectors(currentUrl);

    // V5: Enhanced field configurations with more selectors + site-specific overrides
    const fieldConfigs = [
      {
        name: 'fullName',
        value: `${userData.firstName} ${userData.lastName}`,
        selectors: [
          '#userName',
          'input[id="userName"]',
          'input[name*="fullname" i]',
          'input[id*="fullname" i]',
          'input[name*="full-name" i]',
          'input[id*="full-name" i]',
          'input[name*="name" i]:not([name*="first" i]):not([name*="last" i]):not([name*="user" i])',
          'input[placeholder*="full name" i]',
          'input[autocomplete="name"]'
        ]
      },
      {
        name: 'email',
        value: userData.email,
        selectors: [
          ...(siteSpecificSelectors.email || []),
          '#userEmail',
          'input[id="userEmail"]',
          'input[type="email"]',
          'input[name*="email" i]',
          'input[id*="email" i]',
          'input[placeholder*="email" i]',
          'input[autocomplete="email"]',
          'input[aria-label*="email" i]',
          '[data-test*="email" i]',
          '[data-testid*="email" i]',
          '#username', '#user', '#login', '#user-email', '#email'
        ]
      },
      {
        name: 'firstName',
        value: userData.firstName,
        selectors: [
          'input[name*="first" i]:not([type="password"])',
          'input[id*="first" i]:not([type="password"])',
          'input[autocomplete="given-name"]',
          'input[placeholder*="first" i]',
          'input[aria-label*="first" i]',
          '#firstName', '#first_name', '#fname'
        ]
      },
      {
        name: 'lastName',
        value: userData.lastName,
        selectors: [
          'input[name*="last" i]:not([type="password"])',
          'input[id*="last" i]:not([type="password"])',
          'input[autocomplete="family-name"]',
          'input[placeholder*="last" i]',
          'input[aria-label*="last" i]',
          '#lastName', '#last_name', '#lname'
        ]
      },
      {
        name: 'password',
        value: userData.password,
        selectors: [
          ...(siteSpecificSelectors.password || []),
          'input[type="password"]',
          'input[name*="password" i]',
          'input[id*="password" i]',
          'input[autocomplete="new-password"]',
          'input[autocomplete="current-password"]',
          '[data-test="password"]',
          '[data-testid="password"]',
          'input[placeholder*="password" i]'
        ]
      },
      {
        name: 'username',
        value: userData.username || userData.email,
        selectors: [
          ...(siteSpecificSelectors.username || []),
          'input[name="username"]',
          'input[id="username"]',
          'input[name="user"]',
          'input[id="user"]',
          'input[name="user_login"]',
          'input[id="user-name"]',
          '[data-test="username"]',
          '[data-testid="username"]',
          'input[placeholder*="username" i]',
          'input[autocomplete="username"]'
        ]
      },
      {
        name: 'phone',
        value: '5551234567', // 10 digits for DemoQA mobile number
        selectors: [
          '#userNumber',
          'input[id="userNumber"]',
          'input[type="tel"]',
          'input[name*="mobile" i]',
          'input[id*="mobile" i]',
          'input[name*="phone" i]',
          'input[id*="phone" i]',
          'input[placeholder*="mobile" i]',
          'input[placeholder*="number" i]',
          'input[autocomplete="tel"]',
          'input[placeholder*="phone" i]'
        ]
      },
      {
        name: 'company',
        value: userData.company,
        selectors: [
          'input[name*="company" i]',
          'input[id*="company" i]',
          'input[autocomplete="organization"]',
          'input[placeholder*="company" i]'
        ]
      },
      {
        name: 'website',
        value: userData.website,
        selectors: [
          'input[type="url"]',
          'input[name*="website" i]',
          'input[id*="website" i]',
          'input[placeholder*="website" i]',
          'input[placeholder*="url" i]'
        ]
      },
      {
        name: 'message',
        value: 'This is a test automation message.',
        selectors: [
          ...(siteSpecificSelectors.message || []),
          'textarea',
          'textarea[name*="message" i]',
          'textarea[id*="message" i]',
          'textarea[name*="comment" i]',
          'textarea[placeholder*="message" i]',
          '[role="textbox"]',
          '[contenteditable="true"]',
          '#user-message',
          '#message'
        ]
      },
      {
        name: 'search',
        value: 'test search query',
        selectors: [
          'input[type="search"]',
          'input[name*="search" i]',
          'input[id*="search" i]',
          'input[placeholder*="search" i]',
          'input[aria-label*="search" i]'
        ]
      },
      {
        name: 'number',
        value: '12345',
        selectors: [
          'input[type="number"]',
          'input[name*="age" i]',
          'input[name*="quantity" i]',
          'input[name*="amount" i]'
        ]
      },
      // V4: NEW ENHANCED FIELD TYPES
      {
        name: 'date',
        value: '2025-11-10',
        selectors: [
          'input[type="date"]',
          'input[name*="date" i]',
          'input[id*="date" i]',
          'input[placeholder*="date" i]'
        ]
      },
      {
        name: 'time',
        value: '14:30',
        selectors: [
          'input[type="time"]',
          'input[name*="time" i]',
          'input[id*="time" i]'
        ]
      },
      {
        name: 'datetime',
        value: '2025-11-10T14:30',
        selectors: [
          'input[type="datetime-local"]',
          'input[name*="datetime" i]'
        ]
      },
      {
        name: 'color',
        value: '#4CAF50',
        selectors: [
          'input[type="color"]',
          'input[name*="color" i]'
        ]
      },
      {
        name: 'range',
        value: '50',
        selectors: [
          'input[type="range"]',
          'input[name*="range" i]',
          'input[name*="slider" i]'
        ]
      },
      {
        name: 'currentAddress',
        value: '123 Main Street, Apartment 4B',
        selectors: [
          '#currentAddress',
          'textarea[id="currentAddress"]',
          'input[name*="current" i][name*="address" i]',
          'input[id*="current" i][id*="address" i]',
          'textarea[name*="current" i]',
          'input[autocomplete="address-line1"]',
          'input[placeholder*="current address" i]'
        ]
      },
      {
        name: 'permanentAddress',
        value: '456 Oak Avenue, Suite 200, Springfield',
        selectors: [
          '#permanentAddress',
          'textarea[id="permanentAddress"]',
          'textarea[name*="permanent" i]',
          'textarea[id*="permanent" i]',
          'input[name*="permanent" i][name*="address" i]',
          'input[id*="permanent" i][id*="address" i]',
          'textarea[placeholder*="permanent" i]'
        ]
      },
      {
        name: 'address',
        value: '123 Main Street',
        selectors: [
          'input[name*="address" i]:not([name*="email" i])',
          'input[id*="address" i]:not([id*="email" i])',
          'textarea[name*="address" i]',
          'textarea[id*="address" i]',
          'input[placeholder*="address" i]',
          'input[name*="street" i]'
        ]
      },
      {
        name: 'city',
        value: 'San Francisco',
        selectors: [
          'input[name*="city" i]',
          'input[id*="city" i]',
          'input[autocomplete="address-level2"]',
          'input[placeholder*="city" i]'
        ]
      },
      {
        name: 'state',
        value: 'CA',
        selectors: [
          'input[name*="state" i]',
          'input[id*="state" i]',
          'input[autocomplete="address-level1"]',
          'select[name*="state" i]',
          'select[id*="state" i]'
        ]
      },
      {
        name: 'zip',
        value: '94102',
        selectors: [
          'input[name*="zip" i]',
          'input[id*="zip" i]',
          'input[name*="postal" i]',
          'input[autocomplete="postal-code"]',
          'input[placeholder*="zip" i]'
        ]
      },
      {
        name: 'country',
        value: 'United States',
        selectors: [
          'input[name*="country" i]',
          'input[id*="country" i]',
          'select[name*="country" i]',
          'select[id*="country" i]',
          'input[autocomplete="country-name"]'
        ]
      }
    ];

    // V6: Fill text inputs with enhanced error handling, retry logic, and visual debugging
    for (const config of fieldConfigs) {
      let fieldFilled = false;
      let fieldDetectedButNotFilled = false;

      for (const selector of config.selectors) {
        if (fieldFilled) break;

        try {
          // V5: Playwright's locators automatically pierce Shadow DOM with CSS selectors
          const element = frame.locator(selector).first();

          // V5: Check if element exists and is visible with shorter timeout
          const isVisible = await element.isVisible({ timeout: 500 }).catch(() => false);

          if (!isVisible) continue;

          detected++;

          // V5: Wait for element to be enabled (handles SPA hydration)
          await element.waitFor({ state: 'attached', timeout: 2000 }).catch(() => {});

          // V5: Clear any existing value first
          await element.clear().catch(() => {});

          // V5: Fill with retry on failure
          try {
            await element.fill(config.value);
          } catch (fillError) {
            // Retry with click + type for stubborn fields
            try {
              await element.click({ timeout: 1000 });
              await element.pressSequentially(config.value, { delay: 10 });
            } catch (retryError) {
              // V7: Extra aggressive retry for phone/React inputs
              try {
                // Focus, clear with keyboard, then type character by character
                const page = frame.page();
                await element.focus();
                await page.keyboard.press('Control+A');
                await page.keyboard.press('Backspace');

                // Type slowly for React validation
                for (const char of config.value) {
                  await page.keyboard.type(char);
                  await frame.waitForTimeout(50);
                }

                // Trigger React onChange events
                await element.dispatchEvent('input');
                await element.dispatchEvent('change');
                await element.dispatchEvent('blur');
              } catch (finalError) {
                // V6: Visual debugging - GREEN border for detected but not filled
                fieldDetectedButNotFilled = true;
                await element.evaluate(el => {
                  (el as HTMLElement).style.outline = '4px solid #00FF00';
                  (el as HTMLElement).style.backgroundColor = '#00FF0022';
                }).catch(() => {});
                console.log(`    🟢 ${config.name} DETECTED but NOT FILLED (${selector})`);
                continue;
              }
            }
          }

          // V6: Visual feedback - SUCCESS (filled)
          await element.evaluate(el => {
            (el as HTMLElement).style.outline = '4px solid #4CAF50';
            (el as HTMLElement).style.backgroundColor = '#4CAF5011';
          }).catch(() => {});

          filled++;
          fieldFilled = true;
          console.log(`    ✅ ${config.name} (${selector})`);

        } catch (e) {
          // Try next selector silently
          continue;
        }
      }

      // V6: If field was detected but not filled in any selector, log it
      if (fieldDetectedButNotFilled && !fieldFilled) {
        console.log(`    ⚠️  ${config.name} field detected but could not be filled`);
      }
    }

    // V6: Enhanced Radio Button Handling with Gender Support
    try {
      // Try gender-specific radio buttons first (DemoQA)
      const genderSelectors = [
        'input[name="gender"][value="Male"]',
        'label[for="gender-radio-1"]',
        'input[id*="gender" i][type="radio"]'
      ];

      let genderFilled = false;
      for (const selector of genderSelectors) {
        if (genderFilled) break;
        try {
          const genderRadio = frame.locator(selector).first();
          if (await genderRadio.isVisible({ timeout: 500 })) {
            // For label-based radio buttons, click the label
            if (selector.includes('label')) {
              await genderRadio.click({ timeout: 2000 });
            } else {
              await genderRadio.check({ timeout: 2000 });
            }
            detected++;
            filled++;
            genderFilled = true;
            console.log(`    ✅ gender (radio)`);
          }
        } catch (e) {}
      }

      // Generic radio buttons (select first in each group)
      if (!genderFilled) {
        const radios = frame.locator('input[type="radio"]:visible').all();
        const visibleRadios = await radios;

        if (visibleRadios.length > 0) {
          try {
            await visibleRadios[0].check();
            detected++;
            filled++;
            console.log(`    ✅ radio button`);
          } catch (e) {}
        }
      }
    } catch (e) {}

    // V6: Enhanced Checkbox Handling with Hobbies Support
    try {
      // Try hobbies-specific checkboxes first (DemoQA)
      const hobbiesSelectors = [
        '#hobbies-checkbox-1', // Sports
        '#hobbies-checkbox-2', // Reading
        'label[for="hobbies-checkbox-1"]',
        'label[for="hobbies-checkbox-2"]'
      ];

      let hobbiesCount = 0;
      for (const selector of hobbiesSelectors) {
        try {
          const hobbyCheckbox = frame.locator(selector).first();
          if (await hobbyCheckbox.isVisible({ timeout: 500 })) {
            // For label-based checkboxes, click the label
            if (selector.includes('label')) {
              await hobbyCheckbox.click({ timeout: 2000 });
            } else {
              await hobbyCheckbox.check({ timeout: 2000 });
            }
            detected++;
            filled++;
            hobbiesCount++;
            console.log(`    ✅ hobby (checkbox)`);
            if (hobbiesCount >= 2) break; // Check max 2 hobbies
          }
        } catch (e) {}
      }

      // Generic checkboxes
      const checkboxes = frame.locator('input[type="checkbox"]:visible').all();
      const visibleCheckboxes = await checkboxes;

      for (const checkbox of visibleCheckboxes) {
        try {
          if (await checkbox.isVisible({ timeout: 500 })) {
            const isChecked = await checkbox.isChecked();
            if (!isChecked) {
              await checkbox.check();
              detected++;
              filled++;
              console.log(`    ✅ checkbox`);
            }
          }
        } catch (e) {}
      }
    } catch (e) {}

    // V6: Enhanced Dropdown/Select Handling with State/City Support
    try {
      // DemoQA State dropdown (React Select)
      try {
        const stateInput = frame.locator('#state input, #react-select-3-input').first();
        if (await stateInput.isVisible({ timeout: 500 })) {
          await stateInput.click({ timeout: 2000 });
          await stateInput.type('NCR', { delay: 100 });
          await frame.waitForTimeout(500);
          await stateInput.press('Enter');
          detected++;
          filled++;
          console.log(`    ✅ state (autocomplete dropdown)`);

          // Wait for city to populate
          await frame.waitForTimeout(1000);

          // DemoQA City dropdown (React Select)
          try {
            const cityInput = frame.locator('#city input, #react-select-4-input').first();
            if (await cityInput.isVisible({ timeout: 500 })) {
              await cityInput.click({ timeout: 2000 });
              await cityInput.type('Delhi', { delay: 100 });
              await frame.waitForTimeout(500);
              await cityInput.press('Enter');
              detected++;
              filled++;
              console.log(`    ✅ city (autocomplete dropdown)`);
            }
          } catch (e) {}
        }
      } catch (e) {}

      // Standard HTML select dropdowns
      const selects = frame.locator('select:visible').all();
      const visibleSelects = await selects;

      for (const select of visibleSelects) {
        try {
          if (await select.isVisible({ timeout: 500 })) {
            const options = await select.locator('option').all();
            if (options.length > 1) {
              // Select second option (skip placeholder)
              await select.selectOption({ index: 1 });
              detected++;
              filled++;
              console.log(`    ✅ dropdown (select)`);
            }
          }
        } catch (e) {}
      }
    } catch (e) {}

    // V6: Date Picker Support (DemoQA React DatePicker)
    try {
      const datePickerSelectors = [
        '#dateOfBirthInput',
        'input[id="dateOfBirthInput"]',
        'input[type="date"]',
        'input[name*="date" i][name*="birth" i]',
        'input[placeholder*="date" i]'
      ];

      for (const selector of datePickerSelectors) {
        try {
          const datePicker = frame.locator(selector).first();
          if (await datePicker.isVisible({ timeout: 500 })) {
            // Try JavaScript date setting first (works for React DatePicker)
            await datePicker.evaluate((el) => {
              const input = el as HTMLInputElement;
              input.value = '10 Nov 2000';
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            });

            // Also try direct fill as fallback
            try {
              await datePicker.clear();
              await datePicker.fill('10 Nov 2000');
            } catch (e) {}

            detected++;
            filled++;
            console.log(`    ✅ date of birth (date picker)`);
            break;
          }
        } catch (e) {}
      }
    } catch (e) {}

    // V6: Autocomplete Support (DemoQA Subjects)
    try {
      const subjectsSelectors = [
        '#subjectsInput',
        'input[id="subjectsInput"]',
        '.subjects-auto-complete__input input',
        'input[name*="subject" i]'
      ];

      for (const selector of subjectsSelectors) {
        try {
          const subjectsInput = frame.locator(selector).first();
          if (await subjectsInput.isVisible({ timeout: 500 })) {
            // Type a subject and press enter
            await subjectsInput.click({ timeout: 2000 });
            await subjectsInput.type('Maths', { delay: 100 });
            await frame.waitForTimeout(500);
            await subjectsInput.press('Enter');

            // Add another subject
            await frame.waitForTimeout(300);
            await subjectsInput.type('English', { delay: 100 });
            await frame.waitForTimeout(500);
            await subjectsInput.press('Enter');

            detected++;
            filled++;
            console.log(`    ✅ subjects (autocomplete)`);
            break;
          }
        } catch (e) {}
      }
    } catch (e) {}

    return { detected, filled };
  }

  /**
   * Auto-submit all forms (Phase 1)
   * V8: Enhanced with page focus management and popup handling
   */
  private async autoSubmitAll(frames: Frame[]): Promise<void> {
    for (const frame of frames) {
      try {
        // Get the page that owns this frame
        const page = frame.page();

        // Close any about:blank popups that may have appeared
        const context = page.context();
        const allPages = context.pages();
        for (const p of allPages) {
          if (p.url() === 'about:blank' || p.url() === '') {
            await p.close().catch(() => {});
          }
        }

        // Bring target page to front
        await page.bringToFront();

        // Wait for page to be stable
        await page.waitForLoadState('domcontentloaded').catch(() => {});

        // Small delay to ensure focus
        await page.waitForTimeout(200);

        const submitBtn = frame.locator(
          'button[type="submit"], input[type="submit"], button'
        ).first();

        if (await submitBtn.isVisible({ timeout: 2000 })) {
          // Scroll into view
          await submitBtn.scrollIntoViewIfNeeded().catch(() => {});

          // Click with retry
          await submitBtn.click();
          console.log('    ✅ Auto-submitted');
        }
      } catch (e) {
        console.log('    ⚠️  No submit button');
      }
    }
  }

  /**
   * Human-in-loop submit workflow (Phase 2)
   */
  private async humanSubmitWorkflow(page: Page, frames: Frame[]): Promise<void> {
    // Highlight submit buttons with arrows
    for (const frame of frames) {
      await frame.evaluate(() => {
        const btns = document.querySelectorAll('button[type="submit"], input[type="submit"], button');
        btns.forEach(btn => {
          if (btn instanceof HTMLElement && btn.offsetParent) {
            btn.style.outline = '8px solid #FFD700';
            btn.style.animation = 'pulse 1s infinite';

            const arrow = document.createElement('div');
            arrow.innerHTML = '👈';
            arrow.style.cssText = `
              position: fixed; left: 50%; top: 50%;
              transform: translate(-50%, -50%);
              font-size: 96px; z-index: 999999;
              animation: bounce 0.5s infinite;
              pointer-events: none;
            `;
            document.body.appendChild(arrow);
          }
        });
      }).catch(() => {});
    }

    // Show pause overlay
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.id = 'click-factory-overlay';
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white; padding: 30px; text-align: center;
        font-size: 32px; font-family: monospace; z-index: 999999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      `;
      overlay.innerHTML = '⏸️ REVIEW DATA - Click SUBMIT in each iframe - Press ENTER when done';
      document.body.appendChild(overlay);
    });

    console.log('\n⏸️  PAUSED FOR HUMAN REVIEW');
    console.log('   1. Review filled data in all iframes');
    console.log('   2. Click SUBMIT in each iframe');
    console.log('   3. Solve any CAPTCHAs');
    console.log('   4. Press ENTER to continue...\n');

    // Wait for ENTER
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve(null));
    });

    await page.evaluate(() => {
      document.getElementById('click-factory-overlay')?.remove();
    });
  }

  /**
   * Create context with X-Frame-Options bypass (V5: Enhanced header stripping)
   */
  private async createFactoryContext(): Promise<BrowserContext> {
    if (!this.factoryBrowser) {
      throw new Error('Factory browser not initialized. Call initialize() first.');
    }

    const context = await this.factoryBrowser.newContext({
      viewport: { width: 1920, height: 1080 },
      bypassCSP: true,
      ignoreHTTPSErrors: true
    });

    // V5: More aggressive header stripping for iframe embedding
    await context.route('**/*', async (route: any) => {
      const url = route.request().url();

      try {
        const response = await route.fetch();
        const headers = { ...response.headers() };

        // Remove all frame-blocking headers
        delete headers['x-frame-options'];
        delete headers['content-security-policy'];
        delete headers['content-security-policy-report-only'];
        delete headers['x-content-security-policy'];
        delete headers['x-webkit-csp'];

        // Add permissive headers
        headers['x-frame-options'] = 'ALLOWALL';

        await route.fulfill({
          status: response.status(),
          headers: headers,
          body: await response.body()
        });
      } catch (e) {
        // If fetch fails, try to continue with modified headers
        try {
          await route.continue({
            headers: {
              ...route.request().headers(),
              'x-frame-options': 'ALLOWALL'
            }
          });
        } catch (continueError) {
          console.log(`    [Route] Error for ${url.substring(0, 50)}: ${(e as Error).message}`);
        }
      }
    });

    return context;
  }

  /**
   * Build 2x2 or 2x4 grid HTML
   */
  private buildGridHTML(sites: BatchSite[]): string {
    const gridRows = this.factoryConfig.batchSize === 4 ? '1fr 1fr' : '1fr 1fr 1fr 1fr';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Click Factory - ${this.factoryConfig.mode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 100vw; height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto ${gridRows};
      gap: 2px;
      background: #000;
    }
    #header {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; padding: 20px; text-align: center;
      font-size: 24px; font-family: monospace; font-weight: bold;
    }
    .iframe-box {
      position: relative; background: #1a1a1a;
    }
    iframe {
      width: 100%; height: 100%; border: none;
    }
    .badge {
      position: absolute; top: 10px; left: 10px;
      background: rgba(0,0,0,0.8); color: #4CAF50;
      padding: 8px 16px; border-radius: 6px;
      font-size: 14px; font-family: monospace; z-index: 9999;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255,215,0,0.7); }
      50% { box-shadow: 0 0 0 30px rgba(255,215,0,0); }
    }
    @keyframes bounce {
      0%, 100% { transform: translate(-50%,-50%) scale(1); }
      50% { transform: translate(-50%,-50%) scale(1.2); }
    }
  </style>
</head>
<body>
  <div id="header">
    🏭 CLICK FACTORY - ${this.factoryConfig.mode.toUpperCase()} |
    Batch ${this.stats.batchesCompleted + 1} |
    Success: ${this.stats.sitesSucceeded}/${this.stats.sitesProcessed}
  </div>
  ${sites.map((site, i) => `
  <div class="iframe-box">
    <div class="badge">${site.name || `Site ${i + 1}`}</div>
    <iframe src="${site.url}"></iframe>
  </div>
  `).join('')}
</body>
</html>`;
  }

  /**
   * Record success to AgentDB for pattern learning
   */
  private async recordToAgentDB(site: BatchSite, _result: BatchResult): Promise<void> {
    if (!this.db) return;

    try {
      const sessionId = await this.db.createSession({
        url: site.url,
        mode: 'manual' as any,
        startedAt: Date.now()
      });

      console.log(`    📊 Recorded to AgentDB (session: ${sessionId})`);
    } catch (e) {
      console.log(`    ⚠️  AgentDB error: ${(e as Error).message}`);
    }
  }

  /**
   * Update session statistics
   */
  private updateStats(results: BatchResult[], duration: number): void {
    this.stats.batchesCompleted++;
    this.stats.sitesProcessed += results.length;
    this.stats.sitesSucceeded += results.filter(r => r.success).length;
    this.stats.sitesFailed += results.filter(r => !r.success).length;
    this.stats.totalDuration += duration;

    const avgTime = this.stats.totalDuration / this.stats.sitesProcessed;
    const successRate = (this.stats.sitesSucceeded / this.stats.sitesProcessed * 100).toFixed(1);

    console.log(`\n✓ Batch complete in ${(duration / 1000).toFixed(1)}s`);
    console.log(`  Success: ${successRate}% | Avg: ${(avgTime / 1000).toFixed(1)}s/site\n`);
  }

  /**
   * Get session statistics
   */
  getStats(): FactoryStats {
    const { sitesProcessed, sitesSucceeded, totalDuration } = this.stats;

    return {
      ...this.stats,
      successRate: sitesProcessed ? (sitesSucceeded / sitesProcessed) * 100 : 0,
      avgTimePerSite: sitesProcessed ? totalDuration / sitesProcessed : 0
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.db) {
      await this.db.close();
    }
    if (this.factoryBrowser) {
      await this.factoryBrowser.close();
      this.factoryBrowser = null;
    }
    await this.close();
  }
}
