/**
 * Agent Coordinator - Multi-Agent Coordination System
 * Manages multiple agents working together on browser testing tasks
 * Phase 2: Multi-Agent Coordination
 */

import { EventEmitter } from 'events';
import { SQLiteBackend } from '../database/sqlite-backend.js';
import { AgentDBClient } from '../training/agentdb-client.js';

export interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'error' | 'offline';
  capabilities: AgentCapability[];
  currentTask?: string;
  tasksCompleted: number;
  tasksAssigned: number;
  successRate: number;
  lastHeartbeat: Date;
  metadata?: Record<string, any>;
}

export interface AgentCapability {
  type: 'navigation' | 'form-filling' | 'visual-testing' | 'api-testing' | 'captcha-solving';
  proficiency: number; // 0-1 scale
}

export interface AgentTask {
  id: string;
  type: string;
  priority: number;
  assignedTo?: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'failed';
  payload: any;
  dependencies?: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface AgentMessage {
  id: string;
  from: string;
  to?: string; // undefined means broadcast
  type: 'task' | 'result' | 'status' | 'query' | 'knowledge-share';
  payload: any;
  timestamp: Date;
  priority: number;
}

export interface SharedKnowledge {
  id: string;
  type: 'pattern' | 'solution' | 'failure' | 'optimization';
  contributedBy: string;
  content: any;
  confidence: number;
  usageCount: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoordinationMetrics {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskDuration: number;
  systemUtilization: number;
  knowledgeBaseSize: number;
}

/**
 * Agent Coordinator
 * Central coordination system for managing multiple browser automation agents
 */
export class AgentCoordinator extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private messageQueue: AgentMessage[] = [];
  private sharedKnowledge: Map<string, SharedKnowledge> = new Map();
  private db: SQLiteBackend;
  private agentDB: AgentDBClient;
  private heartbeatInterval?: NodeJS.Timeout;
  private taskDistributionInterval?: NodeJS.Timeout;

  constructor(dbPath: string, agentDBPath: string) {
    super();
    this.db = new SQLiteBackend(dbPath);
    this.agentDB = new AgentDBClient(agentDBPath);
  }

  /**
   * Start the coordination system
   */
  public start(): void {
    // Start heartbeat monitoring
    this.heartbeatInterval = setInterval(() => {
      this.checkAgentHeartbeats();
    }, 5000); // Check every 5 seconds

    // Start task distribution
    this.taskDistributionInterval = setInterval(() => {
      this.distributeTasks();
    }, 1000); // Check every second

    this.emit('coordinator:started');
  }

  /**
   * Stop the coordination system
   */
  public stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.taskDistributionInterval) {
      clearInterval(this.taskDistributionInterval);
    }

    // Notify all agents
    this.broadcast({
      type: 'status',
      payload: { status: 'coordinator-stopping' },
      priority: 10
    });

