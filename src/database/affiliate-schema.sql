-- ============================================================================
-- AgentDB Affiliate Network Extension
-- ============================================================================
-- Extends AgentDB schema for affiliate network data management
-- Compatible with SQLite via sql.js
-- Privacy-safe: NEVER stores passwords or sensitive credentials
-- ============================================================================

-- Affiliate networks table
-- Stores metadata about affiliate networks and their compliance levels
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
  metadata TEXT, -- JSON: {notes, requirements, api_docs_url, etc.}
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- Affiliate links table
-- Stores extracted affiliate links and their metadata
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
  metadata TEXT, -- JSON: {category, tags, conversion_rate, etc.}
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (network_id) REFERENCES affiliate_networks(id) ON DELETE CASCADE
);

-- Signup workflows table
-- Learns and stores patterns for affiliate network signup processes
CREATE TABLE IF NOT EXISTS signup_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  network_id TEXT NOT NULL,
  form_fields TEXT NOT NULL, -- JSON: [{name, type, label, required, pattern, etc.}]
  success_count INTEGER DEFAULT 0,
  last_used INTEGER,
  confidence_score REAL DEFAULT 0.0 CHECK(confidence_score >= 0.0 AND confidence_score <= 1.0),
  workflow_hash TEXT, -- SHA-256 hash for deduplication
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (network_id) REFERENCES affiliate_networks(id) ON DELETE CASCADE
);

-- Compliance logs table
-- Tracks all compliance-sensitive actions for audit purposes
CREATE TABLE IF NOT EXISTS compliance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  network_id TEXT,
  action TEXT NOT NULL,
  compliance_level TEXT NOT NULL CHECK(compliance_level IN ('info', 'warning', 'critical')),
  human_approved BOOLEAN,
  timestamp INTEGER NOT NULL,
  details TEXT, -- JSON: {action_details, context, user_id, etc.}
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (network_id) REFERENCES affiliate_networks(id) ON DELETE SET NULL
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Affiliate networks indexes
CREATE INDEX IF NOT EXISTS idx_networks_domain ON affiliate_networks(domain);
CREATE INDEX IF NOT EXISTS idx_networks_tos ON affiliate_networks(tos_level);
CREATE INDEX IF NOT EXISTS idx_networks_status ON affiliate_networks(signup_status);

-- Affiliate links indexes
CREATE INDEX IF NOT EXISTS idx_links_network ON affiliate_links(network_id);
CREATE INDEX IF NOT EXISTS idx_links_active ON affiliate_links(is_active);
CREATE INDEX IF NOT EXISTS idx_links_extracted ON affiliate_links(extracted_at);

-- Signup workflows indexes
CREATE INDEX IF NOT EXISTS idx_workflows_network ON signup_workflows(network_id);
CREATE INDEX IF NOT EXISTS idx_workflows_confidence ON signup_workflows(confidence_score);
CREATE INDEX IF NOT EXISTS idx_workflows_hash ON signup_workflows(workflow_hash);

-- Compliance logs indexes
CREATE INDEX IF NOT EXISTS idx_logs_network ON compliance_logs(network_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON compliance_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_level ON compliance_logs(compliance_level);
CREATE INDEX IF NOT EXISTS idx_logs_approved ON compliance_logs(human_approved);

-- ============================================================================
-- Schema Metadata
-- ============================================================================

-- Update schema version for affiliate extension
INSERT OR IGNORE INTO schema_metadata (key, value)
VALUES ('affiliate_extension_version', '1');

INSERT OR IGNORE INTO schema_metadata (key, value)
VALUES ('affiliate_extension_created_at', strftime('%s', 'now') * 1000);

-- ============================================================================
-- TOS Compliance Levels Reference
-- ============================================================================
-- 0: Fully automated signup allowed (explicit API or documented automation support)
-- 1: Human-guided automation allowed (standard forms, no restrictions)
-- 2: Manual verification required (email verification, phone verification, etc.)
-- 3: Fully manual process only (anti-bot measures, complex verification)
-- ============================================================================
