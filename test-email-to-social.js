#!/usr/bin/env node
/**
 * Real World Test: Get temp email → Sign up for social account
 * Stores all patterns in AgentDB for learning
 */

import { BrowserController } from './dist/mcp-bridge/browser-controller.js';
import { AgentDBClient } from './dist/training/agentdb-client.js';
import * as fs from 'fs';

const db = new AgentDBClient('./real-world-db', 384);

async function getTemporaryEmail(controller) {
  console.log('\n🔥 STEP 1: Getting Temporary Email Address\n');

  // Try GuerrillaMail - fast and reliable
  console.log('📧 Navigating to GuerrillaMail...');
  await controller.navigate('https://www.guerrillamail.com/');

  // Store navigation pattern
  db.storeAction({
    action: 'navigate',
    url: 'https://www.guerrillamail.com/',
    success: true,
    metadata: { service: 'GuerrillaMail', step: 'initial_load' }
  });

  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('🔍 Extracting email address...');

  // Extract the email address
  const emailResult = await controller.executeScript(`() => {
    // Try multiple possible selectors
    const selectors = [
      '#email-widget',
      '#inbox-id',
      'input[type="text"][value*="@"]',
      'span[id*="email"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const email = element.value || element.textContent || element.innerText;
        if (email && email.includes('@')) {
          return {
            email: email.trim(),
            selector: selector,
            found: true
          };
        }
      }
    }

    // Fallback: look for any text with @ symbol
    const bodyText = document.body.textContent;
    const emailMatch = bodyText.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/);
    if (emailMatch) {
      return {
        email: emailMatch[0],
        selector: 'body_text_search',
        found: true
      };
    }

    return { found: false, error: 'Email not found' };
  }`);

  if (!emailResult.data?.found) {
    throw new Error('Failed to extract email address from GuerrillaMail');
  }

  const email = emailResult.data.email;
  const selector = emailResult.data.selector;

  console.log(`✅ Got temporary email: ${email}`);
  console.log(`   Selector used: ${selector}\n`);

  // Store extraction pattern
  db.storeAction({
    action: 'extract_email',
    selector: selector,
    value: email,
    url: 'https://www.guerrillamail.com/',
    success: true,
    metadata: {
      service: 'GuerrillaMail',
      emailDomain: email.split('@')[1]
    }
  });

  // Take screenshot as proof
  const screenshotPath = `email-acquired-${Date.now()}.png`;
  await controller.screenshot(screenshotPath);
  console.log(`📸 Screenshot saved: ${screenshotPath}\n`);

  return { email, controller };
}

async function signUpForTwitter(controller, email) {
  console.log('🔥 STEP 2: Signing Up for Twitter/X Account\n');

  console.log('🐦 Navigating to Twitter signup...');
  const navResult = await controller.navigate('https://twitter.com/i/flow/signup');

  db.storeAction({
    action: 'navigate',
    url: 'https://twitter.com/i/flow/signup',
    success: navResult.success,
    metadata: { service: 'Twitter', step: 'signup_page' }
  });

  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('📸 Taking screenshot of signup page...');
  await controller.screenshot(`twitter-signup-${Date.now()}.png`);

  console.log('🔍 Looking for signup form fields...');

  // Analyze the signup form
  const formAnalysis = await controller.executeScript(`() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));

    return {
      inputs: inputs.map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        ariaLabel: input.getAttribute('aria-label'),
        visible: input.offsetParent !== null
      })).filter(i => i.visible),
      buttons: buttons.map(btn => ({
        text: btn.textContent?.trim(),
        ariaLabel: btn.getAttribute('aria-label'),
        role: btn.getAttribute('role'),
        visible: btn.offsetParent !== null
      })).filter(b => b.visible && b.text),
      forms: document.querySelectorAll('form').length,
      hasRecaptcha: !!document.querySelector('[class*="recaptcha"], [id*="recaptcha"]')
    };
  }`);

  console.log('\n📋 Form Analysis:');
  console.log('   Inputs found:', formAnalysis.data?.inputs?.length || 0);
  console.log('   Buttons found:', formAnalysis.data?.buttons?.length || 0);
  console.log('   Has reCAPTCHA:', formAnalysis.data?.hasRecaptcha ? '⚠️  YES' : '✅ NO');

  if (formAnalysis.data?.inputs) {
    console.log('\n   Input Fields:');
    formAnalysis.data.inputs.slice(0, 5).forEach((input, i) => {
      console.log(`     ${i + 1}. Type: ${input.type}, Label: ${input.ariaLabel || input.placeholder || 'none'}`);
    });
  }

  if (formAnalysis.data?.buttons) {
    console.log('\n   Buttons:');
    formAnalysis.data.buttons.slice(0, 5).forEach((btn, i) => {
      console.log(`     ${i + 1}. "${btn.text}"`);
    });
  }

  // Store form detection pattern
  db.storeAction({
    action: 'analyze_signup_form',
    url: 'https://twitter.com/i/flow/signup',
    success: true,
    metadata: {
      service: 'Twitter',
      formData: formAnalysis.data,
      hasRecaptcha: formAnalysis.data?.hasRecaptcha
    }
  });

  console.log('\n⚠️  Note: Twitter signup requires:');
  console.log('   • Phone number or email verification');
  console.log('   • May have reCAPTCHA');
  console.log('   • Rate limiting if too many signups');

  return formAnalysis.data;
}

