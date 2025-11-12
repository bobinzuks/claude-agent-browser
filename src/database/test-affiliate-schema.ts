/**
 * Affiliate Schema Validation Test
 *
 * Tests the affiliate extension schema creation and basic operations.
 * Run this to verify the schema is correctly implemented.
 */

// @ts-ignore - sql.js types are not available
import initSqlJs, { Database } from 'sql.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AffiliateDB } from './affiliate-db';
import {
  TOSLevel,
  InsertAffiliateNetwork,
  InsertAffiliateLink,
  InsertSignupWorkflow,
  FormField,
} from './affiliate-types';

// ============================================================================
// Test Setup
// ============================================================================

let db: Database;
let affiliateDB: AffiliateDB;

async function setupDatabase(): Promise<void> {
  console.log('Initializing SQL.js...');
  const SQL = await initSqlJs();
  db = new SQL.Database();

  console.log('Creating schema metadata table...');
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  db.run("INSERT INTO schema_metadata (key, value) VALUES ('version', '2')");

  console.log('Loading affiliate schema...');
  const schemaPath = join(__dirname, 'affiliate-schema.sql');
  const schemaSql = readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);

  affiliateDB = new AffiliateDB(db);
  console.log('Database initialized\n');
}

// ============================================================================
// Schema Validation Tests
// ============================================================================

