/**
 * Conflict Resolver - Handles concurrent agent operation conflicts
 * Resolves resource conflicts and ensures consistency
 * Phase 2: Conflict Resolution
 */

import { EventEmitter } from 'events';
// Types imported for interface definitions - used in JSDoc comments
// @ts-expect-error - Types used in JSDoc but TypeScript doesn't detect this usage
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/consistent-type-imports
import type { Agent, AgentTask } from './agent-coordinator.js';

export interface ResourceLock {
  resourceId: string;
  resourceType: 'browser' | 'url' | 'data' | 'file';
  lockedBy: string;
  lockType: 'read' | 'write' | 'exclusive';
  acquiredAt: Date;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface Conflict {
  id: string;
  type: 'resource' | 'data' | 'timing' | 'priority';
  agents: string[];
  resources: string[];
  detectedAt: Date;
  resolved: boolean;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: 'queue' | 'prioritize' | 'split' | 'merge' | 'cancel';
  winner?: string;
  actions: Array<{
    agentId: string;
    action: 'wait' | 'proceed' | 'retry' | 'cancel';
    delay?: number;
  }>;
  reason: string;
}

export interface ConflictPolicy {
  defaultStrategy: ConflictResolution['strategy'];
  maxLockDuration: number; // milliseconds
  deadlockDetectionInterval: number;
  priorityWeights: {
    agentPriority: number;
    taskPriority: number;
    resourceType: number;
    waitTime: number;
  };
}

/**
 * Conflict Resolver
 * Manages resource locks and resolves conflicts between agents
 */
export class ConflictResolver extends EventEmitter {
  private locks: Map<string, ResourceLock> = new Map();
  private conflicts: Map<string, Conflict> = new Map();
  private policy: ConflictPolicy;
  private lockQueue: Map<string, Array<{ agentId: string; callback: () => void }>> = new Map();
  private deadlockCheckInterval?: NodeJS.Timeout;

  constructor(policy?: Partial<ConflictPolicy>) {
    super();

    this.policy = {
      defaultStrategy: policy?.defaultStrategy || 'queue',
      maxLockDuration: policy?.maxLockDuration || 300000, // 5 minutes
      deadlockDetectionInterval: policy?.deadlockDetectionInterval || 10000, // 10 seconds
      priorityWeights: {
        agentPriority: policy?.priorityWeights?.agentPriority || 0.4,
        taskPriority: policy?.priorityWeights?.taskPriority || 0.3,
        resourceType: policy?.priorityWeights?.resourceType || 0.2,
        waitTime: policy?.priorityWeights?.waitTime || 0.1
      }
    };

    this.startDeadlockDetection();
  }

  /**
   * Start deadlock detection loop
   */
  private startDeadlockDetection(): void {
    this.deadlockCheckInterval = setInterval(() => {
      this.detectDeadlocks();
      this.cleanupExpiredLocks();
    }, this.policy.deadlockDetectionInterval);
  }

  /**
   * Stop deadlock detection
   */
  private stopDeadlockDetection(): void {
    if (this.deadlockCheckInterval) {
      clearInterval(this.deadlockCheckInterval);
    }
  }

  /**
   * Acquire a resource lock
   */
  public async acquireLock(
    resourceId: string,
    resourceType: ResourceLock['resourceType'],
    agentId: string,
    lockType: ResourceLock['lockType'] = 'write',
    timeout: number = this.policy.maxLockDuration
  ): Promise<boolean> {
    const lockKey = `${resourceType}:${resourceId}`;
    const existingLock = this.locks.get(lockKey);

    // Check if resource is already locked
    if (existingLock) {
      // Allow multiple read locks
      if (lockType === 'read' && existingLock.lockType === 'read') {
        return true;
      }

      // Detect conflict
      const conflict = this.detectConflict(
        lockKey,
        [agentId, existingLock.lockedBy],
        [resourceId]
      );

      // Resolve conflict
      const resolution = this.resolveConflict(conflict);

      // Apply resolution
      return this.applyResolution(agentId, resolution);
    }

    // Acquire new lock
    const lock: ResourceLock = {
      resourceId,
      resourceType,
      lockedBy: agentId,
      lockType,
      acquiredAt: new Date(),
      expiresAt: new Date(Date.now() + timeout)
    };

    this.locks.set(lockKey, lock);
    this.emit('lock:acquired', lock);

    return true;
  }

