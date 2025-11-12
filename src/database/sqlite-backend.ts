/**
 * SQLite Backend - Test Execution Database
 * Core database layer for storing test results, browser sessions, and learning data
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TestExecution {
  id?: number;
  testName: string;
  url: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error';
  errorMessage?: string;
  screenshot?: string;
  recording?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface TestResult {
  id?: number;
  executionId: number;
  stepName: string;
  action: string;
  selector?: string;
  value?: string;
  success: boolean;
  errorMessage?: string;
  duration: number;
  screenshot?: string;
  timestamp: string;
}

export interface BrowserSession {
  id?: number;
  sessionId: string;
  browserType: string;
  headless: boolean;
  startTime: string;
  endTime?: string;
  testsExecuted: number;
  testsPassied: number;
  metadata?: Record<string, any>;
}

export interface LearningPattern {
  id?: number;
  patternType: string;
  testName: string;
  url: string;
  selector: string;
  action: string;
  successRate: number;
  usageCount: number;
  lastUsed: string;
  embedding?: string;
  metadata?: Record<string, any>;
}

export interface DatabaseStats {
  totalExecutions: number;
  totalTests: number;
  totalSessions: number;
  totalPatterns: number;
  successRate: number;
  averageDuration: number;
}

/**
 * SQLite Database Backend
 * Provides persistent storage for test execution history and learning patterns
 */
