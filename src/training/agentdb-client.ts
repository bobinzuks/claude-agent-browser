/**
 * AgentDB Client - BOSS 4: The Memory Keeper
 * Vector database for storing and retrieving browser automation patterns
 * Uses HNSW (Hierarchical Navigable Small World) for fast similarity search
 */

import hnswlib from 'hnswlib-node';
const { HierarchicalNSW } = hnswlib;
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface ActionPattern {
  action: string;
  selector?: string;
  value?: string;
  url?: string;
  success?: boolean;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  pattern: ActionPattern;
  similarity: number;
  id: number;
}

export interface SearchOptions {
  successOnly?: boolean;
  urlPattern?: string;
  minSimilarity?: number;
}

export interface Statistics {
  totalActions: number;
  successRate: number;
  actionTypes: Record<string, number>;
  averageEmbeddingTime: number;
}

export interface PatternSummary {
  pattern: string;
  count: number;
  successRate: number;
}

/**
 * AgentDBClient - Vector database for storing browser automation patterns
 */
export class AgentDBClient {
  private index: any;
  private dbPath: string;
  private dimensions: number;
  private patterns: Map<number, ActionPattern>;
  private nextId: number;
  private embeddingTimes: number[];
  private indexCount: number;

  constructor(dbPath: string, dimensions: number = 384) {
    this.dbPath = dbPath;
    this.dimensions = dimensions;
    this.patterns = new Map();
    this.nextId = 0;
    this.embeddingTimes = [];
    this.indexCount = 0;

    // Create database directory
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    // Initialize or load HNSW index
    const indexPath = path.join(dbPath, 'index.dat');
    const metadataPath = path.join(dbPath, 'metadata.json');

    if (fs.existsSync(indexPath) && fs.existsSync(metadataPath)) {
      // Load metadata first
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

      // Restore patterns with their original IDs
      this.patterns = new Map();
      if (metadata.patternsWithIds) {
        metadata.patternsWithIds.forEach(([id, pattern]: [number, ActionPattern]) => {
          this.patterns.set(id, pattern);
        });
      } else {
        // Fallback for old format
        metadata.patterns.forEach((p: ActionPattern, i: number) => {
          this.patterns.set(i, p);
        });
      }
      this.nextId = metadata.nextId;
      this.indexCount = this.patterns.size;

      // Load existing index
      this.index = new HierarchicalNSW('cosine', dimensions);
      this.index.readIndex(indexPath);
    } else {
      // Create new index with proper parameters
      this.index = new HierarchicalNSW('cosine', dimensions);
      this.index.initIndex(10000, dimensions, 16, 200);
      console.log('[AgentDB] New index initialized with dimensions:', dimensions);
    }
  }

  /**
   * Get dimensions of the vector space
   */
  public getDimensions(): number {
    return this.dimensions;
  }

  /**
   * Check if index is initialized
   */
  public isInitialized(): boolean {
    return this.index !== null && this.index !== undefined;
  }

  /**
   * Store an action pattern in the database
   */
  public storeAction(pattern: ActionPattern): number {
    const startTime = Date.now();

    // Generate embedding vector from pattern
    const vector = this.generateEmbedding(pattern);

    // Store in HNSW index
    const id = this.nextId++;
    this.index.addPoint(Array.from(vector), id);
    this.indexCount++; // Track count manually

    // Store pattern metadata
    const patternWithTimestamp = {
      ...pattern,
      timestamp: pattern.timestamp || new Date().toISOString(),
    };
    this.patterns.set(id, patternWithTimestamp);

    // Track embedding time
    const embeddingTime = Date.now() - startTime;
    this.embeddingTimes.push(embeddingTime);

    return id;
  }

