/**
 * Test Execution Engine - Browser Automation Test Runner
 * Executes automated browser tests with screenshot/recording capabilities
 */

import { Browser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { SQLiteBackend, TestExecution, TestResult } from '../database/sqlite-backend.js';
import { AgentDBClient, ActionPattern } from '../training/agentdb-client.js';

export interface TestStep {
  name: string;
  action: 'navigate' | 'click' | 'type' | 'wait' | 'screenshot' | 'evaluate' | 'select';
  selector?: string;
  value?: string;
  timeout?: number;
  waitFor?: number;
}

export interface TestDefinition {
  name: string;
  url: string;
  steps: TestStep[];
  timeout?: number;
  retries?: number;
  metadata?: Record<string, any>;
}

export interface ExecutionOptions {
  browserType?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  recordVideo?: boolean;
  takeScreenshots?: boolean;
  screenshotDir?: string;
  videoDir?: string;
  slowMo?: number;
}

export interface ExecutionResult {
  executionId: number;
  success: boolean;
  duration: number;
  error?: string;
  screenshots: string[];
  videoPath?: string;
  steps: TestResult[];
}

/**
 * Test Execution Engine
 * Runs browser automation tests and stores results in database
 */
export class TestExecutionEngine {
  private db: SQLiteBackend;
  private agentDB: AgentDBClient;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private sessionId: string;
  // private screenshotCounter: number = 0;

  constructor(
    dbPath: string,
    agentDBPath: string,
    options: { sessionId?: string } = {}
  ) {
    this.db = new SQLiteBackend(dbPath);
    this.agentDB = new AgentDBClient(agentDBPath);
    this.sessionId = options.sessionId || `session-${Date.now()}`;
  }

  /**
   * Initialize browser instance
   */
  private async initBrowser(options: ExecutionOptions): Promise<void> {
    const browserType = options.browserType || 'chromium';

    // Launch browser
    const launchOptions: any = {
      headless: options.headless !== false,
      slowMo: options.slowMo || 0
    };

    switch (browserType) {
      case 'chromium':
        this.browser = await chromium.launch(launchOptions);
        break;
      case 'firefox':
        this.browser = await firefox.launch(launchOptions);
        break;
      case 'webkit':
        this.browser = await webkit.launch(launchOptions);
        break;
      default:
        throw new Error(`Unknown browser type: ${browserType}`);
    }

    // Create context with recording if enabled
    const contextOptions: any = {};

    if (options.recordVideo && options.videoDir) {
      contextOptions.recordVideo = {
        dir: options.videoDir,
        size: { width: 1280, height: 720 }
      };
    }

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();

    // Store session
    this.db.storeSession({
      sessionId: this.sessionId,
      browserType,
      headless: options.headless !== false,
      startTime: new Date().toISOString(),
      testsExecuted: 0,
      testsPassied: 0
    });
  }

  /**
   * Close browser instance
   */
  private async closeBrowser(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    // Update session
    this.db.updateSession(this.sessionId, {
      endTime: new Date().toISOString()
    });
  }

  /**
   * Execute a test definition
   */
  public async executeTest(
    test: TestDefinition,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const startTimeISO = new Date().toISOString();
    const screenshots: string[] = [];
    let videoPath: string | undefined;
    let executionId: number = 0;

    try {
      // Initialize browser if not already running
      if (!this.browser) {
        await this.initBrowser(options);
      }

      if (!this.page) {
        throw new Error('Page not initialized');
      }

      // Create execution record
      executionId = this.db.storeExecution({
        testName: test.name,
        url: test.url,
        startTime: startTimeISO,
        status: 'running',
        metadata: test.metadata
      });

      // Execute test steps
      const stepResults: TestResult[] = [];
      let stepIndex = 0;

      for (const step of test.steps) {
        const stepStartTime = Date.now();
        let success = true;
        let errorMessage: string | undefined;
        let screenshot: string | undefined;

        try {
          // Execute step action
          await this.executeStep(step);

          // Take screenshot if enabled
          if (options.takeScreenshots && options.screenshotDir) {
            screenshot = await this.takeScreenshot(
              options.screenshotDir,
              `${test.name}-step-${stepIndex}`
            );
            screenshots.push(screenshot);
          }

          // Store successful action in AgentDB
          this.agentDB.storeAction({
            action: step.action,
            selector: step.selector,
            value: step.value,
            url: test.url,
            success: true,
            timestamp: new Date().toISOString()
          });

        } catch (error: any) {
          success = false;
          errorMessage = error.message;

          // Take error screenshot
          if (options.screenshotDir) {
            screenshot = await this.takeScreenshot(
              options.screenshotDir,
              `${test.name}-step-${stepIndex}-error`
            );
            screenshots.push(screenshot);
          }

          // Store failed action in AgentDB
          this.agentDB.storeAction({
            action: step.action,
            selector: step.selector,
            value: step.value,
            url: test.url,
            success: false,
            timestamp: new Date().toISOString(),
            metadata: { error: errorMessage }
          });
        }

        const stepDuration = Date.now() - stepStartTime;

        // Store step result
        const result: TestResult = {
          executionId,
          stepName: step.name,
          action: step.action,
          selector: step.selector,
          value: step.value,
          success,
          errorMessage,
          duration: stepDuration,
          screenshot,
          timestamp: new Date().toISOString()
        };

        this.db.storeResult(result);
        stepResults.push(result);

        // Stop execution if step failed
        if (!success) {
          throw new Error(`Step "${step.name}" failed: ${errorMessage}`);
        }

        stepIndex++;
      }

      // Get video path if recording was enabled
      if (options.recordVideo && this.page) {
        const video = this.page.video();
        if (video) {
          videoPath = await video.path();
        }
      }

      const duration = Date.now() - startTime;

      // Update execution as passed
      this.db.updateExecution(executionId, {
        endTime: new Date().toISOString(),
        duration,
        status: 'passed',
        recording: videoPath
      });

      // Update session stats
      const _currentSession = this.db.getExecution(executionId);
      if (_currentSession) {
        this.db.updateSession(this.sessionId, {
          testsExecuted: 1,
          testsPassied: 1
        });
      }

      // Save AgentDB patterns
      this.agentDB.save();

      return {
        executionId,
        success: true,
        duration,
        screenshots,
        videoPath,
        steps: stepResults
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Update execution as failed
      if (executionId) {
        this.db.updateExecution(executionId, {
          endTime: new Date().toISOString(),
          duration,
          status: 'failed',
          errorMessage: error.message,
          recording: videoPath
        });
      }

      // Save AgentDB patterns even on failure
      this.agentDB.save();

      return {
        executionId,
        success: false,
        duration,
        error: error.message,
        screenshots,
        videoPath,
        steps: this.db.getResults(executionId)
      };
    }
  }

  /**
   * Execute a single test step
   */
  private async executeStep(step: TestStep): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const timeout = step.timeout || 30000;

    switch (step.action) {
      case 'navigate':
        if (!step.value) throw new Error('Navigate action requires value (URL)');
        await this.page.goto(step.value, { timeout });
        break;

      case 'click':
        if (!step.selector) throw new Error('Click action requires selector');
        await this.page.click(step.selector, { timeout });
        break;

      case 'type':
        if (!step.selector) throw new Error('Type action requires selector');
        if (!step.value) throw new Error('Type action requires value');
        await this.page.fill(step.selector, step.value, { timeout });
        break;

      case 'select':
        if (!step.selector) throw new Error('Select action requires selector');
        if (!step.value) throw new Error('Select action requires value');
        await this.page.selectOption(step.selector, step.value, { timeout });
        break;

      case 'wait':
        const waitTime = step.waitFor || parseInt(step.value || '1000', 10);
        await this.page.waitForTimeout(waitTime);
        break;

      case 'screenshot':
        // Screenshot is handled externally
        break;

      case 'evaluate':
        if (!step.value) throw new Error('Evaluate action requires value (script)');
        await this.page.evaluate(step.value);
        break;

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }

    // Wait a bit after each action for stability
    await this.page.waitForTimeout(step.waitFor || 500);
  }

  /**
   * Take a screenshot
   */
  private async takeScreenshot(dir: string, name: string): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(dir, filename);

    await this.page.screenshot({ path: filepath, fullPage: true });

    return filepath;
  }

  /**
   * Execute multiple tests in batch
   */
  public async executeTests(
    tests: TestDefinition[],
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    try {
      // Initialize browser once for all tests
      await this.initBrowser(options);

      for (const test of tests) {
        const result = await this.executeTest(test, options);
        results.push(result);
      }

    } finally {
      await this.closeBrowser();
    }

    return results;
  }

  /**
   * Get test history for a specific test
   */
  public getTestHistory(testName: string, limit: number = 10): TestExecution[] {
    const allExecutions = this.db.getRecentExecutions(1000);
    return allExecutions
      .filter(e => e.testName === testName)
      .slice(0, limit);
  }

  /**
   * Get learned patterns for a test
   */
  public getLearnedPatterns(testName: string): ActionPattern[] {
    return this.agentDB.queryByMetadata({ testName });
  }

  /**
   * Get database statistics
   */
  public getStats() {
    return {
      database: this.db.getStats(),
      agentDB: this.agentDB.getStatistics()
    };
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    await this.closeBrowser();
    this.db.close();
    this.agentDB.save();
  }

  /**
   * Export test data
   */
  public exportData(): { database: string; patterns: string } {
    return {
      database: this.db.exportToJSON(),
      patterns: this.agentDB.exportTrainingData()
    };
  }
}