    this.emit('coordinator:stopped');
  }

  /**
   * Register a new agent
   */
  public registerAgent(agent: Omit<Agent, 'status' | 'lastHeartbeat' | 'tasksCompleted' | 'tasksAssigned' | 'successRate'>): void {
    const fullAgent: Agent = {
      ...agent,
      status: 'idle',
      lastHeartbeat: new Date(),
      tasksCompleted: 0,
      tasksAssigned: 0,
      successRate: 1.0
    };

    this.agents.set(agent.id, fullAgent);

    // Store in database - Note: agents table not yet implemented in SQLiteBackend
    // TODO: Add agents table to database schema
    /*
    this.db.prepare(`
      INSERT OR REPLACE INTO agents (
        id, name, status, capabilities, tasks_completed, tasks_assigned,
        success_rate, last_heartbeat, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fullAgent.id,
      fullAgent.name,
      fullAgent.status,
      JSON.stringify(fullAgent.capabilities),
      fullAgent.tasksCompleted,
      fullAgent.tasksAssigned,
      fullAgent.successRate,
      fullAgent.lastHeartbeat.toISOString(),
      JSON.stringify(fullAgent.metadata || {})
    );
    */

    this.emit('agent:registered', fullAgent);
  }

  /**
   * Unregister an agent
   */
  public unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Reassign pending tasks
    for (const [_taskId, task] of this.tasks.entries()) {
      if (task.assignedTo === agentId && task.status !== 'completed' && task.status !== 'failed') {
        task.status = 'pending';
        task.assignedTo = undefined;
        this.emit('task:reassigned', task);
      }
    }

    this.agents.delete(agentId);
    this.emit('agent:unregistered', agentId);
  }

  /**
   * Update agent heartbeat
   */
  public heartbeat(agentId: string, status?: Agent['status']): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.lastHeartbeat = new Date();
    if (status) {
      agent.status = status;
    }

    this.emit('agent:heartbeat', agentId);
  }

  /**
   * Check agent heartbeats and mark unresponsive agents as offline
   */
  private checkAgentHeartbeats(): void {
    const now = new Date();
    const timeout = 30000; // 30 seconds

    for (const [agentId, agent] of this.agents.entries()) {
      const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();

      if (timeSinceHeartbeat > timeout && agent.status !== 'offline') {
        agent.status = 'offline';
        this.emit('agent:offline', agentId);

        // Reassign their tasks
        this.reassignAgentTasks(agentId);
      }
    }
  }

  /**
   * Reassign tasks from an offline agent
   */
  private reassignAgentTasks(agentId: string): void {
    for (const [_taskId, task] of this.tasks.entries()) {
      if (task.assignedTo === agentId &&
          (task.status === 'assigned' || task.status === 'in-progress')) {
        task.status = 'pending';
        task.assignedTo = undefined;
        this.emit('task:reassigned', task);
      }
    }
  }

  /**
   * Create and queue a new task
   */
  public createTask(task: Omit<AgentTask, 'id' | 'status' | 'createdAt'>): string {
    const fullTask: AgentTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      status: 'pending',
      createdAt: new Date()
    };

    this.tasks.set(fullTask.id, fullTask);
    this.emit('task:created', fullTask);

    return fullTask.id;
  }

  /**
   * Distribute tasks to available agents
   */
  private distributeTasks(): void {
    const pendingTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'pending')
      .sort((a, b) => b.priority - a.priority);

    const availableAgents = Array.from(this.agents.values())
      .filter(a => a.status === 'idle');

    for (const task of pendingTasks) {
      // Check if dependencies are satisfied
      if (task.dependencies && !this.areDependenciesSatisfied(task.dependencies)) {
        continue;
      }

      // Find best agent for this task
      const bestAgent = this.findBestAgentForTask(task, availableAgents);
      if (!bestAgent) continue;

      // Assign task to agent
      this.assignTask(task.id, bestAgent.id);

      // Remove agent from available pool
      const index = availableAgents.indexOf(bestAgent);
      if (index > -1) {
        availableAgents.splice(index, 1);
      }
    }
  }

  /**
   * Check if task dependencies are satisfied
   */
  private areDependenciesSatisfied(dependencies: string[]): boolean {
    for (const depId of dependencies) {
      const depTask = this.tasks.get(depId);
      if (!depTask || depTask.status !== 'completed') {
        return false;
      }
    }
    return true;
  }

  /**
   * Find the best agent for a task based on capabilities and current load
   */
  private findBestAgentForTask(task: AgentTask, availableAgents: Agent[]): Agent | null {
    if (availableAgents.length === 0) return null;

    // Score agents based on capability match and performance
    const scoredAgents = availableAgents.map(agent => {
      let score = 0;

      // Success rate weight
      score += agent.successRate * 50;

      // Capability match weight
      const relevantCapabilities = agent.capabilities.filter(cap =>
        task.type.includes(cap.type)
      );
      if (relevantCapabilities.length > 0) {
        const avgProficiency = relevantCapabilities.reduce((sum, cap) =>
          sum + cap.proficiency, 0
        ) / relevantCapabilities.length;
        score += avgProficiency * 50;
      }

      // Load balancing - prefer agents with fewer tasks
      const loadFactor = agent.tasksAssigned - agent.tasksCompleted;
      score -= loadFactor * 10;

      return { agent, score };
    });

    // Sort by score and return best agent
    scoredAgents.sort((a, b) => b.score - a.score);
    return scoredAgents[0]?.agent || null;
  }

  /**
   * Assign a task to an agent
   */
  public assignTask(taskId: string, agentId: string): void {
    const task = this.tasks.get(taskId);
    const agent = this.agents.get(agentId);

    if (!task || !agent) return;

    task.status = 'assigned';
    task.assignedTo = agentId;
    task.startedAt = new Date();

    agent.status = 'busy';
    agent.tasksAssigned++;

    // Send task to agent
    this.sendMessage({
      to: agentId,
      type: 'task',
      payload: task,
      priority: task.priority
    });

    this.emit('task:assigned', { task, agent });
  }

  /**
   * Report task completion
   */
  public completeTask(taskId: string, result: any): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.completedAt = new Date();
    task.result = result;

    if (task.assignedTo) {
      const agent = this.agents.get(task.assignedTo);
      if (agent) {
        agent.status = 'idle';
        agent.tasksCompleted++;
        agent.successRate = agent.tasksCompleted / agent.tasksAssigned;
      }
    }

    this.emit('task:completed', task);
  }

  /**
   * Report task failure
   */
  public failTask(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    task.completedAt = new Date();
    task.error = error;

    if (task.assignedTo) {
      const agent = this.agents.get(task.assignedTo);
      if (agent) {
        agent.status = 'idle';
        agent.successRate = agent.tasksCompleted / Math.max(1, agent.tasksAssigned);
      }
    }

    this.emit('task:failed', task);
  }

  /**
   * Send message to specific agent or broadcast
   */
  public sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp' | 'from'>): void {
    const fullMessage: AgentMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      from: 'coordinator',
      timestamp: new Date()
    };

    this.messageQueue.push(fullMessage);
    this.emit('message:sent', fullMessage);
  }

  /**
   * Broadcast message to all agents
   */
  public broadcast(message: Omit<AgentMessage, 'id' | 'timestamp' | 'from' | 'to'>): void {
    this.sendMessage({ ...message, to: undefined });
  }

  /**
   * Get messages for a specific agent
   */
  public getMessages(agentId: string, limit: number = 10): AgentMessage[] {
    return this.messageQueue
      .filter(m => m.to === agentId || m.to === undefined)
      .slice(-limit);
  }

  /**
   * Share knowledge across agents
   */
  public shareKnowledge(knowledge: Omit<SharedKnowledge, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): string {
    const fullKnowledge: SharedKnowledge = {
      ...knowledge,
      id: `knowledge-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };

    this.sharedKnowledge.set(fullKnowledge.id, fullKnowledge);

    // Broadcast to all agents
    this.broadcast({
      type: 'knowledge-share',
      payload: fullKnowledge,
      priority: 5
    });

    this.emit('knowledge:shared', fullKnowledge);
    return fullKnowledge.id;
  }

  /**
   * Query shared knowledge base
   */
  public queryKnowledge(query: {
    type?: SharedKnowledge['type'];
    minConfidence?: number;
    contributedBy?: string;
    limit?: number;
  }): SharedKnowledge[] {
    let results = Array.from(this.sharedKnowledge.values());

    if (query.type) {
      results = results.filter(k => k.type === query.type);
    }

    if (query.minConfidence !== undefined) {
      results = results.filter(k => k.confidence >= (query.minConfidence ?? 0));
    }

    if (query.contributedBy) {
      results = results.filter(k => k.contributedBy === query.contributedBy);
    }

    // Sort by confidence and success rate
    results.sort((a, b) => {
      const scoreA = a.confidence * a.successRate;
      const scoreB = b.confidence * b.successRate;
      return scoreB - scoreA;
    });

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get coordination metrics
   */
  public getMetrics(): CoordinationMetrics {
    const agents = Array.from(this.agents.values());
    const tasks = Array.from(this.tasks.values());

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const avgDuration = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => {
          if (t.completedAt && t.startedAt) {
            return sum + (t.completedAt.getTime() - t.startedAt.getTime());
          }
          return sum;
        }, 0) / completedTasks.length
      : 0;

    const activeAgents = agents.filter(a => a.status === 'busy').length;
    const totalAgents = agents.length;
    const utilization = totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0;

    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'busy').length,
      idleAgents: agents.filter(a => a.status === 'idle').length,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      completedTasks: completedTasks.length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      averageTaskDuration: avgDuration,
      systemUtilization: utilization,
      knowledgeBaseSize: this.sharedKnowledge.size
    };
  }

  /**
   * Get agent status
   */
  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  public getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get task status
   */
  public getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  public getTasks(filter?: { status?: AgentTask['status']; assignedTo?: string }): AgentTask[] {
    let tasks = Array.from(this.tasks.values());

    if (filter?.status) {
      tasks = tasks.filter(t => t.status === filter.status);
    }

    if (filter?.assignedTo) {
      tasks = tasks.filter(t => t.assignedTo === filter.assignedTo);
    }

    return tasks;
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stop();
    this.agents.clear();
    this.tasks.clear();
    this.messageQueue = [];
    this.sharedKnowledge.clear();
    this.db.close();
    this.agentDB.save();
  }
}
