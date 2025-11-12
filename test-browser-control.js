#!/usr/bin/env node
/**
 * Test script to verify browser automation works
 * This tests the BrowserController with Playwright
 */

import { BrowserController } from './dist/mcp-bridge/browser-controller.js';

async function testBrowserControl() {
  console.log('🎮 Testing Browser Control with Playwright\n');

  const controller = new BrowserController({
    headless: false, // Show browser for demo
    slowMo: 500,     // Slow down for visibility
  });

  try {
    // Test 1: Launch browser
    console.log('✅ Test 1: Launching browser...');
    await controller.launch();
    console.log('   ✓ Browser launched\n');

    // Test 2: Navigate to a page
    console.log('✅ Test 2: Navigating to example.com...');
    const navResult = await controller.navigate('https://example.com');
    console.log(`   ✓ Navigated to: ${navResult.url}`);
    console.log(`   ✓ Page title: ${navResult.title}\n`);

    // Test 3: Execute JavaScript
    console.log('✅ Test 3: Executing JavaScript...');
    const scriptResult = await controller.executeScript(`
      () => {
        return {
          title: document.title,
          url: window.location.href,
          bodyText: document.body.textContent.substring(0, 100)
        };
      }
    `);
    console.log('   ✓ Script executed:');
    console.log('   ', JSON.stringify(scriptResult.data, null, 2), '\n');

    // Test 4: Multiple pages
    console.log('✅ Test 4: Creating multiple pages...');
    const page2 = await controller.newPage();
    console.log(`   ✓ Created page: ${page2}`);

    await controller.navigate('https://www.iana.org/domains/reserved', page2);
    console.log('   ✓ Navigated second page\n');

    console.log(`📊 Active pages: ${controller.getPageCount()}`);
    console.log(`📋 Page IDs: ${controller.getPageIds().join(', ')}\n`);

    // Wait a moment to see the browser
    console.log('⏳ Waiting 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 5: Close browser
    console.log('✅ Test 5: Closing browser...');
    await controller.close();
    console.log('   ✓ Browser closed\n');

    console.log('🎉 ALL TESTS PASSED!\n');
    console.log('✨ Browser automation is working perfectly!');
    console.log('✨ Ready to integrate with deal-bot-facebook-marketplace!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await controller.close();
    process.exit(1);
  }
}

// Run tests
testBrowserControl().then(() => {
  console.log('\n🏆 Browser Control Test Complete!\n');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