  /**
   * Find similar patterns to a query
   */
  public findSimilar(query: ActionPattern, k: number = 10, options: SearchOptions = {}): SearchResult[] {
    if (this.patterns.size === 0) {
      return [];
    }

    const queryVector = this.generateEmbedding(query);
    const searchK = Math.min(k * 2, this.patterns.size, this.indexCount);
    if (searchK === 0) {
      return [];
    }

    const searchResult = this.index.searchKnn(Array.from(queryVector), searchK); // Get extra for filtering

    const results: SearchResult[] = [];

    for (let i = 0; i < searchResult.neighbors.length; i++) {
      const id = searchResult.neighbors[i];
      const pattern = this.patterns.get(id);

      if (!pattern) continue;

      // Apply filters
      if (options.successOnly && pattern.success !== true) continue;
      if (options.urlPattern && pattern.url && !pattern.url.includes(options.urlPattern)) continue;

      // Convert distance to similarity (clamp to [0, 1])
      const similarity = Math.max(0, Math.min(1, 1 - searchResult.distances[i]));
      if (options.minSimilarity && similarity < options.minSimilarity) continue;

      results.push({
        pattern,
        similarity,
        id,
      });

      if (results.length >= k) break;
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Query patterns by metadata
   */
  public queryByMetadata(metadata: Record<string, unknown>): ActionPattern[] {
    const results: ActionPattern[] = [];

    for (const pattern of this.patterns.values()) {
      if (!pattern.metadata) continue;

      let matches = true;
      for (const [key, value] of Object.entries(metadata)) {
        if (pattern.metadata[key] !== value) {
          matches = false;
          break;
        }
      }

      if (matches) {
        results.push(pattern);
      }
    }

    return results;
  }

  /**
   * Get top patterns by frequency
   */
  public getTopPatterns(limit: number = 10): PatternSummary[] {
    const patternCounts = new Map<string, { count: number; successes: number }>();

    for (const pattern of this.patterns.values()) {
      const key = `${pattern.action}:${pattern.selector || 'any'}`;
      const existing = patternCounts.get(key) || { count: 0, successes: 0 };

      patternCounts.set(key, {
        count: existing.count + 1,
        successes: existing.successes + (pattern.success ? 1 : 0),
      });
    }

    const summaries: PatternSummary[] = [];
    for (const [patternKey, stats] of patternCounts.entries()) {
      summaries.push({
        pattern: patternKey,
        count: stats.count,
        successRate: stats.count > 0 ? stats.successes / stats.count : 0,
      });
    }

    return summaries
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Save index and metadata to disk
   */
  public save(): void {
    const indexPath = path.join(this.dbPath, 'index.dat');
    const metadataPath = path.join(this.dbPath, 'metadata.json');

    // Save HNSW index
    this.index.writeIndex(indexPath);

    // Save metadata
    const metadata = {
      version: '1.0.0',
      dimensions: this.dimensions,
      nextId: this.nextId,
      patternsWithIds: Array.from(this.patterns.entries()),
      patterns: Array.from(this.patterns.values()), // Keep for backwards compat
      savedAt: new Date().toISOString(),
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Export training data as JSON
   */
  public exportTrainingData(): string {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      patterns: Array.from(this.patterns.values()),
      statistics: this.getStatistics(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import training data from JSON
   */
  public importTrainingData(json: string): void {
    try {
      const data = JSON.parse(json);

      if (!data.patterns || !Array.isArray(data.patterns)) {
        throw new Error('Invalid training data format');
      }

      for (const pattern of data.patterns) {
        this.storeAction(pattern);
      }
    } catch (error) {
      throw new Error(`Failed to import training data: ${error}`);
    }
  }

  /**
   * Get database statistics
   */
  public getStatistics(): Statistics {
    const actionTypes: Record<string, number> = {};
    let successCount = 0;

    for (const pattern of this.patterns.values()) {
      // Count action types
      actionTypes[pattern.action] = (actionTypes[pattern.action] || 0) + 1;

      // Count successes
      if (pattern.success) successCount++;
    }

    const averageEmbeddingTime = this.embeddingTimes.length > 0
      ? this.embeddingTimes.reduce((a, b) => a + b, 0) / this.embeddingTimes.length
      : 0;

    return {
      totalActions: this.patterns.size,
      successRate: this.patterns.size > 0 ? successCount / this.patterns.size : 0,
      actionTypes,
      averageEmbeddingTime,
    };
  }

  /**
   * Generate embedding vector from action pattern
   * Uses a simple but effective hashing approach for now
   * In production, this would use a proper embedding model
   */
  private generateEmbedding(pattern: ActionPattern): Float32Array {
    // Create a text representation of the pattern
    const text = [
      pattern.action || '',
      pattern.selector || '',
      pattern.value || '',
      pattern.url || '',
      JSON.stringify(pattern.metadata || {}),
    ].join(' ');

    // Use cryptographic hash for deterministic embeddings
    const hash = crypto.createHash('sha256').update(text).digest();

    // Expand hash to full dimension vector using deterministic random
    const vector = new Float32Array(this.dimensions);
    const seed = hash.readUInt32LE(0);

    // Simple LCG (Linear Congruential Generator) for deterministic random
    let rng = seed;
    for (let i = 0; i < this.dimensions; i++) {
      rng = (rng * 1664525 + 1013904223) >>> 0; // LCG formula
      vector[i] = (rng / 0xFFFFFFFF) * 2 - 1; // Normalize to [-1, 1]
    }

    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] /= magnitude;
      }
    }

    return vector;
  }
}
