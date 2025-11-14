import { AgentDBClient } from '../src/training/agentdb-client.js';
import { ActionPattern } from '../src/training/types.js';

async function testQueries() {
  console.log('🔍 Testing AgentDB Pattern Queries\n');
  console.log('═══════════════════════════════════════\n');

  const db = new AgentDBClient('./data/click-factory', 384);

  // Test 1: Find username patterns
  console.log('Test 1: Username Field Patterns');
  console.log('─────────────────────────────────────');
  const usernameQuery: ActionPattern = {
    action: 'fill',
    selector: 'input[type="text"][name="username"]',
    url: 'https://example.com',
    success: true,
    timestamp: new Date().toISOString()
  };

  const usernameResults = db.findSimilar(usernameQuery, 10, { successOnly: true });
  console.log(`Found ${usernameResults.length} username patterns (success only)`);

  if (usernameResults.length > 0) {
    console.log('\nTop 5 patterns:');
    usernameResults.slice(0, 5).forEach((result, i) => {
      console.log(`  ${i + 1}. ${result.pattern.selector} (${(result.similarity * 100).toFixed(1)}% match)`);
      console.log(`     URL: ${result.pattern.url}`);
      console.log(`     Success: ${result.pattern.success}, Confidence: ${result.pattern.metadata?.confidence ?? 'N/A'}`);
    });
  }

  // Test 2: Find password patterns
  console.log('\n\nTest 2: Password Field Patterns');
  console.log('─────────────────────────────────────');
  const passwordQuery: ActionPattern = {
    action: 'fill',
    selector: 'input[type="password"]',
    url: 'https://example.com',
    success: true,
    timestamp: new Date().toISOString()
  };

  const passwordResults = db.findSimilar(passwordQuery, 10, { successOnly: true });
  console.log(`Found ${passwordResults.length} password patterns (success only)`);

  if (passwordResults.length > 0) {
    console.log('\nTop 5 patterns:');
    passwordResults.slice(0, 5).forEach((result, i) => {
      console.log(`  ${i + 1}. ${result.pattern.selector} (${(result.similarity * 100).toFixed(1)}% match)`);
      console.log(`     URL: ${result.pattern.url}`);
      console.log(`     Success: ${result.pattern.success}, Confidence: ${result.pattern.metadata?.confidence ?? 'N/A'}`);
    });
  }

  // Test 3: Find email patterns
  console.log('\n\nTest 3: Email Field Patterns');
  console.log('─────────────────────────────────────');
  const emailQuery: ActionPattern = {
    action: 'fill',
    selector: 'input[type="email"]',
    url: 'https://example.com',
    success: true,
    timestamp: new Date().toISOString()
  };

  const emailResults = db.findSimilar(emailQuery, 10, { successOnly: true });
  console.log(`Found ${emailResults.length} email patterns (success only)`);

  if (emailResults.length > 0) {
    console.log('\nTop 5 patterns:');
    emailResults.slice(0, 5).forEach((result, i) => {
      console.log(`  ${i + 1}. ${result.pattern.selector} (${(result.similarity * 100).toFixed(1)}% match)`);
      console.log(`     URL: ${result.pattern.url}`);
      console.log(`     Success: ${result.pattern.success}, Confidence: ${result.pattern.metadata?.confidence ?? 'N/A'}`);
    });
  }

  // Test 4: Site-specific patterns
  console.log('\n\nTest 4: Site-Specific Patterns (ParaBank)');
  console.log('─────────────────────────────────────');
  const parabankPatterns = db.queryByMetadata({
    urlPattern: 'parabank.parasoft.com'
  });
  console.log(`Found ${parabankPatterns.length} ParaBank patterns`);

  if (parabankPatterns.length > 0) {
    const successfulParabank = parabankPatterns.filter(p => p.success);
    console.log(`Successful: ${successfulParabank.length} (${(successfulParabank.length / parabankPatterns.length * 100).toFixed(1)}%)`);
  }

  // Test 5: Overall statistics
  console.log('\n\nTest 5: Overall Database Statistics');
  console.log('─────────────────────────────────────');
  const stats = db.getStatistics();
  console.log(`Total patterns: ${stats.totalActions}`);
  console.log(`Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
  console.log(`Total sites: ${stats.uniqueSites}`);
  console.log(`Action types:`, stats.actionTypes);

  // Test 6: Top patterns
  console.log('\n\nTest 6: Top Performing Patterns');
  console.log('─────────────────────────────────────');
  const topPatterns = db.getTopPatterns(15);
  console.log(`Displaying top ${Math.min(15, topPatterns.length)} patterns:\n`);

  topPatterns.forEach((pattern, i) => {
    const key = `${pattern.action}:${pattern.selector}`;
    console.log(`${i + 1}. ${key}`);
    console.log(`   Used: ${pattern.count} times, Success: ${(pattern.successRate * 100).toFixed(1)}%`);
  });

  console.log('\n═══════════════════════════════════════');
  console.log('✅ All query tests completed successfully!');
  console.log('═══════════════════════════════════════\n');
}

testQueries().catch(console.error);
