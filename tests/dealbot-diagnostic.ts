/**
 * DealBot Diagnostic Tool
 *
 * Automated diagnostic to investigate why all fields show 30% extraction
 * Checks:
 * 1. Is extraction running at all?
 * 2. Is data being stored?
 * 3. Are logs appearing?
 * 4. Is extension loaded properly?
 */

import { chromium, Browser, BrowserContext, Page, ChromiumBrowserContext } from 'playwright';
import * as path from 'path';

interface DiagnosticResult {
  timestamp: number;
  checks: {
    extensionLoaded: boolean;
    serviceWorkerActive: boolean;
    extractionRan: boolean;
    dataStored: boolean;
    logsPresent: boolean;
    modalOpened: boolean;
  };
  extractionLogs: string[];
  storedListings: number;
  sampleListing: any;
  fieldBreakdown: Record<string, number>;
  issues: string[];
  recommendations: string[];
  conclusion: string;
}

export class DealBotDiagnostic {
  private context: ChromiumBrowserContext | null = null;
  private extensionId: string = '';
  private serviceWorkerPage: Page | null = null;

  constructor(
    private extensionPath: string = path.join(__dirname, '../dist')
  ) {}

  /**
   * Run complete diagnostic
   */
  async runDiagnostic(): Promise<DiagnosticResult> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DEALBOT DIAGNOSTIC TOOL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const result: DiagnosticResult = {
      timestamp: Date.now(),
      checks: {
        extensionLoaded: false,
        serviceWorkerActive: false,
        extractionRan: false,
        dataStored: false,
        logsPresent: false,
        modalOpened: false,
      },
      extractionLogs: [],
      storedListings: 0,
      sampleListing: null,
      fieldBreakdown: {},
      issues: [],
      recommendations: [],
      conclusion: '',
    };

    try {
      // Step 1: Setup browser with extension
      await this.setup();
      result.checks.extensionLoaded = true;
      console.log('✅ Extension loaded\n');

      // Step 2: Check service worker
      const swActive = await this.checkServiceWorker();
      result.checks.serviceWorkerActive = swActive;
      console.log(`${swActive ? '✅' : '❌'} Service worker: ${swActive ? 'Active' : 'Not active'}\n`);

      // Step 3: Navigate to Facebook and trigger extraction
      const page = await this.context!.newPage();

      console.log('🔐 Navigating to Facebook Marketplace...\n');
      await page.goto('https://www.facebook.com/marketplace');

      try {
        await page.waitForSelector('a[href*="/marketplace/"]', { timeout: 5000 });
        console.log('✅ Logged in to Facebook\n');
      } catch {
        console.log('⚠️  Not logged in. Waiting for manual login (30s)...\n');
        await page.waitForSelector('a[href*="/marketplace/"]', { timeout: 30000 });
        console.log('✅ Login successful\n');
      }

      // Search
      console.log('🔍 Searching for "laptop"...\n');
      const searchBox = await page.waitForSelector('input[type="search"]');
      await searchBox.fill('laptop');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Click first listing
      console.log('📦 Opening first listing...\n');
      const firstListing = await page.waitForSelector('a[href*="/marketplace/item/"]');
      await firstListing.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for Research button
      console.log('🔍 Looking for Research This Deal button...\n');
      try {
        const button = await page.waitForSelector('button:has-text("Research This Deal")', { timeout: 5000 });
        console.log('✅ Found button\n');

        // Click and wait
        await button.click();
        await page.waitForTimeout(3000);
        result.checks.modalOpened = true;
        console.log('✅ Modal opened\n');

      } catch {
        console.log('❌ Research button not found\n');
        result.issues.push('Research This Deal button not found - content script may not be injecting');
      }

      // Step 4: Check if extraction ran (look for logs)
      console.log('📊 Checking service worker logs...\n');
      const logs = await this.getServiceWorkerLogs();
      result.extractionLogs = logs;
      result.checks.logsPresent = logs.length > 0;

      const extractionLog = logs.find(log => log.includes('[Extraction]') || log.includes('Found') || log.includes('listings'));
      result.checks.extractionRan = !!extractionLog;

      console.log(`${result.checks.extractionRan ? '✅' : '❌'} Extraction logs: ${result.checks.logsPresent ? logs.length + ' logs found' : 'No logs'}\n`);

      // Step 5: Check stored data
      console.log('💾 Checking stored data...\n');
      const storedData = await this.getStoredData(page);

      if (storedData) {
        result.checks.dataStored = storedData.total > 0;
        result.storedListings = storedData.total;
        result.sampleListing = storedData.sample;
        result.fieldBreakdown = storedData.fieldBreakdown;

        console.log(`✅ Stored listings: ${storedData.total}\n`);

        if (storedData.sample) {
          console.log('📋 Sample listing:');
          console.log(`  Title: ${storedData.sample.title || 'N/A'}`);
          console.log(`  Price: ${storedData.sample.price || 'N/A'}`);
          console.log(`  Condition: ${storedData.sample.condition || 'N/A'}`);
          console.log(`  Category: ${storedData.sample.category || 'N/A'}`);
          console.log(`  Brand: ${storedData.sample.brand || 'N/A'}`);
          console.log(`  Image Count: ${storedData.sample.imageCount || 'N/A'}\n`);
        }

        if (storedData.fieldBreakdown) {
          console.log('📊 Field extraction rates:');
          Object.entries(storedData.fieldBreakdown).forEach(([field, rate]) => {
            console.log(`  ${field}: ${rate}%`);
          });
          console.log('');
        }
      } else {
        console.log('❌ No stored data found\n');
        result.issues.push('No data stored in chrome.storage.local');
      }

      await page.close();

      // Analyze results and provide conclusion
      this.analyzeResults(result);

    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      result.issues.push(`Diagnostic error: ${error}`);
    } finally {
      await this.cleanup();
    }

