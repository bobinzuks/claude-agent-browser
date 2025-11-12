/**
 * AgentDB Affiliate Operations
 *
 * Database operations for affiliate network management.
 * Provides type-safe CRUD operations for all affiliate tables.
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
  // UpdateSignupWorkflow,
  NetworkWithStats,
  LinkWithNetwork,
  TOSLevel,
  SignupStatus,
  ComplianceLevel,
  // FormField,
  generateWorkflowHash,
  createComplianceLog,
} from './affiliate-types';

// ============================================================================
// Database Interface
// ============================================================================

interface SQLiteDB {
  exec(sql: string): any[];
  run(sql: string, params?: any[]): { lastInsertRowid: number };
  prepare(sql: string): SQLiteStatement;
}

interface SQLiteStatement {
  bind(params?: any[]): boolean;
  step(): boolean;
  get(): any[];
  getAsObject(): any;
  free(): void;
  reset(): void;
}

// ============================================================================
// Affiliate Network Operations
// ============================================================================

export class AffiliateNetworkDB {
  constructor(private db: SQLiteDB) {}

  /**
   * Insert a new affiliate network
   */
  async insertNetwork(network: InsertAffiliateNetwork): Promise<string> {
    const metadata = network.metadata ? JSON.stringify(network.metadata) : null;

    this.db.run(
      `INSERT INTO affiliate_networks
       (id, name, domain, tos_level, api_available, signup_url, dashboard_url,
        signup_status, signup_date, last_accessed, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        network.id,
        network.name,
        network.domain,
        network.tos_level,
        network.api_available ? 1 : 0,
        network.signup_url || null,
        network.dashboard_url || null,
        network.signup_status || null,
        network.signup_date || null,
        network.last_accessed || null,
        metadata,
      ]
    );

    // Log compliance event
    await this.logCompliance(
      'network_created',
      'info',
      { network_id: network.id, network_name: network.name },
      network.id
    );

    return network.id;
  }

  /**
   * Get affiliate network by ID
   */
  async getNetwork(id: string): Promise<AffiliateNetwork | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM affiliate_networks WHERE id = ?'
    );
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return this.rowToNetwork(row);
    }

    stmt.free();
    return null;
  }

  /**
   * Get all affiliate networks
   */
  async getAllNetworks(): Promise<AffiliateNetwork[]> {
    const result = this.db.exec(
      'SELECT * FROM affiliate_networks ORDER BY name ASC'
    );

    if (result.length === 0) return [];

    return result[0].values.map((row: any) => this.arrayToNetwork(row));
  }

  /**
   * Get networks by TOS level
   */
  async getNetworksByTOSLevel(level: TOSLevel): Promise<AffiliateNetwork[]> {
    const stmt = this.db.prepare(
      'SELECT * FROM affiliate_networks WHERE tos_level = ? ORDER BY name ASC'
    );
    stmt.bind([level]);

    const networks: AffiliateNetwork[] = [];
    while (stmt.step()) {
      networks.push(this.rowToNetwork(stmt.getAsObject()));
    }
    stmt.free();

    return networks;
  }

  /**
   * Get networks by signup status
   */
  async getNetworksByStatus(status: SignupStatus): Promise<AffiliateNetwork[]> {
    const stmt = this.db.prepare(
      'SELECT * FROM affiliate_networks WHERE signup_status = ? ORDER BY name ASC'
    );
    stmt.bind([status]);

    const networks: AffiliateNetwork[] = [];
    while (stmt.step()) {
      networks.push(this.rowToNetwork(stmt.getAsObject()));
    }
    stmt.free();

    return networks;
  }

  /**
   * Update affiliate network
   */
  async updateNetwork(id: string, updates: UpdateAffiliateNetwork): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.domain !== undefined) {
      fields.push('domain = ?');
      values.push(updates.domain);
    }
    if (updates.tos_level !== undefined) {
      fields.push('tos_level = ?');
      values.push(updates.tos_level);
    }
    if (updates.api_available !== undefined) {
      fields.push('api_available = ?');
      values.push(updates.api_available ? 1 : 0);
    }
    if (updates.signup_url !== undefined) {
      fields.push('signup_url = ?');
      values.push(updates.signup_url);
    }
    if (updates.dashboard_url !== undefined) {
      fields.push('dashboard_url = ?');
      values.push(updates.dashboard_url);
    }
    if (updates.signup_status !== undefined) {
      fields.push('signup_status = ?');
      values.push(updates.signup_status);
    }
    if (updates.signup_date !== undefined) {
      fields.push('signup_date = ?');
      values.push(updates.signup_date);
    }
    if (updates.last_accessed !== undefined) {
      fields.push('last_accessed = ?');
      values.push(updates.last_accessed);
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(Date.now());

    values.push(id);

    this.db.run(
      `UPDATE affiliate_networks SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    // Log compliance event
    await this.logCompliance(
      'network_updated',
      'info',
      { network_id: id, updated_fields: Object.keys(updates) },
      id
    );
  }

  /**
   * Delete affiliate network (cascades to links and workflows)
   */
  async deleteNetwork(id: string): Promise<void> {
    // Log before deletion
    await this.logCompliance(
      'network_deleted',
      'warning',
      { network_id: id },
      id
    );

    this.db.run('DELETE FROM affiliate_networks WHERE id = ?', [id]);
  }

  /**
   * Get network with statistics
   */
  async getNetworkWithStats(id: string): Promise<NetworkWithStats | null> {
    const network = await this.getNetwork(id);
    if (!network) return null;

    const linkCountStmt = this.db.prepare(
      'SELECT COUNT(*) FROM affiliate_links WHERE network_id = ?'
    );
    linkCountStmt.bind([id]);
    const linkCount = linkCountStmt.step() ? linkCountStmt.get()[0] : 0;
    linkCountStmt.free();

    const activeLinkCountStmt = this.db.prepare(
      'SELECT COUNT(*) FROM affiliate_links WHERE network_id = ? AND is_active = 1'
    );
    activeLinkCountStmt.bind([id]);
    const activeLinkCount = activeLinkCountStmt.step() ? activeLinkCountStmt.get()[0] : 0;
    activeLinkCountStmt.free();

    const workflowAttemptsStmt = this.db.prepare(
      'SELECT SUM(success_count) FROM signup_workflows WHERE network_id = ?'
    );
    workflowAttemptsStmt.bind([id]);
    const workflowAttempts = workflowAttemptsStmt.step() ? workflowAttemptsStmt.get()[0] : 0;
    workflowAttemptsStmt.free();

    return {
      ...network,
      link_count: linkCount || 0,
      active_link_count: activeLinkCount || 0,
      total_workflow_attempts: workflowAttempts || 0,
    };
  }

  private rowToNetwork(row: any): AffiliateNetwork {
    return {
      id: row.id,
      name: row.name,
      domain: row.domain,
      tos_level: row.tos_level,
      api_available: row.api_available === 1,
      signup_url: row.signup_url,
      dashboard_url: row.dashboard_url,
      signup_status: row.signup_status,
      signup_date: row.signup_date,
      last_accessed: row.last_accessed,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private arrayToNetwork(row: any[]): AffiliateNetwork {
    return {
      id: row[0],
      name: row[1],
      domain: row[2],
      tos_level: row[3],
      api_available: row[4] === 1,
      signup_url: row[5],
      dashboard_url: row[6],
      signup_status: row[7],
      signup_date: row[8],
      last_accessed: row[9],
      metadata: row[10] ? JSON.parse(row[10]) : undefined,
      created_at: row[11],
      updated_at: row[12],
    };
  }

  private async logCompliance(
    action: string,
    level: ComplianceLevel,
    details: any,
    networkId?: string
  ): Promise<void> {
    const complianceDB = new ComplianceLogDB(this.db);
    await complianceDB.insertLog(
      createComplianceLog(action, level, details, networkId)
    );
  }
}

// ============================================================================
// Affiliate Link Operations
// ============================================================================

export class AffiliateLinkDB {
  constructor(private db: SQLiteDB) {}

  /**
   * Insert a new affiliate link
   */
  async insertLink(link: InsertAffiliateLink): Promise<number> {
    const metadata = link.metadata ? JSON.stringify(link.metadata) : null;

    const result = this.db.run(
      `INSERT INTO affiliate_links
       (network_id, url, product_id, product_name, commission, extracted_at,
        last_validated, is_active, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        link.network_id,
        link.url,
        link.product_id || null,
        link.product_name || null,
        link.commission || null,
        link.extracted_at,
        link.last_validated || null,
        link.is_active ? 1 : 0,
        metadata,
      ]
    );

    return result.lastInsertRowid;
  }

  /**
   * Get affiliate link by ID
   */
  async getLink(id: number): Promise<AffiliateLink | null> {
    const stmt = this.db.prepare('SELECT * FROM affiliate_links WHERE id = ?');
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return this.rowToLink(row);
    }

    stmt.free();
    return null;
  }

  /**
   * Get links by network
   */
  async getLinksByNetwork(networkId: string): Promise<AffiliateLink[]> {
    const stmt = this.db.prepare(
      'SELECT * FROM affiliate_links WHERE network_id = ? ORDER BY extracted_at DESC'
    );
    stmt.bind([networkId]);

    const links: AffiliateLink[] = [];
    while (stmt.step()) {
      links.push(this.rowToLink(stmt.getAsObject()));
    }
    stmt.free();

    return links;
  }

  /**
   * Get active links by network
   */
  async getActiveLinksByNetwork(networkId: string): Promise<AffiliateLink[]> {
    const stmt = this.db.prepare(
      'SELECT * FROM affiliate_links WHERE network_id = ? AND is_active = 1 ORDER BY extracted_at DESC'
    );
    stmt.bind([networkId]);

    const links: AffiliateLink[] = [];
    while (stmt.step()) {
      links.push(this.rowToLink(stmt.getAsObject()));
    }
    stmt.free();

    return links;
  }

  /**
   * Update affiliate link
   */
  async updateLink(id: number, updates: UpdateAffiliateLink): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.url !== undefined) {
      fields.push('url = ?');
      values.push(updates.url);
    }
    if (updates.product_id !== undefined) {
      fields.push('product_id = ?');
      values.push(updates.product_id);
    }
    if (updates.product_name !== undefined) {
      fields.push('product_name = ?');
      values.push(updates.product_name);
    }
    if (updates.commission !== undefined) {
      fields.push('commission = ?');
      values.push(updates.commission);
    }
    if (updates.last_validated !== undefined) {
      fields.push('last_validated = ?');
      values.push(updates.last_validated);
    }
    if (updates.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.is_active ? 1 : 0);
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(Date.now());

    values.push(id);

    this.db.run(
      `UPDATE affiliate_links SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  /**
   * Delete affiliate link
   */
  async deleteLink(id: number): Promise<void> {
    this.db.run('DELETE FROM affiliate_links WHERE id = ?', [id]);
  }

  /**
   * Get link with network details
   */
  async getLinkWithNetwork(id: number): Promise<LinkWithNetwork | null> {
    const stmt = this.db.prepare(
      `SELECT l.*, n.name as network_name, n.domain as network_domain
       FROM affiliate_links l
       JOIN affiliate_networks n ON l.network_id = n.id
       WHERE l.id = ?`
    );
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();

      const link = this.rowToLink(row);
      return {
        ...link,
        network_name: row.network_name,
        network_domain: row.network_domain,
      };
    }

    stmt.free();
    return null;
  }

  private rowToLink(row: any): AffiliateLink {
    return {
      id: row.id,
      network_id: row.network_id,
      url: row.url,
      product_id: row.product_id,
      product_name: row.product_name,
      commission: row.commission,
      extracted_at: row.extracted_at,
      last_validated: row.last_validated,
      is_active: row.is_active === 1,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  // @ts-expect-error - Helper method reserved for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _arrayToLink(row: any[]): AffiliateLink {
    return {
      id: row[0],
      network_id: row[1],
      url: row[2],
      product_id: row[3],
      product_name: row[4],
      commission: row[5],
      extracted_at: row[6],
      last_validated: row[7],
      is_active: row[8] === 1,
      metadata: row[9] ? JSON.parse(row[9]) : undefined,
      created_at: row[10],
      updated_at: row[11],
    };
  }
}

// ============================================================================
// Signup Workflow Operations
// ============================================================================

export class SignupWorkflowDB {
  constructor(private db: SQLiteDB) {}

  /**
   * Insert or update a signup workflow
   */
  async upsertWorkflow(workflow: InsertSignupWorkflow): Promise<number> {
    const formFields = JSON.stringify(workflow.form_fields);
    const hash = workflow.workflow_hash || (await generateWorkflowHash(workflow.form_fields));

    // Check if workflow exists
    const stmt = this.db.prepare(
      'SELECT id, success_count FROM signup_workflows WHERE network_id = ? AND workflow_hash = ?'
    );
    stmt.bind([workflow.network_id, hash]);

    if (stmt.step()) {
      // Update existing workflow
      const row = stmt.get();
      const id = row[0];
      const currentCount = row[1];
      stmt.free();

      this.db.run(
        `UPDATE signup_workflows
         SET success_count = ?, last_used = ?, confidence_score = ?, updated_at = ?
         WHERE id = ?`,
        [currentCount + 1, Date.now(), workflow.confidence_score, Date.now(), id]
      );

      return id as number;
    } else {
      stmt.free();
      // Insert new workflow
      const result = this.db.run(
        `INSERT INTO signup_workflows
         (network_id, form_fields, success_count, last_used, confidence_score, workflow_hash)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          workflow.network_id,
          formFields,
          workflow.success_count || 0,
          workflow.last_used || null,
          workflow.confidence_score,
          hash,
        ]
      );

      return result.lastInsertRowid;
    }
  }

  /**
   * Get workflows by network
   */
  async getWorkflowsByNetwork(networkId: string): Promise<SignupWorkflow[]> {
    const stmt = this.db.prepare(
      'SELECT * FROM signup_workflows WHERE network_id = ? ORDER BY confidence_score DESC'
    );
    stmt.bind([networkId]);

    const workflows: SignupWorkflow[] = [];
    while (stmt.step()) {
      workflows.push(this.rowToWorkflow(stmt.getAsObject()));
    }
    stmt.free();

    return workflows;
  }

  /**
   * Get best workflow for network (highest confidence)
   */
  async getBestWorkflow(networkId: string): Promise<SignupWorkflow | null> {
    const stmt = this.db.prepare(
      'SELECT * FROM signup_workflows WHERE network_id = ? ORDER BY confidence_score DESC LIMIT 1'
    );
    stmt.bind([networkId]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return this.rowToWorkflow(row);
    }

    stmt.free();
    return null;
  }

  /**
   * Update workflow confidence
   */
  async updateWorkflowConfidence(id: number, confidence: number): Promise<void> {
    this.db.run(
      'UPDATE signup_workflows SET confidence_score = ?, updated_at = ? WHERE id = ?',
      [confidence, Date.now(), id]
    );
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: number): Promise<void> {
    this.db.run('DELETE FROM signup_workflows WHERE id = ?', [id]);
  }

  private rowToWorkflow(row: any): SignupWorkflow {
    return {
      id: row.id,
      network_id: row.network_id,
      form_fields: JSON.parse(row.form_fields),
      success_count: row.success_count,
      last_used: row.last_used,
      confidence_score: row.confidence_score,
      workflow_hash: row.workflow_hash,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  // Kept for potential future use with array-based queries
  // private _arrayToWorkflow(row: any[]): SignupWorkflow {
  //   return {
  //     id: row[0],
  //     network_id: row[1],
  //     form_fields: JSON.parse(row[2]),
  //     success_count: row[3],
  //     last_used: row[4],
  //     confidence_score: row[5],
  //     workflow_hash: row[6],
  //     created_at: row[7],
  //     updated_at: row[8],
  //   };
  // }
}

// ============================================================================
// Compliance Log Operations
// ============================================================================

export class ComplianceLogDB {
  constructor(private db: SQLiteDB) {}

  /**
   * Insert a compliance log entry
   */
  async insertLog(log: InsertComplianceLog): Promise<number> {
    const details = log.details ? JSON.stringify(log.details) : null;

    const result = this.db.run(
      `INSERT INTO compliance_logs
       (network_id, action, compliance_level, human_approved, timestamp, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        log.network_id || null,
        log.action,
        log.compliance_level,
        log.human_approved !== undefined ? (log.human_approved ? 1 : 0) : null,
        log.timestamp,
        details,
      ]
    );

    return result.lastInsertRowid;
  }

  /**
   * Get logs by network
   */
  async getLogsByNetwork(networkId: string, limit?: number): Promise<ComplianceLog[]> {
    const sql = limit
      ? `SELECT * FROM compliance_logs WHERE network_id = ? ORDER BY timestamp DESC LIMIT ${limit}`
      : 'SELECT * FROM compliance_logs WHERE network_id = ? ORDER BY timestamp DESC';

    const stmt = this.db.prepare(sql);
    stmt.bind([networkId]);

    const logs: ComplianceLog[] = [];
    while (stmt.step()) {
      logs.push(this.rowToLog(stmt.getAsObject()));
    }
    stmt.free();

    return logs;
  }

  /**
   * Get logs by compliance level
   */
  async getLogsByLevel(level: ComplianceLevel, limit?: number): Promise<ComplianceLog[]> {
    const sql = limit
      ? `SELECT * FROM compliance_logs WHERE compliance_level = ? ORDER BY timestamp DESC LIMIT ${limit}`
      : 'SELECT * FROM compliance_logs WHERE compliance_level = ? ORDER BY timestamp DESC';

    const stmt = this.db.prepare(sql);
    stmt.bind([level]);

    const logs: ComplianceLog[] = [];
    while (stmt.step()) {
      logs.push(this.rowToLog(stmt.getAsObject()));
    }
    stmt.free();

    return logs;
  }

  /**
   * Get all logs
   */
  async getAllLogs(limit?: number): Promise<ComplianceLog[]> {
    const sql = limit
      ? `SELECT * FROM compliance_logs ORDER BY timestamp DESC LIMIT ${limit}`
      : 'SELECT * FROM compliance_logs ORDER BY timestamp DESC';

    const result = this.db.exec(sql);

    if (result.length === 0) return [];

    return result[0].values.map((row: any) => this.arrayToLog(row));
  }

  private rowToLog(row: any): ComplianceLog {
    return {
      id: row.id,
      network_id: row.network_id,
      action: row.action,
      compliance_level: row.compliance_level,
      human_approved: row.human_approved !== null ? row.human_approved === 1 : undefined,
      timestamp: row.timestamp,
      details: row.details ? JSON.parse(row.details) : undefined,
      created_at: row.created_at,
    };
  }

  private arrayToLog(row: any[]): ComplianceLog {
    return {
      id: row[0],
      network_id: row[1],
      action: row[2],
      compliance_level: row[3],
      human_approved: row[4] !== null ? row[4] === 1 : undefined,
      timestamp: row[5],
      details: row[6] ? JSON.parse(row[6]) : undefined,
      created_at: row[7],
    };
  }
}

// ============================================================================
// Unified Affiliate Database Interface
// ============================================================================

export class AffiliateDB {
  public networks: AffiliateNetworkDB;
  public links: AffiliateLinkDB;
  public workflows: SignupWorkflowDB;
  public compliance: ComplianceLogDB;

  constructor(db: SQLiteDB) {
    this.networks = new AffiliateNetworkDB(db);
    this.links = new AffiliateLinkDB(db);
    this.workflows = new SignupWorkflowDB(db);
    this.compliance = new ComplianceLogDB(db);
  }
}