async function tryAlternativeSocialSites(controller, email) {
  console.log('\n🔥 STEP 3: Trying Alternative Social Sites\n');

  const sites = [
    {
      name: 'Mastodon (mastodon.social)',
      url: 'https://mastodon.social/auth/sign_up',
      description: 'Decentralized Twitter alternative'
    },
    {
      name: 'Reddit',
      url: 'https://www.reddit.com/register/',
      description: 'Social news aggregation'
    },
    {
      name: 'GitHub',
      url: 'https://github.com/signup',
      description: 'Developer social network'
    }
  ];

  const results = [];

  for (const site of sites) {
    console.log(`\n📱 Checking ${site.name}...`);
    console.log(`   ${site.description}`);

    try {
      const navResult = await controller.navigate(site.url);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Analyze signup form
      const formData = await controller.executeScript(`() => {
        const inputs = Array.from(document.querySelectorAll('input[type="email"], input[type="text"], input[type="password"]'));
        const submitButtons = Array.from(document.querySelectorAll('button[type="submit"], input[type="submit"]'));

        return {
          emailFields: inputs.filter(i =>
            i.type === 'email' ||
            i.name?.toLowerCase().includes('email') ||
            i.id?.toLowerCase().includes('email') ||
            i.placeholder?.toLowerCase().includes('email')
          ).length,
          passwordFields: inputs.filter(i => i.type === 'password').length,
          submitButtons: submitButtons.length,
          hasForm: document.querySelectorAll('form').length > 0,
          title: document.title
        };
      }`);

      const screenshot = `${site.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
      await controller.screenshot(screenshot);

      console.log(`   ✅ Loaded: ${formData.data?.title || 'Unknown'}`);
      console.log(`   📧 Email fields: ${formData.data?.emailFields || 0}`);
      console.log(`   🔒 Password fields: ${formData.data?.passwordFields || 0}`);
      console.log(`   🔘 Submit buttons: ${formData.data?.submitButtons || 0}`);
      console.log(`   📸 Screenshot: ${screenshot}`);

      // Store pattern
      db.storeAction({
        action: 'analyze_signup_page',
        url: site.url,
        success: true,
        metadata: {
          service: site.name,
          formAnalysis: formData.data,
          screenshot: screenshot
        }
      });

      results.push({
        site: site.name,
        url: site.url,
        success: true,
        formData: formData.data,
        screenshot: screenshot
      });

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        site: site.name,
        url: site.url,
        success: false,
        error: error.message
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🌐 REAL WORLD TEST: Email → Social Account Signup         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const controller = new BrowserController({
    headless: false, // Show browser so you can see what's happening
    slowMo: 1000     // Slow down for visibility
  });

  try {
    await controller.launch();

    // Step 1: Get temporary email
    const { email } = await getTemporaryEmail(controller);

    // Step 2: Try Twitter signup
    await signUpForTwitter(controller, email);

    // Step 3: Try alternative sites
    const altResults = await tryAlternativeSocialSites(controller, email);

    // Save AgentDB
    console.log('\n💾 Saving patterns to AgentDB...');
    db.save();
    const stats = db.getStatistics();
    console.log(`   ✅ Stored ${stats.totalActions} patterns`);
    console.log(`   ✅ Success rate: ${(stats.successRate * 100).toFixed(1)}%`);

    // Summary
    console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    📊 TEST SUMMARY                           ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`📧 Temporary Email: ${email}`);
    console.log(`\n🐦 Twitter Signup: Analyzed (requires phone/email verification)`);

    console.log(`\n📱 Alternative Social Sites Analyzed:`);
    altResults.forEach((result, i) => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${i + 1}. ${result.site}`);
      if (result.success) {
        console.log(`      Email fields: ${result.formData?.emailFields || 0}`);
        console.log(`      Screenshot: ${result.screenshot}`);
      }
    });

    console.log(`\n💾 AgentDB Statistics:`);
    console.log(`   Total patterns stored: ${stats.totalActions}`);
    console.log(`   Action types: ${JSON.stringify(stats.actionTypes)}`);
    console.log(`   Database saved to: ./real-world-db/`);

    console.log('\n📸 Screenshots saved:');
    const screenshots = fs.readdirSync('.').filter(f => f.endsWith('.png'));
    screenshots.forEach(s => console.log(`   • ${s}`));

    console.log('\n✨ Test complete! Keeping browser open for 10 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));

    await controller.close();

    console.log('🎉 All done! Check the screenshots and AgentDB data.\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    await controller.close();
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
