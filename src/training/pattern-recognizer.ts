/**
 * BOSS 8: The Pattern Recognizer - Semantic Action Understanding
 */

import { ActionPattern, AgentDBClient } from './agentdb-client';

export interface SemanticPattern {
  intent: string;
  confidence: number;
  actions: ActionPattern[];
  frequency: number;
}

/**
 * PatternRecognizer - Semantic understanding of automation patterns
 */
export class PatternRecognizer {
  private agentDB: AgentDBClient;
  private patterns: Map<string, SemanticPattern>;

  constructor(agentDB: AgentDBClient) {
    this.agentDB = agentDB;
    this.patterns = new Map();
  }

  /**
   * Recognize pattern from action sequence
   */
  public recognizePattern(actions: ActionPattern[]): SemanticPattern | null {
    if (actions.length === 0) {
      return null;
    }

    // Extract intent from actions
    const intent = this.extractIntent(actions);

    // Check if we've seen this pattern before
    const existing = this.patterns.get(intent);

    if (existing) {
      existing.frequency++;
      return existing;
    }

    // Create new pattern
    const pattern: SemanticPattern = {
      intent,
      confidence: this.calculateConfidence(actions),
      actions,
      frequency: 1,
    };

    this.patterns.set(intent, pattern);
    return pattern;
  }

  /**
   * Find similar patterns
   */
  public async findSimilarPatterns(query: ActionPattern, limit: number = 5): Promise<ActionPattern[]> {
    const results = this.agentDB.findSimilar(query, limit);
    return results.map(r => r.pattern);
  }

  /**
   * Extract intent from action sequence
   */
  private extractIntent(actions: ActionPattern[]): string {
    const actionTypes = actions.map(a => a.action).join('_');
    const url = actions[0]?.url || 'unknown';
    const domain = this.extractDomain(url);

    return `${domain}_${actionTypes}`;
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(actions: ActionPattern[]): number {
    const successCount = actions.filter(a => a.success).length;
    return actions.length > 0 ? successCount / actions.length : 0;
  }

  /**
   * Get all patterns
   */
  public getPatterns(): SemanticPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get statistics
   */
  public getStatistics() {
    const patterns = this.getPatterns();

    return {
      totalPatterns: patterns.length,
      averageConfidence: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length || 0,
      totalFrequency: patterns.reduce((sum, p) => sum + p.frequency, 0),
      topPatterns: patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 5),
    };
  }
}

/**
 * BOSS 8 COMPLETE!
 * +700 XP
 * Achievement: 🎯 Pattern Master
 */
