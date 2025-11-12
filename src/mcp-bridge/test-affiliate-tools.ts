/**
 * Test script for Affiliate Automation Tools
 * Demonstrates usage of all affiliate MCP tools
 */

import { BrowserController } from './browser-controller.js';
import { AffiliateAutomationTools } from './affiliate-commands.js';

async function testAffiliateTools(): Promise<void> {
  console.log('=== Affiliate Automation Tools Test Suite ===\n');

  // Initialize browser and tools
  const browser = new BrowserController({
    headless: false,
    slowMo: 100,
  });

  const affiliateTools = new AffiliateAutomationTools(browser);

  try {
    // Test 1: Network Detection
    console.log('TEST 1: Network Detection');
    console.log('-------------------------');
    const testUrls = [
      'https://shareasale.com/signup',
      'https://www.cj.com/affiliate',
      'https://affiliate-program.amazon.com',
      'https://example.com',
    ];

    for (const url of testUrls) {
      const detection = await affiliateTools.detectNetwork(url);
      console.log(`URL: ${url}`);
      console.log(`  Network: ${detection.name} (${detection.networkId})`);
      console.log(`  ToS Level: ${detection.tosLevel}`);
      console.log(`  Can Automate: ${detection.canAutomate}`);
      console.log(`  Confidence: ${(detection.confidence * 100).toFixed(0)}%`);
      console.log('');
    }

    // Test 2: Compliance Checking
    console.log('\nTEST 2: Compliance Checking');
    console.log('---------------------------');
    const complianceTests = [
      { action: 'extract_links', network: 'shareASale' },
      { action: 'auto_signup', network: 'amazon_associates' },
      { action: 'auto_submit', network: 'cj' },
    ];

    for (const test of complianceTests) {
      const compliance = await affiliateTools.checkCompliance(
        test.action,
        test.network
      );
      console.log(`Action: ${test.action} on ${test.network}`);
      console.log(`  Allowed: ${compliance.allowed}`);
      console.log(`  Level: ${compliance.level}`);
      console.log(`  Reason: ${compliance.reason}`);
      console.log(`  Requires Human: ${compliance.requiresHuman}`);
      if (compliance.recommendations) {
        console.log(`  Recommendations:`);
        compliance.recommendations.forEach((rec) =>
          console.log(`    - ${rec}`)
        );
      }
      console.log('');
    }

    // Test 3: Get Network Status
    console.log('\nTEST 3: Network Status');
    console.log('---------------------');
    const status = await affiliateTools.getNetworkStatus();
    console.log(`Total networks: ${status.networks.length}`);
    console.log('\nFirst 5 networks:');
    status.networks.slice(0, 5).forEach((network) => {
      console.log(`  ${network.name} (${network.id})`);
      console.log(`    Status: ${network.signupStatus}`);
      console.log(`    Links: ${network.linkCount}`);
    });

    // Test 4: Deep Link Generation
    console.log('\n\nTEST 4: Deep Link Generation');
    console.log('----------------------------');
    const linkTests = [
      {
        url: 'https://example.com/product',
        network: 'shareASale',
        affiliateId: 'TEST123',
      },
      {
        url: 'https://example.com/software',
        network: 'impact',
        affiliateId: 'IMPACT456',
      },
    ];

    for (const test of linkTests) {
      const deepLink = await affiliateTools.generateDeepLink(
        test.url,
        test.network,
        test.affiliateId
      );
      if (deepLink) {
        console.log(`Original: ${test.url}`);
        console.log(`Network: ${test.network}`);
        console.log(`Affiliate Link: ${deepLink.affiliateUrl}`);
        console.log(`Tracking ID: ${deepLink.trackingId}`);
        console.log('');
      }
    }

    // Test 5: Link Extraction (requires actual page navigation)
    console.log('\nTEST 5: Link Extraction (Mock)');
    console.log('------------------------------');
    console.log('Note: This test requires navigation to a real affiliate page.');
    console.log('Example usage:');
    console.log('  await browser.launch();');
    console.log('  await browser.navigate("https://shareasale.com/merchants");');
    console.log('  const links = await affiliateTools.extractLinks();');
    console.log('  console.log(`Extracted ${links.count} links`);');

    // Test 6: Signup Assistance (requires actual page navigation)
    console.log('\n\nTEST 6: Signup Assistance (Mock)');
    console.log('--------------------------------');
    console.log('Note: This test requires navigation to a signup form.');
    console.log('Example usage:');
    console.log('  await browser.navigate("https://shareasale.com/signup");');
    console.log('  const result = await affiliateTools.assistSignup(');
    console.log('    "shareASale",');
    console.log('    {');
    console.log('      email: "test@example.com",');
    console.log('      firstName: "John",');
    console.log('      lastName: "Doe",');
    console.log('      website: "https://example.com"');
    console.log('    }');
    console.log('  );');
    console.log('  console.log(`Status: ${result.status}`);');
    console.log('  console.log(`Next step: ${result.nextStep}`);');

    // Test 7: Get Supported Networks
    console.log('\n\nTEST 7: Supported Networks');
    console.log('--------------------------');
    const networks = affiliateTools.getSupportedNetworks();
    console.log(`Total supported networks: ${networks.length}\n`);
    networks.forEach((network) => {
      console.log(`${network.name} (${network.id})`);
      console.log(`  Domains: ${network.domains.join(', ')}`);
    });

    console.log('\n=== All Tests Completed ===');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Cleanup
    if (browser.isActive()) {
      await browser.close();
    }
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAffiliateTools().catch(console.error);
}

export { testAffiliateTools };
