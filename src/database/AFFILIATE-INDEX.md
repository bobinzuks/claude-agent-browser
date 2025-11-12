# Affiliate Extension - Quick Reference

## Files Overview

| File | Lines | Purpose |
|------|-------|---------|
| `affiliate-schema.sql` | 117 | SQL schema definition with tables and indexes |
| `affiliate-types.ts` | 353 | TypeScript interfaces and type definitions |
| `affiliate-migration.ts` | 230 | Migration integration for AgentDB |
| `affiliate-db.ts` | 706 | Database operations and CRUD methods |
| `AFFILIATE-README.md` | - | Complete documentation and examples |

**Total:** 1,406 lines of code + comprehensive documentation

## Database Schema

### Tables Created

1. **affiliate_networks** - Network metadata and TOS compliance
2. **affiliate_links** - Tracked affiliate links with validation
3. **signup_workflows** - Learned signup form patterns
4. **compliance_logs** - Audit trail for compliance

### Indexes Created (16 total)

- 3x Networks indexes (domain, tos, status)
- 3x Links indexes (network, active, extracted)
- 3x Workflows indexes (network, confidence, hash)
- 4x Compliance indexes (network, timestamp, level, approved)
- 3x Additional metadata indexes

## TypeScript Types

### Main Interfaces
- `AffiliateNetwork` - Network entity
- `AffiliateLink` - Link entity
- `SignupWorkflow` - Workflow pattern
- `ComplianceLog` - Compliance record
- `FormField` - Form field definition

### Enums
- `TOSLevel` - Compliance levels (0-3)
- `SignupStatus` - Status tracking
- `ComplianceLevel` - Log severity
- `FormFieldType` - Input types

### Helper Types
- `InsertX` - Insert operations (omits auto-generated)
- `UpdateX` - Update operations (partial)
- `NetworkWithStats` - Extended queries
- `LinkWithNetwork` - Joined queries

## Database Operations

### AffiliateDB Class
```typescript
class AffiliateDB {
  networks: AffiliateNetworkDB;   // Network CRUD
  links: AffiliateLinkDB;         // Link CRUD
  workflows: SignupWorkflowDB;    // Workflow CRUD
  compliance: ComplianceLogDB;    // Compliance logging
}
```

### Key Methods

#### Networks
- `insertNetwork()` - Create new network
- `getNetwork(id)` - Get by ID
- `getAllNetworks()` - List all
- `getNetworksByTOSLevel(level)` - Filter by compliance
- `updateNetwork(id, updates)` - Update fields
- `deleteNetwork(id)` - Delete (cascades)
- `getNetworkWithStats(id)` - Get with link counts

#### Links
- `insertLink()` - Add affiliate link
- `getLink(id)` - Get by ID
- `getLinksByNetwork(networkId)` - All links for network
- `getActiveLinksByNetwork(networkId)` - Active only
- `updateLink(id, updates)` - Update link
- `deleteLink(id)` - Remove link
- `getLinkWithNetwork(id)` - Get with network details

#### Workflows
- `upsertWorkflow()` - Insert or update (auto-dedupe)
- `getWorkflowsByNetwork(networkId)` - All workflows
- `getBestWorkflow(networkId)` - Highest confidence
- `updateWorkflowConfidence(id, score)` - Update score
- `deleteWorkflow(id)` - Remove workflow

#### Compliance
- `insertLog()` - Add log entry
- `getLogsByNetwork(networkId, limit?)` - Network logs
- `getLogsByLevel(level, limit?)` - Filter by severity
- `getAllLogs(limit?)` - All logs

## Utility Functions

```typescript
// Type checking
isSensitiveField(field: FormField): boolean
isValidTOSLevel(level: number): boolean
isValidAffiliateUrl(url: string): boolean

// Hashing
generateWorkflowHash(fields: FormField[]): Promise<string>

// Formatting
getTOSLevelDescription(level: TOSLevel): string
extractDomain(url: string): string

// Factory
createComplianceLog(action, level, details?, networkId?): InsertComplianceLog
```

