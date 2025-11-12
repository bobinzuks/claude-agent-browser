/**
 * Automated Facebook Marketplace Extraction Test Suite
 *
 * Tests the Facebook Marketplace data extraction functionality using Playwright
 * Validates extraction success rates, data quality, and logs console output
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

interface ExtractionResult {
  listingId: string;
  title: string | null;
  price: number | null;
  currency: string;
  daysListed: number | null;
  ageText: string | null;
  listingLocation: string | null;
  sellerName: string | null;
  url: string;
  imageUrl: string | null;
  extractedAt: number;
  extractionMethod: string;
}

interface TestResult {
  timestamp: number;
  searchQuery: string;
  location: string;
  totalListings: number;
  extractedListings: number;
  successRate: number;
  metrics: {
    priceSuccess: number;
    titleSuccess: number;
    daysListedSuccess: number;
    locationSuccess: number;
    sellerSuccess: number;
    imageSuccess: number;
  };
  extractionMethods: Record<string, number>;
  results: ExtractionResult[];
  consoleMessages: string[];
  errors: string[];
}

export class FacebookMarketplaceTest {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private consoleMessages: string[] = [];
  private errors: string[] = [];

  constructor(
    private extensionPath: string = path.join(__dirname, '../dist'),
    private headless: boolean = false
  ) {}

  /**
   * Initialize browser with extension loaded
   */
  async setup(): Promise<void> {
    console.log('🚀 Setting up browser with extension...');

    // Launch browser with extension
    this.browser = await chromium.launchPersistentContext('', {
      headless: this.headless,
      args: [
        `--disable-extensions-except=${this.extensionPath}`,
        `--load-extension=${this.extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    // Get first page or create new one
    const pages = this.browser.pages();
    this.page = pages.length > 0 ? pages[0] : await this.browser.newPage();

    // Setup console monitoring
    this.page.on('console', (msg) => {
      const text = msg.text();
      this.consoleMessages.push(text);

      // Log extraction-related messages
      if (text.includes('[Extraction]') || text.includes('[DealBot')) {
        console.log('📊', text);
      }
    });

    // Setup error monitoring
    this.page.on('pageerror', (error) => {
      const errorText = error.message;
      this.errors.push(errorText);
      console.error('❌ Page error:', errorText);
    });

    console.log('✅ Browser setup complete');
  }

  /**
   * Login to Facebook (manual step required)
   */
  async loginToFacebook(): Promise<void> {
    console.log('🔐 Please login to Facebook...');

    await this.page!.goto('https://www.facebook.com/marketplace');

    // Wait for user to login
    console.log('⏳ Waiting for Facebook login (60 seconds)...');
    console.log('👉 Please login in the browser window');

    try {
      // Wait for marketplace to load (indicates successful login)
      await this.page!.waitForSelector('a[href*="/marketplace/"]', {
        timeout: 60000
      });
      console.log('✅ Login successful');
    } catch (error) {
      throw new Error('Login timeout - please login faster next time');
    }
  }

  /**
   * Search Facebook Marketplace
   */
  async searchMarketplace(query: string, location?: string): Promise<void> {
    console.log(`🔍 Searching for "${query}"${location ? ` in ${location}` : ''}...`);

    // Navigate to marketplace
    await this.page!.goto('https://www.facebook.com/marketplace');
    await this.page!.waitForLoadState('networkidle');

    // Enter search query
    const searchBox = await this.page!.waitForSelector('input[type="search"], input[aria-label*="Search"]');
    await searchBox!.fill(query);
    await this.page!.keyboard.press('Enter');

    // Wait for results to load
    await this.page!.waitForLoadState('networkidle');
    await this.page!.waitForTimeout(2000);

    console.log('✅ Search results loaded');
  }

  /**
   * Run extraction script on current page
   */
  async extractListings(maxListings: number = 10): Promise<ExtractionResult[]> {
    console.log(`📦 Extracting up to ${maxListings} listings...`);

    const extractionScript = this.getExtractionScript(maxListings);

    const results = await this.page!.evaluate(extractionScript);

    console.log(`✅ Extracted ${results.length} listings`);
    return results as ExtractionResult[];
  }

  /**
   * Get the extraction script (same as in facebook-marketplace-tools.ts)
   */
  private getExtractionScript(maxListings: number): string {
    return `
      (() => {
        const maxListings = ${maxListings};
        const listings = [];
        const links = document.querySelectorAll('a[href*="/marketplace/item/"]');

        console.log('[Extraction] Found ' + links.length + ' marketplace item links');

        for (let i = 0; i < Math.min(links.length, maxListings); i++) {
          const link = links[i];

          try {
            // Extract listing ID
            const idMatch = link.href.match(/\\/marketplace\\/item\\/(\\d+)/);
            if (!idMatch) continue;

            const fullText = link.textContent;
            const lowerText = fullText.toLowerCase();

            // TITLE EXTRACTION
            const titleSpans = link.querySelectorAll('span[dir="auto"]');
            let title = null;
            for (const span of titleSpans) {
              const text = span.textContent.trim();
              if (text.length > 3 && text.length < 200 && !text.match(/\\$/) && !text.toLowerCase().includes('listed')) {
                title = text;
                break;
              }
            }

            // PRICE AND CURRENCY EXTRACTION
            const priceMatch = link.textContent.match(/(CA|US)?\\$([\\d,]+)(?:\\.\\d{2})?/);
            let price = null;
            let currency = 'USD';
            if (priceMatch) {
              currency = priceMatch[1] === 'CA' ? 'CAD' : 'USD';
              price = parseFloat(priceMatch[2].replace(/,/g, ''));

              if (price <= 0 || price > 1000000) {
                price = null;
              }
            }

            // DAYS LISTED EXTRACTION (4-METHOD FALLBACK)
            let daysListed = null;
            let ageText = null;
            let extractionMethod = 'NONE';

            // METHOD 1: "listed" keyword
            if (lowerText.includes('listed')) {
              if (lowerText.match(/listed\\s*(just now|a\\s*moment\\s*ago|a\\s*few\\s*(seconds?|minutes?))/i)) {
                daysListed = 0;
                ageText = 'Just now';
                extractionMethod = 'TEXT_LISTED_NOW';
              }
              else if (lowerText.match(/listed\\s*(\\d+)\\s*hour|listed\\s*today|listed\\s*an?\\s*hour/i)) {
                const hourMatch = lowerText.match(/listed\\s*(\\d+)\\s*hour/i);
                daysListed = 0;
                ageText = hourMatch ? hourMatch[1] + ' hours ago' : 'Today';
                extractionMethod = 'TEXT_LISTED_HOURS';
              }
              else if (lowerText.match(/listed\\s*yesterday/i)) {
                daysListed = 1;
                ageText = 'Yesterday';
                extractionMethod = 'TEXT_LISTED_YESTERDAY';
              }
              else {
                const dayMatch = lowerText.match(/listed\\s*(\\d+)\\s*day/i);
                const weekMatch = lowerText.match(/listed\\s*(\\d+)\\s*week/i);
                const monthMatch = lowerText.match(/listed\\s*(\\d+)\\s*month/i);

                if (dayMatch) {
                  daysListed = parseInt(dayMatch[1]);
                  ageText = dayMatch[0];
                  extractionMethod = 'TEXT_LISTED_DAYS';
                } else if (weekMatch) {
                  daysListed = parseInt(weekMatch[1]) * 7;
                  ageText = weekMatch[0];
                  extractionMethod = 'TEXT_LISTED_WEEKS';
                } else if (monthMatch) {
                  daysListed = parseInt(monthMatch[1]) * 30;
                  ageText = monthMatch[0];
                  extractionMethod = 'TEXT_LISTED_MONTHS';
                }
              }
            }

            // METHOD 2: Standalone span patterns
            if (daysListed === null) {
              const allSpans = link.querySelectorAll('span');
              for (const span of allSpans) {
                const text = span.textContent.trim().toLowerCase();

                if (text.match(/^(just now|today|a few (seconds?|minutes?) ago)$/i)) {
                  daysListed = 0;
                  ageText = span.textContent.trim();
                  extractionMethod = 'SPAN_TODAY';
                  break;
                }
                if (text.match(/^yesterday$/i)) {
                  daysListed = 1;
                  ageText = 'Yesterday';
                  extractionMethod = 'SPAN_YESTERDAY';
                  break;
                }

                const dayMatch = text.match(/^(\\d+)\\s*days?\\s*ago$/i);
                if (dayMatch) {
                  daysListed = parseInt(dayMatch[1]);
                  ageText = span.textContent.trim();
                  extractionMethod = 'SPAN_DAYS';
                  break;
                }
              }
            }

            // METHOD 3: <time> elements
            if (daysListed === null) {
              const timeElements = link.querySelectorAll('time');
              for (const time of timeElements) {
                const datetime = time.getAttribute('datetime');
                if (datetime) {
                  try {
                    const postedDate = new Date(datetime);
                    const now = new Date();
                    const diffMs = now - postedDate;
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                    if (diffDays >= 0 && diffDays < 365) {
                      daysListed = diffDays;
                      ageText = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : diffDays + ' days ago';
                      extractionMethod = 'TIME_DATETIME';
                      break;
                    }
                  } catch (e) {
                    // Invalid datetime
                  }
                }
              }
            }

            // METHOD 4: Aria-labels
            if (daysListed === null) {
              const ariaElements = link.querySelectorAll('[aria-label]');
              for (const elem of ariaElements) {
                const aria = elem.getAttribute('aria-label');
                if (!aria) continue;
                const ariaLower = aria.toLowerCase();

                if (ariaLower.includes('listed') || ariaLower.includes('posted')) {
                  const dayMatch = ariaLower.match(/(\\d+)\\s*day/);
                  if (dayMatch) {
                    daysListed = parseInt(dayMatch[1]);
                    ageText = aria;
                    extractionMethod = 'ARIA_LABEL_DAYS';
                    break;
                  }
                }
              }
            }

            // LOCATION EXTRACTION
            let listingLocation = null;
            const locationPatterns = [
              /([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*),\\s*([A-Z]{2})/,
              /([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*),\\s*([A-Z][a-z]+)/
            ];

            for (const pattern of locationPatterns) {
              const match = fullText.match(pattern);
              if (match) {
                listingLocation = match[0];
                break;
              }
            }

            // SELLER EXTRACTION
            let sellerName = null;
            const sellerLinks = link.querySelectorAll('a[href*="/profile/"], a[href*="/user/"]');
            if (sellerLinks.length > 0) {
              sellerName = sellerLinks[0].textContent.trim();
            }

            // IMAGE EXTRACTION
            const img = link.querySelector('img');
            const imageUrl = img ? img.src : null;

            // Only add if we have minimum data
            if (title && price !== null) {
              const listing = {
                listingId: idMatch[1],
                title: title,
                price: price,
                currency: currency,
                daysListed: daysListed,
                ageText: ageText,
                listingLocation: listingLocation,
                sellerName: sellerName,
                url: link.href,
                imageUrl: imageUrl,
                extractedAt: Date.now(),
                extractionMethod: extractionMethod
              };

              listings.push(listing);

              // Log extraction
              const status = daysListed !== null ? '✅' : '⚠️';
              const condition = ageText || 'N/A';
              const imgCount = imageUrl ? '1img' : '0img';
              console.log(\`[Extraction] \${status} #\${i+1} | \${currency}\${price} | \${condition} | \${imgCount} | \${title}\`);
            }

          } catch (error) {
            console.error('[Extraction Error]', error);
          }
        }

        return listings;
      })();
    `;
  }

  /**
   * Analyze extraction results
   */
  analyzeResults(results: ExtractionResult[]): TestResult['metrics'] {
    const total = results.length;

    return {
      priceSuccess: (results.filter(r => r.price !== null).length / total) * 100,
      titleSuccess: (results.filter(r => r.title !== null).length / total) * 100,
      daysListedSuccess: (results.filter(r => r.daysListed !== null).length / total) * 100,
      locationSuccess: (results.filter(r => r.listingLocation !== null).length / total) * 100,
      sellerSuccess: (results.filter(r => r.sellerName !== null).length / total) * 100,
      imageSuccess: (results.filter(r => r.imageUrl !== null).length / total) * 100,
    };
  }

  /**
   * Get extraction method breakdown
   */
  getMethodBreakdown(results: ExtractionResult[]): Record<string, number> {
    const methods: Record<string, number> = {};

    results.forEach(r => {
      const method = r.extractionMethod || 'UNKNOWN';
      methods[method] = (methods[method] || 0) + 1;
    });

    return methods;
  }

  /**
   * Run complete test
   */
  async runTest(
    query: string,
    location: string = 'Vancouver, BC',
    maxListings: number = 30
  ): Promise<TestResult> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 FACEBOOK MARKETPLACE EXTRACTION TEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Reset state
    this.consoleMessages = [];
    this.errors = [];

    // Search
    await this.searchMarketplace(query, location);

    // Extract
    const results = await this.extractListings(maxListings);

    // Analyze
    const metrics = this.analyzeResults(results);
    const extractionMethods = this.getMethodBreakdown(results);

    const testResult: TestResult = {
      timestamp: Date.now(),
      searchQuery: query,
      location,
      totalListings: maxListings,
      extractedListings: results.length,
      successRate: (results.length / maxListings) * 100,
      metrics,
      extractionMethods,
      results,
      consoleMessages: this.consoleMessages,
      errors: this.errors,
    };

    this.printResults(testResult);

    return testResult;
  }

  /**
   * Print formatted results
   */
  private printResults(result: TestResult): void {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 EXTRACTION RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`🔍 Search: "${result.searchQuery}" in ${result.location}`);
    console.log(`📦 Total listings: ${result.totalListings}`);
    console.log(`✅ Extracted: ${result.extractedListings} (${result.successRate.toFixed(1)}%)\n`);

    console.log('📈 FIELD SUCCESS RATES:');
    console.log(`  💰 Price:        ${result.metrics.priceSuccess.toFixed(1)}%`);
    console.log(`  📝 Title:        ${result.metrics.titleSuccess.toFixed(1)}%`);
    console.log(`  📅 Days Listed:  ${result.metrics.daysListedSuccess.toFixed(1)}% ${result.metrics.daysListedSuccess >= 90 ? '⭐' : ''}`);
    console.log(`  📍 Location:     ${result.metrics.locationSuccess.toFixed(1)}%`);
    console.log(`  👤 Seller:       ${result.metrics.sellerSuccess.toFixed(1)}%`);
    console.log(`  🖼️  Images:       ${result.metrics.imageSuccess.toFixed(1)}%\n`);

    console.log('🔧 EXTRACTION METHODS:');
    const sortedMethods = Object.entries(result.extractionMethods)
      .sort((a, b) => b[1] - a[1]);

    sortedMethods.forEach(([method, count]) => {
      const percentage = (count / result.extractedListings * 100).toFixed(1);
      console.log(`  ${method}: ${count} (${percentage}%)`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Status
    const passed =
      result.successRate >= 75 &&
      result.metrics.daysListedSuccess >= 90 &&
      result.metrics.priceSuccess >= 95 &&
      result.metrics.titleSuccess >= 95;

    if (passed) {
      console.log('✅ TEST PASSED - All targets met');
    } else {
      console.log('❌ TEST FAILED - Some targets not met');
      if (result.successRate < 75) console.log('  ⚠️  Overall success rate below 75%');
      if (result.metrics.daysListedSuccess < 90) console.log('  ⚠️  Days listed below 90%');
      if (result.metrics.priceSuccess < 95) console.log('  ⚠️  Price extraction below 95%');
      if (result.metrics.titleSuccess < 95) console.log('  ⚠️  Title extraction below 95%');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Save results to file
   */
  async saveResults(result: TestResult, filename?: string): Promise<void> {
    const outputDir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = filename || `marketplace-test-${timestamp}.json`;
    const filepath = path.join(outputDir, file);

    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    console.log(`💾 Results saved to: ${filepath}`);
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run test if executed directly
if (require.main === module) {
  (async () => {
    const test = new FacebookMarketplaceTest();

    try {
      await test.setup();
      await test.loginToFacebook();

      const result = await test.runTest('laptop', 'Vancouver, BC', 30);
      await test.saveResults(result);

    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    } finally {
      await test.cleanup();
    }
  })();
}

export default FacebookMarketplaceTest;
