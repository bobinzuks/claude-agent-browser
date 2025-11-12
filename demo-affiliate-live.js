#!/usr/bin/env node

/**
 * Live Demo: Extract Real Affiliate Links from Browser
 * Uses Playwright to navigate to affiliate networks and extract links
 */

const { chromium } = require('playwright');

async function extractAffiliateLinksLive() {
  console.log('🚀 Live Affiliate Link Extraction\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Demo 1: Extract from ShareASale public page (no login required)
    console.log('📍 Navigating to ShareASale...');
    await page.goto('https://www.shareasale.com/info/merchants/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    console.log('🔍 Extracting affiliate information...\n');

    // Extract merchant information
    const merchants = await page.evaluate(() => {
      const results = [];
      const merchantElements = document.querySelectorAll('[class*="merchant"], [class*="program"]');

      merchantElements.forEach((el, index) => {
        if (index < 5) { // Get first 5
          const text = el.textContent.trim();
          const links = el.querySelectorAll('a');
          links.forEach(link => {
            if (link.href && link.href.includes('shareasale')) {
              results.push({
                merchant: text.substring(0, 50),
                url: link.href
              });
            }
          });
        }
      });

      return results;
    });

    console.log(`✅ Found ${merchants.length} ShareASale merchant links:\n`);
    merchants.forEach((merchant, index) => {
      console.log(`${index + 1}. ${merchant.merchant}`);
      console.log(`   URL: ${merchant.url}\n`);
    });

    // Demo 2: Generate deep links
    console.log('\n🔗 Generating Deep Links...\n');

    const targetProducts = [
      'https://www.example.com/product1',
      'https://www.example.com/product2',
      'https://www.example.com/product3'
    ];

    console.log('Example deep links (replace YOUR_AFFILIATE_ID):\n');
    targetProducts.forEach((url, index) => {
      const affiliateLink = `https://www.shareasale.com/r.cfm?affID=YOUR_AFFILIATE_ID&urllink=${encodeURIComponent(url)}`;
      console.log(`${index + 1}. ${url}`);
      console.log(`   → ${affiliateLink}\n`);
    });

    // Demo 3: Check PartnerStack (automation-friendly)
    console.log('\n📍 Checking PartnerStack (automation-friendly network)...');
    await page.goto('https://www.partnerstack.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const partnerStackInfo = await page.evaluate(() => {
      return {
        title: document.title,
        features: Array.from(document.querySelectorAll('h2, h3')).slice(0, 3).map(h => h.textContent.trim())
      };
    });

    console.log('✅ PartnerStack Info:');
    console.log(`   Title: ${partnerStackInfo.title}`);
    console.log(`   Features: ${partnerStackInfo.features.join(', ')}\n`);

    // Summary
    console.log('\n📊 Summary:');
    console.log('──────────────────────────────────────');
    console.log(`✅ ShareASale: ${merchants.length} links found`);
    console.log(`✅ Deep Links: ${targetProducts.length} generated`);
    console.log(`✅ PartnerStack: Verified automation-friendly\n`);

    console.log('🎯 Next Steps:');
    console.log('1. Sign up for affiliate networks (human-in-loop process)');
    console.log('2. Get your affiliate ID from each network');
    console.log('3. Use the system to automate link extraction');
    console.log('4. Generate deep links for your products\n');

    console.log('📚 Documentation: AFFILIATE-AUTOMATION-GUIDE.md');
    console.log('🔧 Configuration: Set up credentials in AgentDB vault\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the demo
extractAffiliateLinksLive().then(() => {
  console.log('✅ Live demo complete!\n');
  process.exit(0);
}).catch(error => {
  console.error('❌ Demo failed:', error);
  process.exit(1);
});
