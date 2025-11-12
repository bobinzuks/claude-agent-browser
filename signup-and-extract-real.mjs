#!/usr/bin/env node

/**
 * REAL Affiliate Network Signup & Link Extraction
 * This script will help you sign up for PartnerStack (automation-friendly)
 * and extract your first real affiliate links
 */

import { chromium } from 'playwright';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function realAffiliateSignupAndExtraction() {
  console.log('🚀 REAL Affiliate Network Setup\n');
  console.log('We\'ll use PartnerStack (automation-friendly, Level 0 ToS)\n');

  // Get user information
  console.log('📝 First, let\'s collect your information:\n');

  const userData = {
    firstName: await ask('First Name: '),
    lastName: await ask('Last Name: '),
    email: await ask('Email: '),
    company: await ask('Company Name: '),
    website: await ask('Website URL (https://...): ')
  };

  console.log('\n✅ Information collected!\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    console.log('🌐 Method 1: PartnerStack Signup (Recommended)\n');
    console.log('──────────────────────────────────────────────\n');

    // Navigate to PartnerStack
    console.log('📍 Navigating to PartnerStack...');
    await page.goto('https://www.partnerstack.com/partners', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    console.log('✅ Page loaded!\n');
    console.log('🎯 INSTRUCTIONS:\n');
    console.log('1. Look for "Sign Up" or "Get Started" button');
    console.log('2. I will help pre-fill the form with your info');
    console.log('3. YOU must review and click Submit (compliance requirement)\n');

    await page.waitForTimeout(2000);

    // Try to find signup button
    const signupSelectors = [
      'a[href*="signup"]',
      'a[href*="register"]',
      'button:has-text("Sign Up")',
      'button:has-text("Get Started")',
      'a:has-text("Sign Up")',
      'a:has-text("Get Started")'
    ];

    let signupButton = null;
    for (const selector of signupSelectors) {
      try {
        signupButton = await page.locator(selector).first();
        if (await signupButton.isVisible({ timeout: 1000 })) {
          console.log(`✅ Found signup button: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying
      }
    }

    if (signupButton) {
      console.log('🖱️  Clicking signup button...\n');
      await signupButton.click();
      await page.waitForTimeout(3000);
    }

    // Try to pre-fill form
    console.log('📝 Attempting to pre-fill form...\n');

    const formFields = [
      { selector: 'input[name*="first" i], input[id*="first" i]', value: userData.firstName, label: 'First Name' },
      { selector: 'input[name*="last" i], input[id*="last" i]', value: userData.lastName, label: 'Last Name' },
      { selector: 'input[type="email"], input[name*="email" i]', value: userData.email, label: 'Email' },
      { selector: 'input[name*="company" i], input[id*="company" i]', value: userData.company, label: 'Company' },
      { selector: 'input[name*="website" i], input[name*="url" i]', value: userData.website, label: 'Website' }
    ];

    for (const field of formFields) {
      try {
        const input = page.locator(field.selector).first();
        if (await input.isVisible({ timeout: 2000 })) {
          await input.fill(field.value);
          console.log(`✅ Filled: ${field.label} = ${field.value}`);
          await page.waitForTimeout(500);
        }
      } catch (e) {
        console.log(`⚠️  Could not fill: ${field.label} (field not found)`);
      }
    }

    console.log('\n✅ Form pre-filled!\n');
    console.log('🔴 IMPORTANT: YOU MUST NOW:\n');
    console.log('1. Review the form carefully');
    console.log('2. Fill any missing fields');
    console.log('3. Read and accept Terms of Service');
    console.log('4. Click Submit/Sign Up button yourself\n');
    console.log('⏳ Waiting for you to complete signup...\n');
    console.log('(The browser will stay open - take your time)\n');

    // Wait for navigation after signup
    const continueAction = await ask('Have you completed the signup? (yes/no): ');

    if (continueAction.toLowerCase() === 'yes') {
      console.log('\n✅ Great! Now let\'s try to extract your affiliate link...\n');

      // Wait for dashboard
      await page.waitForTimeout(3000);

      // Look for affiliate link/referral link
      console.log('🔍 Searching for your affiliate/referral link...\n');

      const linkSelectors = [
        'a[href*="partnerstack.com/"][href*="referral"]',
        'input[value*="partnerstack.com/"][value*="referral"]',
        '[class*="referral" i] a',
        '[class*="affiliate" i] a',
        'code',
        'pre'
      ];

      const extractedLinks = [];

      for (const selector of linkSelectors) {
        try {
          const elements = await page.locator(selector).all();
          for (const el of elements) {
            const text = await el.textContent();
            const href = await el.getAttribute('href');
            const value = await el.getAttribute('value');

            const link = href || value || text;
            if (link && link.includes('partnerstack') && !extractedLinks.includes(link)) {
              extractedLinks.push(link);
            }
          }
        } catch (e) {
          // Continue
        }
      }

      if (extractedLinks.length > 0) {
        console.log('✅ SUCCESS! Found your affiliate links:\n');
        extractedLinks.forEach((link, i) => {
          console.log(`${i + 1}. ${link}`);
        });
        console.log('');
      } else {
        console.log('⚠️  Could not auto-detect affiliate link.\n');
        console.log('Please manually copy your affiliate/referral link from the page.\n');
      }

      // Extract any visible links
      console.log('🔗 All links on current page:\n');
      const allLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'))
          .map(a => ({ text: a.textContent.trim().substring(0, 50), href: a.href }))
          .filter(l => l.href.includes('partnerstack'))
          .slice(0, 10);
      });

      allLinks.forEach((link, i) => {
        console.log(`${i + 1}. ${link.text}`);
        console.log(`   ${link.href}\n`);
      });

    } else {
      console.log('\n⏭️  Skipping extraction. You can run this script again after signup.\n');
    }

    console.log('═══════════════════════════════════════════════════\n');
    console.log('📊 ALTERNATIVE: Use ShareASale (More Merchants)\n');
    console.log('═══════════════════════════════════════════════════\n');

    const tryShareASale = await ask('Want to try ShareASale signup too? (yes/no): ');

    if (tryShareASale.toLowerCase() === 'yes') {
      console.log('\n📍 Opening ShareASale signup page...\n');
      await page.goto('https://account.shareasale.com/newsignup.cfm', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      console.log('✅ ShareASale signup page loaded!\n');
      console.log('📝 Attempting to pre-fill...\n');

      // ShareASale specific fields
      const shareASaleFields = [
        { selector: '#fname', value: userData.firstName, label: 'First Name' },
        { selector: '#lname', value: userData.lastName, label: 'Last Name' },
        { selector: '#emailaddr', value: userData.email, label: 'Email' },
        { selector: '#website', value: userData.website, label: 'Website' }
      ];

      for (const field of shareASaleFields) {
        try {
          await page.fill(field.selector, field.value);
          console.log(`✅ Filled: ${field.label}`);
          await page.waitForTimeout(300);
        } catch (e) {
          console.log(`⚠️  Could not fill: ${field.label}`);
        }
      }

      console.log('\n✅ ShareASale form pre-filled!\n');
      console.log('🔴 COMPLETE THE FORM MANUALLY:\n');
      console.log('1. Fill remaining required fields');
      console.log('2. Select your website category');
      console.log('3. Enter how you promote products');
      console.log('4. Review and accept ToS');
      console.log('5. Complete CAPTCHA if present');
      console.log('6. Click Submit\n');

      await ask('Press Enter when done (or to close browser): ');
    }

    console.log('\n✅ SETUP COMPLETE!\n');
    console.log('📚 NEXT STEPS:\n');
    console.log('1. Check your email for verification');
    console.log('2. Login to your dashboard');
    console.log('3. Find the "Get Links" or "Tools" section');
    console.log('4. Use our extraction tool to grab all affiliate links\n');
    console.log('🚀 Command: mcp_tool_affiliate_extract_links({ networkId: "partnerstack" })\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    console.log('\n👋 Closing browser...\n');
    await browser.close();
    rl.close();
  }
}

// Run it
console.log('═══════════════════════════════════════════════════');
console.log('🎯 REAL AFFILIATE NETWORK SIGNUP');
console.log('═══════════════════════════════════════════════════\n');

realAffiliateSignupAndExtraction().then(() => {
  console.log('✅ All done!\n');
  process.exit(0);
}).catch(error => {
  console.error('❌ Failed:', error);
  process.exit(1);
});