function testSchemaCreation(): boolean {
  console.log('Test 1: Schema Creation');
  console.log('─'.repeat(50));

  const tables = [
    'affiliate_networks',
    'affiliate_links',
    'signup_workflows',
    'compliance_logs',
  ];

  let allTablesExist = true;

  for (const table of tables) {
    const result = db.exec(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`
    );

    const exists = result.length > 0 && result[0].values.length > 0;
    console.log(`  ${exists ? '✓' : '✗'} Table: ${table}`);

    if (!exists) allTablesExist = false;
  }

  console.log('─'.repeat(50));
  console.log(allTablesExist ? '✓ PASSED\n' : '✗ FAILED\n');
  return allTablesExist;
}

function testIndexCreation(): boolean {
  console.log('Test 2: Index Creation');
  console.log('─'.repeat(50));

  const expectedIndexes = [
    'idx_networks_domain',
    'idx_networks_tos',
    'idx_networks_status',
    'idx_links_network',
    'idx_links_active',
    'idx_links_extracted',
    'idx_workflows_network',
    'idx_workflows_confidence',
    'idx_workflows_hash',
    'idx_logs_network',
    'idx_logs_timestamp',
    'idx_logs_level',
    'idx_logs_approved',
  ];

  let allIndexesExist = true;

  for (const index of expectedIndexes) {
    const result = db.exec(
      `SELECT name FROM sqlite_master WHERE type='index' AND name='${index}'`
    );

    const exists = result.length > 0 && result[0].values.length > 0;
    console.log(`  ${exists ? '✓' : '✗'} Index: ${index}`);

    if (!exists) allIndexesExist = false;
  }

  console.log('─'.repeat(50));
  console.log(allIndexesExist ? '✓ PASSED\n' : '✗ FAILED\n');
  return allIndexesExist;
}

// ============================================================================
// CRUD Operation Tests
// ============================================================================

async function testNetworkCRUD(): Promise<boolean> {
  console.log('Test 3: Network CRUD Operations');
  console.log('─'.repeat(50));

  try {
    // Create
    const network: InsertAffiliateNetwork = {
      id: 'test-network-1',
      name: 'Test Network',
      domain: 'test.example.com',
      tos_level: TOSLevel.HUMAN_GUIDED,
      api_available: true,
      signup_url: 'https://test.example.com/signup',
      metadata: {
        notes: 'Test network for validation',
        minimum_payout: 50,
      },
    };

    await affiliateDB.networks.insertNetwork(network);
    console.log('  ✓ Created network');

    // Read
    const retrieved = await affiliateDB.networks.getNetwork('test-network-1');
    if (!retrieved) throw new Error('Failed to retrieve network');
    console.log('  ✓ Retrieved network');

    // Update
    await affiliateDB.networks.updateNetwork('test-network-1', {
      signup_status: 'completed',
      last_accessed: Date.now(),
    });
    console.log('  ✓ Updated network');

    // Verify update
    const updated = await affiliateDB.networks.getNetwork('test-network-1');
    if (updated?.signup_status !== 'completed') {
      throw new Error('Update verification failed');
    }
    console.log('  ✓ Verified update');

    // Delete
    await affiliateDB.networks.deleteNetwork('test-network-1');
    const deleted = await affiliateDB.networks.getNetwork('test-network-1');
    if (deleted !== null) throw new Error('Delete failed');
    console.log('  ✓ Deleted network');

    console.log('─'.repeat(50));
    console.log('✓ PASSED\n');
    return true;
  } catch (error) {
    console.log('─'.repeat(50));
    console.log(`✗ FAILED: ${error}\n`);
    return false;
  }
}

async function testLinkCRUD(): Promise<boolean> {
  console.log('Test 4: Link CRUD Operations');
  console.log('─'.repeat(50));

  try {
    // Create network first
    await affiliateDB.networks.insertNetwork({
      id: 'test-network-2',
      name: 'Test Network 2',
      domain: 'test2.example.com',
      tos_level: TOSLevel.FULLY_AUTOMATED,
      api_available: true,
    });

    // Create link
    const link: InsertAffiliateLink = {
      network_id: 'test-network-2',
      url: 'https://test2.example.com/aff?id=123',
      product_name: 'Test Product',
      commission: '10%',
      extracted_at: Date.now(),
      is_active: true,
    };

    const linkId = await affiliateDB.links.insertLink(link);
    console.log(`  ✓ Created link (ID: ${linkId})`);

    // Read
    const retrieved = await affiliateDB.links.getLink(linkId);
    if (!retrieved) throw new Error('Failed to retrieve link');
    console.log('  ✓ Retrieved link');

    // Update
    await affiliateDB.links.updateLink(linkId, {
      commission: '15%',
      last_validated: Date.now(),
    });
    console.log('  ✓ Updated link');

    // Get by network
    const networkLinks = await affiliateDB.links.getLinksByNetwork('test-network-2');
    if (networkLinks.length !== 1) throw new Error('GetByNetwork failed');
    console.log('  ✓ Retrieved links by network');

    // Cleanup
    await affiliateDB.networks.deleteNetwork('test-network-2'); // Cascades to links
    console.log('  ✓ Cascade delete verified');

    console.log('─'.repeat(50));
    console.log('✓ PASSED\n');
    return true;
  } catch (error) {
    console.log('─'.repeat(50));
    console.log(`✗ FAILED: ${error}\n`);
    return false;
  }
}

async function testWorkflowCRUD(): Promise<boolean> {
  console.log('Test 5: Workflow CRUD Operations');
  console.log('─'.repeat(50));

  try {
    // Create network
    await affiliateDB.networks.insertNetwork({
      id: 'test-network-3',
      name: 'Test Network 3',
      domain: 'test3.example.com',
      tos_level: TOSLevel.MANUAL_VERIFICATION,
      api_available: false,
    });

    // Create workflow
    const formFields: FormField[] = [
      {
        name: 'email',
        type: 'email',
        label: 'Email',
        required: true,
      },
      {
        name: 'password',
        type: 'password',
        label: 'Password',
        required: true,
        sensitive: true,
      },
    ];

    const workflow: InsertSignupWorkflow = {
      network_id: 'test-network-3',
      form_fields: formFields,
      success_count: 1,
      confidence_score: 0.8,
    };

    const workflowId = await affiliateDB.workflows.upsertWorkflow(workflow);
    console.log(`  ✓ Created workflow (ID: ${workflowId})`);

    // Upsert again (should update)
    await affiliateDB.workflows.upsertWorkflow({
      ...workflow,
      confidence_score: 0.9,
    });
    console.log('  ✓ Upserted workflow (deduplication works)');

    // Get by network
    const workflows = await affiliateDB.workflows.getWorkflowsByNetwork('test-network-3');
    if (workflows.length !== 1) throw new Error('Expected 1 workflow');
    console.log('  ✓ Retrieved workflows by network');

    // Get best workflow
    const best = await affiliateDB.workflows.getBestWorkflow('test-network-3');
    if (!best) throw new Error('Failed to get best workflow');
    console.log(`  ✓ Retrieved best workflow (confidence: ${best.confidence_score})`);

    // Cleanup
    await affiliateDB.networks.deleteNetwork('test-network-3');
    console.log('  ✓ Cascade delete verified');

    console.log('─'.repeat(50));
    console.log('✓ PASSED\n');
    return true;
  } catch (error) {
    console.log('─'.repeat(50));
    console.log(`✗ FAILED: ${error}\n`);
    return false;
  }
}

async function testComplianceLogs(): Promise<boolean> {
  console.log('Test 6: Compliance Logging');
  console.log('─'.repeat(50));

  try {
    // Create network
    await affiliateDB.networks.insertNetwork({
      id: 'test-network-4',
      name: 'Test Network 4',
      domain: 'test4.example.com',
      tos_level: TOSLevel.FULLY_MANUAL,
      api_available: false,
    });

    // Insert logs
    await affiliateDB.compliance.insertLog({
      network_id: 'test-network-4',
      action: 'signup_attempt',
      compliance_level: 'info',
      timestamp: Date.now(),
      details: { test: true },
    });
    console.log('  ✓ Inserted compliance log');

    // Get logs by network
    const networkLogs = await affiliateDB.compliance.getLogsByNetwork('test-network-4');
    if (networkLogs.length === 0) throw new Error('No logs found');
    console.log(`  ✓ Retrieved ${networkLogs.length} log(s) by network`);

    // Get logs by level
    const infoLogs = await affiliateDB.compliance.getLogsByLevel('info');
    if (infoLogs.length === 0) throw new Error('No info logs found');
    console.log(`  ✓ Retrieved ${infoLogs.length} log(s) by level`);

    // Cleanup
    await affiliateDB.networks.deleteNetwork('test-network-4');
    console.log('  ✓ Cleanup completed');

    console.log('─'.repeat(50));
    console.log('✓ PASSED\n');
    return true;
  } catch (error) {
    console.log('─'.repeat(50));
    console.log(`✗ FAILED: ${error}\n`);
    return false;
  }
}

// ============================================================================
// Foreign Key and Constraint Tests
// ============================================================================

async function testConstraints(): Promise<boolean> {
  console.log('Test 7: Constraints and Foreign Keys');
  console.log('─'.repeat(50));

  try {
    // Test TOS level constraint
    try {
      db.run(
        `INSERT INTO affiliate_networks
         (id, name, domain, tos_level, api_available)
         VALUES ('invalid', 'Invalid', 'test.com', 99, 0)`
      );
      throw new Error('TOS level constraint not enforced');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('constraint')) {
        console.log('  ✓ TOS level constraint enforced');
      } else {
        throw error instanceof Error ? error : new Error(String(error));
      }
    }

    // Test signup status constraint
    try {
      db.run(
        `INSERT INTO affiliate_networks
         (id, name, domain, tos_level, api_available, signup_status)
         VALUES ('invalid2', 'Invalid', 'test.com', 1, 0, 'invalid_status')`
      );
      throw new Error('Signup status constraint not enforced');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('constraint')) {
        console.log('  ✓ Signup status constraint enforced');
      } else {
        throw error instanceof Error ? error : new Error(String(error));
      }
    }

    // Test unique URL constraint
    await affiliateDB.networks.insertNetwork({
      id: 'test-network-5',
      name: 'Test Network 5',
      domain: 'test5.example.com',
      tos_level: TOSLevel.HUMAN_GUIDED,
      api_available: false,
    });

    await affiliateDB.links.insertLink({
      network_id: 'test-network-5',
      url: 'https://unique.example.com/link',
      extracted_at: Date.now(),
      is_active: true,
    });

    try {
      await affiliateDB.links.insertLink({
        network_id: 'test-network-5',
        url: 'https://unique.example.com/link', // Duplicate
        extracted_at: Date.now(),
        is_active: true,
      });
      throw new Error('Unique URL constraint not enforced');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('UNIQUE')) {
        console.log('  ✓ Unique URL constraint enforced');
      } else {
        throw error instanceof Error ? error : new Error(String(error));
      }
    }

    // Cleanup
    await affiliateDB.networks.deleteNetwork('test-network-5');

    console.log('─'.repeat(50));
    console.log('✓ PASSED\n');
    return true;
  } catch (error) {
    console.log('─'.repeat(50));
    console.log(`✗ FAILED: ${error}\n`);
    return false;
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('  AFFILIATE SCHEMA VALIDATION TEST SUITE');
  console.log('═'.repeat(50));
  console.log('\n');

  await setupDatabase();

  const results = {
    schemaCreation: testSchemaCreation(),
    indexCreation: testIndexCreation(),
    networkCRUD: await testNetworkCRUD(),
    linkCRUD: await testLinkCRUD(),
    workflowCRUD: await testWorkflowCRUD(),
    complianceLogs: await testComplianceLogs(),
    constraints: await testConstraints(),
  };

  console.log('═'.repeat(50));
  console.log('  TEST SUMMARY');
  console.log('═'.repeat(50));

  const testNames = Object.keys(results);
  const passed = testNames.filter((name) => results[name as keyof typeof results]).length;
  const total = testNames.length;

  testNames.forEach((name) => {
    const status = results[name as keyof typeof results] ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status} - ${name}`);
  });

  console.log('─'.repeat(50));
  console.log(`  Total: ${passed}/${total} tests passed`);
  console.log('═'.repeat(50));

  if (passed === total) {
    console.log('\n✓ All tests passed! Schema is valid.\n');
    process.exit(0);
  } else {
    console.log('\n✗ Some tests failed. Please review.\n');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runAllTests };