## Quick Start

```typescript
import { AffiliateDB } from './database/affiliate-db';
import { TOSLevel } from './database/affiliate-types';

// 1. Initialize
const affiliateDB = new AffiliateDB(sqliteDb);

// 2. Create network
await affiliateDB.networks.insertNetwork({
  id: 'network-id',
  name: 'Network Name',
  domain: 'example.com',
  tos_level: TOSLevel.HUMAN_GUIDED,
  api_available: true,
});

// 3. Add link
await affiliateDB.links.insertLink({
  network_id: 'network-id',
  url: 'https://example.com/aff?id=123',
  extracted_at: Date.now(),
  is_active: true,
});

// 4. Store workflow
await affiliateDB.workflows.upsertWorkflow({
  network_id: 'network-id',
  form_fields: [...],
  confidence_score: 0.8,
});

// 5. Log compliance
await affiliateDB.compliance.insertLog({
  network_id: 'network-id',
  action: 'signup_attempt',
  compliance_level: 'info',
  timestamp: Date.now(),
});
```

## TOS Compliance Levels

| Level | Name | Description | Automation |
|-------|------|-------------|------------|
| 0 | FULLY_AUTOMATED | API or documented support | Full auto OK |
| 1 | HUMAN_GUIDED | Standard forms | Guided auto OK |
| 2 | MANUAL_VERIFICATION | Email/phone verify | Manual steps required |
| 3 | FULLY_MANUAL | Anti-bot measures | Manual only |

## Privacy Guarantees

- ✅ No passwords stored
- ✅ No API keys stored
- ✅ No credit cards stored
- ✅ Sensitive fields marked
- ✅ All actions logged
- ✅ Human approval tracking

## Integration Checklist

- [ ] Add `affiliateExtensionMigration` to migrations array
- [ ] Add `applyAffiliateExtensionToIndexedDB()` call
- [ ] Update `SCHEMA_VERSION` to 2
- [ ] Import types where needed
- [ ] Run migration
- [ ] Test CRUD operations
- [ ] Verify indexes created

## File Locations

```
src/database/
├── affiliate-schema.sql       # SQL definitions
├── affiliate-types.ts         # TypeScript types
├── affiliate-migration.ts     # Migration logic
├── affiliate-db.ts           # Database operations
├── AFFILIATE-README.md       # Full documentation
└── AFFILIATE-INDEX.md        # This file
```

## Common Patterns

### Check TOS Before Automation
```typescript
const network = await affiliateDB.networks.getNetwork(networkId);
if (network.tos_level >= TOSLevel.MANUAL_VERIFICATION) {
  // Require human intervention
}
```

### Track Signup Attempt
```typescript
await affiliateDB.compliance.insertLog(
  createComplianceLog('signup_attempt', 'info', {
    tos_level: network.tos_level,
    automated: false,
  }, networkId)
);
```

### Validate Link Before Use
```typescript
const link = await affiliateDB.links.getLink(linkId);
if (!link.is_active || !link.last_validated) {
  // Re-validate link
  await affiliateDB.links.updateLink(linkId, {
    last_validated: Date.now(),
  });
}
```

### Learn From Success
```typescript
// After successful signup
const workflow = await affiliateDB.workflows.getBestWorkflow(networkId);
await affiliateDB.workflows.updateWorkflowConfidence(
  workflow.id,
  Math.min(workflow.confidence_score + 0.1, 1.0)
);
```

## Version History

- **v1.0** (2025-11-06) - Initial release
  - 4 tables (networks, links, workflows, compliance)
  - 16 indexes
  - Full CRUD operations
  - Privacy-safe design
  - Complete TypeScript types

## Support

See `AFFILIATE-README.md` for:
- Detailed examples
- Architecture diagrams
- Testing guidelines
- Best practices
- Complete API reference
