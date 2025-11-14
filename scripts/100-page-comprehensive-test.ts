/**
 * 100-Page Comprehensive Test
 * Tests ALL Claude Agent Browser capabilities across 100 real pages
 * Records everything to AgentDB for cross-component learning
 */

import { chromium, Browser, Page } from 'playwright';
import { AgentDBClient } from '../src/training/agentdb-client.js';
import { ActionPattern } from '../src/training/types.js';
import * as fs from 'fs';
import * as path from 'path';

// Import test site data
const testSitesPath = '/media/terry/data/projects/projects/Affiliate-Networks-that-Bundle/research-data/test-sites.json';

interface TestSite {
  name: string;
  url: string;
  category: string;
  features?: string[];
  difficulty?: string;
}

interface CapabilityTest {
  capability: string;
  action: string;
  selector?: string;
  success: boolean;
  duration: number;
  error?: string;
  patterns: ActionPattern[];
}

interface TestResult {
  site: TestSite;
  url: string;
  timestamp: string;
  capabilities: CapabilityTest[];
  totalDuration: number;
  successRate: number;
  patternsLearned: number;
}

class ComprehensiveTestRunner {
  private browser!: Browser;
  private db: AgentDBClient;
  private results: TestResult[] = [];
  private testSites: TestSite[] = [];

  constructor() {
    this.db = new AgentDBClient('./data/unified-agentdb', 384);
  }

  async initialize() {
    console.log('🚀 Initializing 100-Page Comprehensive Test\n');
    console.log('═══════════════════════════════════════════════\n');

    // Load test sites
    await this.loadTestSites();

    // Launch browser with stealth
    this.browser = await chromium.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    console.log(`✅ Browser launched`);
    console.log(`✅ AgentDB initialized`);
    console.log(`✅ Loaded ${this.testSites.length} test sites\n`);
  }

  async loadTestSites() {
    if (fs.existsSync(testSitesPath)) {
      const data = JSON.parse(fs.readFileSync(testSitesPath, 'utf-8'));
      this.testSites = data.sites || [];
      console.log(`📂 Loaded ${this.testSites.length} sites from test-sites.json`);
    }

    // Add additional curated sites
    const additionalSites: TestSite[] = [
      // Form Testing Sites
      { name: 'The Internet Herokuapp - Login', url: 'https://the-internet.herokuapp.com/login', category: 'Forms' },
      { name: 'The Internet Herokuapp - Dropdown', url: 'https://the-internet.herokuapp.com/dropdown', category: 'Forms' },
      { name: 'The Internet Herokuapp - Checkboxes', url: 'https://the-internet.herokuapp.com/checkboxes', category: 'Forms' },
      { name: 'Practice Test Automation', url: 'https://practicetestautomation.com/practice-test-login/', category: 'Forms' },
      { name: 'SauceDemo', url: 'https://www.saucedemo.com/', category: 'Forms' },

      // Dynamic Content Sites
      { name: 'The Internet - Dynamic Loading', url: 'https://the-internet.herokuapp.com/dynamic_loading/1', category: 'Dynamic' },
      { name: 'The Internet - Infinite Scroll', url: 'https://the-internet.herokuapp.com/infinite_scroll', category: 'Dynamic' },
      { name: 'UI Testing Playground - Dynamic ID', url: 'http://uitestingplayground.com/dynamicid', category: 'Dynamic' },
      { name: 'UI Testing Playground - AJAX Data', url: 'http://uitestingplayground.com/ajax', category: 'Dynamic' },

      // Shadow DOM Sites
      { name: 'UI Testing Playground - Shadow DOM', url: 'http://uitestingplayground.com/shadowdom', category: 'Shadow DOM' },

      // Iframe Sites
      { name: 'The Internet - Frames', url: 'https://the-internet.herokuapp.com/frames', category: 'Iframes' },
      { name: 'The Internet - Nested Frames', url: 'https://the-internet.herokuapp.com/nested_frames', category: 'Iframes' },

      // Real-World Sites (Read-Only)
      { name: 'GitHub Homepage', url: 'https://github.com', category: 'Real-World' },
      { name: 'Amazon Homepage', url: 'https://www.amazon.com', category: 'Real-World' },
      { name: 'Stack Overflow', url: 'https://stackoverflow.com', category: 'Real-World' },
      { name: 'Reddit', url: 'https://www.reddit.com', category: 'Real-World' },
      { name: 'Twitter/X', url: 'https://twitter.com', category: 'Real-World' },
      { name: 'LinkedIn', url: 'https://www.linkedin.com', category: 'Real-World' },
      { name: 'YouTube', url: 'https://www.youtube.com', category: 'Real-World' },
      { name: 'Wikipedia', url: 'https://en.wikipedia.org', category: 'Real-World' },
    ];

    this.testSites = [...this.testSites, ...additionalSites];

    // Limit to 100 sites
    this.testSites = this.testSites.slice(0, 100);
  }

