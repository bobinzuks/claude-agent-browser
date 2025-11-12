/**
 * SQLite Backend Comprehensive Test Suite
 * Tests database operations, CRUD, transactions, and performance
 */

import { SQLiteBackend, TestExecution, TestResult, BrowserSession, LearningPattern } from '../../database/sqlite-backend';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('SQLiteBackend', () => {
  let db: SQLiteBackend;
  let testDbPath: string;

  beforeEach(() => {
    // Create temporary database for testing
    testDbPath = path.join(os.tmpdir(), `test-db-${Date.now()}.sqlite`);
    db = new SQLiteBackend(testDbPath);
  });

  afterEach(() => {
    db.close();
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const dbDir = path.dirname(testDbPath);
    if (fs.existsSync(dbDir)) {
      const files = fs.readdirSync(dbDir).filter(f => f.startsWith('test-db-'));
      files.forEach(f => {
        try {
          fs.unlinkSync(path.join(dbDir, f));
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    }
  });

  describe('Database Initialization', () => {
    it('should create database file', () => {
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    it('should create all required tables', () => {
      const stats = db.getStats();
      expect(stats).toHaveProperty('totalExecutions');
      expect(stats).toHaveProperty('totalTests');
      expect(stats).toHaveProperty('totalSessions');
      expect(stats).toHaveProperty('totalPatterns');
    });

    it('should handle database directory creation', () => {
      const nestedPath = path.join(os.tmpdir(), 'nested', 'test', `db-${Date.now()}.sqlite`);
      const nestedDb = new SQLiteBackend(nestedPath);
      expect(fs.existsSync(nestedPath)).toBe(true);
      nestedDb.close();
      fs.unlinkSync(nestedPath);
      fs.rmdirSync(path.dirname(nestedPath));
      fs.rmdirSync(path.dirname(path.dirname(nestedPath)));
    });
  });

  describe('Test Executions - CRUD Operations', () => {
    it('should store a test execution', () => {
      const execution: TestExecution = {
        testName: 'login-test',
        url: 'https://example.com',
        startTime: new Date().toISOString(),
        status: 'pending',
      };

      const id = db.storeExecution(execution);
      expect(id).toBeGreaterThan(0);
    });

    it('should retrieve a test execution by ID', () => {
      const execution: TestExecution = {
        testName: 'login-test',
        url: 'https://example.com',
        startTime: new Date().toISOString(),
        status: 'pending',
      };

      const id = db.storeExecution(execution);
      const retrieved = db.getExecution(id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.testName).toBe('login-test');
      expect(retrieved?.url).toBe('https://example.com');
      expect(retrieved?.status).toBe('pending');
    });

    it('should update a test execution', () => {
      const execution: TestExecution = {
        testName: 'login-test',
        url: 'https://example.com',
        startTime: new Date().toISOString(),
        status: 'pending',
      };

      const id = db.storeExecution(execution);
      db.updateExecution(id, {
        status: 'passed',
        endTime: new Date().toISOString(),
        duration: 1500,
      });

      const updated = db.getExecution(id);
      expect(updated?.status).toBe('passed');
      expect(updated?.duration).toBe(1500);
      expect(updated?.endTime).toBeDefined();
    });

    it('should store execution metadata as JSON', () => {
      const execution: TestExecution = {
        testName: 'login-test',
        url: 'https://example.com',
        startTime: new Date().toISOString(),
        status: 'pending',
        metadata: {
          browser: 'chrome',
          version: '120.0',
          tags: ['smoke', 'critical'],
        },
      };

      const id = db.storeExecution(execution);
      const retrieved = db.getExecution(id);

      expect(retrieved?.metadata).toEqual(execution.metadata);
    });

    it('should get recent executions', () => {
      // Create multiple executions
      for (let i = 0; i < 5; i++) {
        db.storeExecution({
          testName: `test-${i}`,
          url: 'https://example.com',
          startTime: new Date(Date.now() + i * 1000).toISOString(),
          status: 'pending',
        });
      }

      const recent = db.getRecentExecutions(3);
      expect(recent).toHaveLength(3);
      // Should be sorted by startTime DESC
      expect(recent[0].testName).toBe('test-4');
      expect(recent[1].testName).toBe('test-3');
    });
  });

  describe('Test Results - Step Tracking', () => {
    it('should store test results', () => {
      const executionId = db.storeExecution({
        testName: 'login-test',
        url: 'https://example.com',
        startTime: new Date().toISOString(),
        status: 'running',
      });

      const result: TestResult = {
        executionId,
        stepName: 'click-login',
        action: 'click',
        selector: '#login-button',
        success: true,
        duration: 250,
        timestamp: new Date().toISOString(),
      };

      const resultId = db.storeResult(result);
      expect(resultId).toBeGreaterThan(0);
    });

    it('should retrieve results for an execution', () => {
      const executionId = db.storeExecution({
        testName: 'login-test',
        url: 'https://example.com',
        startTime: new Date().toISOString(),
        status: 'running',
      });

      // Store multiple results
      for (let i = 0; i < 3; i++) {
        db.storeResult({
          executionId,
          stepName: `step-${i}`,
          action: 'click',
          success: true,
          duration: 100 + i * 50,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
        });
      }

      const results = db.getResults(executionId);
      expect(results).toHaveLength(3);
      expect(results[0].stepName).toBe('step-0');
      expect(results[2].stepName).toBe('step-2');
    });

    it('should store failed step with error message', () => {
      const executionId = db.storeExecution({
        testName: 'login-test',
        url: 'https://example.com',
        startTime: new Date().toISOString(),
        status: 'running',
      });

      db.storeResult({
        executionId,
        stepName: 'invalid-step',
        action: 'click',
        selector: '#nonexistent',
        success: false,
        errorMessage: 'Element not found',
        duration: 5000,
        timestamp: new Date().toISOString(),
      });

      const results = db.getResults(executionId);
      expect(results[0].success).toBe(false);
      expect(results[0].errorMessage).toBe('Element not found');
    });
  });

  describe('Browser Sessions', () => {
    it('should store a browser session', () => {
      const session: BrowserSession = {
        sessionId: 'session-123',
        browserType: 'chromium',
        headless: true,
        startTime: new Date().toISOString(),
        testsExecuted: 0,
        testsPassied: 0,
      };

      const id = db.storeSession(session);
      expect(id).toBeGreaterThan(0);
    });

    it('should update session statistics', () => {
      const session: BrowserSession = {
        sessionId: 'session-123',
        browserType: 'chromium',
        headless: true,
        startTime: new Date().toISOString(),
        testsExecuted: 0,
        testsPassied: 0,
      };

      db.storeSession(session);
      db.updateSession('session-123', {
        testsExecuted: 5,
        testsPassied: 4,
        endTime: new Date().toISOString(),
      });

      const stats = db.getStats();
      expect(stats.totalSessions).toBe(1);
    });

    it('should store session metadata', () => {
      const session: BrowserSession = {
        sessionId: 'session-123',
        browserType: 'firefox',
        headless: false,
        startTime: new Date().toISOString(),
        testsExecuted: 0,
        testsPassied: 0,
        metadata: {
          userAgent: 'Mozilla/5.0',
          viewport: { width: 1920, height: 1080 },
        },
      };

      db.storeSession(session);
      // Verify stored by checking stats
      expect(db.getStats().totalSessions).toBe(1);
    });
  });

  describe('Learning Patterns', () => {
    it('should store a learning pattern', () => {
      const pattern: LearningPattern = {
        patternType: 'login',
        testName: 'user-login',
        url: 'https://example.com',
        selector: '#login-button',
        action: 'click',
        successRate: 0.95,
        usageCount: 20,
        lastUsed: new Date().toISOString(),
      };

      const id = db.storePattern(pattern);
      expect(id).toBeGreaterThan(0);
    });

    it('should update pattern on conflict (upsert)', () => {
      const pattern: LearningPattern = {
        patternType: 'login',
        testName: 'user-login',
        url: 'https://example.com',
        selector: '#login-button',
        action: 'click',
        successRate: 0.95,
        usageCount: 20,
        lastUsed: new Date().toISOString(),
      };

      db.storePattern(pattern);
      // Store again with updated stats
      db.storePattern({
        ...pattern,
        successRate: 0.97,
        usageCount: 25,
      });

      const patterns = db.getPatterns('user-login');
      expect(patterns).toHaveLength(1);
      expect(patterns[0].successRate).toBe(0.97);
      expect(patterns[0].usageCount).toBe(26); // Incremented by upsert
    });

    it('should retrieve patterns for a test', () => {
      const pattern1: LearningPattern = {
        patternType: 'login',
        testName: 'user-login',
        url: 'https://example.com',
        selector: '#login-button',
        action: 'click',
        successRate: 0.95,
        usageCount: 20,
        lastUsed: new Date().toISOString(),
      };

      const pattern2: LearningPattern = {
        patternType: 'form',
        testName: 'user-login',
        url: 'https://example.com',
        selector: '#username',
        action: 'type',
        successRate: 0.98,
        usageCount: 22,
        lastUsed: new Date().toISOString(),
      };

      db.storePattern(pattern1);
      db.storePattern(pattern2);

      const patterns = db.getPatterns('user-login');
      expect(patterns).toHaveLength(2);
      // Should be sorted by success rate DESC, then usage count DESC
      expect(patterns[0].action).toBe('type');
    });
  });

  describe('Database Statistics', () => {
    it('should return correct statistics', () => {
      // Create test data
      const executionId = db.storeExecution({
        testName: 'test1',
        url: 'https://example.com',
        startTime: new Date().toISOString(),
        status: 'passed',
        duration: 1000,
      });

      db.storeResult({
        executionId,
        stepName: 'step1',
        action: 'click',
        success: true,
        duration: 100,
        timestamp: new Date().toISOString(),
      });

      db.storeSession({
        sessionId: 'session-1',
        browserType: 'chromium',
        headless: true,
        startTime: new Date().toISOString(),
        testsExecuted: 1,
        testsPassied: 1,
      });

      db.storePattern({
        patternType: 'login',
        testName: 'test1',
        url: 'https://example.com',
        selector: '#button',
        action: 'click',
        successRate: 1.0,
        usageCount: 1,
        lastUsed: new Date().toISOString(),
      });

      const stats = db.getStats();
      expect(stats.totalExecutions).toBe(1);
      expect(stats.totalTests).toBe(1);
      expect(stats.totalSessions).toBe(1);
      expect(stats.totalPatterns).toBe(1);
      expect(stats.successRate).toBe(1.0);
      expect(stats.averageDuration).toBe(1000);
    });

    it('should calculate success rate correctly', () => {
      // Create mixed results
      db.storeExecution({
        testName: 'test1',
        url: 'https://example.com',
        startTime: new Date().toISOString(),
        status: 'passed',
        duration: 1000,
      });

      db.storeExecution({
        testName: 'test2',
        url: 'https://example.com',
        startTime: new Date().toISOString(),
        status: 'failed',
        duration: 500,
      });

      db.storeExecution({
        testName: 'test3',
        url: 'https://example.com',
        startTime: new Date().toISOString(),
        status: 'passed',
        duration: 750,
      });

      const stats = db.getStats();
      expect(stats.successRate).toBeCloseTo(0.6667, 2);
      expect(stats.averageDuration).toBeCloseTo(750, 0);
    });
  });

  describe('Data Cleanup', () => {
    it('should cleanup old executions', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);

      // Create old execution
      db.storeExecution({
        testName: 'old-test',
        url: 'https://example.com',
        startTime: oldDate.toISOString(),
        status: 'passed',
      });

      // Create recent execution
      db.storeExecution({
        testName: 'recent-test',
        url: 'https://example.com',
        startTime: new Date().toISOString(),
        status: 'passed',
      });

      const deleted = db.cleanup(30);
      expect(deleted).toBe(1);

      const executions = db.getRecentExecutions(10);
      expect(executions).toHaveLength(1);
      expect(executions[0].testName).toBe('recent-test');
    });
  });

  describe('Import/Export', () => {
    it('should export database to JSON', () => {
      db.storeExecution({
        testName: 'test1',
        url: 'https://example.com',
        startTime: new Date().toISOString(),
        status: 'passed',
      });

      const json = db.exportToJSON();
      const data = JSON.parse(json);

      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('executions');
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('sessions');
      expect(data).toHaveProperty('patterns');
      expect(data.executions).toHaveLength(1);
    });

    it('should import database from JSON', () => {
      const exportData = {
        version: '1.0.0',
        executions: [
          {
            testName: 'imported-test',
            url: 'https://example.com',
            startTime: new Date().toISOString(),
            status: 'passed',
          },
        ],
        results: [],
        sessions: [],
        patterns: [],
      };

      db.importFromJSON(JSON.stringify(exportData));

      const executions = db.getRecentExecutions(10);
      expect(executions.length).toBeGreaterThan(0);
    });

    it('should handle invalid import data', () => {
      expect(() => {
        db.importFromJSON('invalid json');
      }).toThrow();

      expect(() => {
        db.importFromJSON('{"invalid": "format"}');
      }).toThrow('Invalid import format');
    });
  });

  describe('Transaction Handling', () => {
    it('should handle concurrent writes', () => {
      const results = [];
      for (let i = 0; i < 100; i++) {
        const id = db.storeExecution({
          testName: `test-${i}`,
          url: 'https://example.com',
          startTime: new Date().toISOString(),
          status: 'pending',
        });
        results.push(id);
      }

      expect(results).toHaveLength(100);
      expect(new Set(results).size).toBe(100); // All IDs should be unique
    });
  });

  describe('Error Recovery', () => {
    it('should handle missing execution gracefully', () => {
      const execution = db.getExecution(99999);
      expect(execution).toBeNull();
    });

    it('should handle empty results query', () => {
      const results = db.getResults(99999);
      expect(results).toEqual([]);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should insert 1000 executions quickly', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        db.storeExecution({
          testName: `perf-test-${i}`,
          url: 'https://example.com',
          startTime: new Date().toISOString(),
          status: 'pending',
        });
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should query recent executions quickly', () => {
      // Insert test data
      for (let i = 0; i < 100; i++) {
        db.storeExecution({
          testName: `test-${i}`,
          url: 'https://example.com',
          startTime: new Date().toISOString(),
          status: 'pending',
        });
      }

      const start = Date.now();
      db.getRecentExecutions(50);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});
