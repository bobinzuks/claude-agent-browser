/**
 * Test Orchestrator - Parallel Test Execution Manager
 * Orchestrates parallel test execution across multiple agents
 * Phase 2: Test Orchestration
 */

import { EventEmitter } from 'events';
import { AgentCoordinator, AgentTask } from './agent-coordinator.js';
import { /* TestExecutionEngine, */ TestDefinition, ExecutionResult, ExecutionOptions } from '../testing/test-execution-engine.js';
import { PatternAnalyzer } from '../learning/pattern-analyzer.js';
import { SQLiteBackend } from '../database/sqlite-backend.js';

export interface TestSuite {
  id: string;
  name: string;
  tests: TestDefinition[];
  parallel?: boolean;
  maxConcurrency?: number;
  timeout?: number;
  retryOnFailure?: boolean;
  retryCount?: number;
  tags?: string[];
  priority?: number;
}

export interface OrchestrationConfig {
  maxParallelTests: number;
  defaultTimeout: number;
  retryFailedTests: boolean;
  maxRetries: number;
  resourceLimits: {
    maxBrowsers: number;
    maxMemoryPerTest: number;
    maxCPUPerTest: number;
  };
  scheduling: {
    algorithm: 'fifo' | 'priority' | 'load-balanced' | 'capability-based';
    rebalanceInterval: number;
  };
}

export interface TestExecutionPlan {
  suiteId: string;
  tests: Array<{
    testId: string;
    agentId: string;
    priority: number;
    dependencies: string[];
  }>;
  estimatedDuration: number;
  resourceRequirements: {
    agents: number;
    browsers: number;
    memory: number;
  };
}

export interface OrchestratorMetrics {
  totalSuites: number;
  totalTests: number;
  testsRunning: number;
  testsCompleted: number;
  testsFailed: number;
  averageExecutionTime: number;
  parallelizationEfficiency: number;
  resourceUtilization: {
    agents: number;
    browsers: number;
    memory: number;
    cpu: number;
  };
}

export interface AggregatedResults {
  suiteId: string;
  suiteName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  results: Array<{
    testName: string;
    agentId: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
    screenshots: string[];
    videoPath?: string;
  }>;
  analytics: {
    fastestTest: { name: string; duration: number };
    slowestTest: { name: string; duration: number };
    mostReliable: { name: string; successRate: number };
    leastReliable: { name: string; successRate: number };
  };
}

/**
 * Test Orchestrator
 * Coordinates parallel test execution across multiple agents
 */
export class TestOrchestrator extends EventEmitter {
  private coordinator: AgentCoordinator;
  private testSuites: Map<string, TestSuite> = new Map();
  private testExecutions: Map<string, Map<string, ExecutionResult>> = new Map();
  private executionPlans: Map<string, TestExecutionPlan> = new Map();
  private config: OrchestrationConfig;
  private db: SQLiteBackend;
  private patternAnalyzer: PatternAnalyzer;
  private activeExecutions: Set<string> = new Set();

