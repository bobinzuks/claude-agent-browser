/**
 * Test Execution Engine Comprehensive Test Suite
 * Tests Playwright integration, browser automation, and test orchestration
 */

import { TestExecutionEngine, TestDefinition, ExecutionOptions } from '../../testing/test-execution-engine';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('TestExecutionEngine', () => {
  let engine: TestExecutionEngine;
  let testDbPath: string;
  let agentDBPath: string;
  let screenshotDir: string;

  beforeEach(() => {
    testDbPath = path.join(os.tmpdir(), `test-engine-db-${Date.now()}.sqlite`);
    agentDBPath = path.join(os.tmpdir(), `test-agent-db-${Date.now()}`);
    screenshotDir = path.join(os.tmpdir(), `screenshots-${Date.now()}`);

    engine = new TestExecutionEngine(testDbPath, agentDBPath);
  });

  afterEach(async () => {
    await engine.cleanup();

    // Clean up test files
    [testDbPath].forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (e) {
          // Ignore
        }
      }
    });

    // Clean up directories
    [agentDBPath, screenshotDir].forEach(dir => {
      if (fs.existsSync(dir)) {
        try {
          fs.rmSync(dir, { recursive: true, force: true });
        } catch (e) {
          // Ignore
        }
      }
    });
  });

  describe('Test Execution - Basic Operations', () => {
    it('should execute a simple navigation test', async () => {
      const test: TestDefinition = {
        name: 'simple-navigation',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
        ],
        timeout: 30000,
      };

      const options: ExecutionOptions = {
        headless: true,
        takeScreenshots: false,
      };

      const result = await engine.executeTest(test, options);

      expect(result.success).toBe(true);
      expect(result.executionId).toBeGreaterThan(0);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].success).toBe(true);
    }, 60000);

    it('should handle test failure gracefully', async () => {
      const test: TestDefinition = {
        name: 'failing-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
          {
            name: 'click-nonexistent',
            action: 'click',
            selector: '#nonexistent-element',
            timeout: 1000,
          },
        ],
      };

      const result = await engine.executeTest(test, { headless: true });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.steps).toHaveLength(2);
      expect(result.steps[1].success).toBe(false);
    }, 60000);

    it('should record test duration', async () => {
      const test: TestDefinition = {
        name: 'duration-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
          {
            name: 'wait',
            action: 'wait',
            waitFor: 100,
          },
        ],
      };

      const result = await engine.executeTest(test, { headless: true });

      expect(result.duration).toBeGreaterThan(100);
      expect(result.success).toBe(true);
    }, 60000);
  });

  describe('Screenshot Capture', () => {
    it('should capture screenshots when enabled', async () => {
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const test: TestDefinition = {
        name: 'screenshot-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
        ],
      };

      const result = await engine.executeTest(test, {
        headless: true,
        takeScreenshots: true,
        screenshotDir,
      });

      expect(result.success).toBe(true);
      expect(result.screenshots.length).toBeGreaterThan(0);
      expect(fs.existsSync(result.screenshots[0])).toBe(true);
    }, 60000);

    it('should capture error screenshots', async () => {
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const test: TestDefinition = {
        name: 'error-screenshot-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
          {
            name: 'fail',
            action: 'click',
            selector: '#nonexistent',
            timeout: 1000,
          },
        ],
      };

      const result = await engine.executeTest(test, {
        headless: true,
        screenshotDir,
      });

      expect(result.success).toBe(false);
      expect(result.screenshots.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Multi-Browser Support', () => {
    it('should execute tests in Chromium', async () => {
      const test: TestDefinition = {
        name: 'chromium-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
        ],
      };

      const result = await engine.executeTest(test, {
        browserType: 'chromium',
        headless: true,
      });

      expect(result.success).toBe(true);
    }, 60000);

    it('should execute tests in Firefox', async () => {
      const test: TestDefinition = {
        name: 'firefox-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
        ],
      };

      const result = await engine.executeTest(test, {
        browserType: 'firefox',
        headless: true,
      });

      expect(result.success).toBe(true);
    }, 60000);

    it('should execute tests in WebKit', async () => {
      const test: TestDefinition = {
        name: 'webkit-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
        ],
      };

      const result = await engine.executeTest(test, {
        browserType: 'webkit',
        headless: true,
      });

      expect(result.success).toBe(true);
    }, 60000);
  });

  describe('Batch Test Execution', () => {
    it('should execute multiple tests in sequence', async () => {
      const tests: TestDefinition[] = [
        {
          name: 'test-1',
          url: 'about:blank',
          steps: [
            {
              name: 'navigate',
              action: 'navigate',
              value: 'about:blank',
            },
          ],
        },
        {
          name: 'test-2',
          url: 'about:blank',
          steps: [
            {
              name: 'navigate',
              action: 'navigate',
              value: 'about:blank',
            },
          ],
        },
        {
          name: 'test-3',
          url: 'about:blank',
          steps: [
            {
              name: 'navigate',
              action: 'navigate',
              value: 'about:blank',
            },
          ],
        },
      ];

      const results = await engine.executeTests(tests, { headless: true });

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    }, 120000);

    it('should continue batch execution after failure', async () => {
      const tests: TestDefinition[] = [
        {
          name: 'passing-test',
          url: 'about:blank',
          steps: [
            {
              name: 'navigate',
              action: 'navigate',
              value: 'about:blank',
            },
          ],
        },
        {
          name: 'failing-test',
          url: 'about:blank',
          steps: [
            {
              name: 'fail',
              action: 'click',
              selector: '#nonexistent',
              timeout: 1000,
            },
          ],
        },
        {
          name: 'another-passing-test',
          url: 'about:blank',
          steps: [
            {
              name: 'navigate',
              action: 'navigate',
              value: 'about:blank',
            },
          ],
        },
      ];

      const results = await engine.executeTests(tests, { headless: true });

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    }, 120000);
  });

  describe('Test Actions', () => {
    it('should support navigate action', async () => {
      const test: TestDefinition = {
        name: 'navigate-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
        ],
      };

      const result = await engine.executeTest(test, { headless: true });
      expect(result.success).toBe(true);
    }, 60000);

    it('should support wait action', async () => {
      const test: TestDefinition = {
        name: 'wait-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
          {
            name: 'wait',
            action: 'wait',
            waitFor: 500,
          },
        ],
      };

      const result = await engine.executeTest(test, { headless: true });
      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(500);
    }, 60000);

    it('should support evaluate action', async () => {
      const test: TestDefinition = {
        name: 'evaluate-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
          {
            name: 'evaluate',
            action: 'evaluate',
            value: 'document.title = "Test Title"',
          },
        ],
      };

      const result = await engine.executeTest(test, { headless: true });
      expect(result.success).toBe(true);
    }, 60000);
  });

  describe('Error Handling', () => {
    it('should handle timeout errors', async () => {
      const test: TestDefinition = {
        name: 'timeout-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
          {
            name: 'timeout',
            action: 'click',
            selector: '#will-never-exist',
            timeout: 1000,
          },
        ],
      };

      const result = await engine.executeTest(test, { headless: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
    }, 60000);

    it('should handle invalid selectors', async () => {
      const test: TestDefinition = {
        name: 'invalid-selector-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
          {
            name: 'invalid',
            action: 'click',
            selector: '>>invalid<<',
            timeout: 1000,
          },
        ],
      };

      const result = await engine.executeTest(test, { headless: true });

      expect(result.success).toBe(false);
    }, 60000);

    it('should handle navigation errors', async () => {
      const test: TestDefinition = {
        name: 'navigation-error-test',
        url: 'https://invalid-domain-that-does-not-exist-12345.com',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'https://invalid-domain-that-does-not-exist-12345.com',
            timeout: 5000,
          },
        ],
      };

      const result = await engine.executeTest(test, { headless: true });

      expect(result.success).toBe(false);
    }, 60000);
  });

  describe('Test History', () => {
    it('should track test history', async () => {
      const test: TestDefinition = {
        name: 'history-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
        ],
      };

      // Execute test multiple times
      await engine.executeTest(test, { headless: true });
      await engine.executeTest(test, { headless: true });
      await engine.executeTest(test, { headless: true });

      const history = engine.getTestHistory('history-test', 10);
      expect(history.length).toBeGreaterThanOrEqual(3);
    }, 120000);

    it('should retrieve learned patterns', async () => {
      const test: TestDefinition = {
        name: 'pattern-test',
        url: 'https://example.com',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'https://example.com',
          },
        ],
      };

      await engine.executeTest(test, { headless: true });

      const patterns = engine.getLearnedPatterns('pattern-test');
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
    }, 60000);
  });

  describe('Statistics', () => {
    it('should return execution statistics', async () => {
      const test: TestDefinition = {
        name: 'stats-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
        ],
      };

      await engine.executeTest(test, { headless: true });

      const stats = engine.getStats();
      expect(stats).toHaveProperty('database');
      expect(stats).toHaveProperty('agentDB');
      expect(stats.database.totalExecutions).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Data Export', () => {
    it('should export test data', async () => {
      const test: TestDefinition = {
        name: 'export-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
        ],
      };

      await engine.executeTest(test, { headless: true });

      const exported = engine.exportData();
      expect(exported).toHaveProperty('database');
      expect(exported).toHaveProperty('patterns');

      const dbData = JSON.parse(exported.database);
      expect(dbData.executions.length).toBeGreaterThan(0);

      const patternData = JSON.parse(exported.patterns);
      expect(patternData).toHaveProperty('patterns');
    }, 60000);
  });

  describe('Performance Benchmarks', () => {
    it('should execute simple tests in under 5 seconds', async () => {
      const test: TestDefinition = {
        name: 'perf-test',
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
        ],
      };

      const start = Date.now();
      const result = await engine.executeTest(test, { headless: true });
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000);
    }, 60000);

    it('should handle concurrent test execution efficiently', async () => {
      const tests: TestDefinition[] = Array(5).fill(null).map((_, i) => ({
        name: `concurrent-test-${i}`,
        url: 'about:blank',
        steps: [
          {
            name: 'navigate',
            action: 'navigate',
            value: 'about:blank',
          },
        ],
      }));

      const start = Date.now();
      const results = await engine.executeTests(tests, { headless: true });
      const duration = Date.now() - start;

      expect(results).toHaveLength(5);
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(30000); // Should complete in under 30 seconds
    }, 120000);
  });
});
