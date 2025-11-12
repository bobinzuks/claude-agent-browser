/**
 * Pattern Analyzer - Learning System Core
 * Analyzes test execution patterns and predicts failures
 */

import { AgentDBClient, ActionPattern, SearchResult } from '../training/agentdb-client.js';
import { SQLiteBackend, TestExecution, TestResult } from '../database/sqlite-backend.js';

export interface PatternAnalysis {
  commonPatterns: PatternSummary[];
  failurePatterns: PatternSummary[];
  successPatterns: PatternSummary[];
  recommendations: string[];
}

export interface PatternSummary {
  pattern: string;
  selector?: string;
  action: string;
  frequency: number;
  successRate: number;
  averageDuration: number;
  examples: ActionPattern[];
}

export interface FailurePrediction {
  testName: string;
  step: string;
  likelihood: number;
  reasoning: string;
  suggestions: string[];
}

export interface AdaptiveTestSuggestion {
  testName: string;
  url: string;
  steps: Array<{
    action: string;
    selector: string;
    value?: string;
    confidence: number;
  }>;
  confidence: number;
  source: 'learned' | 'similar' | 'generated';
}

/**
 * Pattern Analyzer
 * Analyzes test execution history to learn patterns and predict failures
 */
export class PatternAnalyzer {
  private agentDB: AgentDBClient;
  private sqliteDB: SQLiteBackend;

  constructor(agentDBPath: string, sqliteDBPath: string) {
    this.agentDB = new AgentDBClient(agentDBPath);
    this.sqliteDB = new SQLiteBackend(sqliteDBPath);
  }