    this.printResults(result);
    return result;
  }

  /**
   * Setup browser
   */
  private async setup(): Promise<void> {
    const userDataDir = path.join(__dirname, '../.test-profiles/diagnostic');

    this.context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${this.extensionPath}`,
        `--load-extension=${this.extensionPath}`,
        '--no-sandbox',
      ],
    });

    // Get extension ID
    const page = await this.context.newPage();
    await page.goto('chrome://extensions/');

    const extensionCards = await page.$$('extensions-item');
    for (const card of extensionCards) {
      const nameElement = await card.$('#name');
      const name = await nameElement?.textContent();

      if (name?.includes('DealBot') || name?.includes('Claude Agent')) {
        const id = await card.getAttribute('id');
        if (id) {
          this.extensionId = id;
          break;
        }
      }
    }

    await page.close();
  }

  /**
   * Check if service worker is active
   */
  private async checkServiceWorker(): Promise<boolean> {
    const serviceWorkers = this.context!.serviceWorkers();

    this.serviceWorkerPage = serviceWorkers.find(sw =>
      sw.url().includes('chrome-extension://')
    ) || null;

    return this.serviceWorkerPage !== null;
  }

  /**
   * Get service worker console logs
   */
  private async getServiceWorkerLogs(): Promise<string[]> {
    if (!this.serviceWorkerPage) return [];

    const logs: string[] = [];

    // Setup listener
    this.serviceWorkerPage.on('console', msg => {
      logs.push(msg.text());
    });

    // Wait a bit for logs to accumulate
    await new Promise(resolve => setTimeout(resolve, 1000));

    return logs;
  }

  /**
   * Get stored data from extension storage
   */
  private async getStoredData(page: Page): Promise<any> {
    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['collectedListings'], (result) => {
            const listings = result.collectedListings || [];

            if (listings.length === 0) {
              resolve({ total: 0, sample: null, fieldBreakdown: {} });
              return;
            }

            // Get latest listing
            const sample = listings[listings.length - 1];

            // Calculate field breakdown
            const fields = ['condition', 'category', 'brand', 'sellerInfo', 'imageCount'];
            const fieldBreakdown: Record<string, number> = {};

            fields.forEach(field => {
              const withField = listings.filter((l: any) => l[field] && l[field] !== 'N/A').length;
              fieldBreakdown[field] = Math.round((withField / listings.length) * 100);
            });

            resolve({
              total: listings.length,
              sample,
              fieldBreakdown
            });
          });
        } else {
          resolve(null);
        }
      });
    });

    return result;
  }

  /**
   * Analyze results and generate conclusion
   */
  private analyzeResults(result: DiagnosticResult): void {
    const { checks, storedListings, fieldBreakdown } = result;

    // Issue detection
    if (!checks.extensionLoaded) {
      result.issues.push('Extension not loaded properly');
      result.recommendations.push('Rebuild extension: npm run build');
      result.recommendations.push('Reload extension in chrome://extensions/');
    }

    if (!checks.serviceWorkerActive) {
      result.issues.push('Service worker not running');
      result.recommendations.push('Check extension errors in chrome://extensions/');
      result.recommendations.push('Try clicking service worker link to activate');
    }

    if (!checks.modalOpened) {
      result.issues.push('Product Research modal did not open');
      result.recommendations.push('Content script may not be injecting');
      result.recommendations.push('Check content script in dist/content/');
    }

    if (!checks.extractionRan) {
      result.issues.push('Extraction did not run');
      result.recommendations.push('Check if "Research This Deal" button was clicked');
      result.recommendations.push('Verify background script is listening for messages');
    }

    if (!checks.dataStored && checks.extractionRan) {
      result.issues.push('Extraction ran but no data stored');
      result.recommendations.push('Check chrome.storage.local permissions in manifest');
      result.recommendations.push('Verify data saving logic in background script');
    }

    if (checks.dataStored && storedListings > 0) {
      // Check if all fields have same rate (suspicious)
      const rates = Object.values(fieldBreakdown);
      const allSame = rates.length > 0 && rates.every(r => r === rates[0]);

      if (allSame && rates[0] === 30) {
        result.issues.push('All fields showing exactly 30% - likely using placeholder/test data');
        result.recommendations.push('Check if extraction is using mock data');
        result.recommendations.push('Verify extraction script is actually parsing DOM');
        result.conclusion = '⚠️ ISSUE: All fields at 30% suggests placeholder data, not real extraction';
      } else if (rates[0] === 0) {
        result.issues.push('All fields at 0% - extraction failing completely');
        result.recommendations.push('Check Facebook DOM structure hasn\'t changed');
        result.recommendations.push('Verify selectors in extraction script');
        result.conclusion = '❌ ISSUE: Extraction running but all fields failing - DOM selectors may be wrong';
      } else {
        result.conclusion = '✅ Extraction appears to be working with real data';
      }
    } else {
      result.conclusion = '❌ CRITICAL: No data being extracted or stored';
    }
  }

  /**
   * Print diagnostic results
   */
  private printResults(result: DiagnosticResult): void {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DIAGNOSTIC RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔍 SYSTEM CHECKS:');
    Object.entries(result.checks).forEach(([check, passed]) => {
      const icon = passed ? '✅' : '❌';
      console.log(`  ${icon} ${check}`);
    });
    console.log('');

    if (result.storedListings > 0) {
      console.log('💾 STORED DATA:');
      console.log(`  Total listings: ${result.storedListings}`);
      console.log('');
    }

    if (result.issues.length > 0) {
      console.log('🚨 ISSUES FOUND:');
      result.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
      console.log('');
    }

    if (result.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      result.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
      console.log('');
    }

    console.log('🎯 CONCLUSION:');
    console.log(`  ${result.conclusion}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Cleanup
   */
  private async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const diagnostic = new DealBotDiagnostic();

  (async () => {
    try {
      await diagnostic.runDiagnostic();
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      process.exit(1);
    }
  })();
}

export default DealBotDiagnostic;