export class SQLiteBackend {
  private dbPath: string;
  private db: any = null;
  private better_sqlite3: any;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.initializeDatabase();
  }

  /**
   * Initialize database connection and create tables
   */
  private initializeDatabase(): void {
    // Create database directory if it doesn't exist
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Lazy load better-sqlite3 (will be installed as dependency)
    try {
      this.better_sqlite3 = require('better-sqlite3');
      this.db = new this.better_sqlite3(this.dbPath);
      this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better performance

      this.createTables();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw new Error('Database initialization failed. Make sure better-sqlite3 is installed.');
    }
  }

  /**
   * Create database schema
   */
  private createTables(): void {
    // Test Executions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        testName TEXT NOT NULL,
        url TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        duration INTEGER,
        status TEXT NOT NULL,
        errorMessage TEXT,
        screenshot TEXT,
        recording TEXT,
        metadata TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(testName, startTime)
      )
    `);

    // Test Results table (detailed step-by-step results)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        executionId INTEGER NOT NULL,
        stepName TEXT NOT NULL,
        action TEXT NOT NULL,
        selector TEXT,
        value TEXT,
        success INTEGER NOT NULL,
        errorMessage TEXT,
        duration INTEGER NOT NULL,
        screenshot TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (executionId) REFERENCES test_executions(id) ON DELETE CASCADE
      )
    `);

    // Browser Sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS browser_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId TEXT UNIQUE NOT NULL,
        browserType TEXT NOT NULL,
        headless INTEGER NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        testsExecuted INTEGER DEFAULT 0,
        testsPassed INTEGER DEFAULT 0,
        metadata TEXT
      )
    `);

    // Learning Patterns table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS learning_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patternType TEXT NOT NULL,
        testName TEXT NOT NULL,
        url TEXT NOT NULL,
        selector TEXT NOT NULL,
        action TEXT NOT NULL,
        successRate REAL DEFAULT 0.0,
        usageCount INTEGER DEFAULT 0,
        lastUsed TEXT NOT NULL,
        embedding TEXT,
        metadata TEXT,
        UNIQUE(patternType, testName, selector, action)
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_executions_status ON test_executions(status);
      CREATE INDEX IF NOT EXISTS idx_executions_testName ON test_executions(testName);
      CREATE INDEX IF NOT EXISTS idx_results_executionId ON test_results(executionId);
      CREATE INDEX IF NOT EXISTS idx_sessions_sessionId ON browser_sessions(sessionId);
      CREATE INDEX IF NOT EXISTS idx_patterns_testName ON learning_patterns(testName);
    `);
  }

  /**
   * Store a test execution
   */
  public storeExecution(execution: TestExecution): number {
    const stmt = this.db.prepare(`
      INSERT INTO test_executions (testName, url, startTime, endTime, duration, status, errorMessage, screenshot, recording, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      execution.testName,
      execution.url,
      execution.startTime,
      execution.endTime || null,
      execution.duration || null,
      execution.status,
      execution.errorMessage || null,
      execution.screenshot || null,
      execution.recording || null,
      execution.metadata ? JSON.stringify(execution.metadata) : null
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Update a test execution
   */
  public updateExecution(id: number, updates: Partial<TestExecution>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.endTime !== undefined) {
      fields.push('endTime = ?');
      values.push(updates.endTime);
    }
    if (updates.duration !== undefined) {
      fields.push('duration = ?');
      values.push(updates.duration);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.errorMessage !== undefined) {
      fields.push('errorMessage = ?');
      values.push(updates.errorMessage);
    }
    if (updates.screenshot !== undefined) {
      fields.push('screenshot = ?');
      values.push(updates.screenshot);
    }
    if (updates.recording !== undefined) {
      fields.push('recording = ?');
      values.push(updates.recording);
    }

    if (fields.length === 0) return;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE test_executions SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  /**
   * Get test execution by ID
   */
  public getExecution(id: number): TestExecution | null {
    const stmt = this.db.prepare('SELECT * FROM test_executions WHERE id = ?');
    const row = stmt.get(id);

    if (!row) return null;

    return {
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }

  /**
   * Get recent test executions
   */
  public getRecentExecutions(limit: number = 50): TestExecution[] {
    const stmt = this.db.prepare('SELECT * FROM test_executions ORDER BY startTime DESC LIMIT ?');
    const rows = stmt.all(limit);

    return rows.map((row: any) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }

  /**
   * Store a test result (step)
   */
  public storeResult(result: TestResult): number {
    const stmt = this.db.prepare(`
      INSERT INTO test_results (executionId, stepName, action, selector, value, success, errorMessage, duration, screenshot, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const dbResult = stmt.run(
      result.executionId,
      result.stepName,
      result.action,
      result.selector || null,
      result.value || null,
      result.success ? 1 : 0,
      result.errorMessage || null,
      result.duration,
      result.screenshot || null,
      result.timestamp
    );

    return dbResult.lastInsertRowid as number;
  }

  /**
   * Get test results for an execution
   */
  public getResults(executionId: number): TestResult[] {
    const stmt = this.db.prepare('SELECT * FROM test_results WHERE executionId = ? ORDER BY timestamp ASC');
    const rows = stmt.all(executionId);

    return rows.map((row: any) => ({
      ...row,
      success: row.success === 1
    }));
  }

  /**
   * Store browser session
   */
  public storeSession(session: BrowserSession): number {
    const stmt = this.db.prepare(`
      INSERT INTO browser_sessions (sessionId, browserType, headless, startTime, endTime, testsExecuted, testsPassed, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      session.sessionId,
      session.browserType,
      session.headless ? 1 : 0,
      session.startTime,
      session.endTime || null,
      session.testsExecuted || 0,
      session.testsPassied || 0,
      session.metadata ? JSON.stringify(session.metadata) : null
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Update browser session
   */
  public updateSession(sessionId: string, updates: Partial<BrowserSession>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.endTime !== undefined) {
      fields.push('endTime = ?');
      values.push(updates.endTime);
    }
    if (updates.testsExecuted !== undefined) {
      fields.push('testsExecuted = ?');
      values.push(updates.testsExecuted);
    }
    if (updates.testsPassied !== undefined) {
      fields.push('testsPassed = ?');
      values.push(updates.testsPassied);
    }

    if (fields.length === 0) return;

    values.push(sessionId);
    const stmt = this.db.prepare(`UPDATE browser_sessions SET ${fields.join(', ')} WHERE sessionId = ?`);
    stmt.run(...values);
  }

  /**
   * Store or update learning pattern
   */
  public storePattern(pattern: LearningPattern): number {
    const stmt = this.db.prepare(`
      INSERT INTO learning_patterns (patternType, testName, url, selector, action, successRate, usageCount, lastUsed, embedding, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(patternType, testName, selector, action) DO UPDATE SET
        successRate = excluded.successRate,
        usageCount = excluded.usageCount + 1,
        lastUsed = excluded.lastUsed,
        embedding = excluded.embedding,
        metadata = excluded.metadata
    `);

    const result = stmt.run(
      pattern.patternType,
      pattern.testName,
      pattern.url,
      pattern.selector,
      pattern.action,
      pattern.successRate,
      pattern.usageCount || 0,
      pattern.lastUsed,
      pattern.embedding || null,
      pattern.metadata ? JSON.stringify(pattern.metadata) : null
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Get learning patterns for a test
   */
  public getPatterns(testName: string): LearningPattern[] {
    const stmt = this.db.prepare('SELECT * FROM learning_patterns WHERE testName = ? ORDER BY successRate DESC, usageCount DESC');
    const rows = stmt.all(testName);

    return rows.map((row: any) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }

  /**
   * Get database statistics
   */
  public getStats(): DatabaseStats {
    const executions = this.db.prepare('SELECT COUNT(*) as count FROM test_executions').get();
    const results = this.db.prepare('SELECT COUNT(*) as count FROM test_results').get();
    const sessions = this.db.prepare('SELECT COUNT(*) as count FROM browser_sessions').get();
    const patterns = this.db.prepare('SELECT COUNT(*) as count FROM learning_patterns').get();

    const successStats = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed,
        AVG(duration) as avgDuration
      FROM test_executions
      WHERE status IN ('passed', 'failed')
    `).get();

    return {
      totalExecutions: executions.count,
      totalTests: results.count,
      totalSessions: sessions.count,
      totalPatterns: patterns.count,
      successRate: successStats.total > 0 ? successStats.passed / successStats.total : 0,
      averageDuration: successStats.avgDuration || 0
    };
  }

  /**
   * Clean up old test executions
   */
  public cleanup(daysToKeep: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoff = cutoffDate.toISOString();

    const stmt = this.db.prepare('DELETE FROM test_executions WHERE startTime < ?');
    const result = stmt.run(cutoff);

    return result.changes;
  }

  /**
   * Close database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
    }
  }

  /**
   * Export database to JSON
   */
  public exportToJSON(): string {
    const executions = this.db.prepare('SELECT * FROM test_executions').all();
    const results = this.db.prepare('SELECT * FROM test_results').all();
    const sessions = this.db.prepare('SELECT * FROM browser_sessions').all();
    const patterns = this.db.prepare('SELECT * FROM learning_patterns').all();

    return JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      executions: executions.map((e: any) => ({
        ...e,
        metadata: e.metadata ? JSON.parse(e.metadata) : undefined
      })),
      results,
      sessions: sessions.map((s: any) => ({
        ...s,
        metadata: s.metadata ? JSON.parse(s.metadata) : undefined
      })),
      patterns: patterns.map((p: any) => ({
        ...p,
        metadata: p.metadata ? JSON.parse(p.metadata) : undefined
      }))
    }, null, 2);
  }

  /**
   * Import data from JSON export
   */
  public importFromJSON(json: string): void {
    const data = JSON.parse(json);

    if (!data.executions || !Array.isArray(data.executions)) {
      throw new Error('Invalid import format');
    }

    // Use transaction for atomic import
    const transaction = this.db.transaction(() => {
      for (const execution of data.executions) {
        this.storeExecution(execution);
      }

      if (data.results) {
        for (const result of data.results) {
          this.storeResult(result);
        }
      }

      if (data.sessions) {
        for (const session of data.sessions) {
          this.storeSession(session);
        }
      }

      if (data.patterns) {
        for (const pattern of data.patterns) {
          this.storePattern(pattern);
        }
      }
    });

    transaction();
  }
}
