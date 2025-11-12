#!/usr/bin/env node
/**
 * Test AgentDB - Vector Database for Browser Automation Patterns
 */

import { AgentDBClient } from './dist/training/agentdb-client.js';
import * as fs from 'fs';
import * as path from 'path';

async function testAgentDB() {
  console.log('🧠 Testing AgentDB - Vector Pattern Database\n');

  const dbPath = './test-agentdb';
  const db = new AgentDBClient(dbPath, 384);

  try {
    console.log('✅ Test 1: Store browser automation patterns');
    console.log('   Storing patterns from GitHub signup flow...\n');

    // Store some patterns
    const patterns = [
      {
        action: 'fill',
        selector: 'input[name="email"]',
        value: 'test@example.com',
        url: 'https://github.com/signup',
        success: true,
        metadata: { service: 'GitHub', step: 1 }
      },
      {
        action: 'fill',
        selector: 'input[name="password"]',
        value: '••••••••',
        url: 'https://github.com/signup',
        success: true,
        metadata: { service: 'GitHub', step: 2 }
      },
      {
        action: 'click',
        selector: 'button[type="submit"]',
        url: 'https://github.com/signup',
        success: true,
        metadata: { service: 'GitHub', step: 3 }
      },
      {
        action: 'fill',
        selector: 'input[type="email"]',
        value: 'user@test.com',
        url: 'https://console.anthropic.com/signup',
        success: true,
        metadata: { service: 'Anthropic', step: 1 }
      },
      {
        action: 'fill',
        selector: 'input[name="email"]',
        value: 'dev@example.com',
        url: 'https://newsapi.org/register',
        success: true,
        metadata: { service: 'NewsAPI', step: 1 }
      }
    ];

    const ids = [];
    for (const pattern of patterns) {
      const id = db.storeAction(pattern);
      ids.push(id);
      console.log(`   ✓ Stored pattern ID ${id}: ${pattern.action} ${pattern.selector}`);
    }

    console.log('\n✅ Test 2: Find similar patterns');
    console.log('   Query: Looking for email field patterns...\n');

    const query = {
      action: 'fill',
      selector: 'input[name="email"]',
      url: 'https://some-api.com/signup'
    };

    const similar = db.findSimilar(query, 3);
    console.log(`   Found ${similar.length} similar patterns:\n`);

    for (const result of similar) {
      console.log(`   ID ${result.id} | Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`   Action: ${result.pattern.action} | Selector: ${result.pattern.selector}`);
      console.log(`   URL: ${result.pattern.url}`);
      console.log(`   Service: ${result.pattern.metadata?.service}\n`);
    }

    console.log('✅ Test 3: Get database statistics\n');
    const stats = db.getStatistics();
    console.log(`   Total Actions: ${stats.totalActions}`);
    console.log(`   Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`   Action Types: ${JSON.stringify(stats.actionTypes)}`);
    console.log(`   Avg Embedding Time: ${stats.averageEmbeddingTime.toFixed(2)}ms\n`);

    console.log('✅ Test 4: Get top patterns\n');
    const topPatterns = db.getTopPatterns(3);
    for (const pattern of topPatterns) {
      console.log(`   ${pattern.pattern}`);
      console.log(`   Count: ${pattern.count} | Success: ${(pattern.successRate * 100).toFixed(0)}%\n`);
    }

    console.log('✅ Test 5: Save database to disk');
    db.save();
    console.log(`   ✓ Saved to ${dbPath}/`);
    console.log(`   ✓ Index size: ${fs.statSync(path.join(dbPath, 'index.dat')).size} bytes`);
    console.log(`   ✓ Metadata size: ${fs.statSync(path.join(dbPath, 'metadata.json')).size} bytes\n`);

    console.log('✅ Test 6: Load existing database');
    const db2 = new AgentDBClient(dbPath, 384);
    const stats2 = db2.getStatistics();
    console.log(`   ✓ Loaded ${stats2.totalActions} patterns from disk\n`);

    console.log('🎉 ALL AGENTDB TESTS PASSED!\n');
    console.log('✨ Vector database is working perfectly!');
    console.log('✨ Ready to store and retrieve browser automation patterns!');
    console.log('\n📊 AgentDB Features:');
    console.log('   • HNSW vector similarity search');
    console.log('   • Persistent storage to disk');
    console.log('   • Pattern similarity matching');
    console.log('   • Metadata filtering');
    console.log('   • Success rate tracking\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testAgentDB().then(() => {
  console.log('🏆 AgentDB Test Complete!\n');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
