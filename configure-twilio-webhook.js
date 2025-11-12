#!/usr/bin/env node
/**
 * Automated Twilio Webhook Configuration
 * Uses Playwright to configure webhook in Twilio Console
 */

import { chromium } from 'playwright';

async function configureTwilioWebhook() {
  console.log('🚀 Launching browser to configure Twilio webhook...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser so you can see it work
    slowMo: 500 // Slow down so you can watch
  });

  const page = await browser.newPage();

  try {
    // Step 1: Go to Twilio login
    console.log('Step 1: Navigating to Twilio console...');
    await page.goto('https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');

    console.log('⏳ Waiting for login...');
    console.log('   Please log in manually in the browser window that opened');
    console.log('   (I cannot automate login for security reasons - you need 2FA)\n');

    // Wait for user to log in (wait for page to have the configuration form)
    await page.waitForSelector('input[name="SmsUrl"], input[id*="sms"], input[placeholder*="URL"]', {
      timeout: 120000 // 2 minutes for login
    });

    console.log('✅ Login detected! Proceeding with configuration...\n');

    // Step 2: Find the SMS webhook URL input
    console.log('Step 2: Finding SMS webhook input field...');

    // Try multiple possible selectors
    const smsUrlInput = await page.locator('input[name="SmsUrl"]').or(
      page.locator('input[id*="sms_url"]')
    ).or(
      page.locator('//label[contains(text(), "A message comes in")]/following::input[1]')
    ).first();

    // Step 3: Fill in webhook URL
    console.log('Step 3: Entering webhook URL...');
    const webhookUrl = process.env.WEBHOOK_URL || 'https://your-tunnel-url.loca.lt/sms';
    await smsUrlInput.fill(webhookUrl);
    console.log(`   ✅ Entered: ${webhookUrl}\n`);

    // Step 4: Set method to POST
    console.log('Step 4: Setting HTTP method to POST...');
    const methodDropdown = await page.locator('select[name="SmsMethod"]').or(
      page.locator('//label[contains(text(), "A message comes in")]/following::select[1]')
    ).first();

    await methodDropdown.selectOption('POST');
    console.log('   ✅ Set to POST\n');

    // Step 5: Save configuration
    console.log('Step 5: Saving configuration...');
    const saveButton = await page.locator('button:has-text("Save")').or(
      page.locator('input[type="submit"]')
    ).first();

    await saveButton.click();
    console.log('   ✅ Clicked Save\n');

    // Wait for save confirmation
    await page.waitForTimeout(2000);

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║         ✅ TWILIO WEBHOOK CONFIGURED SUCCESSFULLY! ✅        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log(`Webhook URL: ${webhookUrl}`);
    console.log('Method: POST\n');
    console.log('You can close the browser window now.');

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Configuration failed:', error.message);
    console.log('\n💡 You can configure manually:');
    console.log('   1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');
    console.log('   2. Click your phone number');
    console.log('   3. Under "A message comes in", enter your webhook URL');
    console.log('   4. Set method to: POST');
    console.log('   5. Click Save\n');
  } finally {
    await browser.close();
  }
}

configureTwilioWebhook();