  async runComprehensiveTest() {
    console.log('🧪 Starting Comprehensive Test\n');
    console.log(`Testing ${this.testSites.length} pages with all capabilities\n`);

    for (let i = 0; i < this.testSites.length; i++) {
      const site = this.testSites[i];
      console.log(`\n[${ i + 1}/${this.testSites.length}] Testing: ${site.name}`);
      console.log(`URL: ${site.url}`);
      console.log(`Category: ${site.category}`);

      try {
        const result = await this.testSinglePage(site);
        this.results.push(result);

        console.log(`  ✓ Success Rate: ${(result.successRate * 100).toFixed(1)}%`);
        console.log(`  ✓ Patterns Learned: ${result.patternsLearned}`);
        console.log(`  ✓ Duration: ${(result.totalDuration / 1000).toFixed(2)}s`);
      } catch (error) {
        console.error(`  ✗ Failed to test: ${(error as Error).message}`);
      }

      // Save progress every 10 sites
      if ((i + 1) % 10 === 0) {
        await this.saveProgress();
        console.log(`\n📊 Progress saved (${i + 1}/${this.testSites.length})`);
      }
    }

    await this.generateFinalReport();
  }

  async testSinglePage(site: TestSite): Promise<TestResult> {
    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();
    const startTime = Date.now();
    const capabilities: CapabilityTest[] = [];
    let patternsLearned = 0;

    try {
      // Aggressive timeout strategy - don't wait for networkidle on heavy sites
      try {
        await page.goto(site.url, {
          waitUntil: 'domcontentloaded', // Faster than networkidle
          timeout: 15000 // Shorter timeout
        });
      } catch (timeoutError) {
        // If DOMContentLoaded times out, try with just commit
        console.log(`  ⚠️ DOMContentLoaded timeout, trying load event...`);
        await page.goto(site.url, {
          waitUntil: 'load',
          timeout: 20000
        });
      }

      // Wait a bit for dynamic content
      await page.waitForTimeout(1500);

      // Test 1: DOM Element Detection
      const domTest = await this.testDOMDetection(page, site.url);
      capabilities.push(domTest);
      patternsLearned += domTest.patterns.length;

      // Test 2: Form Field Detection
      const formTest = await this.testFormDetection(page, site.url);
      capabilities.push(formTest);
      patternsLearned += formTest.patterns.length;

      // Test 3: Button Detection
      const buttonTest = await this.testButtonDetection(page, site.url);
      capabilities.push(buttonTest);
      patternsLearned += buttonTest.patterns.length;

      // Test 4: Link Extraction
      const linkTest = await this.testLinkExtraction(page, site.url);
      capabilities.push(linkTest);
      patternsLearned += linkTest.patterns.length;

      // Test 5: Shadow DOM Detection
      const shadowTest = await this.testShadowDOM(page, site.url);
      capabilities.push(shadowTest);
      patternsLearned += shadowTest.patterns.length;

      // Test 6: Iframe Detection
      const iframeTest = await this.testIframes(page, site.url);
      capabilities.push(iframeTest);
      patternsLearned += iframeTest.patterns.length;

      // Test 7: Dynamic Content Detection
      const dynamicTest = await this.testDynamicContent(page, site.url);
      capabilities.push(dynamicTest);
      patternsLearned += dynamicTest.patterns.length;

      // Test 8: CAPTCHA Detection
      const captchaTest = await this.testCAPTCHADetection(page, site.url);
      capabilities.push(captchaTest);
      patternsLearned += captchaTest.patterns.length;

      // Test 9: Performance Metrics
      const perfTest = await this.testPerformanceMetrics(page, site.url);
      capabilities.push(perfTest);
      patternsLearned += perfTest.patterns.length;

      // Test 10: API Request Interception
      const apiTest = await this.testAPIInterception(page, site.url);
      capabilities.push(apiTest);
      patternsLearned += apiTest.patterns.length;

      // Store all patterns to AgentDB
      for (const cap of capabilities) {
        for (const pattern of cap.patterns) {
          this.db.storeAction(pattern);
        }
      }

      const totalDuration = Date.now() - startTime;
      const successfulTests = capabilities.filter(c => c.success).length;
      const successRate = successfulTests / capabilities.length;

      return {
        site,
        url: site.url,
        timestamp: new Date().toISOString(),
        capabilities,
        totalDuration,
        successRate,
        patternsLearned,
      };
    } finally {
      await page.close();
      await context.close();
    }
  }