  constructor(
    coordinator: AgentCoordinator,
    dbPath: string,
    agentDBPath: string,
    config?: Partial<OrchestrationConfig>
  ) {
    super();
    this.coordinator = coordinator;
    this.db = new SQLiteBackend(dbPath);
    this.patternAnalyzer = new PatternAnalyzer(agentDBPath, dbPath);

    // Default configuration
    this.config = {
      maxParallelTests: config?.maxParallelTests || 8,
      defaultTimeout: config?.defaultTimeout || 300000, // 5 minutes
      retryFailedTests: config?.retryFailedTests !== false,
      maxRetries: config?.maxRetries || 2,
      resourceLimits: {
        maxBrowsers: config?.resourceLimits?.maxBrowsers || 16,
        maxMemoryPerTest: config?.resourceLimits?.maxMemoryPerTest || 512, // MB
        maxCPUPerTest: config?.resourceLimits?.maxCPUPerTest || 50 // percentage
      },
      scheduling: {
        algorithm: config?.scheduling?.algorithm || 'capability-based',
        rebalanceInterval: config?.scheduling?.rebalanceInterval || 5000
      }
    };

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for coordinator events
   */
  private setupEventHandlers(): void {
    this.coordinator.on('task:completed', (task: AgentTask) => {
      this.handleTaskCompleted(task);
    });

    this.coordinator.on('task:failed', (task: AgentTask) => {
      this.handleTaskFailed(task);
    });

    this.coordinator.on('agent:offline', (agentId: string) => {
      this.handleAgentOffline(agentId);
    });
  }

  /**
   * Register a test suite
   */
  public registerSuite(suite: TestSuite): void {
    this.testSuites.set(suite.id, suite);
    this.emit('suite:registered', suite);
  }

  /**
   * Execute a test suite
   */
  public async executeSuite(
    suiteId: string,
    options?: ExecutionOptions
  ): Promise<AggregatedResults> {
    const suite = this.testSuites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteId}`);
    }

    this.activeExecutions.add(suiteId);
    const startTime = new Date();

    // Create execution plan
    const plan = this.createExecutionPlan(suite);
    this.executionPlans.set(suiteId, plan);

    // Initialize results map for this suite
    const resultsMap = new Map<string, ExecutionResult>();
    this.testExecutions.set(suiteId, resultsMap);

    this.emit('suite:started', { suite, plan });

    // Execute tests based on plan
    const testPromises = suite.tests.map(async (test, index) => {
      const testId = `${suiteId}-test-${index}`;

      // Create task for test execution
      const taskId = this.coordinator.createTask({
        type: 'test-execution',
        priority: suite.priority || plan.tests[index]?.priority || 5,
        payload: {
          test,
          options,
          suiteId,
          testId
        },
        dependencies: plan.tests[index]?.dependencies || []
      });

      // Wait for task completion
      return this.waitForTaskCompletion(taskId, suite.timeout || this.config.defaultTimeout);
    });

    // Wait for all tests to complete (parallel or sequential based on suite config)
    let results: ExecutionResult[];
    if (suite.parallel !== false) {
      // Parallel execution with concurrency limit
      results = await this.executeConcurrent(
        testPromises,
        suite.maxConcurrency || this.config.maxParallelTests
      );
    } else {
      // Sequential execution
      results = await this.executeSequential(testPromises);
    }

    const endTime = new Date();
    // const _duration = endTime.getTime() - startTime.getTime();

    // Store results
    results.forEach((result, index) => {
      resultsMap.set(`test-${index}`, result);
    });

    // Aggregate and analyze results
    const aggregatedResults = this.aggregateResults(suite, results, startTime, endTime);

    // Learn from execution
    this.learnFromExecution(suite, results);

    this.activeExecutions.delete(suiteId);
    this.emit('suite:completed', aggregatedResults);

    return aggregatedResults;
  }

  /**
   * Create execution plan for a test suite
   */
  private createExecutionPlan(suite: TestSuite): TestExecutionPlan {
    const agents = this.coordinator.getAgents().filter(a => a.status !== 'offline');
    const agentCount = agents.length;

    if (agentCount === 0) {
      throw new Error('No agents available for test execution');
    }

    // Estimate test distribution
    const tests = suite.tests.map((test, index) => {
      // Assign agent based on scheduling algorithm
      let agentId = agents[index % agentCount].id;

      if (this.config.scheduling.algorithm === 'capability-based') {
        // Find best agent based on test type
        const bestAgent = this.findBestAgentForTest(test, agents);
        if (bestAgent) {
          agentId = bestAgent.id;
        }
      }

      return {
        testId: `${suite.id}-test-${index}`,
        agentId,
        priority: suite.priority || 5,
        dependencies: []
      };
    });

    // Estimate duration based on historical data
    const avgDuration = this.estimateAverageDuration(suite);
    const parallelism = suite.parallel !== false ?
      Math.min(suite.maxConcurrency || this.config.maxParallelTests, agentCount) : 1;
    const estimatedDuration = (suite.tests.length / parallelism) * avgDuration;

    return {
      suiteId: suite.id,
      tests,
      estimatedDuration,
      resourceRequirements: {
        agents: Math.min(suite.tests.length, parallelism),
        browsers: Math.min(suite.tests.length, this.config.resourceLimits.maxBrowsers),
        memory: suite.tests.length * this.config.resourceLimits.maxMemoryPerTest
      }
    };
  }

  /**
   * Find best agent for a test based on capabilities
   */
  private findBestAgentForTest(_test: TestDefinition, agents: any[]): any {
    // Simple heuristic: choose agent with least load
    return agents.reduce((best, agent) => {
      const bestLoad = best.tasksAssigned - best.tasksCompleted;
      const agentLoad = agent.tasksAssigned - agent.tasksCompleted;
      return agentLoad < bestLoad ? agent : best;
    });
  }

  /**
   * Estimate average test duration
   */
  private estimateAverageDuration(_suite: TestSuite): number {
    const stats = this.db.getStats();
    return stats.averageDuration || 5000; // Default to 5 seconds
  }

  /**
   * Execute promises with concurrency limit
   */
  private async executeConcurrent<T>(
    promises: Promise<T>[],
    limit: number
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const promise of promises) {
      const p = promise.then(result => {
        results.push(result);
      });

      executing.push(p);

      if (executing.length >= limit) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex(e => e === p),
          1
        );
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * Execute promises sequentially
   */
  private async executeSequential<T>(promises: Promise<T>[]): Promise<T[]> {
    const results: T[] = [];
    for (const promise of promises) {
      results.push(await promise);
    }
    return results;
  }

  /**
   * Wait for task completion with timeout
   */
  private async waitForTaskCompletion(taskId: string, timeout: number): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Task ${taskId} timed out after ${timeout}ms`));
      }, timeout);

      const checkCompletion = () => {
        const task = this.coordinator.getTask(taskId);
        if (!task) {
          clearTimeout(timeoutId);
          reject(new Error(`Task ${taskId} not found`));
          return;
        }

        if (task.status === 'completed') {
          clearTimeout(timeoutId);
          resolve(task.result as ExecutionResult);
        } else if (task.status === 'failed') {
          clearTimeout(timeoutId);
          reject(new Error(task.error || 'Task failed'));
        } else {
          setTimeout(checkCompletion, 100);
        }
      };

      checkCompletion();
    });
  }

  /**
   * Handle task completion
   */
  private handleTaskCompleted(task: AgentTask): void {
    if (task.type !== 'test-execution') return;

    const { suiteId, testId } = task.payload;
    const resultsMap = this.testExecutions.get(suiteId);

    if (resultsMap && task.result) {
      resultsMap.set(testId, task.result);
    }

    this.emit('test:completed', { task, result: task.result });
  }

  /**
   * Handle task failure
   */
  private handleTaskFailed(task: AgentTask): void {
    if (task.type !== 'test-execution') return;

    const { suiteId: _suiteId, testId: _testId, test: _test } = task.payload;

    // Retry if configured
    if (this.config.retryFailedTests) {
      const retryCount = (task.payload.retryCount || 0) + 1;

      if (retryCount <= this.config.maxRetries) {
        // Create retry task
        this.coordinator.createTask({
          type: 'test-execution',
          priority: task.priority + 1, // Higher priority for retries
          payload: {
            ...task.payload,
            retryCount
          }
        });

        this.emit('test:retrying', { task, retryCount });
        return;
      }
    }

    this.emit('test:failed', { task, error: task.error });
  }

  /**
   * Handle agent going offline
   */
  private handleAgentOffline(agentId: string): void {
    // Tasks are automatically reassigned by AgentCoordinator
    this.emit('agent:offline', agentId);
  }

  /**
   * Aggregate test results
   */
  private aggregateResults(
    suite: TestSuite,
    results: ExecutionResult[],
    startTime: Date,
    endTime: Date
  ): AggregatedResults {
    const duration = endTime.getTime() - startTime.getTime();

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const skipped = suite.tests.length - results.length;

    const passRate = suite.tests.length > 0 ? (passed / suite.tests.length) * 100 : 0;

    // Find extremes
    const sortedByDuration = [...results].sort((a, b) => a.duration - b.duration);
    const fastestTest = sortedByDuration[0];
    const slowestTest = sortedByDuration[sortedByDuration.length - 1];

    // Calculate reliability from historical data
    const testReliability = suite.tests.map((test, _index) => {
      const history = this.db.getRecentExecutions(100)
        .filter(e => e.testName === test.name);

      const testPassed = history.filter(e => e.status === 'passed').length;
      const successRate = history.length > 0 ? testPassed / history.length : 0;

      return { name: test.name, successRate };
    });

    const mostReliable = testReliability.reduce((a, b) =>
      a.successRate > b.successRate ? a : b, testReliability[0]
    );

    const leastReliable = testReliability.reduce((a, b) =>
      a.successRate < b.successRate ? a : b, testReliability[0]
    );

    return {
      suiteId: suite.id,
      suiteName: suite.name,
      startTime,
      endTime,
      duration,
      totalTests: suite.tests.length,
      passed,
      failed,
      skipped,
      passRate,
      results: results.map((result, index) => ({
        testName: suite.tests[index].name,
        agentId: 'unknown', // Would be set from task
        status: result.success ? 'passed' : 'failed',
        duration: result.duration,
        error: result.error,
        screenshots: result.screenshots,
        videoPath: result.videoPath
      })),
      analytics: {
        fastestTest: { name: suite.tests[0].name, duration: fastestTest?.duration || 0 },
        slowestTest: { name: suite.tests[0].name, duration: slowestTest?.duration || 0 },
        mostReliable: mostReliable || { name: 'unknown', successRate: 0 },
        leastReliable: leastReliable || { name: 'unknown', successRate: 0 }
      }
    };
  }

  /**
   * Learn from test execution
   */
  private learnFromExecution(suite: TestSuite, results: ExecutionResult[]): void {
    // Update pattern analyzer with new execution data
    suite.tests.forEach((test, index) => {
      const result = results[index];
      if (result) {
        this.patternAnalyzer.updatePatternSuccessRates(test.name);
      }
    });

    // Share successful patterns with coordinator
    const successfulPatterns = results
      .filter(r => r.success)
      .map(r => ({
        type: 'pattern' as const,
        content: r.steps,
        confidence: 0.8,
        successRate: 1.0,
        contributedBy: 'orchestrator'
      }));

    successfulPatterns.forEach(pattern => {
      this.coordinator.shareKnowledge(pattern);
    });
  }

  /**
   * Get orchestrator metrics
   */
  public getMetrics(): OrchestratorMetrics {
    const coordinatorMetrics = this.coordinator.getMetrics();
    const dbStats = this.db.getStats();

    const totalTests = Array.from(this.testSuites.values())
      .reduce((sum, suite) => sum + suite.tests.length, 0);

    return {
      totalSuites: this.testSuites.size,
      totalTests,
      testsRunning: this.activeExecutions.size,
      testsCompleted: dbStats.totalExecutions,
      testsFailed: Math.round(dbStats.totalExecutions * (1 - dbStats.successRate)),
      averageExecutionTime: dbStats.averageDuration,
      parallelizationEfficiency: this.calculateParallelizationEfficiency(),
      resourceUtilization: {
        agents: coordinatorMetrics.systemUtilization,
        browsers: (coordinatorMetrics.activeAgents / this.config.resourceLimits.maxBrowsers) * 100,
        memory: 0, // Would be measured from actual system
        cpu: 0 // Would be measured from actual system
      }
    };
  }

  /**
   * Calculate parallelization efficiency
   */
  private calculateParallelizationEfficiency(): number {
    const metrics = this.coordinator.getMetrics();
    if (metrics.totalAgents === 0) return 0;

    // Efficiency = (active agents / total agents) * 100
    return (metrics.activeAgents / metrics.totalAgents) * 100;
  }

  /**
   * Get suite results
   */
  public getSuiteResults(suiteId: string): AggregatedResults | null {
    const suite = this.testSuites.get(suiteId);
    const resultsMap = this.testExecutions.get(suiteId);

    if (!suite || !resultsMap) return null;

    const results = Array.from(resultsMap.values());
    return this.aggregateResults(suite, results, new Date(), new Date());
  }

  /**
   * Cancel suite execution
   */
  public cancelSuite(suiteId: string): void {
    if (!this.activeExecutions.has(suiteId)) return;

    // Cancel all pending tasks for this suite
    const tasks = this.coordinator.getTasks({ status: 'pending' });
    tasks.forEach(task => {
      if (task.payload?.suiteId === suiteId) {
        this.coordinator.failTask(task.id, 'Suite cancelled');
      }
    });

    this.activeExecutions.delete(suiteId);
    this.emit('suite:cancelled', suiteId);
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.testSuites.clear();
    this.testExecutions.clear();
    this.executionPlans.clear();
    this.activeExecutions.clear();
    this.patternAnalyzer.cleanup();
    this.db.close();
  }
}
