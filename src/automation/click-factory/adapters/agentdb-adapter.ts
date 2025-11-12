/**
 * AgentDB Adapter
 * Wraps AgentDBClient to provide an interface compatible with Click Factory
 */

import { AgentDBClient } from '../../../training/agentdb-client';
import * as path from 'path';

export interface SessionData {
  url: string;
  mode: 'manual' | 'auto';
  startedAt: number;
  [key: string]: any;
}

/**
 * Adapter that wraps AgentDBClient for Click Factory use
 */
export class AgentDBAdapter {
  private client: AgentDBClient;
  private dbPath: string;

  constructor(mode: 'sqlite' | 'memory' = 'sqlite') {
    // Determine database path
    if (mode === 'sqlite') {
      this.dbPath = path.resolve('./data/click-factory');
    } else {
      this.dbPath = ':memory:';
    }

    // Initialize AgentDBClient with 384 dimensions
    this.client = new AgentDBClient(this.dbPath, 384);
  }

  /**
   * Initialize the database
   * AgentDBClient doesn't require async initialization in its constructor,
   * but we provide this method for compatibility
   */
  async initialize(): Promise<void> {
    // AgentDBClient initializes in constructor, so this is mostly a no-op
    // But we can verify it's ready
    if (!this.client.isInitialized()) {
      throw new Error('AgentDB failed to initialize');
    }
    console.log('[AgentDBAdapter] Initialized successfully');
  }

  /**
   * Create a new session and return session ID
   */
  createSession(data: SessionData): number {
    // Store session data as an action pattern
    // Extract mode and startedAt from data to avoid duplication
    const { mode, startedAt, url, ...restData } = data;

    const sessionId = this.client.storeAction({
      action: 'session_start',
      url: url,
      metadata: {
        mode,
        startedAt,
        ...restData
      }
    });

    return sessionId;
  }

  /**
   * Record a successful form fill action
   */
  recordFormFill(url: string, selector: string, success: boolean): number {
    return this.client.storeAction({
      action: 'form_fill',
      selector,
      url,
      success,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Find similar successful patterns for a URL
   */
  findSuccessfulPatterns(url: string, limit: number = 10) {
    return this.client.findSimilar(
      { action: 'form_fill', url },
      limit,
      { successOnly: true, urlPattern: url }
    );
  }

  /**
   * Get database statistics
   */
  getStatistics() {
    return this.client.getStatistics();
  }

  /**
   * Save the database to disk
   */
  save(): void {
    this.client.save();
  }

  /**
   * Close the database
   */
  async close(): Promise<void> {
    // Save before closing
    this.client.save();
    console.log('[AgentDBAdapter] Database saved and closed');
  }

  /**
   * Get direct access to the underlying AgentDBClient
   * Use this for advanced operations
   */
  get agentDB(): AgentDBClient {
    return this.client;
  }
}
