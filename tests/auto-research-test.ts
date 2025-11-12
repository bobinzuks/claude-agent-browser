/**
 * Fully Automated Research Test
 *
 * Zero manual steps - completely automated:
 * 1. Opens Facebook Marketplace
 * 2. Searches for product
 * 3. Clicks listing
 * 4. Automatically clicks "Research This Deal" button
 * 5. Monitors extraction
 * 6. Validates all 20 fields
 * 7. Reports results
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

interface AutoResearchResult {
  timestamp: number;
  success: boolean;
  searchQuery: string;

  steps: {
    marketplaceLoaded: boolean;
    searchCompleted: boolean;
    listingOpened: boolean;
    researchButtonFound: boolean;
    researchButtonClicked: boolean;
    extractionStarted: boolean;
    extractionCompleted: boolean;
    resultsValidated: boolean;
  };

  extraction: {
    totalListings: number;
    coreFields: Record<string, number>;
    phase1Fields: Record<string, number>;
    phase2Fields: Record<string, number>;
    ageDetection: {
      detected: boolean;
      conclusion: string;
    };
  };

  issues: string[];
  logs: string[];
  screenshot?: string;
}

export class AutoResearchTest {
  private context: BrowserContext | null = null;
  private extensionId: string = '';
  private logs: string[] = [];

  constructor(
    private extensionPath: string = path.join(__dirname, '../dist'),
    private headless: boolean = false
  ) {}

  /**
   * Run fully automated research test
   */
  async run(searchQuery: string = 'laptop'): Promise<AutoResearchResult> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 FULLY AUTOMATED RESEARCH TEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚡ Zero manual steps - fully automated\n');

    const result: AutoResearchResult = {
      timestamp: Date.now(),
      success: false,
      searchQuery,
      steps: {
        marketplaceLoaded: false,
        searchCompleted: false,
        listingOpened: false,
        researchButtonFound: false,
        researchButtonClicked: false,
        extractionStarted: false,
        extractionCompleted: false,
        resultsValidated: false,
      },
      extraction: {
        totalListings: 0,
        coreFields: {},
        phase1Fields: {},
        phase2Fields: {},
        ageDetection: {
          detected: false,
          conclusion: ''
        }
      },
      issues: [],
      logs: []
    };

    let page: Page | null = null;

    try {
      // Step 1: Setup
      console.log('🚀 Step 1/8: Setting up browser...');
      await this.setup();
      console.log('✅ Browser ready\n');

      page = await this.context!.newPage();

      // Monitor console
      page.on('console', msg => {
        const text = msg.text();
        this.logs.push(text);
        if (text.includes('[DealBot') || text.includes('[Extraction]')) {
          console.log('  📊', text);
        }
      });

      // Step 2: Navigate to Marketplace
      console.log('🚀 Step 2/8: Loading Facebook Marketplace...');
      await page.goto('https://www.facebook.com/marketplace', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Check login
      try {
        await page.waitForSelector('a[href*="/marketplace/"]', { timeout: 5000 });
        result.steps.marketplaceLoaded = true;
        console.log('✅ Marketplace loaded (logged in)\n');
      } catch {
        console.log('⚠️  Not logged in - waiting 30s for manual login...');
        await page.waitForSelector('a[href*="/marketplace/"]', { timeout: 30000 });
        result.steps.marketplaceLoaded = true;
        console.log('✅ Login completed\n');
      }

      // Step 3: Search
      console.log(`🚀 Step 3/8: Searching for "${searchQuery}"...`);
      const searchBox = await page.waitForSelector(
        'input[type="search"], input[aria-label*="Search"]',
        { timeout: 10000 }
      );
      await searchBox.fill(searchQuery);
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      result.steps.searchCompleted = true;
      console.log('✅ Search completed\n');

      // Step 4: Open first listing
      console.log('🚀 Step 4/8: Opening first listing...');
      const firstListing = await page.waitForSelector(
        'a[href*="/marketplace/item/"]',
        { timeout: 10000 }
      );
      await firstListing.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Wait for page to fully load
      result.steps.listingOpened = true;
      console.log('✅ Listing opened\n');

      // Step 5: Find Research button
      console.log('🚀 Step 5/8: Looking for "Research This Deal" button...');

      // Try multiple selectors
      const selectors = [
        'button:has-text("Research This Deal")',
        'button:has-text("🔍 Research")',
        'button[aria-label*="Research"]',
        '[data-testid*="research"]',
        'button:has-text("Research")'
      ];

      let researchButton = null;
      for (const selector of selectors) {
        try {
          researchButton = await page.waitForSelector(selector, { timeout: 2000 });
          if (researchButton) {
            console.log(`  ✅ Found button with selector: ${selector}`);
            break;
          }
        } catch {
          continue;
        }
      }

      if (!researchButton) {
        console.log('  ❌ Research button not found with any selector');
        console.log('  ℹ️  Checking if content script injected...\n');

        // Check if content script exists
        const contentScriptInjected = await page.evaluate(() => {
          return document.querySelector('[data-dealbot-injected]') !== null;
        });

        if (!contentScriptInjected) {
          result.issues.push('Content script not injected - button cannot appear');
          console.log('  ❌ Content script not injected\n');
        } else {
          result.issues.push('Content script injected but button not rendered');
          console.log('  ⚠️  Content script injected but button not visible\n');
        }

        // Take screenshot for debugging
        const screenshotPath = path.join(__dirname, '../test-results/no-button.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.screenshot = screenshotPath;
        console.log(`  📸 Screenshot saved: ${screenshotPath}\n`);

      } else {
        result.steps.researchButtonFound = true;
        console.log('✅ Research button found\n');

        // Step 6: Click Research button
        console.log('🚀 Step 6/8: Clicking "Research This Deal" button...');
        await researchButton.click();
        await page.waitForTimeout(1000);
        result.steps.researchButtonClicked = true;
        console.log('✅ Button clicked\n');

        // Step 7: Monitor extraction
        console.log('🚀 Step 7/8: Monitoring extraction...');

        // Wait for extraction to start
        const extractionStarted = await this.waitForExtractionStart(5000);
        result.steps.extractionStarted = extractionStarted;

        if (extractionStarted) {
          console.log('✅ Extraction started\n');

          // Wait for extraction to complete
          console.log('⏳ Waiting for extraction to complete (30s timeout)...');
          const extractionCompleted = await this.waitForExtractionComplete(30000);
          result.steps.extractionCompleted = extractionCompleted;

          if (extractionCompleted) {
            console.log('✅ Extraction completed\n');
          } else {
            console.log('⚠️  Extraction timeout (may still be running)\n');
            result.issues.push('Extraction did not complete within 30 seconds');
          }
        } else {
          console.log('❌ Extraction did not start\n');
          result.issues.push('No extraction logs detected');
        }

        // Step 8: Validate results
        console.log('🚀 Step 8/8: Validating extraction results...');
        const validation = await this.validateResults(page);
        result.extraction = validation;
        result.steps.resultsValidated = true;

        if (validation.totalListings > 0) {
          console.log(`✅ Found ${validation.totalListings} listings\n`);
          result.success = true;
        } else {
          console.log('⚠️  No listings extracted\n');
          result.issues.push('Zero listings in results');
        }
      }

    } catch (error) {
      console.error('❌ Test failed:', error);
      result.issues.push(`Test error: ${error}`);

      // Screenshot on error
      if (page) {
        const screenshotPath = path.join(__dirname, '../test-results/error.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.screenshot = screenshotPath;
      }
    } finally {
      result.logs = this.logs;
      if (page) await page.close();
      await this.cleanup();
    }

    this.printResults(result);
    return result;
  }

  /**
   * Setup browser
   */
  private async setup(): Promise<void> {
    const userDataDir = path.join(__dirname, '../.test-profiles/auto-research');

    this.context = await chromium.launchPersistentContext(userDataDir, {
      headless: this.headless,
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

    if (!this.extensionId) {
      throw new Error('Extension not found');
    }
  }

  /**
   * Wait for extraction to start
   */
  private async waitForExtractionStart(timeoutMs: number): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const hasStartLog = this.logs.some(log =>
        log.includes('[DealBot') ||
        log.includes('[Extraction]') ||
        log.includes('Found') ||
        log.includes('marketplace item')
      );

      if (hasStartLog) return true;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return false;
  }

  /**
   * Wait for extraction to complete
   */
  private async waitForExtractionComplete(timeoutMs: number): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const hasCompleteLog = this.logs.some(log =>
        log.includes('EXTRACTION SUMMARY') ||
        log.includes('listings processed') ||
        log.includes('extraction complete')
      );

      if (hasCompleteLog) return true;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return false;
  }

  /**
   * Validate extraction results
   */
  private async validateResults(page: Page): Promise<AutoResearchResult['extraction']> {
    // Get stored data from extension
    const storedData = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['collectedListings'], (result) => {
            resolve(result.collectedListings || []);
          });
        } else {
          resolve([]);
        }
      });
    }) as any[];

    const total = storedData.length;

    // Calculate field extraction rates
    const calculateRate = (field: string) => {
      const extracted = storedData.filter(item => {
        const value = item[field];
        return value && value !== 'N/A' && value !== null && value !== undefined;
      }).length;
      return total > 0 ? Math.round((extracted / total) * 100) : 0;
    };

    // Core fields
    const coreFields = {
      price: calculateRate('price'),
      title: calculateRate('title'),
      age: calculateRate('daysListed'),
      location: calculateRate('location'),
      url: calculateRate('url'),
      listingId: calculateRate('listingId'),
      currency: calculateRate('currency'),
      imageUrl: calculateRate('imageUrl')
    };

    // Phase 1 fields
    const phase1Fields = {
      condition: calculateRate('condition'),
      sellerInfo: calculateRate('sellerInfo'),
      category: calculateRate('category'),
      images: calculateRate('imageCount'),
      shippingInfo: calculateRate('shippingInfo')
    };

    // Phase 2 fields
    const phase2Fields = {
      sellerBadges: calculateRate('sellerBadges'),
      sellerRating: calculateRate('sellerRating'),
      brand: calculateRate('brand'),
      model: calculateRate('model'),
      specifications: calculateRate('specifications'),
      urgencyKeywords: calculateRate('urgencyKeywords'),
      description: calculateRate('description')
    };

    // Age detection
    const ageDetected = coreFields.age > 0;
    const ageConclusion = ageDetected
      ? `✅ Age data detected (${coreFields.age}% of listings)`
      : '❌ No age data - likely Facebook limitation';

    return {
      totalListings: total,
      coreFields,
      phase1Fields,
      phase2Fields,
      ageDetection: {
        detected: ageDetected,
        conclusion: ageConclusion
      }
    };
  }

  /**
   * Print results
   */
  private printResults(result: AutoResearchResult): void {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 AUTOMATED RESEARCH TEST RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔍 TEST STEPS:');
    Object.entries(result.steps).forEach(([step, passed]) => {
      const icon = passed ? '✅' : '❌';
      const label = step.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`  ${icon} ${label}`);
    });
    console.log('');

    if (result.extraction.totalListings > 0) {
      console.log('📦 EXTRACTION RESULTS:');
      console.log(`  Total Listings: ${result.extraction.totalListings}\n`);

      console.log('  🔵 Core Fields:');
      Object.entries(result.extraction.coreFields).forEach(([field, rate]) => {
        const icon = rate >= 70 ? '✅' : rate >= 40 ? '⚠️' : '❌';
        console.log(`    ${icon} ${field}: ${rate}%`);
      });

      console.log('\n  🟢 Phase 1 Fields:');
      Object.entries(result.extraction.phase1Fields).forEach(([field, rate]) => {
        const icon = rate >= 60 ? '✅' : rate >= 30 ? '⚠️' : '❌';
        console.log(`    ${icon} ${field}: ${rate}%`);
      });

      console.log('\n  🟡 Phase 2 Fields:');
      Object.entries(result.extraction.phase2Fields).forEach(([field, rate]) => {
        const icon = rate >= 40 ? '✅' : rate >= 20 ? '⚠️' : '❌';
        console.log(`    ${icon} ${field}: ${rate}%`);
      });

      console.log('\n  📅 Age Detection:');
      console.log(`    ${result.extraction.ageDetection.conclusion}`);
      console.log('');
    }

    if (result.issues.length > 0) {
      console.log('🚨 ISSUES:');
      result.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
      console.log('');
    }

    if (result.screenshot) {
      console.log(`📸 Screenshot: ${result.screenshot}\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (result.success) {
      console.log('✅ TEST PASSED - Extraction working');
    } else {
      console.log('❌ TEST FAILED - See issues above');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Save results
   */
  async saveResults(result: AutoResearchResult): Promise<void> {
    const outputDir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filepath = path.join(outputDir, `auto-research-${timestamp}.json`);

    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    console.log(`💾 Results saved: ${filepath}\n`);
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
  const test = new AutoResearchTest();

  (async () => {
    try {
      const result = await test.run('laptop');
      await test.saveResults(result);

      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    }
  })();
}

export default AutoResearchTest;
