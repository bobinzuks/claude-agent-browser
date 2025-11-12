/**
 * Console Monitor Helper
 *
 * Real-time console monitoring for extension service worker
 * Captures and analyzes extraction logs as they happen
 */

import { chromium, Browser, Page, CDPSession } from 'playwright';
import * as path from 'path';

interface ConsoleLog {
  timestamp: number;
  type: 'log' | 'error' | 'warn' | 'info' | 'debug';
  text: string;
  args?: any[];
}

interface ExtractionStats {
  totalListings: number;
  successfulExtractions: number;
  failedExtractions: number;
  methodCounts: Record<string, number>;
  startTime: number;
  endTime: number;
  duration: number;
}

export class ConsoleMonitor {
  private browser: Browser | null = null;
  private serviceWorkerPage: Page | null = null;
  private logs: ConsoleLog[] = [];
  private isMonitoring: boolean = false;

  constructor(
    private extensionPath: string = path.join(__dirname, '../dist'),
    private verbose: boolean = true
  ) {}

  /**
   * Start browser and connect to service worker
   */
  async start(): Promise<void> {
    console.log('🚀 Starting console monitor...\n');

    // Launch browser with extension
    const userDataDir = path.join(__dirname, '../.test-profiles/console-monitor');

    this.browser = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${this.extensionPath}`,
        `--load-extension=${this.extensionPath}`,
        '--auto-open-devtools-for-tabs',
      ],
    });

    console.log('✅ Browser launched with extension\n');

    // Wait for extension to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Connect to service worker
    await this.connectToServiceWorker();

    console.log('✅ Console monitor ready\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 LIVE CONSOLE OUTPUT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Connect to extension service worker
   */
  private async connectToServiceWorker(): Promise<void> {
    const serviceWorkers = this.browser!.serviceWorkers();

    if (serviceWorkers.length === 0) {
      throw new Error('No service workers found. Make sure extension is loaded.');
    }

    // Get extension service worker
    this.serviceWorkerPage = serviceWorkers.find(sw =>
      sw.url().includes('chrome-extension://')
    ) || serviceWorkers[0];

    if (!this.serviceWorkerPage) {
      throw new Error('Could not find extension service worker');
    }

    console.log(`✅ Connected to service worker: ${this.serviceWorkerPage.url()}\n`);

    // Setup console listeners
    this.setupConsoleListeners();
  }

  /**
   * Setup console event listeners
   */
  private setupConsoleListeners(): void {
    if (!this.serviceWorkerPage) return;

    this.serviceWorkerPage.on('console', (msg) => {
      const log: ConsoleLog = {
        timestamp: Date.now(),
        type: msg.type() as any,
        text: msg.text(),
      };

      this.logs.push(log);

      // Print if verbose
      if (this.verbose) {
        this.printLog(log);
      }
    });

    this.serviceWorkerPage.on('pageerror', (error) => {
      const log: ConsoleLog = {
        timestamp: Date.now(),
        type: 'error',
        text: error.message,
      };

      this.logs.push(log);

      if (this.verbose) {
        console.error('❌', error.message);
      }
    });
  }

  /**
   * Print formatted console log
   */
  private printLog(log: ConsoleLog): void {
    const time = new Date(log.timestamp).toLocaleTimeString();
    const prefix = this.getLogPrefix(log.type);
    const text = log.text;

    // Highlight extraction-related logs
    if (text.includes('[Extraction]') || text.includes('[DealBot')) {
      console.log(`${prefix} [${time}] ${text}`);
    } else if (log.type === 'error') {
      console.error(`${prefix} [${time}] ${text}`);
    } else if (log.type === 'warn') {
      console.warn(`${prefix} [${time}] ${text}`);
    }
  }

  /**
   * Get emoji prefix for log type
   */
  private getLogPrefix(type: string): string {
    const prefixes: Record<string, string> = {
      log: '📝',
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🔍',
    };
    return prefixes[type] || '📝';
  }

  /**
   * Filter logs by pattern
   */
  filterLogs(pattern: string | RegExp): ConsoleLog[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    return this.logs.filter(log => regex.test(log.text));
  }

  /**
   * Get all extraction logs
   */
  getExtractionLogs(): ConsoleLog[] {
    return this.filterLogs(/\[Extraction\]|\[DealBot\]/);
  }

  /**
   * Get all error logs
   */
  getErrorLogs(): ConsoleLog[] {
    return this.logs.filter(log => log.type === 'error');
  }

  /**
   * Analyze extraction statistics from logs
   */
  analyzeExtraction(): ExtractionStats | null {
    const extractionLogs = this.getExtractionLogs();

    if (extractionLogs.length === 0) {
      return null;
    }

    const startLog = extractionLogs[0];
    const endLog = extractionLogs[extractionLogs.length - 1];

    // Count success/failure
    const successLogs = extractionLogs.filter(log => log.text.includes('✅'));
    const failureLogs = extractionLogs.filter(log => log.text.includes('❌') || log.text.includes('Error'));

    // Count extraction methods
    const methodCounts: Record<string, number> = {};
    extractionLogs.forEach(log => {
      const methodMatch = log.text.match(/TEXT_LISTED|SPAN_|TIME_|ARIA_LABEL|NONE/);
      if (methodMatch) {
        const method = methodMatch[0];
        methodCounts[method] = (methodCounts[method] || 0) + 1;
      }
    });

    return {
      totalListings: successLogs.length + failureLogs.length,
      successfulExtractions: successLogs.length,
      failedExtractions: failureLogs.length,
      methodCounts,
      startTime: startLog.timestamp,
      endTime: endLog.timestamp,
      duration: endLog.timestamp - startLog.timestamp,
    };
  }

  /**
   * Print extraction statistics
   */
  printStats(): void {
    const stats = this.analyzeExtraction();

    if (!stats) {
      console.log('\n⚠️  No extraction data found in logs\n');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 EXTRACTION STATISTICS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`📦 Total Listings: ${stats.totalListings}`);
    console.log(`✅ Successful: ${stats.successfulExtractions}`);
    console.log(`❌ Failed: ${stats.failedExtractions}`);
    console.log(`📈 Success Rate: ${((stats.successfulExtractions / stats.totalListings) * 100).toFixed(1)}%`);
    console.log(`⏱️  Duration: ${(stats.duration / 1000).toFixed(2)}s\n`);

    if (Object.keys(stats.methodCounts).length > 0) {
      console.log('🔧 Extraction Methods:');
      const sortedMethods = Object.entries(stats.methodCounts)
        .sort((a, b) => b[1] - a[1]);

      sortedMethods.forEach(([method, count]) => {
        const percentage = ((count / stats.totalListings) * 100).toFixed(1);
        console.log(`  ${method}: ${count} (${percentage}%)`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Export logs to JSON
   */
  exportLogs(filepath: string): void {
    const fs = require('fs');
    const data = {
      timestamp: Date.now(),
      totalLogs: this.logs.length,
      extractionLogs: this.getExtractionLogs().length,
      errorLogs: this.getErrorLogs().length,
      stats: this.analyzeExtraction(),
      logs: this.logs,
    };

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`💾 Logs exported to: ${filepath}`);
  }

  /**
   * Wait for extraction to complete
   */
  async waitForExtraction(timeoutMs: number = 30000): Promise<boolean> {
    console.log('⏳ Waiting for extraction to complete...\n');

    const startTime = Date.now();

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const extractionLogs = this.getExtractionLogs();
        const lastLog = extractionLogs[extractionLogs.length - 1];

        // Check for summary log (indicates completion)
        if (lastLog && lastLog.text.includes('EXTRACTION SUMMARY')) {
          clearInterval(checkInterval);
          console.log('\n✅ Extraction complete!\n');
          resolve(true);
          return;
        }

        // Timeout
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(checkInterval);
          console.log('\n⚠️  Extraction timeout\n');
          resolve(false);
        }
      }, 100);
    });
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    console.log('🗑️  Logs cleared\n');
  }

  /**
   * Get log count
   */
  getLogCount(): number {
    return this.logs.length;
  }

  /**
   * Cleanup
   */
  async stop(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('\n✅ Console monitor stopped\n');
  }
}

// Interactive CLI mode
if (require.main === module) {
  const monitor = new ConsoleMonitor();

  (async () => {
    try {
      await monitor.start();

      console.log('📌 INSTRUCTIONS:');
      console.log('1. Navigate to Facebook Marketplace in the browser');
      console.log('2. Search for a product');
      console.log('3. Trigger extraction');
      console.log('4. Watch the logs appear here in real-time');
      console.log('5. Press Ctrl+C when done\n');

      // Keep process alive
      process.on('SIGINT', async () => {
        console.log('\n\n📊 Generating final statistics...\n');
        monitor.printStats();

        const outputFile = path.join(__dirname, '../test-results/console-logs.json');
        monitor.exportLogs(outputFile);

        await monitor.stop();
        process.exit(0);
      });

      // Keep running
      await new Promise(() => {});

    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}

export default ConsoleMonitor;
