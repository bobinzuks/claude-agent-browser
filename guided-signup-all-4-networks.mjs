#!/usr/bin/env node

/**
 * GUIDED SIGNUP: All 4 Major Affiliate Networks
 * ToS-Compliant Human-in-Loop Workflow
 *
 * This script will help you sign up for all 4 networks in order:
 * 1. PartnerStack (instant approval)
 * 2. ShareASale (1-3 days)
 * 3. Impact.com (2-5 days)
 * 4. CJ Affiliate (3-7 days)
 */

import { chromium } from 'playwright';
import readline from 'readline';
import fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

const NETWORKS = [
  {
    id: 'partnerstack',
    name: 'PartnerStack',
    tosLevel: 0,
    signupUrl: 'https://www.partnerstack.com/partners',
    approvalTime: 'Instant (auto-accept)',
    automation: 'Full Auto Supported',
    priority: 1,
    color: '🟢'
  },
  {
    id: 'shareasale',
    name: 'ShareASale (Awin)',
    tosLevel: 1,
    signupUrl: 'https://account.shareasale.com/newsignup.cfm',
    approvalTime: '1-3 days',
    automation: 'Human-in-Loop',
    priority: 2,
    color: '🟡'
  },
  {
    id: 'impact',
    name: 'Impact.com',
    tosLevel: 1,
    signupUrl: 'https://app.impact.com/campaign/promo-signup/default-sign-up-brand.ihtml',
    approvalTime: '2-5 days',
    automation: 'Human-in-Loop',
    priority: 3,
    color: '🟡'
  },
  {
    id: 'cj',
    name: 'CJ Affiliate',
    tosLevel: 2,
    signupUrl: 'https://www.cj.com/affiliate-sign-up',
    approvalTime: '3-7 days',
    automation: 'Manual Verification',
    priority: 4,
    color: '🟡'
  }
];

const signupResults = {
  startTime: new Date().toISOString(),
  userData: {},
  networks: [],
  affiliateIds: {},
  notes: []
};

async function collectUserData() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📝 STEP 1: COLLECT YOUR INFORMATION');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('This info will be used to pre-fill forms (ToS-compliant):\n');

  const userData = {
    firstName: await ask('First Name: '),
    lastName: await ask('Last Name: '),
    email: await ask('Email Address: '),
    phone: await ask('Phone Number (optional): ') || '',
    company: await ask('Company Name: '),
    website: await ask('Website URL (https://...): '),
    address: await ask('Street Address: '),
    city: await ask('City: '),
    state: await ask('State/Province: '),
    zip: await ask('ZIP/Postal Code: '),
    country: await ask('Country: '),
    description: await ask('How will you promote products? (brief): ')
  };

  signupResults.userData = userData;

  console.log('\n✅ Information collected!\n');
  console.log('═══════════════════════════════════════════════════\n');

  return userData;
}

