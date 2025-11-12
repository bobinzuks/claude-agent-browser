#!/usr/bin/env node

/**
 * SIMPLE ARROW TEST - Verify visual injection works
 */

import { chromium } from 'playwright';

async function testArrow() {
  console.log('🧪 Testing arrow visibility...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  try {
    console.log('🌐 Opening PartnerStack...\n');
    await page.goto('https://www.partnerstack.com/partners');
    await page.waitForTimeout(3000);

    console.log('💉 Injecting CENTER SCREEN ARROW...\n');

    // Inject the simplest possible arrow in center of screen
    await page.evaluate(() => {
      const arrow = document.createElement('div');
      arrow.id = 'test-arrow';
      arrow.innerHTML = '👇';

      // Make it IMPOSSIBLE to miss
      arrow.style.position = 'fixed';
      arrow.style.top = '50%';
      arrow.style.left = '50%';
      arrow.style.transform = 'translate(-50%, -50%)';
      arrow.style.fontSize = '200px';
      arrow.style.zIndex = '99999999';
      arrow.style.color = '#00ff00';
      arrow.style.textShadow = '0 0 50px #00ff00, 0 0 100px #00ff00';
      arrow.style.pointerEvents = 'none';

      document.body.appendChild(arrow);

      console.log('Arrow element created:', arrow);
    });

    console.log('✅ Arrow injected!\n');
    console.log('👀 DO YOU SEE A GIANT GREEN ARROW IN THE CENTER?\n');
    console.log('Browser will stay open for 30 seconds...\n');

    await page.waitForTimeout(30000);

    // Take screenshot to verify
    await page.screenshot({ path: '/media/terry/data/projects/projects/chatgpt-atlas/claude-agent-browser/arrow-test.png' });
    console.log('📸 Screenshot saved to arrow-test.png\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('✅ Test complete!\n');
  }
}

testArrow().catch(console.error);