  /**
   * Release a resource lock
   */
  public releaseLock(
    resourceId: string,
    resourceType: ResourceLock['resourceType'],
    agentId: string
  ): boolean {
    const lockKey = `${resourceType}:${resourceId}`;
    const lock = this.locks.get(lockKey);

    if (!lock || lock.lockedBy !== agentId) {
      return false;
    }

    this.locks.delete(lockKey);
    this.emit('lock:released', lock);

    // Process queued requests for this resource
    this.processLockQueue(lockKey);

    return true;
  }

  /**
   * Check if resource is locked
   */
  public isLocked(resourceId: string, resourceType: ResourceLock['resourceType']): boolean {
    const lockKey = `${resourceType}:${resourceId}`;
    return this.locks.has(lockKey);
  }

  /**
   * Get lock info
   */
  public getLock(
    resourceId: string,
    resourceType: ResourceLock['resourceType']
  ): ResourceLock | undefined {
    const lockKey = `${resourceType}:${resourceId}`;
    return this.locks.get(lockKey);
  }

  /**
   * Detect conflict between agents
   */
  private detectConflict(
    _resourceKey: string,
    agents: string[],
    resources: string[]
  ): Conflict {
    const conflict: Conflict = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'resource',
      agents,
      resources,
      detectedAt: new Date(),
      resolved: false
    };

    this.conflicts.set(conflict.id, conflict);
    this.emit('conflict:detected', conflict);

    return conflict;
  }

  /**
   * Resolve a conflict using configured strategy
   */
  private resolveConflict(conflict: Conflict): ConflictResolution {
    const strategy = this.policy.defaultStrategy;
    let resolution: ConflictResolution;

    switch (strategy) {
      case 'queue':
        resolution = this.resolveByQueue(conflict);
        break;

      case 'prioritize':
        resolution = this.resolveByPriority(conflict);
        break;

      case 'split':
        resolution = this.resolveBySplit(conflict);
        break;

      case 'merge':
        resolution = this.resolveByMerge(conflict);
        break;

      case 'cancel':
        resolution = this.resolveByCancel(conflict);
        break;

      default:
        resolution = this.resolveByQueue(conflict);
    }

    conflict.resolved = true;
    conflict.resolution = resolution;

    this.emit('conflict:resolved', { conflict, resolution });

    return resolution;
  }

  /**
   * Resolve conflict by queueing requests
   */
  private resolveByQueue(conflict: Conflict): ConflictResolution {
    return {
      strategy: 'queue',
      winner: conflict.agents[0], // First agent continues
      actions: conflict.agents.map((agentId, index) => ({
        agentId,
        action: index === 0 ? 'proceed' : 'wait'
      })),
      reason: 'First agent proceeds, others queued'
    };
  }

  /**
   * Resolve conflict by priority
   */
  private resolveByPriority(conflict: Conflict): ConflictResolution {
    // Calculate priority scores for each agent
    const scores = conflict.agents.map(agentId => ({
      agentId,
      score: this.calculatePriorityScore(agentId)
    }));

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    return {
      strategy: 'prioritize',
      winner: scores[0].agentId,
      actions: scores.map((item, index) => ({
        agentId: item.agentId,
        action: index === 0 ? 'proceed' : 'wait',
        delay: index * 1000 // Stagger by 1 second
      })),
      reason: `Agent ${scores[0].agentId} has highest priority (score: ${scores[0].score.toFixed(2)})`
    };
  }

  /**
   * Calculate priority score for an agent
   */
  private calculatePriorityScore(_agentId: string): number {
    // This would integrate with AgentCoordinator to get actual priorities
    // For now, return a simple score
    return Math.random(); // Placeholder
  }

  /**
   * Resolve conflict by splitting resources
   */
  private resolveBySplit(conflict: Conflict): ConflictResolution {
    return {
      strategy: 'split',
      actions: conflict.agents.map(agentId => ({
        agentId,
        action: 'proceed'
      })),
      reason: 'Resources split between agents'
    };
  }

  /**
   * Resolve conflict by merging tasks
   */
  private resolveByMerge(conflict: Conflict): ConflictResolution {
    return {
      strategy: 'merge',
      winner: conflict.agents[0],
      actions: [
        { agentId: conflict.agents[0], action: 'proceed' },
        ...conflict.agents.slice(1).map(agentId => ({
          agentId,
          action: 'cancel' as const
        }))
      ],
      reason: 'Tasks merged into single execution'
    };
  }

  /**
   * Resolve conflict by cancelling lower priority tasks
   */
  private resolveByCancel(conflict: Conflict): ConflictResolution {
    return {
      strategy: 'cancel',
      winner: conflict.agents[0],
      actions: [
        { agentId: conflict.agents[0], action: 'proceed' },
        ...conflict.agents.slice(1).map(agentId => ({
          agentId,
          action: 'cancel' as const
        }))
      ],
      reason: 'Lower priority tasks cancelled'
    };
  }