async function signupNetwork(network, userData, browser) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${network.color} NETWORK ${network.priority}/4: ${network.name.toUpperCase()}`);
  console.log(`${'═'.repeat(60)}\n`);
  console.log(`📍 URL: ${network.signupUrl}`);
  console.log(`⏱️  Approval Time: ${network.approvalTime}`);
  console.log(`🤖 Automation: ${network.automation}`);
  console.log(`📊 ToS Level: ${network.tosLevel}\n`);

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const networkResult = {
    network: network.name,
    id: network.id,
    startTime: new Date().toISOString(),
    status: 'pending',
    affiliateId: null,
    notes: []
  };

  try {
    console.log('🌐 Opening signup page...\n');
    await page.goto(network.signupUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log('✅ Page loaded!\n');
    console.log('🤖 ATTEMPTING AUTO-FILL (ToS Compliant)...\n');

    // Network-specific form filling
    let filledCount = 0;

    if (network.id === 'partnerstack') {
      const fields = [
        { sel: 'input[name*="first" i]', val: userData.firstName, label: 'First Name' },
        { sel: 'input[name*="last" i]', val: userData.lastName, label: 'Last Name' },
        { sel: 'input[type="email"]', val: userData.email, label: 'Email' },
        { sel: 'input[name*="company" i]', val: userData.company, label: 'Company' },
        { sel: 'input[name*="website" i], input[name*="url" i]', val: userData.website, label: 'Website' }
      ];
      filledCount = await fillFields(page, fields);

    } else if (network.id === 'shareasale') {
      const fields = [
        { sel: '#fname', val: userData.firstName, label: 'First Name' },
        { sel: '#lname', val: userData.lastName, label: 'Last Name' },
        { sel: '#emailaddr', val: userData.email, label: 'Email' },
        { sel: '#website', val: userData.website, label: 'Website' },
        { sel: '#address1', val: userData.address, label: 'Address' },
        { sel: '#city', val: userData.city, label: 'City' },
        { sel: '#zip', val: userData.zip, label: 'ZIP' },
        { sel: '#phone', val: userData.phone, label: 'Phone' }
      ];
      filledCount = await fillFields(page, fields);

    } else if (network.id === 'impact') {
      const fields = [
        { sel: 'input[name*="first" i]', val: userData.firstName, label: 'First Name' },
        { sel: 'input[name*="last" i]', val: userData.lastName, label: 'Last Name' },
        { sel: 'input[type="email"]', val: userData.email, label: 'Email' },
        { sel: 'input[name*="company" i]', val: userData.company, label: 'Company' },
        { sel: 'input[name*="website" i]', val: userData.website, label: 'Website' }
      ];
      filledCount = await fillFields(page, fields);

    } else if (network.id === 'cj') {
      const fields = [
        { sel: 'input[name*="first" i]', val: userData.firstName, label: 'First Name' },
        { sel: 'input[name*="last" i]', val: userData.lastName, label: 'Last Name' },
        { sel: 'input[type="email"]', val: userData.email, label: 'Email' },
        { sel: 'input[name*="company" i]', val: userData.company, label: 'Company' },
        { sel: 'input[name*="url" i], input[name*="website" i]', val: userData.website, label: 'Website' }
      ];
      filledCount = await fillFields(page, fields);
    }

    console.log(`\n✅ Auto-filled ${filledCount} fields!\n`);
    networkResult.notes.push(`Auto-filled ${filledCount} fields`);

    console.log('═══════════════════════════════════════════════════');
    console.log('🔴 HUMAN ACTION REQUIRED (ToS COMPLIANCE)');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('YOU MUST NOW:\n');
    console.log('1. ✏️  Review and complete any missing fields');
    console.log('2. 🔐 Create a password (NEVER auto-filled by system)');
    console.log('3. ✅ Accept Terms of Service (READ THEM!)');
    console.log('4. 🤖 Complete any CAPTCHA');
    console.log('5. 🖱️  Click SUBMIT button yourself\n');
    console.log('⏳ Browser will stay open - take your time...\n');
    console.log('═══════════════════════════════════════════════════\n');

    const completed = await ask('Did you complete the signup? (yes/no): ');

    if (completed.toLowerCase() === 'yes') {
      networkResult.status = 'submitted';
      console.log('\n✅ Great! Now checking for confirmation...\n');

      await page.waitForTimeout(3000);

      // Try to detect success
      const pageContent = await page.content();
      if (pageContent.includes('thank') || pageContent.includes('confirm') ||
          pageContent.includes('success') || pageContent.includes('email')) {
        console.log('✅ SUCCESS! Signup appears successful!\n');
        networkResult.status = 'success';

        // Try to find affiliate ID
        const affiliateId = await ask('Do you see your Affiliate/Publisher ID on screen? (paste it or press Enter): ');
        if (affiliateId.trim()) {
          networkResult.affiliateId = affiliateId.trim();
          signupResults.affiliateIds[network.id] = affiliateId.trim();
          console.log(`\n💾 Saved your ${network.name} ID: ${affiliateId.trim()}\n`);
        }
      }

      console.log('📧 CHECK YOUR EMAIL for verification link!\n');
      networkResult.notes.push('Check email for verification');

    } else {
      networkResult.status = 'incomplete';
      networkResult.notes.push('User chose not to complete');
      console.log('\n⏭️  Skipping this network for now.\n');
    }

  } catch (error) {
    console.error(`\n❌ Error with ${network.name}:`, error.message);
    networkResult.status = 'error';
    networkResult.notes.push(`Error: ${error.message}`);
  } finally {
    networkResult.endTime = new Date().toISOString();
    signupResults.networks.push(networkResult);
    await context.close();
  }

  // Ask if they want to continue to next network
  if (network.priority < 4) {
    console.log('\n─────────────────────────────────────────────────\n');
    const continueNext = await ask(`Continue to next network (${NETWORKS[network.priority].name})? (yes/no): `);
    if (continueNext.toLowerCase() !== 'yes') {
      return false; // Stop signup process
    }
  }

  return true;
}

async function fillFields(page, fields) {
  let count = 0;
  for (const field of fields) {
    try {
      const input = page.locator(field.sel).first();
      if (await input.isVisible({ timeout: 2000 })) {
        await input.fill(field.val);
        console.log(`   ✅ ${field.label}: ${field.val}`);
        await page.waitForTimeout(300);
        count++;
      }
    } catch (e) {
      console.log(`   ⚠️  ${field.label}: Not found (fill manually)`);
    }
  }
  return count;
}

async function saveSummary() {
  signupResults.endTime = new Date().toISOString();

  const filename = `affiliate-signup-results-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(signupResults, null, 2));

  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 SIGNUP SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');

  signupResults.networks.forEach((net, i) => {
    console.log(`${i + 1}. ${net.network}`);
    console.log(`   Status: ${net.status}`);
    if (net.affiliateId) {
      console.log(`   🎯 Affiliate ID: ${net.affiliateId}`);
    }
    console.log('');
  });

  console.log(`💾 Results saved to: ${filename}\n`);

  if (Object.keys(signupResults.affiliateIds).length > 0) {
    console.log('🎯 YOUR AFFILIATE IDs:\n');
    for (const [network, id] of Object.entries(signupResults.affiliateIds)) {
      console.log(`   ${network}: ${id}`);
    }
    console.log('');
  }

  console.log('📧 NEXT STEPS:\n');
  console.log('1. Check email for verification links (all networks)');
  console.log('2. Verify your email addresses');
  console.log('3. Wait for approval notifications');
  console.log('4. Login to dashboards and get your affiliate IDs');
  console.log('5. Run: node extract-dashboard-links.mjs\n');

  console.log('⏰ APPROVAL TIMELINE:\n');
  console.log('   PartnerStack: Instant (should be ready now!)');
  console.log('   ShareASale: 1-3 days');
  console.log('   Impact.com: 2-5 days');
  console.log('   CJ Affiliate: 3-7 days\n');
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 GUIDED SIGNUP: ALL 4 AFFILIATE NETWORKS');
  console.log('═══════════════════════════════════════════════════');
  console.log('\n🎯 This script will guide you through signing up for:\n');

  NETWORKS.forEach(net => {
    console.log(`   ${net.color} ${net.priority}. ${net.name} (${net.approvalTime})`);
  });

  console.log('\n🤖 COMPLIANCE GUARANTEES:\n');
  console.log('   ✅ System pre-fills forms (automation allowed)');
  console.log('   ✅ YOU click submit (human-in-loop required)');
  console.log('   ✅ Passwords NEVER auto-filled (security)');
  console.log('   ✅ ToS acceptance is manual (legal requirement)');
  console.log('   ✅ Complete audit trail maintained\n');

  const start = await ask('Ready to begin? (yes/no): ');
  if (start.toLowerCase() !== 'yes') {
    console.log('\n👋 Exiting. Run again when ready!\n');
    rl.close();
    return;
  }

  const userData = await collectUserData();

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  try {
    for (const network of NETWORKS) {
      const shouldContinue = await signupNetwork(network, userData, browser);
      if (!shouldContinue) {
        console.log('\n⏹️  Signup process stopped by user.\n');
        break;
      }
    }
  } finally {
    await browser.close();
    await saveSummary();
    rl.close();
  }

  console.log('✅ ALL DONE!\n');
  console.log('🎉 You\'re on your way to earning affiliate commissions!\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});
