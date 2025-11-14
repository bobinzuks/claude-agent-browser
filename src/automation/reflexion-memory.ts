/**
 * 🧠 Reflexion Memory - Phase 3
 * Self-critique and learning from failures
 * Inspired by Reflexion paper: https://arxiv.org/abs/2303.11366
 */

import { AgentDBClient } from '../training/agentdb-client.js';

export interface AttemptRecord {
  sessionId: string;
  action: string;
  selector: string;
  url: string;
  success: boolean;
  attempts: number;
  duration: number;
  errorMessage?: string;
  timestamp: string;
}

export interface Reflection {
  reasoning: string;
  mistakes: string[];
  improvements: string[];
  reward: number; // -1 to 1
  confidence: number; // 0 to 1
}

/**
 * Reflexion Memory System
 */
export class ReflexionMemory {
  private db: AgentDBClient;
  private sessionHistory = new Map<string, AttemptRecord[]>();

  constructor(dbPath: string) {
    this.db = new AgentDBClient(dbPath, 384);
  }

  /**
   * Record attempt with self-reflection
   */
  async recordAttempt(record: AttemptRecord): Promise<void> {
    // Generate reflection
    const reflection = this.generateReflection(record);
    const reward = this.calculateReward(record);

    // Store in AgentDB with reflection
    this.db.storeAction({
      action: record.action,
      selector: record.selector,
      url: record.url,
      success: record.success,
      timestamp: record.timestamp,
      metadata: {
        sessionId: record.sessionId,
        attempts: record.attempts,
        duration: record.duration,
        errorMessage: record.errorMessage,
        reflection: reflection.reasoning,
        mistakes: reflection.mistakes,
        improvements: reflection.improvements,
        reward,
        confidence: reflection.confidence,
        source: 'reflexion-memory',
      },
    });

    // Update session history
    const history = this.sessionHistory.get(record.sessionId) || [];
    history.push(record);
    this.sessionHistory.set(record.sessionId, history);
  }

  /**
   * Generate self-reflection on attempt
   */
  private generateReflection(record: AttemptRecord): Reflection {
    const mistakes: string[] = [];
    const improvements: string[] = [];
    let reasoning: string;
    let confidence: number;

    if (record.success) {
      // Success - reflect on efficiency
      if (record.attempts === 1) {
        reasoning = `✓ Succeeded immediately with selector: ${record.selector}. This is a reliable pattern.`;
        confidence = 0.95;
      } else if (record.attempts <= 3) {
        reasoning = `✓ Succeeded after ${record.attempts} attempts. Selector strategy could be improved.`;
        mistakes.push(`Initial selector failed: ${record.selector}`);
        improvements.push(`Update primary selector strategy to use working selector first`);
        confidence = 0.75;
      } else {
        reasoning = `✓ Eventually succeeded after ${record.attempts} attempts. Significant improvement needed.`;
        mistakes.push(`Too many failed attempts before success`);
        improvements.push(`Add more fallback strategies`);
        improvements.push(`Improve selector robustness`);
        confidence = 0.5;
      }

      // Check duration
      if (record.duration > 10000) {
        mistakes.push(`Took ${(record.duration / 1000).toFixed(1)}s - too slow`);
        improvements.push(`Optimize selector strategy priority`);
        improvements.push(`Add timeout handling`);
      }
    } else {
      // Failure - reflect on root cause
      reasoning = `✗ Failed after ${record.attempts} attempts. Error: ${record.errorMessage || 'Unknown'}`;
      confidence = 0.1;

      // Analyze error message
      if (record.errorMessage?.includes('timeout')) {
        mistakes.push(`Element not found within timeout`);
        improvements.push(`Increase wait time for dynamic elements`);
        improvements.push(`Check if element loads asynchronously`);
      } else if (record.errorMessage?.includes('not visible')) {
        mistakes.push(`Element exists but not visible`);
        improvements.push(`Scroll element into view before interaction`);
        improvements.push(`Wait for element to become visible`);
      } else if (record.errorMessage?.includes('detached')) {
        mistakes.push(`Element was removed from DOM`);
        improvements.push(`Page structure is unstable - use more stable selectors`);
        improvements.push(`Add retry logic for detached elements`);
      } else if (record.errorMessage?.includes('not found')) {
        mistakes.push(`Selector did not match any element`);
        improvements.push(`Use more robust selector strategy`);
        improvements.push(`Check if page structure changed`);
        improvements.push(`Try alternative selectors from AgentDB`);
      } else {
        mistakes.push(`Unknown failure reason`);
        improvements.push(`Add better error handling`);
        improvements.push(`Log more diagnostic information`);
      }
    }

    return {
      reasoning,
      mistakes,
      improvements,
      reward: this.calculateReward(record),
      confidence,
    };
  }

