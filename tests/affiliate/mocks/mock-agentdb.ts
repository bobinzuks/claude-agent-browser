/**
 * Mock AgentDB for Affiliate Tests
 * In-memory database implementation for testing
 */

import {
  AffiliateNetwork,
  AffiliateLink,
  SignupWorkflow,
  ComplianceLog,
  InsertAffiliateNetwork,
  InsertAffiliateLink,
  InsertSignupWorkflow,
  InsertComplianceLog,
  UpdateAffiliateNetwork,
  UpdateAffiliateLink,
  NetworkWithStats,
  LinkWithNetwork,
} from '../../../src/database/affiliate-types';

/**
 * Mock AgentDB Implementation
 * Provides in-memory storage for testing without real database
 */
export class MockAgentDB {
  private networks: Map<string, AffiliateNetwork> = new Map();
  private links: Map<number, AffiliateLink> = new Map();
  private workflows: Map<number, SignupWorkflow> = new Map();
  private logs: Map<number, ComplianceLog> = new Map();
  private nextLinkId = 1;
  private nextWorkflowId = 1;
  private nextLogId = 1;

  // ========================================================================
  // Network Operations
  // ========================================================================

  addNetwork(network: InsertAffiliateNetwork): AffiliateNetwork {
    const fullNetwork: AffiliateNetwork = {
      ...network,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    this.networks.set(network.id, fullNetwork);
    return fullNetwork;
  }

  getNetwork(id: string): AffiliateNetwork | null {
    return this.networks.get(id) || null;
  }

  getNetworkByDomain(domain: string): AffiliateNetwork | null {
    for (const network of this.networks.values()) {
      if (network.domain === domain || network.domain.includes(domain)) {
        return network;
      }
    }
    return null;
  }

  getAllNetworks(): AffiliateNetwork[] {
    return Array.from(this.networks.values());
  }

  updateNetwork(id: string, updates: UpdateAffiliateNetwork): boolean {
    const network = this.networks.get(id);
    if (!network) return false;

    const updated: AffiliateNetwork = {
      ...network,
      ...updates,
      updated_at: Date.now(),
    };
    this.networks.set(id, updated);
    return true;
  }

  deleteNetwork(id: string): boolean {
    // Delete associated links, workflows, and logs
    const linksToDelete = Array.from(this.links.entries())
      .filter(([_, link]) => link.network_id === id)
      .map(([id]) => id);
    linksToDelete.forEach((linkId) => this.links.delete(linkId));

    const workflowsToDelete = Array.from(this.workflows.entries())
      .filter(([_, workflow]) => workflow.network_id === id)
      .map(([id]) => id);
    workflowsToDelete.forEach((workflowId) => this.workflows.delete(workflowId));

    const logsToDelete = Array.from(this.logs.entries())
      .filter(([_, log]) => log.network_id === id)
      .map(([id]) => id);
    logsToDelete.forEach((logId) => this.logs.delete(logId));

    return this.networks.delete(id);
  }

  getNetworkWithStats(id: string): NetworkWithStats | null {
    const network = this.networks.get(id);
    if (!network) return null;

    const networkLinks = Array.from(this.links.values()).filter(
      (link) => link.network_id === id
    );
    const activeLinks = networkLinks.filter((link) => link.is_active);
    const workflows = Array.from(this.workflows.values()).filter(
      (workflow) => workflow.network_id === id
    );
    const totalAttempts = workflows.reduce((sum, w) => sum + w.success_count, 0);

    return {
      ...network,
      link_count: networkLinks.length,
      active_link_count: activeLinks.length,
      total_workflow_attempts: totalAttempts,
    };
  }

  // ========================================================================
  // Link Operations
  // ========================================================================

  addLink(link: InsertAffiliateLink): AffiliateLink {
    const id = this.nextLinkId++;
    const fullLink: AffiliateLink = {
      ...link,
      id,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    this.links.set(id, fullLink);
    return fullLink;
  }

  getLink(id: number): AffiliateLink | null {
    return this.links.get(id) || null;
  }

  getLinkByUrl(url: string): AffiliateLink | null {
    for (const link of this.links.values()) {
      if (link.url === url) return link;
    }
    return null;
  }

  getLinksByNetwork(networkId: string): AffiliateLink[] {
    return Array.from(this.links.values()).filter(
      (link) => link.network_id === networkId
    );
  }

  getActiveLinks(networkId?: string): AffiliateLink[] {
    let links = Array.from(this.links.values()).filter((link) => link.is_active);
    if (networkId) {
      links = links.filter((link) => link.network_id === networkId);
    }
    return links;
  }

  updateLink(id: number, updates: UpdateAffiliateLink): boolean {
    const link = this.links.get(id);
    if (!link) return false;

    const updated: AffiliateLink = {
      ...link,
      ...updates,
      updated_at: Date.now(),
    };
    this.links.set(id, updated);
    return true;
  }

  deleteLink(id: number): boolean {
    return this.links.delete(id);
  }

  getLinkWithNetwork(id: number): LinkWithNetwork | null {
    const link = this.links.get(id);
    if (!link) return null;

    const network = this.networks.get(link.network_id);
    if (!network) return null;

    return {
      ...link,
      network_name: network.name,
      network_domain: network.domain,
    };
  }

  // ========================================================================
  // Workflow Operations
  // ========================================================================

  addWorkflow(workflow: InsertSignupWorkflow): SignupWorkflow {
    const id = this.nextWorkflowId++;
    const fullWorkflow: SignupWorkflow = {
      ...workflow,
      id,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    this.workflows.set(id, fullWorkflow);
    return fullWorkflow;
  }

  getWorkflow(id: number): SignupWorkflow | null {
    return this.workflows.get(id);
  }

  getWorkflowsByNetwork(networkId: string): SignupWorkflow[] {
    return Array.from(this.workflows.values())
      .filter((workflow) => workflow.network_id === networkId)
      .sort((a, b) => b.confidence_score - a.confidence_score);
  }

  getBestWorkflow(networkId: string): SignupWorkflow | null {
    const workflows = this.getWorkflowsByNetwork(networkId);
    return workflows.length > 0 ? workflows[0] : null;
  }

  updateWorkflowSuccess(id: number): boolean {
    const workflow = this.workflows.get(id);
    if (!workflow) return false;

    const updated: SignupWorkflow = {
      ...workflow,
      success_count: workflow.success_count + 1,
      last_used: Date.now(),
      confidence_score: Math.min(1.0, workflow.confidence_score + 0.05),
      updated_at: Date.now(),
    };
    this.workflows.set(id, updated);
    return true;
  }

  // ========================================================================
  // Compliance Log Operations
  // ========================================================================

  addComplianceLog(log: InsertComplianceLog): ComplianceLog {
    const id = this.nextLogId++;
    const fullLog: ComplianceLog = {
      ...log,
      id,
      created_at: Date.now(),
    };
    this.logs.set(id, fullLog);
    return fullLog;
  }

  getComplianceLog(id: number): ComplianceLog | null {
    return this.logs.get(id) || null;
  }

  getComplianceLogsByNetwork(
    networkId: string,
    limit?: number
  ): ComplianceLog[] {
    let logs = Array.from(this.logs.values())
      .filter((log) => log.network_id === networkId)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (limit) {
      logs = logs.slice(0, limit);
    }

    return logs;
  }

  getRecentComplianceLogs(limit: number = 50): ComplianceLog[] {
    return Array.from(this.logs.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getCriticalComplianceLogs(): ComplianceLog[] {
    return Array.from(this.logs.values())
      .filter((log) => log.compliance_level === 'critical')
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  clear(): void {
    this.networks.clear();
    this.links.clear();
    this.workflows.clear();
    this.logs.clear();
    this.nextLinkId = 1;
    this.nextWorkflowId = 1;
    this.nextLogId = 1;
  }

  seed(data: {
    networks?: AffiliateNetwork[];
    links?: AffiliateLink[];
    workflows?: SignupWorkflow[];
    logs?: ComplianceLog[];
  }): void {
    if (data.networks) {
      data.networks.forEach((network) => {
        this.networks.set(network.id, network);
      });
    }

    if (data.links) {
      data.links.forEach((link) => {
        if (link.id) {
          this.links.set(link.id, link);
          this.nextLinkId = Math.max(this.nextLinkId, link.id + 1);
        }
      });
    }

    if (data.workflows) {
      data.workflows.forEach((workflow) => {
        if (workflow.id) {
          this.workflows.set(workflow.id, workflow);
          this.nextWorkflowId = Math.max(this.nextWorkflowId, workflow.id + 1);
        }
      });
    }

    if (data.logs) {
      data.logs.forEach((log) => {
        if (log.id) {
          this.logs.set(log.id, log);
          this.nextLogId = Math.max(this.nextLogId, log.id + 1);
        }
      });
    }
  }

  getStats() {
    return {
      networks: this.networks.size,
      links: this.links.size,
      activeLinks: Array.from(this.links.values()).filter((l) => l.is_active).length,
      workflows: this.workflows.size,
      logs: this.logs.size,
      criticalLogs: this.getCriticalComplianceLogs().length,
    };
  }
}

/**
 * Factory function to create a fresh mock database
 */
export function createMockAgentDB(): MockAgentDB {
  return new MockAgentDB();
}

/**
 * Factory function to create a pre-seeded mock database
 */
export function createSeededMockAgentDB(data: {
  networks?: AffiliateNetwork[];
  links?: AffiliateLink[];
  workflows?: SignupWorkflow[];
  logs?: ComplianceLog[];
}): MockAgentDB {
  const db = new MockAgentDB();
  db.seed(data);
  return db;
}