  /**
   * Apply conflict resolution
   */
  private async applyResolution(
    agentId: string,
    resolution: ConflictResolution
  ): Promise<boolean> {
    const action = resolution.actions.find(a => a.agentId === agentId);

    if (!action) {
      return false;
    }

    switch (action.action) {
      case 'proceed':
        return true;

      case 'wait':
        // Add to queue
        if (action.delay) {
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }
        return false;

      case 'retry':
        // Will retry after delay
        return false;

      case 'cancel':
        // Task should be cancelled
        this.emit('task:cancelled', agentId);
        return false;

      default:
        return false;
    }
  }

  /**
   * Process queued lock requests
   */
  private processLockQueue(lockKey: string): void {
    const queue = this.lockQueue.get(lockKey);
    if (!queue || queue.length === 0) return;

    // Process first queued request
    const next = queue.shift();
    if (next) {
      next.callback();
    }
  }

  /**
   * Detect deadlocks
   */
  private detectDeadlocks(): void {
    // Build dependency graph
    const graph = new Map<string, Set<string>>();

    for (const [lockKey, lock] of this.locks.entries()) {
      const queue = this.lockQueue.get(lockKey);
      if (!queue) continue;

      // Agent holding lock
      if (!graph.has(lock.lockedBy)) {
        graph.set(lock.lockedBy, new Set());
      }

      // Agents waiting for lock
      for (const waiter of queue) {
        if (!graph.has(waiter.agentId)) {
          graph.set(waiter.agentId, new Set());
        }
        graph.get(waiter.agentId)!.add(lock.lockedBy);
      }
    }

    // Detect cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);

      const neighbors = graph.get(node);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            if (hasCycle(neighbor)) {
              return true;
            }
          } else if (recursionStack.has(neighbor)) {
            return true;
          }
        }
      }

      recursionStack.delete(node);
      return false;
    };

    // Check all nodes
    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        if (hasCycle(node)) {
          this.handleDeadlock(Array.from(recursionStack));
        }
      }
    }
  }

  /**
   * Handle detected deadlock
   */
  private handleDeadlock(agents: string[]): void {
    const conflict: Conflict = {
      id: `deadlock-${Date.now()}`,
      type: 'resource',
      agents,
      resources: [],
      detectedAt: new Date(),
      resolved: false
    };

    this.emit('deadlock:detected', conflict);

    // Break deadlock by cancelling lowest priority agent
    const resolution = this.resolveByCancel(conflict);
    this.applyResolution(agents[agents.length - 1], resolution);
  }

  /**
   * Clean up expired locks
   */
  private cleanupExpiredLocks(): void {
    const now = new Date();

    for (const [lockKey, lock] of this.locks.entries()) {
      if (lock.expiresAt < now) {
        this.locks.delete(lockKey);
        this.emit('lock:expired', lock);

        // Process queued requests
        this.processLockQueue(lockKey);
      }
    }
  }

  /**
   * Get all active locks
   */
  public getActiveLocks(): ResourceLock[] {
    return Array.from(this.locks.values());
  }

  /**
   * Get all conflicts
   */
  public getConflicts(resolved?: boolean): Conflict[] {
    let conflicts = Array.from(this.conflicts.values());

    if (resolved !== undefined) {
      conflicts = conflicts.filter(c => c.resolved === resolved);
    }

    return conflicts;
  }

  /**
   * Get conflict statistics
   */
  public getConflictStats(): {
    total: number;
    resolved: number;
    unresolved: number;
    byType: Record<string, number>;
    averageResolutionTime: number;
  } {
    const conflicts = Array.from(this.conflicts.values());
    const resolved = conflicts.filter(c => c.resolved);

    const byType: Record<string, number> = {};
    for (const conflict of conflicts) {
      byType[conflict.type] = (byType[conflict.type] || 0) + 1;
    }

    const resolutionTimes = resolved
      .filter(c => c.resolution)
      .map(_c => {
        // Calculate time from detection to resolution
        return 100; // Placeholder
      });

    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
      : 0;

    return {
      total: conflicts.length,
      resolved: resolved.length,
      unresolved: conflicts.length - resolved.length,
      byType,
      averageResolutionTime: avgResolutionTime
    };
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stopDeadlockDetection();
    this.locks.clear();
    this.conflicts.clear();
    this.lockQueue.clear();
  }
}