  /**
   * Analyze patterns across all test executions
   */
  public analyzePatterns(): PatternAnalysis {
    // const _stats = this.agentDB.getStatistics();
    // const _topPatterns = this.agentDB.getTopPatterns(20);

    // Separate success and failure patterns
    const successPatterns: PatternSummary[] = [];
    const failurePatterns: PatternSummary[] = [];
    const commonPatterns: PatternSummary[] = [];

    // Get all patterns and group by action type
    const patternGroups = new Map<string, ActionPattern[]>();
    const allExecutions = this.sqliteDB.getRecentExecutions(500);

    for (const execution of allExecutions) {
      const results = this.sqliteDB.getResults(execution.id!);

      for (const result of results) {
        const key = `${result.action}:${result.selector || 'any'}`;
        if (!patternGroups.has(key)) {
          patternGroups.set(key, []);
        }

        patternGroups.get(key)!.push({
          action: result.action,
          selector: result.selector,
          value: result.value,
          url: execution.url,
          success: result.success,
          timestamp: result.timestamp
        });
      }
    }

    // Analyze each pattern group
    for (const [key, patterns] of patternGroups.entries()) {
      const successCount = patterns.filter(p => p.success).length;
      const successRate = successCount / patterns.length;
      const avgDuration = patterns.reduce((sum, _p) => sum, 0) / patterns.length;

      const summary: PatternSummary = {
        pattern: key,
        selector: patterns[0].selector,
        action: patterns[0].action,
        frequency: patterns.length,
        successRate,
        averageDuration: avgDuration,
        examples: patterns.slice(0, 3)
      };

      if (patterns.length >= 3) {
        commonPatterns.push(summary);
      }

      if (successRate >= 0.8) {
        successPatterns.push(summary);
      } else if (successRate < 0.5) {
        failurePatterns.push(summary);
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      commonPatterns,
      failurePatterns,
      successPatterns
    );

    return {
      commonPatterns: commonPatterns
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10),
      failurePatterns: failurePatterns
        .sort((a, b) => a.successRate - b.successRate)
        .slice(0, 10),
      successPatterns: successPatterns
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 10),
      recommendations
    };
  }

  /**
   * Generate recommendations based on pattern analysis
   */
  private generateRecommendations(
    _commonPatterns: PatternSummary[],
    failurePatterns: PatternSummary[],
    successPatterns: PatternSummary[]
  ): string[] {
    const recommendations: string[] = [];

    // Recommend replacing failing patterns
    for (const failPattern of failurePatterns.slice(0, 3)) {
      const similar = successPatterns.find(
        s => s.action === failPattern.action
      );

      if (similar) {
        recommendations.push(
          `Replace selector "${failPattern.selector}" with "${similar.selector}" ` +
          `for ${failPattern.action} actions (improves success rate from ` +
          `${(failPattern.successRate * 100).toFixed(0)}% to ${(similar.successRate * 100).toFixed(0)}%)`
        );
      }
    }

    // Recommend adding wait times for fast-failing patterns
    for (const pattern of failurePatterns) {
      if (pattern.averageDuration < 1000) {
        recommendations.push(
          `Add wait time before "${pattern.action}" on "${pattern.selector}" ` +
          `(currently fails quickly at ${pattern.averageDuration}ms)`
        );
      }
    }

    // Recommend using proven patterns
    if (successPatterns.length > 0) {
      const topSuccess = successPatterns[0];
      recommendations.push(
        `Use proven pattern: ${topSuccess.action} on "${topSuccess.selector}" ` +
        `(${(topSuccess.successRate * 100).toFixed(0)}% success rate, used ${topSuccess.frequency} times)`
      );
    }

    // Recommend avoiding problematic selectors
    const problematicSelectors = failurePatterns
      .filter(p => p.frequency >= 3)
      .map(p => p.selector)
      .filter((s): s is string => s !== undefined);

    if (problematicSelectors.length > 0) {
      recommendations.push(
        `Avoid these unreliable selectors: ${problematicSelectors.slice(0, 3).join(', ')}`
      );
    }

    return recommendations;
  }

  /**
   * Predict failure likelihood for a test
   */
  public predictFailure(testName: string): FailurePrediction[] {
    const history = this.sqliteDB.getRecentExecutions(100)
      .filter(e => e.testName === testName);

    if (history.length < 3) {
      return [];
    }

    const predictions: FailurePrediction[] = [];

    // Analyze each test's results
    const stepFailures = new Map<string, { count: number; total: number }>();

    for (const execution of history) {
      const results = this.sqliteDB.getResults(execution.id!);

      for (const result of results) {
        const key = result.stepName;
        const stats = stepFailures.get(key) || { count: 0, total: 0 };

        stats.total++;
        if (!result.success) {
          stats.count++;
        }

        stepFailures.set(key, stats);
      }
    }

    // Generate predictions for steps with high failure rates
    for (const [stepName, stats] of stepFailures.entries()) {
      if (stats.total >= 3) {
        const failureRate = stats.count / stats.total;

        if (failureRate > 0.3) {
          // Find similar successful patterns
          const suggestions: string[] = [];
          const similarPatterns = this.agentDB.getTopPatterns(10)
            .filter(p => p.successRate > 0.8);

          if (similarPatterns.length > 0) {
            suggestions.push(
              `Try using selector patterns: ${similarPatterns.slice(0, 2).map(p => p.pattern).join(', ')}`
            );
          }

          suggestions.push('Add explicit wait conditions before this step');
          suggestions.push('Increase timeout for this action');

          predictions.push({
            testName,
            step: stepName,
            likelihood: failureRate,
            reasoning: `This step has failed ${stats.count} out of ${stats.total} times (${(failureRate * 100).toFixed(0)}%)`,
            suggestions
          });
        }
      }
    }

    return predictions.sort((a, b) => b.likelihood - a.likelihood);
  }

  /**
   * Generate adaptive test suggestions based on learned patterns
   */
  public generateAdaptiveTest(baseUrl: string, testGoal: string): AdaptiveTestSuggestion {
    // Find similar patterns in the database
    const queryPattern: ActionPattern = {
      action: 'navigate',
      url: baseUrl,
      success: true
    };

    const similarPatterns = this.agentDB.findSimilar(queryPattern, 10, {
      successOnly: true,
      minSimilarity: 0.6
    });

    if (similarPatterns.length === 0) {
      // No learned patterns, return basic test structure
      return {
        testName: `Generated test for ${baseUrl}`,
        url: baseUrl,
        steps: [
          {
            action: 'navigate',
            selector: '',
            value: baseUrl,
            confidence: 0.5
          }
        ],
        confidence: 0.3,
        source: 'generated'
      };
    }

    // Build test from learned patterns
    const steps: AdaptiveTestSuggestion['steps'] = [];
    const uniqueActions = new Map<string, SearchResult>();

    // Deduplicate and select best patterns
    for (const result of similarPatterns) {
      const key = `${result.pattern.action}:${result.pattern.selector}`;
      const existing = uniqueActions.get(key);

      if (!existing || result.similarity > existing.similarity) {
        uniqueActions.set(key, result);
      }
    }

    // Convert to test steps
    for (const result of uniqueActions.values()) {
      steps.push({
        action: result.pattern.action,
        selector: result.pattern.selector || '',
        value: result.pattern.value,
        confidence: result.similarity
      });
    }

    // Calculate overall confidence
    const avgConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;

    return {
      testName: `Adaptive test: ${testGoal}`,
      url: baseUrl,
      steps,
      confidence: avgConfidence,
      source: similarPatterns.length > 3 ? 'learned' : 'similar'
    };
  }

  /**
   * Calculate reinforcement learning reward
   */
  public calculateReward(execution: TestExecution, results: TestResult[]): number {
    let reward = 0;

    // Base reward for completion
    if (execution.status === 'passed') {
      reward += 100;
    }

    // Bonus for speed (faster is better)
    const avgDuration = this.sqliteDB.getStats().averageDuration;
    if (execution.duration && avgDuration > 0) {
      const speedFactor = avgDuration / execution.duration;
      reward += Math.min(50, speedFactor * 25);
    }

    // Penalty for failures
    const failedSteps = results.filter(r => !r.success).length;
    reward -= failedSteps * 20;

    // Bonus for using learned patterns
    const learnedPatterns = results.filter(r => {
      const similar = this.agentDB.findSimilar({
        action: r.action,
        selector: r.selector,
        success: true
      }, 1, { minSimilarity: 0.9 });

      return similar.length > 0;
    });

    reward += learnedPatterns.length * 10;

    return Math.max(0, reward);
  }

  /**
   * Update pattern success rates based on execution
   */
  public updatePatternSuccessRates(testName: string): void {
    const executions = this.sqliteDB.getRecentExecutions(100)
      .filter(e => e.testName === testName);

    for (const execution of executions) {
      const results = this.sqliteDB.getResults(execution.id!);

      for (const result of results) {
        // Store pattern with updated success rate
        this.sqliteDB.storePattern({
          patternType: 'action',
          testName,
          url: execution.url,
          selector: result.selector || '',
          action: result.action,
          successRate: result.success ? 1.0 : 0.0,
          usageCount: 1,
          lastUsed: result.timestamp
        });
      }
    }
  }

  /**
   * Get learning progress metrics
   */
  public getLearningMetrics() {
    const dbStats = this.sqliteDB.getStats();
    const agentStats = this.agentDB.getStatistics();
    const analysis = this.analyzePatterns();

    return {
      totalTests: dbStats.totalExecutions,
      successRate: dbStats.successRate,
      patternsLearned: agentStats.totalActions,
      commonPatterns: analysis.commonPatterns.length,
      failurePatterns: analysis.failurePatterns.length,
      successPatterns: analysis.successPatterns.length,
      recommendations: analysis.recommendations.length,
      improvementPotential: this.calculateImprovementPotential(analysis)
    };
  }

  /**
   * Calculate improvement potential based on patterns
   */
  private calculateImprovementPotential(analysis: PatternAnalysis): number {
    if (analysis.commonPatterns.length === 0) {
      return 0;
    }

    // Calculate average success rate of common patterns
    const avgSuccessRate = analysis.commonPatterns
      .reduce((sum, p) => sum + p.successRate, 0) / analysis.commonPatterns.length;

    // Improvement potential is the gap to 100% success
    return (1 - avgSuccessRate) * 100;
  }

  /**
   * Export learning data
   */
  public exportLearningData(): string {
    const analysis = this.analyzePatterns();
    const metrics = this.getLearningMetrics();

    return JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      metrics,
      analysis,
      rawData: {
        patterns: this.agentDB.exportTrainingData(),
        executions: this.sqliteDB.exportToJSON()
      }
    }, null, 2);
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.agentDB.save();
    this.sqliteDB.close();
  }
}
