/**
 * Test MCP Tools - API Endpoints for Browser Testing
 * Exposes test execution, learning, and analysis through MCP protocol
 */

import { TestExecutionEngine, TestDefinition, ExecutionOptions } from '../testing/test-execution-engine.js';
import { PatternAnalyzer } from '../learning/pattern-analyzer.js';
import * as path from 'path';
import * as fs from 'fs';

export interface TestMCPToolsConfig {
  dbPath?: string;
  agentDBPath?: string;
  screenshotDir?: string;
  videoDir?: string;
}

/**
 * Test MCP Tools
 * Provides MCP tool implementations for browser testing
 */
export class TestMCPTools {
  private testEngine: TestExecutionEngine;
  private patternAnalyzer: PatternAnalyzer;
  private config: Required<TestMCPToolsConfig>;

  constructor(config: TestMCPToolsConfig = {}) {
    // Set default paths
    const projectRoot = process.cwd();
    this.config = {
      dbPath: config.dbPath || path.join(projectRoot, 'data', 'test-results.db'),
      agentDBPath: config.agentDBPath || path.join(projectRoot, 'data', 'agent-patterns'),
      screenshotDir: config.screenshotDir || path.join(projectRoot, 'data', 'screenshots'),
      videoDir: config.videoDir || path.join(projectRoot, 'data', 'videos')
    };

    // Ensure directories exist
    this.ensureDirectories();

    // Initialize components
    this.testEngine = new TestExecutionEngine(this.config.dbPath, this.config.agentDBPath);
    this.patternAnalyzer = new PatternAnalyzer(this.config.agentDBPath, this.config.dbPath);
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    const dirs = [
      path.dirname(this.config.dbPath),
      this.config.agentDBPath,
      this.config.screenshotDir,
      this.config.videoDir
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Execute a browser test
   */
  public async executeTest(params: {
    testName: string;
    url: string;
    steps: Array<{
      name: string;
      action: string;
      selector?: string;
      value?: string;
      timeout?: number;
    }>;
    browserType?: 'chromium' | 'firefox' | 'webkit';
    headless?: boolean;
    recordVideo?: boolean;
    takeScreenshots?: boolean;
  }): Promise<any> {
    try {
      const testDef: TestDefinition = {
        name: params.testName,
        url: params.url,
        steps: params.steps as any
      };

      const options: ExecutionOptions = {
        browserType: params.browserType || 'chromium',
        headless: params.headless !== false,
        recordVideo: params.recordVideo || false,
        takeScreenshots: params.takeScreenshots !== false,
        screenshotDir: this.config.screenshotDir,
        videoDir: this.config.videoDir
      };

      const result = await this.testEngine.executeTest(testDef, options);

      // Award quest XP
      try {
        const browserQuest = require('../../../../browser-quest-extension.js');
        if (result.success) {
          browserQuest.awardBrowserXP('TEST_PASSED', {
            details: `Test "${testDef.name}" completed successfully`
          });
        }
        if (result.screenshots.length > 0) {
          browserQuest.awardBrowserXP('SCREENSHOT_CAPTURED', {
            details: `${result.screenshots.length} screenshots captured`
          });
        }
      } catch (e) {
        // Quest system not available, continue without it
      }

      return {
        success: true,
        executionId: result.executionId,
        testPassed: result.success,
        duration: result.duration,
        steps: result.steps.length,
        stepsPassed: result.steps.filter(s => s.success).length,
        screenshots: result.screenshots,
        videoPath: result.videoPath,
        error: result.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Execute multiple tests in batch
   */
  public async executeTestBatch(params: {
    tests: Array<{
      testName: string;
      url: string;
      steps: Array<any>;
    }>;
    browserType?: 'chromium' | 'firefox' | 'webkit';
    headless?: boolean;
  }): Promise<any> {
    try {
      const testDefs: TestDefinition[] = params.tests.map(t => ({
        name: t.testName,
        url: t.url,
        steps: t.steps
      }));

      const options: ExecutionOptions = {
        browserType: params.browserType || 'chromium',
        headless: params.headless !== false,
        takeScreenshots: true,
        screenshotDir: this.config.screenshotDir
      };

      const results = await this.testEngine.executeTests(testDefs, options);

      const summary = {
        total: results.length,
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
        results: results.map(r => ({
          executionId: r.executionId,
          success: r.success,
          duration: r.duration,
          error: r.error
        }))
      };

      return {
        success: true,
        summary
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get test execution history
   */
  public async getTestHistory(params: {
    testName?: string;
    limit?: number;
  }): Promise<any> {
    try {
      const limit = params.limit || 50;

      if (params.testName) {
        const history = this.testEngine.getTestHistory(params.testName, limit);
        return {
          success: true,
          testName: params.testName,
          executions: history
        };
      } else {
        const stats = this.testEngine.getStats();
        return {
          success: true,
          stats
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze test patterns
   */
  public async analyzePatterns(): Promise<any> {
    try {
      const analysis = this.patternAnalyzer.analyzePatterns();

      return {
        success: true,
        analysis: {
          commonPatterns: analysis.commonPatterns.map(p => ({
            pattern: p.pattern,
            frequency: p.frequency,
            successRate: (p.successRate * 100).toFixed(1) + '%'
          })),
          failurePatterns: analysis.failurePatterns.map(p => ({
            pattern: p.pattern,
            frequency: p.frequency,
            successRate: (p.successRate * 100).toFixed(1) + '%'
          })),
          successPatterns: analysis.successPatterns.map(p => ({
            pattern: p.pattern,
            frequency: p.frequency,
            successRate: (p.successRate * 100).toFixed(1) + '%'
          })),
          recommendations: analysis.recommendations
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Predict test failures
   */
  public async predictFailures(params: {
    testName: string;
  }): Promise<any> {
    try {
      const predictions = this.patternAnalyzer.predictFailure(params.testName);

      return {
        success: true,
        testName: params.testName,
        predictions: predictions.map(p => ({
          step: p.step,
          likelihood: (p.likelihood * 100).toFixed(1) + '%',
          reasoning: p.reasoning,
          suggestions: p.suggestions
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate adaptive test from learned patterns
   */
  public async generateAdaptiveTest(params: {
    baseUrl: string;
    testGoal: string;
  }): Promise<any> {
    try {
      const suggestion = this.patternAnalyzer.generateAdaptiveTest(
        params.baseUrl,
        params.testGoal
      );

      return {
        success: true,
        suggestion: {
          testName: suggestion.testName,
          url: suggestion.url,
          steps: suggestion.steps,
          confidence: (suggestion.confidence * 100).toFixed(1) + '%',
          source: suggestion.source
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get learning metrics
   */
  public async getLearningMetrics(): Promise<any> {
    try {
      const metrics = this.patternAnalyzer.getLearningMetrics();

      return {
        success: true,
        metrics: {
          totalTests: metrics.totalTests,
          successRate: (metrics.successRate * 100).toFixed(1) + '%',
          patternsLearned: metrics.patternsLearned,
          commonPatterns: metrics.commonPatterns,
          failurePatterns: metrics.failurePatterns,
          successPatterns: metrics.successPatterns,
          recommendations: metrics.recommendations,
          improvementPotential: metrics.improvementPotential.toFixed(1) + '%'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export test data
   */
  public async exportTestData(params: {
    format?: 'json' | 'learning';
  }): Promise<any> {
    try {
      const format = params.format || 'json';

      if (format === 'learning') {
        const data = this.patternAnalyzer.exportLearningData();
        return {
          success: true,
          data,
          format: 'learning'
        };
      } else {
        const data = this.testEngine.exportData();
        return {
          success: true,
          database: data.database,
          patterns: data.patterns,
          format: 'json'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get quest progress
   */
  public async getQuestProgress(): Promise<any> {
    try {
      const browserQuest = require('../../../../browser-quest-extension.js');
      const progress = browserQuest.getBrowserProgress();

      if (!progress) {
        return {
          success: true,
          message: 'No browser testing progress yet. Start testing to track progress!',
          progress: null
        };
      }

      return {
        success: true,
        progress
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Quest system not available',
        details: error.message
      };
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    await this.testEngine.cleanup();
    this.patternAnalyzer.cleanup();
  }

  /**
   * Get all available tools definitions for MCP
   */
  public getToolDefinitions(): any[] {
    return [
      {
        name: 'test_execute',
        description: 'Execute a browser automation test with specified steps',
        inputSchema: {
          type: 'object',
          properties: {
            testName: { type: 'string', description: 'Name of the test' },
            url: { type: 'string', description: 'Starting URL for the test' },
            steps: {
              type: 'array',
              description: 'Test steps to execute',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  action: { type: 'string', enum: ['navigate', 'click', 'type', 'wait', 'screenshot', 'evaluate', 'select'] },
                  selector: { type: 'string' },
                  value: { type: 'string' },
                  timeout: { type: 'number' }
                },
                required: ['name', 'action']
              }
            },
            browserType: { type: 'string', enum: ['chromium', 'firefox', 'webkit'], default: 'chromium' },
            headless: { type: 'boolean', default: true },
            recordVideo: { type: 'boolean', default: false },
            takeScreenshots: { type: 'boolean', default: true }
          },
          required: ['testName', 'url', 'steps']
        }
      },
      {
        name: 'test_execute_batch',
        description: 'Execute multiple tests in batch',
        inputSchema: {
          type: 'object',
          properties: {
            tests: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  testName: { type: 'string' },
                  url: { type: 'string' },
                  steps: { type: 'array' }
                },
                required: ['testName', 'url', 'steps']
              }
            },
            browserType: { type: 'string', enum: ['chromium', 'firefox', 'webkit'] },
            headless: { type: 'boolean', default: true }
          },
          required: ['tests']
        }
      },
      {
        name: 'test_history',
        description: 'Get test execution history and statistics',
        inputSchema: {
          type: 'object',
          properties: {
            testName: { type: 'string', description: 'Optional: filter by test name' },
            limit: { type: 'number', default: 50 }
          }
        }
      },
      {
        name: 'test_analyze_patterns',
        description: 'Analyze learned patterns from test executions',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'test_predict_failures',
        description: 'Predict potential failures for a test based on history',
        inputSchema: {
          type: 'object',
          properties: {
            testName: { type: 'string', description: 'Name of the test to analyze' }
          },
          required: ['testName']
        }
      },
      {
        name: 'test_generate_adaptive',
        description: 'Generate adaptive test based on learned patterns',
        inputSchema: {
          type: 'object',
          properties: {
            baseUrl: { type: 'string', description: 'Base URL for the test' },
            testGoal: { type: 'string', description: 'Description of test goal' }
          },
          required: ['baseUrl', 'testGoal']
        }
      },
      {
        name: 'test_learning_metrics',
        description: 'Get learning system metrics and statistics',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'test_export_data',
        description: 'Export test data and learning patterns',
        inputSchema: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: ['json', 'learning'], default: 'json' }
          }
        }
      },
      {
        name: 'test_quest_progress',
        description: 'Get browser testing quest progress and achievements',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }
}
