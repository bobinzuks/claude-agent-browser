# AgentDB Affiliate Network Extension

Complete database schema and TypeScript implementation for managing affiliate network data in AgentDB.

## Overview

This extension adds four new tables to AgentDB for managing affiliate networks, tracking links, learning signup workflows, and maintaining compliance logs. All data is privacy-safe and follows the same principles as the core AgentDB schema.

## Files

- **affiliate-schema.sql** - SQL schema definition for all tables and indexes
- **affiliate-types.ts** - TypeScript interfaces and type definitions
- **affiliate-migration.ts** - Migration to integrate with existing AgentDB
- **affiliate-db.ts** - Database operations and CRUD methods

## Schema Design

### Tables

#### 1. affiliate_networks
Stores metadata about affiliate networks and their compliance levels.

```sql
CREATE TABLE affiliate_networks (
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
  metadata TEXT, -- JSON
  created_at INTEGER,
  updated_at INTEGER
);
```

**TOS Levels:**
- `0` - Fully automated (API or documented automation support)
- `1` - Human-guided automation (standard forms, no restrictions)
- `2` - Manual verification required (email/phone verification)
- `3` - Fully manual (anti-bot measures, complex verification)

#### 2. affiliate_links
Tracks extracted affiliate links with validation status.

```sql
CREATE TABLE affiliate_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  network_id TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  product_id TEXT,
  product_name TEXT,
  commission TEXT,
  extracted_at INTEGER NOT NULL,
  last_validated INTEGER,
  is_active BOOLEAN DEFAULT 1,
  metadata TEXT, -- JSON
  created_at INTEGER,
  updated_at INTEGER,
  FOREIGN KEY (network_id) REFERENCES affiliate_networks(id)
);
```

#### 3. signup_workflows
Learns and stores patterns for affiliate network signup processes.

```sql
CREATE TABLE signup_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  network_id TEXT NOT NULL,
  form_fields TEXT NOT NULL, -- JSON array
  success_count INTEGER DEFAULT 0,
  last_used INTEGER,
  confidence_score REAL DEFAULT 0.0,
  workflow_hash TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  FOREIGN KEY (network_id) REFERENCES affiliate_networks(id)
);
```

#### 4. compliance_logs
Tracks all compliance-sensitive actions for audit purposes.

```sql
CREATE TABLE compliance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  network_id TEXT,
  action TEXT NOT NULL,
  compliance_level TEXT NOT NULL CHECK(compliance_level IN ('info', 'warning', 'critical')),
  human_approved BOOLEAN,
  timestamp INTEGER NOT NULL,
  details TEXT, -- JSON
  created_at INTEGER,
  FOREIGN KEY (network_id) REFERENCES affiliate_networks(id)
);
```

## TypeScript Types

### Core Interfaces

```typescript
interface AffiliateNetwork {
  id: string;
  name: string;
  domain: string;
  tos_level: TOSLevel;
  api_available: boolean;
  signup_url?: string;
  dashboard_url?: string;
  signup_status?: SignupStatus;
  signup_date?: number;
  last_accessed?: number;
  metadata?: AffiliateNetworkMetadata;
  created_at: number;
  updated_at: number;
}

interface AffiliateLink {
  id?: number;
  network_id: string;
  url: string;
  product_id?: string;
  product_name?: string;
  commission?: string;
  extracted_at: number;
  last_validated?: number;
  is_active: boolean;
  metadata?: AffiliateLinkMetadata;
  created_at: number;
  updated_at: number;
}

interface SignupWorkflow {
  id?: number;
  network_id: string;
  form_fields: FormField[];
  success_count: number;
  last_used?: number;
  confidence_score: number;
  workflow_hash?: string;
  created_at: number;
  updated_at: number;
}

interface ComplianceLog {
  id?: number;
  network_id?: string;
  action: string;
  compliance_level: ComplianceLevel;
  human_approved?: boolean;
  timestamp: number;
  details?: ComplianceLogDetails;
  created_at: number;
}
```

### Enums

```typescript
enum TOSLevel {
  FULLY_AUTOMATED = 0,
  HUMAN_GUIDED = 1,
  MANUAL_VERIFICATION = 2,
  FULLY_MANUAL = 3,
}

type SignupStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';
type ComplianceLevel = 'info' | 'warning' | 'critical';
```

## Usage Examples

### 1. Creating a Network