  /**
   * Calculate reward score (-1 to 1)
   */
  private calculateReward(record: AttemptRecord): number {
    if (!record.success) {
      return -1; // Maximum penalty for failure
    }

    // Success - reward based on efficiency
    const attemptPenalty = Math.min(record.attempts - 1, 5) * 0.15; // Max -0.75
    const durationPenalty = Math.min(record.duration / 10000, 1) * 0.25; // Max -0.25

    return Math.max(1 - attemptPenalty - durationPenalty, 0);
  }

  /**
   * Get reflection for similar patterns
   */
  async getSimilarReflections(action: string, selector: string, url: string, k: number = 5) {
    const similar = this.db.findSimilar({
      action,
      selector,
      url,
      success: true, // Only get successful attempts
    }, k, { successOnly: true });

    return similar.map(s => ({
      pattern: s.pattern,
      similarity: s.similarity,
      reflection: s.pattern.metadata?.reflection,
      improvements: s.pattern.metadata?.improvements,
      reward: s.pattern.metadata?.reward,
    }));
  }

  /**
   * Get session summary with reflections
   */
  getSessionSummary(sessionId: string) {
    const history = this.sessionHistory.get(sessionId) || [];

    if (history.length === 0) {
      return {
        sessionId,
        attempts: 0,
        successes: 0,
        failures: 0,
        avgReward: 0,
        reflections: [],
      };
    }

    const successes = history.filter(h => h.success).length;
    const failures = history.length - successes;
    const avgReward = history.reduce((sum, h) => sum + this.calculateReward(h), 0) / history.length;

    const reflections = history.map(h => this.generateReflection(h));

    return {
      sessionId,
      attempts: history.length,
      successes,
      failures,
      successRate: successes / history.length,
      avgReward,
      reflections,
      topMistakes: this.aggregateMistakes(reflections),
      topImprovements: this.aggregateImprovements(reflections),
    };
  }

  /**
   * Aggregate common mistakes
   */
  private aggregateMistakes(reflections: Reflection[]): Array<{ mistake: string; count: number }> {
    const mistakeCounts = new Map<string, number>();

    for (const reflection of reflections) {
      for (const mistake of reflection.mistakes) {
        mistakeCounts.set(mistake, (mistakeCounts.get(mistake) || 0) + 1);
      }
    }

    return Array.from(mistakeCounts.entries())
      .map(([mistake, count]) => ({ mistake, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Aggregate common improvements
   */
  private aggregateImprovements(reflections: Reflection[]): Array<{ improvement: string; count: number }> {
    const improvementCounts = new Map<string, number>();

    for (const reflection of reflections) {
      for (const improvement of reflection.improvements) {
        improvementCounts.set(improvement, (improvementCounts.get(improvement) || 0) + 1);
      }
    }

    return Array.from(improvementCounts.entries())
      .map(([improvement, count]) => ({ improvement, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Clear session history
   */
  clearSession(sessionId: string): void {
    this.sessionHistory.delete(sessionId);
  }
}
