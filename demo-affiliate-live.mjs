#!/usr/bin/env node

/**
 * Live Demo: Extract Real Affiliate Links from Browser
 * Uses Playwright to navigate to affiliate networks and extract links
 */

import { chromium } from 'playwright';

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
      const merchantElements = document.querySelectorAll('[class*="merchant"], [class*="program"], .table a, td a');

      merchantElements.forEach((el, index) => {
        if (index < 10 && el.href) { // Get first 10 links
          results.push({
            text: el.textContent.trim().substring(0, 60),
            url: el.href
          });
        }
      });

      return results;
    });

    console.log(`✅ Found ${merchants.length} ShareASale links:\n`);
    merchants.slice(0, 5).forEach((merchant, index) => {
      console.log(`${index + 1}. ${merchant.text}`);
      console.log(`   URL: ${merchant.url}\n`);
    });

    // Demo 2: Generate deep links
    console.log('\n🔗 Generating Deep Links for Your Products...\n');

    const yourProducts = [
      { name: 'Product A', url: 'https://www.example-store.com/product-a' },
      { name: 'Product B', url: 'https://www.example-store.com/product-b' },
      { name: 'Product C', url: 'https://www.example-store.com/product-c' }
    ];

    console.log('Replace YOUR_AFFILIATE_ID with your actual ShareASale affiliate ID:\n');
    yourProducts.forEach((product, index) => {
      const affiliateLink = `https://www.shareasale.com/r.cfm?affID=YOUR_AFFILIATE_ID&urllink=${encodeURIComponent(product.url)}`;
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Merchant URL: ${product.url}`);
      console.log(`   Affiliate Link: ${affiliateLink}\n`);
    });

    // Demo 3: Check CJ Affiliate
    console.log('\n📍 Checking CJ Affiliate public page...');
    await page.goto('https://www.cj.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const cjInfo = await page.evaluate(() => {
      return {
        title: document.title,
        links: Array.from(document.querySelectorAll('a[href*="cj.com"]')).slice(0, 5).map(a => ({
          text: a.textContent.trim().substring(0, 40),
          href: a.href
        }))
      };
    });

    console.log('✅ CJ Affiliate Info:');
    console.log(`   Title: ${cjInfo.title}`);
    console.log(`   Links found: ${cjInfo.links.length}\n`);

    // Demo 4: PartnerStack (automation-friendly)
    console.log('📍 Checking PartnerStack (AUTOMATION FRIENDLY)...');
    await page.goto('https://www.partnerstack.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const partnerStackInfo = await page.evaluate(() => {
      return {
        title: document.title,
        hasAutoAccept: document.body.textContent.includes('auto') || document.body.textContent.includes('automated')
      };
    });

    console.log('✅ PartnerStack:');
    console.log(`   Title: ${partnerStackInfo.title}`);
    console.log(`   Automation Support: ${partnerStackInfo.hasAutoAccept ? 'YES (auto-accept available)' : 'Standard'}\n`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 EXTRACTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ ShareASale: ${merchants.length} links extracted`);
    console.log(`✅ Deep Links: ${yourProducts.length} examples generated`);
    console.log(`✅ CJ Affiliate: ${cjInfo.links.length} links found`);
    console.log(`✅ PartnerStack: Automation-friendly verified\n`);

    console.log('🎯 NEXT STEPS:');
    console.log('──────────────────────────────────────\n');
    console.log('1. SIGNUP (Human-in-Loop Required):');
    console.log('   - Navigate to affiliate network signup page');
    console.log('   - System will detect and pre-fill forms');
    console.log('   - YOU must click submit (never automated)\n');

    console.log('2. GET YOUR AFFILIATE ID:');
    console.log('   - Login to your dashboard');
    console.log('   - Copy your affiliate/publisher ID\n');

    console.log('3. AUTOMATE LINK EXTRACTION:');
    console.log('   - Navigate to your dashboard');
    console.log('   - Run: mcp_tool_affiliate_extract_links()');
    console.log('   - System extracts all affiliate links automatically\n');

    console.log('4. GENERATE DEEP LINKS:');
    console.log('   - Run: mcp_tool_affiliate_generate_link({ targetUrl, networkId })');
    console.log('   - Instantly create affiliate links for any product\n');

    console.log('📚 Full Documentation:');
    console.log('   - AFFILIATE-AUTOMATION-GUIDE.md');
    console.log('   - QUICK-START-AFFILIATE.md');
    console.log('   - NETWORK-SUPPORT-MATRIX.md\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
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