```typescript
import { AffiliateDB, TOSLevel } from './database/affiliate-db';
import { InsertAffiliateNetwork } from './database/affiliate-types';

const affiliateDB = new AffiliateDB(sqliteDb);

const network: InsertAffiliateNetwork = {
  id: 'shareasale',
  name: 'ShareASale',
  domain: 'shareasale.com',
  tos_level: TOSLevel.HUMAN_GUIDED,
  api_available: true,
  signup_url: 'https://account.shareasale.com/newsignup.cfm',
  dashboard_url: 'https://account.shareasale.com/',
  signup_status: 'pending',
  metadata: {
    notes: 'Requires website verification',
    minimum_payout: 50,
    payment_methods: ['check', 'direct_deposit'],
  },
};

const networkId = await affiliateDB.networks.insertNetwork(network);
```

### 2. Adding Affiliate Links

```typescript
const link: InsertAffiliateLink = {
  network_id: 'shareasale',
  url: 'https://shareasale.com/r.cfm?b=123&u=456&m=789',
  product_id: 'prod-123',
  product_name: 'Example Product',
  commission: '10%',
  extracted_at: Date.now(),
  is_active: true,
  metadata: {
    category: 'electronics',
    tags: ['laptops', 'computers'],
  },
};

const linkId = await affiliateDB.links.insertLink(link);
```

### 3. Storing Signup Workflow

```typescript
import { FormField } from './database/affiliate-types';

const formFields: FormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email Address',
    required: true,
    autocomplete: 'email',
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    required: true,
    sensitive: true,
    validation_rules: [
      { type: 'min', value: 8, message: 'Minimum 8 characters' },
    ],
  },
  {
    name: 'website_url',
    type: 'url',
    label: 'Website URL',
    required: true,
    pattern: '^https?://.*',
  },
];

const workflow: InsertSignupWorkflow = {
  network_id: 'shareasale',
  form_fields: formFields,
  success_count: 1,
  confidence_score: 0.8,
  last_used: Date.now(),
};

const workflowId = await affiliateDB.workflows.upsertWorkflow(workflow);
```

### 4. Logging Compliance Events

```typescript
import { createComplianceLog } from './database/affiliate-types';

const log = createComplianceLog(
  'signup_attempt',
  'info',
  {
    action_details: 'Attempted automated signup',
    context: { tos_level: TOSLevel.HUMAN_GUIDED },
    user_id: 'agent-123',
  },
  'shareasale'
);

await affiliateDB.compliance.insertLog(log);
```

### 5. Querying Data

```typescript
// Get network with statistics
const networkStats = await affiliateDB.networks.getNetworkWithStats('shareasale');
console.log(`Network: ${networkStats.name}`);
console.log(`Total links: ${networkStats.link_count}`);
console.log(`Active links: ${networkStats.active_link_count}`);

// Get best workflow for a network
const bestWorkflow = await affiliateDB.workflows.getBestWorkflow('shareasale');
console.log(`Confidence: ${bestWorkflow.confidence_score}`);
console.log(`Success count: ${bestWorkflow.success_count}`);

// Get recent compliance logs
const recentLogs = await affiliateDB.compliance.getAllLogs(10);
recentLogs.forEach(log => {
  console.log(`[${log.compliance_level}] ${log.action}`);
});

// Get active links by network
const activeLinks = await affiliateDB.links.getActiveLinksByNetwork('shareasale');
console.log(`Found ${activeLinks.length} active links`);
```

## Integration with AgentDB

### Step 1: Add Migration

Edit `src/database/migrations.ts`:

```typescript
import { affiliateExtensionMigration } from './affiliate-migration';

const migrations: Migration[] = [
  // ... existing migrations
  affiliateExtensionMigration,
];
```

### Step 2: Update IndexedDB Support

In `IndexedDBMigrationManager` class:

```typescript
import { applyAffiliateExtensionToIndexedDB } from './affiliate-migration';

request.onupgradeneeded = (event) => {
  const db = (event.target as IDBOpenDBRequest).result;
  const oldVersion = event.oldVersion;

  if (oldVersion < 1) {
    this.applyVersion1(db);
  }
  if (oldVersion < 2) {
    applyAffiliateExtensionToIndexedDB(db);
  }
};
```

### Step 3: Update Schema Version

Edit `src/database/schema.ts`:

```typescript
export const SCHEMA_VERSION = 2;
```

### Step 4: Use in Your Code

```typescript
import { AgentDB } from './database/agentdb';
import { AffiliateDB } from './database/affiliate-db';

// Initialize AgentDB
const agentDB = new AgentDB('sqlite');
await agentDB.initialize(sqliteModule);

// Create affiliate DB interface
const affiliateDB = new AffiliateDB(agentDB.sqliteDb);

// Now you can use all affiliate operations
await affiliateDB.networks.insertNetwork({...});
await affiliateDB.links.insertLink({...});
```

## Privacy & Compliance

### Privacy-Safe Design

1. **No Sensitive Data Storage**: Passwords, API keys, and credentials are NEVER stored
2. **Sensitive Field Marking**: Form fields are marked as `sensitive: true` to prevent value storage
3. **Compliance Logging**: All actions are logged for audit purposes
4. **Human Approval Tracking**: Critical actions can require human approval

### Form Field Sensitivity Detection

```typescript
import { isSensitiveField } from './database/affiliate-types';

const field: FormField = {
  name: 'password',
  type: 'password',
  label: 'Password',
  required: true,
};

if (isSensitiveField(field)) {
  // Never store the actual value
  console.log('This field should not store values');
}
```

### TOS Compliance Checking

```typescript
import { getTOSLevelDescription, TOSLevel } from './database/affiliate-types';

const network = await affiliateDB.networks.getNetwork('shareasale');

console.log(`TOS Level: ${network.tos_level}`);
console.log(`Description: ${getTOSLevelDescription(network.tos_level)}`);

if (network.tos_level >= TOSLevel.MANUAL_VERIFICATION) {
  console.log('This network requires manual verification');
  // Prompt for human intervention
}
```

## Indexes

All tables include optimized indexes for common query patterns:

```sql
-- Networks
idx_networks_domain
idx_networks_tos
idx_networks_status

-- Links
idx_links_network
idx_links_active
idx_links_extracted

-- Workflows
idx_workflows_network
idx_workflows_confidence
idx_workflows_hash

-- Compliance
idx_logs_network
idx_logs_timestamp
idx_logs_level
idx_logs_approved
```

## Testing

```typescript
// Example test
import { AffiliateDB, TOSLevel } from './database/affiliate-db';

async function testAffiliateDB() {
  const db = new AffiliateDB(sqliteDb);

  // Create network
  const networkId = await db.networks.insertNetwork({
    id: 'test-network',
    name: 'Test Network',
    domain: 'test.com',
    tos_level: TOSLevel.HUMAN_GUIDED,
    api_available: false,
  });

  // Create link
  const linkId = await db.links.insertLink({
    network_id: networkId,
    url: 'https://test.com/aff?id=123',
    extracted_at: Date.now(),
    is_active: true,
  });

  // Verify
  const network = await db.networks.getNetwork(networkId);
  const links = await db.links.getLinksByNetwork(networkId);

  console.log(`Network: ${network.name}`);
  console.log(`Links: ${links.length}`);

  // Cleanup
  await db.networks.deleteNetwork(networkId);
}
```

## Migration Strategy

The affiliate extension is designed as a **non-breaking addition** to AgentDB:

- Existing tables are unchanged
- New tables are isolated
- Foreign keys use `ON DELETE CASCADE` for automatic cleanup
- Schema version increments from 1 to 2
- Backward compatible with existing code

## Best Practices

1. **Always use TOSLevel enum** instead of raw numbers
2. **Store metadata as typed objects** (they'll be JSON-serialized automatically)
3. **Log all compliance-sensitive actions** using ComplianceLogDB
4. **Mark sensitive fields** in signup workflows
5. **Validate URLs** before inserting links
6. **Use upsertWorkflow** to avoid duplicates
7. **Check network TOS level** before automation attempts

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         AgentDB                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Sessions   │  │   Actions    │  │   Patterns   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Affiliate Extension (v2)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Networks   │◄─┤    Links     │  │  Workflows   │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                     │
│         └──────────────┬──────────────┐                     │
│                        ▼              ▼                      │
│                 ┌──────────────┐  ┌──────────────┐         │
│                 │ Compliance   │  │   Metadata   │         │
│                 │     Logs     │  │   (JSON)     │         │
│                 └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## License

Same as AgentDB - part of the claude-agent-browser project.
