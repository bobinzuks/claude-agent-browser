/**
 * AgentDB Affiliate Extension Migration
 *
 * Migration to add affiliate network tables to existing AgentDB schema.
 * This can be integrated into the main migrations.ts file.
 */

import { Migration, Database } from './migrations';
import { readFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Affiliate Extension Migration (Version 2)
// ============================================================================

/**
 * Reads the affiliate schema SQL file
 */
function getAffiliateSchemaSQL(): string {
  try {
    // Try to read from file system (Node.js environment)
    const schemaPath = join(__dirname, 'affiliate-schema.sql');
    return readFileSync(schemaPath, 'utf-8');
  } catch {
    // Fallback to inline SQL for browser environments
    return AFFILIATE_SCHEMA_SQL;
  }
}

/**
 * Inline SQL schema (fallback for browser environments)
 */
const AFFILIATE_SCHEMA_SQL = `
-- Affiliate networks table
CREATE TABLE IF NOT EXISTS affiliate_networks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  tos_level INTEGER NOT NULL CHECK(tos_level IN (0,1,2,3)),
  api_available BOOLEAN DEFAULT 0,
  signup_url TEXT,
  dashboard_url TEXT,
  signup_status TEXT CHECK(signup_status IN ('pending', 'in_progress', 'completed', 'rejected')),
  signup_date INTEGER,
  last_accessed INTEGER,
  metadata TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- Affiliate links table
CREATE TABLE IF NOT EXISTS affiliate_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  network_id TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  product_id TEXT,
  product_name TEXT,
  commission TEXT,
  extracted_at INTEGER NOT NULL,
  last_validated INTEGER,
  is_active BOOLEAN DEFAULT 1,
  metadata TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (network_id) REFERENCES affiliate_networks(id) ON DELETE CASCADE
);

-- Signup workflows table
CREATE TABLE IF NOT EXISTS signup_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  network_id TEXT NOT NULL,
  form_fields TEXT NOT NULL,
  success_count INTEGER DEFAULT 0,
  last_used INTEGER,
  confidence_score REAL DEFAULT 0.0 CHECK(confidence_score >= 0.0 AND confidence_score <= 1.0),
  workflow_hash TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (network_id) REFERENCES affiliate_networks(id) ON DELETE CASCADE
);

-- Compliance logs table
CREATE TABLE IF NOT EXISTS compliance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  network_id TEXT,
  action TEXT NOT NULL,
  compliance_level TEXT NOT NULL CHECK(compliance_level IN ('info', 'warning', 'critical')),
  human_approved BOOLEAN,
  timestamp INTEGER NOT NULL,
  details TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (network_id) REFERENCES affiliate_networks(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_networks_domain ON affiliate_networks(domain);
CREATE INDEX IF NOT EXISTS idx_networks_tos ON affiliate_networks(tos_level);
CREATE INDEX IF NOT EXISTS idx_networks_status ON affiliate_networks(signup_status);
CREATE INDEX IF NOT EXISTS idx_links_network ON affiliate_links(network_id);
CREATE INDEX IF NOT EXISTS idx_links_active ON affiliate_links(is_active);
CREATE INDEX IF NOT EXISTS idx_links_extracted ON affiliate_links(extracted_at);
CREATE INDEX IF NOT EXISTS idx_workflows_network ON signup_workflows(network_id);
CREATE INDEX IF NOT EXISTS idx_workflows_confidence ON signup_workflows(confidence_score);
CREATE INDEX IF NOT EXISTS idx_workflows_hash ON signup_workflows(workflow_hash);
CREATE INDEX IF NOT EXISTS idx_logs_network ON compliance_logs(network_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON compliance_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_level ON compliance_logs(compliance_level);
CREATE INDEX IF NOT EXISTS idx_logs_approved ON compliance_logs(human_approved);

-- Schema metadata
INSERT OR IGNORE INTO schema_metadata (key, value)
VALUES ('affiliate_extension_version', '1');

INSERT OR IGNORE INTO schema_metadata (key, value)
VALUES ('affiliate_extension_created_at', strftime('%s', 'now') * 1000);
`;

/**
 * Migration object for affiliate extension
 * This should be added to the migrations array in migrations.ts
 */
export const affiliateExtensionMigration: Migration = {
  version: 2,
  name: 'affiliate_extension',
  up: async (db: Database) => {
    const sql = getAffiliateSchemaSQL();
    db.exec(sql);
    console.log('[Migration] Affiliate extension tables created successfully');
  },
  down: async (db: Database) => {
    db.exec(`
      DROP TABLE IF EXISTS compliance_logs;
      DROP TABLE IF EXISTS signup_workflows;
      DROP TABLE IF EXISTS affiliate_links;
      DROP TABLE IF EXISTS affiliate_networks;
      DELETE FROM schema_metadata WHERE key LIKE 'affiliate_extension_%';
    `);
    console.log('[Migration] Affiliate extension tables dropped');
  },
};

// ============================================================================
// IndexedDB Migration for Affiliate Extension
// ============================================================================

/**
 * Applies affiliate extension schema to IndexedDB
 * This should be called from IndexedDBMigrationManager.applyVersion2()
 */
export function applyAffiliateExtensionToIndexedDB(db: IDBDatabase): void {
  // Affiliate Networks
  if (!db.objectStoreNames.contains('affiliate_networks')) {
    const networksStore = db.createObjectStore('affiliate_networks', {
      keyPath: 'id',
    });
    networksStore.createIndex('domain', 'domain', { unique: false });
    networksStore.createIndex('tos_level', 'tos_level', { unique: false });
    networksStore.createIndex('signup_status', 'signup_status', { unique: false });
    console.log('[IndexedDB] Created affiliate_networks object store');
  }

  // Affiliate Links
  if (!db.objectStoreNames.contains('affiliate_links')) {
    const linksStore = db.createObjectStore('affiliate_links', {
      keyPath: 'id',
      autoIncrement: true,
    });
    linksStore.createIndex('network_id', 'network_id', { unique: false });
    linksStore.createIndex('url', 'url', { unique: true });
    linksStore.createIndex('is_active', 'is_active', { unique: false });
    linksStore.createIndex('extracted_at', 'extracted_at', { unique: false });
    console.log('[IndexedDB] Created affiliate_links object store');
  }

  // Signup Workflows
  if (!db.objectStoreNames.contains('signup_workflows')) {
    const workflowsStore = db.createObjectStore('signup_workflows', {
      keyPath: 'id',
      autoIncrement: true,
    });
    workflowsStore.createIndex('network_id', 'network_id', { unique: false });
    workflowsStore.createIndex('workflow_hash', 'workflow_hash', { unique: false });
    workflowsStore.createIndex('confidence_score', 'confidence_score', { unique: false });
    console.log('[IndexedDB] Created signup_workflows object store');
  }

  // Compliance Logs
  if (!db.objectStoreNames.contains('compliance_logs')) {
    const logsStore = db.createObjectStore('compliance_logs', {
      keyPath: 'id',
      autoIncrement: true,
    });
    logsStore.createIndex('network_id', 'network_id', { unique: false });
    logsStore.createIndex('timestamp', 'timestamp', { unique: false });
    logsStore.createIndex('compliance_level', 'compliance_level', { unique: false });
    logsStore.createIndex('human_approved', 'human_approved', { unique: false });
    console.log('[IndexedDB] Created compliance_logs object store');
  }
}

// ============================================================================
// Integration Instructions
// ============================================================================

/**
 * To integrate this migration into the main AgentDB:
 *
 * 1. In migrations.ts, add this migration to the migrations array:
 *    import { affiliateExtensionMigration } from './affiliate-migration';
 *    const migrations: Migration[] = [
 *      // ... existing migrations
 *      affiliateExtensionMigration,
 *    ];
 *
 * 2. In migrations.ts IndexedDBMigrationManager, add version 2 handler:
 *    if (oldVersion < 2) {
 *      applyAffiliateExtensionToIndexedDB(db);
 *    }
 *
 * 3. Update SCHEMA_VERSION in schema.ts to 2
 *
 * 4. Import types in your code:
 *    import {
 *      AffiliateNetwork,
 *      AffiliateLink,
 *      SignupWorkflow,
 *      ComplianceLog,
 *      TOSLevel
 *    } from './affiliate-types';
 */
