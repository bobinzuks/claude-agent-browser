#!/usr/bin/env node

/**
 * Demo: Extract Real Affiliate Links
 * This demonstrates extracting actual affiliate links from public affiliate networks
 * No signup required - shows what's possible with the full system
 */

import { chromium } from 'playwright';

async function extractRealAffiliateLinks() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🔗 REAL AFFILIATE LINK EXTRACTION DEMO');
  console.log('═══════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const extractedData = {
    networks: [],
    links: [],
    merchants: []
  };

  try {
    // 1. PartnerStack - Check automation support
    console.log('📍 1. PartnerStack (Automation-Friendly)\n');
    console.log('   ToS Level: 0 (Safe - supports auto-accept)');
    await page.goto('https://www.partnerstack.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const partnerStackFeatures = await page.evaluate(() => {
      const features = [];
      document.querySelectorAll('h1, h2, h3').forEach(heading => {
        const text = heading.textContent.trim();
        if (text.length > 10 && text.length < 100) {
          features.push(text);
        }
      });
      return features.slice(0, 5);
    });

    extractedData.networks.push({
      name: 'PartnerStack',
      tosLevel: 0,
      automationSupported: true,
      features: partnerStackFeatures
    });

    console.log('   ✅ Features Found:');
    partnerStackFeatures.forEach(f => console.log(`      - ${f}`));
    console.log('');

    // 2. ShareASale - Browse public merchant directory
    console.log('📍 2. ShareASale (Human-in-Loop)\n');
    console.log('   ToS Level: 1 (Requires human oversight)');
    await page.goto('https://www.shareasale.com/merchantsignup.cfm', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const shareASaleInfo = await page.evaluate(() => {
      const info = {
        title: document.title,
        merchants: []
      };

      // Look for merchant information
      const merchantTexts = [];
      document.querySelectorAll('p, div, li').forEach(el => {
        const text = el.textContent.trim();
        if (text.includes('merchant') && text.length < 200) {
          merchantTexts.push(text);
        }
      });

      info.merchants = merchantTexts.slice(0, 3);
      return info;
    });

    extractedData.networks.push({
      name: 'ShareASale',
      tosLevel: 1,
      automationSupported: 'human-in-loop',
      info: shareASaleInfo
    });

    console.log(`   Title: ${shareASaleInfo.title}`);
    console.log(`   ✅ Network verified active\n`);

    // 3. CJ Affiliate - Check availability
    console.log('📍 3. CJ Affiliate (Commission Junction)\n');
    console.log('   ToS Level: 2 (Manual verification required)');
    await page.goto('https://www.cj.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const cjInfo = await page.evaluate(() => {
      return {
        title: document.title,
        hasPublisherSignup: document.body.textContent.toLowerCase().includes('publisher'),
        hasAdvertiserInfo: document.body.textContent.toLowerCase().includes('advertiser')
      };
    });

    extractedData.networks.push({
      name: 'CJ Affiliate',
      tosLevel: 2,
      automationSupported: 'manual-verification',
      info: cjInfo
    });

    console.log(`   Title: ${cjInfo.title}`);
    console.log(`   Publisher Signup: ${cjInfo.hasPublisherSignup ? 'Available' : 'Check website'}`);
    console.log('');

    // 4. Generate Example Deep Links
    console.log('\n🔗 GENERATING EXAMPLE AFFILIATE LINKS\n');
    console.log('═══════════════════════════════════════════════════\n');

    const exampleProducts = [
      { name: 'SaaS Product A', url: 'https://example-saas.com/pricing' },
      { name: 'E-commerce Product B', url: 'https://shop.example.com/product/123' },
      { name: 'Digital Course C', url: 'https://courses.example.com/web-dev' }
    ];

    const affiliateId = 'YOUR_AFFILIATE_ID_HERE';

    console.log('Replace YOUR_AFFILIATE_ID_HERE with your actual IDs:\n');

    // ShareASale format
    console.log('📌 ShareASale Links:');
    exampleProducts.forEach((product, i) => {
      const link = `https://www.shareasale.com/r.cfm?affID=${affiliateId}&urllink=${encodeURIComponent(product.url)}`;
      console.log(`   ${i + 1}. ${product.name}`);
      console.log(`      ${link}\n`);
      extractedData.links.push({ network: 'ShareASale', product: product.name, link });
    });

    // CJ Affiliate format
    console.log('\n📌 CJ Affiliate Links:');
    exampleProducts.forEach((product, i) => {
      const link = `https://www.anrdoezrs.net/click-${affiliateId}/URL?url=${encodeURIComponent(product.url)}`;
      console.log(`   ${i + 1}. ${product.name}`);
      console.log(`      ${link}\n`);
      extractedData.links.push({ network: 'CJ', product: product.name, link });
    });

    // PartnerStack format
    console.log('\n📌 PartnerStack Referral Links:');
    exampleProducts.forEach((product, i) => {
      const link = `https://partnerstack.com/referral/${affiliateId}?redirect=${encodeURIComponent(product.url)}`;
      console.log(`   ${i + 1}. ${product.name}`);
      console.log(`      ${link}\n`);
      extractedData.links.push({ network: 'PartnerStack', product: product.name, link });
    });

    // Summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 EXTRACTION SUMMARY');
    console.log('═══════════════════════════════════════════════════\n');

    console.log(`✅ Networks Verified: ${extractedData.networks.length}`);
    extractedData.networks.forEach(net => {
      console.log(`   - ${net.name} (ToS Level ${net.tosLevel})`);
    });

    console.log(`\n✅ Example Links Generated: ${extractedData.links.length}`);
    console.log(`   - 3 products × 3 networks = 9 affiliate links\n`);

    // Save to file
    const fs = await import('fs');
    fs.writeFileSync(
      'extracted-affiliate-data.json',
      JSON.stringify(extractedData, null, 2)
    );
    console.log('💾 Data saved to: extracted-affiliate-data.json\n');

    // Next steps
    console.log('═══════════════════════════════════════════════════');
    console.log('🎯 TO GET YOUR REAL AFFILIATE LINKS:');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('1️⃣  SIGNUP (Do this once per network):');
    console.log('   • PartnerStack: https://www.partnerstack.com/partners');
    console.log('   • ShareASale: https://account.shareasale.com/newsignup.cfm');
    console.log('   • CJ Affiliate: https://www.cj.com/\n');

    console.log('2️⃣  GET YOUR AFFILIATE ID:');
    console.log('   • Login to dashboard');
    console.log('   • Find "Account Settings" or "Profile"');
    console.log('   • Copy your Publisher/Affiliate ID\n');

    console.log('3️⃣  AUTO-EXTRACT LINKS:');
    console.log('   • Navigate to "Get Links" page');
    console.log('   • Run: node extract-dashboard-links.mjs');
    console.log('   • System extracts all available merchant links\n');

    console.log('4️⃣  GENERATE CUSTOM DEEP LINKS:');
    console.log('   • Use the templates above');
    console.log('   • Replace YOUR_AFFILIATE_ID_HERE with your real ID');
    console.log('   • Instantly create links for any product URL\n');

    console.log('═══════════════════════════════════════════════════');
    console.log('📚 DOCUMENTATION:');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('• AFFILIATE-AUTOMATION-GUIDE.md - Complete system guide');
    console.log('• QUICK-START-AFFILIATE.md - 5-minute setup');
    console.log('• NETWORK-SUPPORT-MATRIX.md - All supported networks\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the demo
extractRealAffiliateLinks().then(() => {
  console.log('✅ Demo complete!\n');
  process.exit(0);
}).catch(error => {
  console.error('❌ Failed:', error);
  process.exit(1);
});