  async testDOMDetection(page: Page, url: string): Promise<CapabilityTest> {
    const startTime = Date.now();
    const patterns: ActionPattern[] = [];

    try {
      const elementCount = await page.evaluate(() => {
        const elements = {
          divs: document.querySelectorAll('div').length,
          inputs: document.querySelectorAll('input').length,
          buttons: document.querySelectorAll('button').length,
          links: document.querySelectorAll('a').length,
          forms: document.querySelectorAll('form').length,
        };
        return elements;
      });

      // Record pattern for each element type found
      Object.entries(elementCount).forEach(([type, count]) => {
        if (count > 0) {
          patterns.push({
            action: 'detect',
            selector: type,
            url,
            success: true,
            timestamp: new Date().toISOString(),
            metadata: {
              capability: 'DOM Detection',
              count,
              source: '100-page-test',
            },
          });
        }
      });

      return {
        capability: 'DOM Detection',
        action: 'detect_elements',
        success: true,
        duration: Date.now() - startTime,
        patterns,
      };
    } catch (error) {
      return {
        capability: 'DOM Detection',
        action: 'detect_elements',
        success: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
        patterns,
      };
    }
  }

  async testFormDetection(page: Page, url: string): Promise<CapabilityTest> {
    const startTime = Date.now();
    const patterns: ActionPattern[] = [];

    try {
      const formFields = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
        return inputs.map(input => {
          const el = input as HTMLInputElement;
          return {
            type: el.type || el.tagName.toLowerCase(),
            name: el.name,
            id: el.id,
            placeholder: el.placeholder,
            selector: el.id ? `#${el.id}` : el.name ? `[name="${el.name}"]` : null,
          };
        }).filter(f => f.selector);
      });

      // Record each form field as a pattern
      formFields.forEach(field => {
        patterns.push({
          action: 'detect_field',
          selector: field.selector!,
          url,
          success: true,
          timestamp: new Date().toISOString(),
          metadata: {
            capability: 'Form Detection',
            fieldType: field.type,
            fieldName: field.name,
            fieldId: field.id,
            source: '100-page-test',
          },
        });
      });

