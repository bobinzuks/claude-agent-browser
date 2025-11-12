/**
 * Automated Multi-Location Search Test
 *
 * Tests the DealBot extension's multi-location search feature
 * Validates tab automation, data extraction, and results aggregation
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

interface Location {
  city: string;
  state: string;
}

interface ExtractionResult {
  location: string;
  listingsFound: number;
  extractedListings: number;
  bestPrice: number | null;
  averagePrice: number | null;
  priceRange: { min: number; max: number } | null;
  extractionTime: number;
  success: boolean;
  error?: string;
}

interface MultiLocationTestResult {
  timestamp: number;
  productQuery: string;
  locationsSearched: number;
  totalListings: number;
  successfulLocations: number;
  failedLocations: number;
  totalDuration: number;
  averagePriceAcrossLocations: number | null;
  bestDeal: {
    location: string;
    price: number;
    title: string;
  } | null;
  results: ExtractionResult[];
  performanceMetrics: {
    avgTimePerLocation: number;
    tabsOpenedSimultaneously: number;
    parallelEfficiency: number;
  };
}

export class MultiLocationTest {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private extensionId: string = '';

  private readonly testLocations: Location[] = [
    { city: 'Seattle', state: 'WA' },
    { city: 'Portland', state: 'OR' },
    { city: 'San Francisco', state: 'CA' },
  ];

  constructor(
    private extensionPath: string = path.join(__dirname, '../dist'),
    private headless: boolean = false
  ) {}

  /**
   * Setup browser with extension
   */
  async setup(): Promise<void> {
    console.log('🚀 Setting up browser with DealBot extension...\n');

    const userDataDir = path.join(__dirname, '../.test-profiles/multi-location');

    // Launch with extension
    this.context = await chromium.launchPersistentContext(userDataDir, {
      headless: this.headless,
      args: [
        `--disable-extensions-except=${this.extensionPath}`,
        `--load-extension=${this.extensionPath}`,
        '--no-sandbox',
      ],
    });

    // Get extension ID
    await this.getExtensionId();

    console.log(`✅ Extension loaded: ${this.extensionId}\n`);
  }

  /**
   * Get extension ID from chrome://extensions page
   */
  private async getExtensionId(): Promise<void> {
    const page = await this.context!.newPage();
    await page.goto('chrome://extensions/');

    // Extract extension ID from the page
    const extensionCards = await page.$$('extensions-item');

    for (const card of extensionCards) {
      const nameElement = await card.$('#name');
      const name = await nameElement?.textContent();

      if (name?.includes('DealBot') || name?.includes('Claude Agent Browser')) {
        const id = await card.getAttribute('id');
        if (id) {
          this.extensionId = id;
          break;
        }
      }
    }

    await page.close();

    if (!this.extensionId) {
      throw new Error('Could not find extension ID. Is the extension loaded?');
    }
  }

  /**
   * Test using the test page (Option A)
   */
  async testViaTestPage(): Promise<MultiLocationTestResult> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 TESTING VIA TEST PAGE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const page = await this.context!.newPage();
    const testPageUrl = `chrome-extension://${this.extensionId}/test-multi-location.html`;

    console.log(`📄 Opening test page: ${testPageUrl}\n`);

    try {
      await page.goto(testPageUrl, { waitUntil: 'networkidle' });
    } catch (error) {
      throw new Error(`Test page not found. Make sure test-multi-location.html exists in ${this.extensionPath}`);
    }

    // Setup console monitoring
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);

      if (text.includes('[DealBot') || text.includes('[Extraction]')) {
        console.log('📊', text);
      }
    });

    // Click the test button
    console.log('🔘 Clicking "Test Multi-Location Search" button...\n');

    const startTime = Date.now();

    await page.click('button:has-text("Test Multi-Location Search")');

    // Wait for search to complete
    console.log('⏳ Waiting for multi-location search to complete...\n');

    await this.waitForSearchCompletion(page, logs, 60000);

    const duration = Date.now() - startTime;

    // Extract results from page
    const results = await this.extractResultsFromPage(page);

    await page.close();

    return this.buildTestResult(results, duration, 'test-page');
  }

  /**
   * Test using real Facebook Marketplace (Option B)
   */
  async testViaFacebookMarketplace(productQuery: string = 'laptop'): Promise<MultiLocationTestResult> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 TESTING VIA FACEBOOK MARKETPLACE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const page = await this.context!.newPage();

    // Login check
    console.log('🔐 Checking Facebook login status...\n');
    await page.goto('https://www.facebook.com/marketplace');

    try {
      await page.waitForSelector('a[href*="/marketplace/"]', { timeout: 5000 });
      console.log('✅ Already logged in\n');
    } catch {
      console.log('⚠️  Not logged in. Please login manually...\n');
      console.log('⏳ Waiting 60 seconds for manual login...\n');

      await page.waitForSelector('a[href*="/marketplace/"]', { timeout: 60000 });
      console.log('✅ Login successful\n');
    }

    // Search for product
    console.log(`🔍 Searching for: ${productQuery}\n`);

    const searchBox = await page.waitForSelector('input[type="search"], input[aria-label*="Search"]');
    await searchBox.fill(productQuery);
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on first listing
    console.log('📦 Opening first listing...\n');

    const firstListing = await page.waitForSelector('a[href*="/marketplace/item/"]');
    await firstListing.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for "Research This Deal" button
    console.log('🔍 Looking for "Research This Deal" button...\n');

    try {
      const researchButton = await page.waitForSelector('button:has-text("Research This Deal")', {
        timeout: 10000
      });

      console.log('✅ Found button, clicking...\n');
      await researchButton.click();
      await page.waitForTimeout(1000);
    } catch {
      console.log('⚠️  Button not found. Extension may not be injecting content script.\n');
      throw new Error('Research This Deal button not found');
    }

    // Wait for modal
    console.log('📱 Waiting for Product Research Modal...\n');
    await page.waitForSelector('.product-research-modal', { timeout: 5000 });

    // Setup console monitoring
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);

      if (text.includes('[DealBot') || text.includes('[Extraction]')) {
        console.log('📊', text);
      }
    });

    // Click "Open All Locations" button
    console.log('🚀 Clicking "Open All Locations" button...\n');

    const startTime = Date.now();

    await page.click('button:has-text("Open All Locations")');

    // Wait for search to complete
    console.log('⏳ Waiting for multi-location search to complete...\n');

    await this.waitForSearchCompletion(page, logs, 60000);

    const duration = Date.now() - startTime;

    // Extract results from modal
    const results = await this.extractResultsFromModal(page);

    await page.close();

    return this.buildTestResult(results, duration, productQuery);
  }

  /**
   * Wait for search to complete by monitoring console logs
   */
  private async waitForSearchCompletion(
    page: Page,
    logs: string[],
    timeoutMs: number
  ): Promise<void> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        // Check for completion indicators in logs
        const hasStarted = logs.some(log => log.includes('Opening search tab'));
        const hasClosed = logs.filter(log => log.includes('Closed tab')).length;
        const hasCompleted = logs.some(log =>
          log.includes('Multi-location search complete') ||
          log.includes('All locations processed')
        );

        if (hasCompleted || (hasStarted && hasClosed >= this.testLocations.length)) {
          clearInterval(checkInterval);
          console.log('✅ Search completed!\n');
          resolve();
          return;
        }

        // Timeout
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(checkInterval);
          reject(new Error('Search timeout'));
        }
      }, 500);
    });
  }

  /**
   * Extract results from test page
   */
  private async extractResultsFromPage(page: Page): Promise<ExtractionResult[]> {
    // Wait for results to be displayed
    await page.waitForSelector('#results', { timeout: 5000 });

    // Extract data from DOM
    const resultsData = await page.evaluate(() => {
      const resultsDiv = document.getElementById('results');
      if (!resultsDiv) return [];

      // Parse the results (format depends on how test page displays them)
      const locationDivs = resultsDiv.querySelectorAll('.location-result');

      return Array.from(locationDivs).map(div => {
        const locationText = div.querySelector('.location-name')?.textContent || '';
        const listingsText = div.querySelector('.listings-count')?.textContent || '0';
        const priceText = div.querySelector('.average-price')?.textContent || '0';

        return {
          location: locationText,
          listingsFound: parseInt(listingsText) || 0,
          extractedListings: parseInt(listingsText) || 0,
          averagePrice: parseFloat(priceText) || null,
          success: true,
        };
      });
    });

    return resultsData.map((data: any) => ({
      ...data,
      bestPrice: null,
      priceRange: null,
      extractionTime: 0,
    }));
  }

  /**
   * Extract results from Facebook modal
   */
  private async extractResultsFromModal(page: Page): Promise<ExtractionResult[]> {
    // Wait for results section
    await page.waitForSelector('.location-results', { timeout: 5000 });

    const resultsData = await page.evaluate(() => {
      const resultItems = document.querySelectorAll('.location-result-item');

      return Array.from(resultItems).map(item => {
        const locationText = item.querySelector('.location-label')?.textContent || '';
        const countText = item.querySelector('.listing-count')?.textContent || '0';
        const priceText = item.querySelector('.avg-price')?.textContent || '0';

        return {
          location: locationText,
          listingsFound: parseInt(countText.match(/\d+/)?.[0] || '0'),
          extractedListings: parseInt(countText.match(/\d+/)?.[0] || '0'),
          averagePrice: parseFloat(priceText.replace(/[^0-9.]/g, '')) || null,
          success: true,
        };
      });
    });

    return resultsData.map((data: any) => ({
      ...data,
      bestPrice: null,
      priceRange: null,
      extractionTime: 0,
    }));
  }

  /**
   * Build test result object
   */
  private buildTestResult(
    results: ExtractionResult[],
    duration: number,
    productQuery: string
  ): MultiLocationTestResult {
    const successfulLocations = results.filter(r => r.success).length;
    const failedLocations = results.filter(r => !r.success).length;
    const totalListings = results.reduce((sum, r) => sum + r.extractedListings, 0);

    const allPrices = results
      .filter(r => r.averagePrice !== null)
      .map(r => r.averagePrice!);

    const averagePriceAcrossLocations = allPrices.length > 0
      ? allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length
      : null;

    // Find best deal (assumes results have individual listings)
    let bestDeal = null;
    // This would need to be extracted from actual listing data

    return {
      timestamp: Date.now(),
      productQuery,
      locationsSearched: results.length,
      totalListings,
      successfulLocations,
      failedLocations,
      totalDuration: duration,
      averagePriceAcrossLocations,
      bestDeal,
      results,
      performanceMetrics: {
        avgTimePerLocation: duration / results.length,
        tabsOpenedSimultaneously: 3, // Based on current implementation
        parallelEfficiency: (3000 * results.length) / duration, // 3s ideal per location
      },
    };
  }

  /**
   * Print test results
   */
  printResults(result: MultiLocationTestResult): void {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 MULTI-LOCATION TEST RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`🔍 Product Query: "${result.productQuery}"`);
    console.log(`📍 Locations Searched: ${result.locationsSearched}`);
    console.log(`✅ Successful: ${result.successfulLocations}`);
    console.log(`❌ Failed: ${result.failedLocations}`);
    console.log(`📦 Total Listings: ${result.totalListings}`);
    console.log(`⏱️  Total Duration: ${(result.totalDuration / 1000).toFixed(2)}s`);

    if (result.averagePriceAcrossLocations) {
      console.log(`💰 Average Price: $${result.averagePriceAcrossLocations.toFixed(2)}`);
    }

    console.log('\n📈 PERFORMANCE METRICS:');
    console.log(`  ⏱️  Avg Time/Location: ${(result.performanceMetrics.avgTimePerLocation / 1000).toFixed(2)}s`);
    console.log(`  🔀 Parallel Tabs: ${result.performanceMetrics.tabsOpenedSimultaneously}`);
    console.log(`  ⚡ Efficiency: ${result.performanceMetrics.parallelEfficiency.toFixed(2)}x`);

    console.log('\n📍 LOCATION BREAKDOWN:\n');

    result.results.forEach((loc, i) => {
      const status = loc.success ? '✅' : '❌';
      const price = loc.averagePrice ? `$${loc.averagePrice.toFixed(2)}` : 'N/A';

      console.log(`  ${status} ${loc.location.padEnd(20)} | ${loc.extractedListings.toString().padStart(2)} listings | Avg: ${price}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Validation
    const passed =
      result.successfulLocations >= result.locationsSearched * 0.8 && // 80% success rate
      result.totalListings > 0 &&
      result.totalDuration < 30000; // Under 30 seconds

    if (passed) {
      console.log('✅ TEST PASSED\n');
    } else {
      console.log('❌ TEST FAILED\n');

      if (result.successfulLocations < result.locationsSearched * 0.8) {
        console.log('  ⚠️  Success rate below 80%');
      }
      if (result.totalListings === 0) {
        console.log('  ⚠️  No listings extracted');
      }
      if (result.totalDuration >= 30000) {
        console.log('  ⚠️  Duration exceeded 30 seconds');
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Save results to file
   */
  async saveResults(result: MultiLocationTestResult, filename?: string): Promise<void> {
    const outputDir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = filename || `multi-location-test-${timestamp}.json`;
    const filepath = path.join(outputDir, file);

    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    console.log(`💾 Results saved to: ${filepath}\n`);
  }

  /**
   * Run comprehensive test suite
   */
  async runFullTestSuite(): Promise<void> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 MULTI-LOCATION TEST SUITE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 1: Via test page
    console.log('📋 TEST 1: Via Test Page\n');
    try {
      const result1 = await this.testViaTestPage();
      this.printResults(result1);
      await this.saveResults(result1, 'test-page-result.json');
    } catch (error) {
      console.log(`❌ Test page failed: ${error}\n`);
    }

    // Test 2: Via Facebook Marketplace
    console.log('📋 TEST 2: Via Facebook Marketplace\n');
    try {
      const result2 = await this.testViaFacebookMarketplace('laptop');
      this.printResults(result2);
      await this.saveResults(result2, 'facebook-marketplace-result.json');
    } catch (error) {
      console.log(`❌ Facebook marketplace test failed: ${error}\n`);
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
    console.log('🧹 Cleanup complete\n');
  }
}

// Run if executed directly
if (require.main === module) {
  const test = new MultiLocationTest();

  (async () => {
    try {
      await test.setup();

      // Choose test mode
      const mode = process.argv[2] || 'test-page';

      if (mode === 'full') {
        await test.runFullTestSuite();
      } else if (mode === 'facebook') {
        const result = await test.testViaFacebookMarketplace();
        test.printResults(result);
        await test.saveResults(result);
      } else {
        const result = await test.testViaTestPage();
        test.printResults(result);
        await test.saveResults(result);
      }

    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    } finally {
      await test.cleanup();
    }
  })();
}

export default MultiLocationTest;