      return {
        capability: 'Form Detection',
        action: 'detect_form_fields',
        success: true,
        duration: Date.now() - startTime,
        patterns,
      };
    } catch (error) {
      return {
        capability: 'Form Detection',
        action: 'detect_form_fields',
        success: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
        patterns,
      };
    }
  }

  async testButtonDetection(page: Page, url: string): Promise<CapabilityTest> {
    const startTime = Date.now();
    const patterns: ActionPattern[] = [];

    try {
      const buttons = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
        return btns.slice(0, 20).map((btn, i) => {
          const el = btn as HTMLElement;
          return {
            text: el.textContent?.trim() || '',
            selector: el.id ? `#${el.id}` : `button:nth-of-type(${i + 1})`,
            type: (el as HTMLInputElement).type || 'button',
          };
        });
      });

      buttons.forEach(btn => {
        patterns.push({
          action: 'detect_button',
          selector: btn.selector,
          value: btn.text,
          url,
          success: true,
          timestamp: new Date().toISOString(),
          metadata: {
            capability: 'Button Detection',
            buttonText: btn.text,
            buttonType: btn.type,
            source: '100-page-test',
          },
        });
      });

      return {
        capability: 'Button Detection',
        action: 'detect_buttons',
        success: true,
        duration: Date.now() - startTime,
        patterns,
      };
    } catch (error) {
      return {
        capability: 'Button Detection',
        action: 'detect_buttons',
        success: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
        patterns,
      };
    }
  }

  async testLinkExtraction(page: Page, url: string): Promise<CapabilityTest> {
    const startTime = Date.now();
    const patterns: ActionPattern[] = [];

    try {
      // Wait for links with multiple strategies
      try {
        await Promise.race([
          page.waitForSelector('a[href]', { timeout: 3000 }),
          page.waitForTimeout(1000), // Fallback
        ]);
      } catch {
        // Ignore timeout, try anyway
      }

      // Scroll to trigger lazy-loaded links
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight * 0.5);
      });
      await page.waitForTimeout(500);

      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors.slice(0, 10).map(a => {
          return {
            href: (a as HTMLAnchorElement).href,
            text: a.textContent?.trim() || '',
          };
        });
      });

      if (links.length > 0) {
        patterns.push({
          action: 'extract_links',
          selector: 'a[href]',
          url,
          success: true,
          timestamp: new Date().toISOString(),
          metadata: {
            capability: 'Link Extraction',
            linkCount: links.length,
            source: '100-page-test',
          },
        });
      }

      return {
        capability: 'Link Extraction',
        action: 'extract_links',
        success: links.length > 0,
        duration: Date.now() - startTime,
        patterns,
      };
    } catch (error) {
      return {
        capability: 'Link Extraction',
        action: 'extract_links',
        success: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
        patterns,
      };
    }
  }

  async testShadowDOM(page: Page, url: string): Promise<CapabilityTest> {
    const startTime = Date.now();
    const patterns: ActionPattern[] = [];

    try {
      const shadowRoots = await page.evaluate(() => {
        function findShadowRoots(root: Document | ShadowRoot): number {
          let count = 0;
          const elements = root.querySelectorAll('*');

          elements.forEach(element => {
            if (element.shadowRoot) {
              count++;
              // Recursively count nested shadow roots
              count += findShadowRoots(element.shadowRoot);
            }
          });

          return count;
        }

        return findShadowRoots(document);
      });

      if (shadowRoots > 0) {
        patterns.push({
          action: 'detect_shadow_dom',
          selector: 'shadow-root',
          url,
          success: true,
          timestamp: new Date().toISOString(),
          metadata: {
            capability: 'Shadow DOM Detection',
            shadowRootCount: shadowRoots,
            source: '100-page-test',
          },
        });
      }

      return {
        capability: 'Shadow DOM Detection',
        action: 'detect_shadow_dom',
        success: true,
        duration: Date.now() - startTime,
        patterns,
      };
    } catch (error) {
      return {
        capability: 'Shadow DOM Detection',
        action: 'detect_shadow_dom',
        success: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
        patterns,
      };
    }
  }

  async testIframes(page: Page, url: string): Promise<CapabilityTest> {
    const startTime = Date.now();
    const patterns: ActionPattern[] = [];

    try {
      const iframes = await page.evaluate(() => {
        const frames = Array.from(document.querySelectorAll('iframe'));
        return frames.map(f => ({
          src: f.src,
          id: f.id,
          name: f.name,
        }));
      });

      if (iframes.length > 0) {
        patterns.push({
          action: 'detect_iframes',
          selector: 'iframe',
          url,
          success: true,
          timestamp: new Date().toISOString(),
          metadata: {
            capability: 'Iframe Detection',
            iframeCount: iframes.length,
            source: '100-page-test',
          },
        });
      }

      return {
        capability: 'Iframe Detection',
        action: 'detect_iframes',
        success: true,
        duration: Date.now() - startTime,
        patterns,
      };
    } catch (error) {
      return {
        capability: 'Iframe Detection',
        action: 'detect_iframes',
        success: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
        patterns,
      };
    }
  }

  async testDynamicContent(page: Page, url: string): Promise<CapabilityTest> {
    const startTime = Date.now();
    const patterns: ActionPattern[] = [];

    try {
      // Check for common dynamic content frameworks
      const frameworks = await page.evaluate(() => {
        return {
          react: !!(window as any).React || !!document.querySelector('[data-reactroot], [data-reactid]'),
          vue: !!(window as any).Vue || !!document.querySelector('[data-v-]'),
          angular: !!(window as any).angular || !!document.querySelector('[ng-app], [ng-controller]'),
          svelte: !!document.querySelector('[data-svelte]'),
        };
      });

      Object.entries(frameworks).forEach(([framework, detected]) => {
        if (detected) {
          patterns.push({
            action: 'detect_framework',
            selector: framework,
            url,
            success: true,
            timestamp: new Date().toISOString(),
            metadata: {
              capability: 'Dynamic Content Detection',
              framework,
              source: '100-page-test',
            },
          });
        }
      });

      return {
        capability: 'Dynamic Content Detection',
        action: 'detect_spa_framework',
        success: true,
        duration: Date.now() - startTime,
        patterns,
      };
    } catch (error) {
      return {
        capability: 'Dynamic Content Detection',
        action: 'detect_spa_framework',
        success: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
        patterns,
      };
    }
  }

  async testCAPTCHADetection(page: Page, url: string): Promise<CapabilityTest> {
    const startTime = Date.now();
    const patterns: ActionPattern[] = [];

    try {
      const captchas = await page.evaluate(() => {
        return {
          recaptcha: !!document.querySelector('.g-recaptcha, iframe[src*="recaptcha"]'),
          hcaptcha: !!document.querySelector('.h-captcha, iframe[src*="hcaptcha"]'),
          cloudflare: !!document.querySelector('#cf-challenge-running'),
        };
      });

      Object.entries(captchas).forEach(([type, detected]) => {
        if (detected) {
          patterns.push({
            action: 'detect_captcha',
            selector: type,
            url,
            success: true,
            timestamp: new Date().toISOString(),
            metadata: {
              capability: 'CAPTCHA Detection',
              captchaType: type,
              source: '100-page-test',
            },
          });
        }
      });

      return {
        capability: 'CAPTCHA Detection',
        action: 'detect_captcha',
        success: true,
        duration: Date.now() - startTime,
        patterns,
      };
    } catch (error) {
      return {
        capability: 'CAPTCHA Detection',
        action: 'detect_captcha',
        success: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
        patterns,
      };
    }
  }

  async testPerformanceMetrics(page: Page, url: string): Promise<CapabilityTest> {
    const startTime = Date.now();
    const patterns: ActionPattern[] = [];

    try {
      const metrics = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart,
          loadComplete: perf.loadEventEnd - perf.fetchStart,
          responseTime: perf.responseEnd - perf.requestStart,
        };
      });

      patterns.push({
        action: 'measure_performance',
        selector: 'page',
        url,
        success: true,
        timestamp: new Date().toISOString(),
        metadata: {
          capability: 'Performance Metrics',
          ...metrics,
          source: '100-page-test',
        },
      });

      return {
        capability: 'Performance Metrics',
        action: 'measure_performance',
        success: true,
        duration: Date.now() - startTime,
        patterns,
      };
    } catch (error) {
      return {
        capability: 'Performance Metrics',
        action: 'measure_performance',
        success: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
        patterns,
      };
    }
  }

  async testAPIInterception(page: Page, url: string): Promise<CapabilityTest> {
    const startTime = Date.now();
    const patterns: ActionPattern[] = [];
    const apiCalls: string[] = [];

    try {
      // Intercept API calls
      page.on('request', request => {
        const resType = request.resourceType();
        if (resType === 'xhr' || resType === 'fetch') {
          apiCalls.push(request.url());
        }
      });

      await page.waitForTimeout(2000); // Wait for API calls

      if (apiCalls.length > 0) {
        patterns.push({
          action: 'intercept_api',
          selector: 'xhr/fetch',
          url,
          success: true,
          timestamp: new Date().toISOString(),
          metadata: {
            capability: 'API Interception',
            apiCallCount: apiCalls.length,
            source: '100-page-test',
          },
        });
      }

      return {
        capability: 'API Interception',
        action: 'intercept_requests',
        success: true,
        duration: Date.now() - startTime,
        patterns,
      };
    } catch (error) {
      return {
        capability: 'API Interception',
        action: 'intercept_requests',
        success: false,
        duration: Date.now() - startTime,
        error: (error as Error).message,
        patterns,
      };
    }
  }

  async saveProgress() {
    const progressPath = './data/test-results/100-page-progress.json';
    const dir = path.dirname(progressPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(progressPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      completed: this.results.length,
      total: this.testSites.length,
      results: this.results,
    }, null, 2));

    // Save AgentDB
    this.db.save();
  }

  async generateFinalReport() {
    console.log('\n\n═══════════════════════════════════════════════');
    console.log('📊 FINAL COMPREHENSIVE TEST REPORT');
    console.log('═══════════════════════════════════════════════\n');

    const totalTests = this.results.length;
    const totalCapabilities = this.results.reduce((sum, r) => sum + r.capabilities.length, 0);
    const successfulCapabilities = this.results.reduce((sum, r) =>
      sum + r.capabilities.filter(c => c.success).length, 0);
    const totalPatterns = this.results.reduce((sum, r) => sum + r.patternsLearned, 0);
    const avgSuccessRate = this.results.reduce((sum, r) => sum + r.successRate, 0) / totalTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.totalDuration, 0);

    console.log(`Test Summary:`);
    console.log(`  Pages Tested: ${totalTests}`);
    console.log(`  Total Capabilities Tested: ${totalCapabilities}`);
    console.log(`  Successful Capabilities: ${successfulCapabilities} (${(successfulCapabilities / totalCapabilities * 100).toFixed(1)}%)`);
    console.log(`  Average Success Rate: ${(avgSuccessRate * 100).toFixed(1)}%`);
    console.log(`  Total Duration: ${(totalDuration / 1000 / 60).toFixed(2)} minutes`);
    console.log(`  Patterns Learned: ${totalPatterns}`);

    // Capability breakdown
    console.log('\n\nCapability Performance:');
    const capabilityStats = new Map<string, { total: number; successful: number }>();

    this.results.forEach(result => {
      result.capabilities.forEach(cap => {
        const stats = capabilityStats.get(cap.capability) || { total: 0, successful: 0 };
        stats.total++;
        if (cap.success) stats.successful++;
        capabilityStats.set(cap.capability, stats);
      });
    });

    Array.from(capabilityStats.entries())
      .sort((a, b) => (b[1].successful / b[1].total) - (a[1].successful / a[1].total))
      .forEach(([capability, stats]) => {
        const rate = (stats.successful / stats.total * 100).toFixed(1);
        console.log(`  ${capability}: ${stats.successful}/${stats.total} (${rate}%)`);
      });

    // Category breakdown
    console.log('\n\nCategory Performance:');
    const categoryStats = new Map<string, { total: number; avgSuccess: number }>();

    this.results.forEach(result => {
      const category = result.site.category;
      const stats = categoryStats.get(category) || { total: 0, avgSuccess: 0 };
      stats.total++;
      stats.avgSuccess += result.successRate;
      categoryStats.set(category, stats);
    });

    Array.from(categoryStats.entries())
      .sort((a, b) => (b[1].avgSuccess / b[1].total) - (a[1].avgSuccess / a[1].total))
      .forEach(([category, stats]) => {
        const avgRate = (stats.avgSuccess / stats.total * 100).toFixed(1);
        console.log(`  ${category}: ${stats.total} sites, ${avgRate}% avg success`);
      });

    // AgentDB statistics
    console.log('\n\nAgentDB Learning Statistics:');
    const dbStats = this.db.getStatistics();
    console.log(`  Total Patterns: ${dbStats.totalActions}`);
    console.log(`  Success Rate: ${(dbStats.successRate * 100).toFixed(1)}%`);
    console.log(`  Action Types:`, dbStats.actionTypes);
    console.log(`  Avg Embedding Time: ${dbStats.averageEmbeddingTime.toFixed(2)}ms`);

    // Save final report
    const reportPath = './data/test-results/100-page-final-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        pagesT: totalTests,
        totalCapabilities,
        successfulCapabilities,
        avgSuccessRate,
        totalDuration,
        totalPatterns,
      },
      capabilityStats: Array.from(capabilityStats.entries()).map(([name, stats]) => ({
        capability: name,
        ...stats,
        successRate: stats.successful / stats.total,
      })),
      categoryStats: Array.from(categoryStats.entries()).map(([name, stats]) => ({
        category: name,
        siteCount: stats.total,
        avgSuccessRate: stats.avgSuccess / stats.total,
      })),
      agentDBStats: dbStats,
      results: this.results,
    }, null, 2));

    console.log(`\n✅ Final report saved: ${reportPath}`);
    console.log(`✅ Progress saved: ./data/test-results/100-page-progress.json`);
    console.log(`✅ AgentDB saved: ./data/unified-agentdb/\n`);
  }

  async cleanup() {
    await this.db.save();
    await this.browser.close();
  }
}

// Run test
async function main() {
  const runner = new ComprehensiveTestRunner();

  try {
    await runner.initialize();
    await runner.runComprehensiveTest();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await runner.cleanup();
  }
}

main().catch(console.error);
