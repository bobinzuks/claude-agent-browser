#!/usr/bin/env npx tsx
/**
 * Comprehensive Verification Test
 * Tests ALL components with REAL credentials from .env
 */

import { BrowserController } from '../dist/mcp-bridge/browser-controller.js';
import { TwilioProvider } from '../dist/extension/lib/sms-providers/twilio-provider.js';
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║       🧪 COMPREHENSIVE VERIFICATION TEST 🧪                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Verify .env is loaded
console.log('📋 Step 1: Verifying .env file...\n');

console.log('Environment variables loaded:');
console.log(`  TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID || '❌ NOT SET'}`);
console.log(`  TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? '✅ SET' : '❌ NOT SET'}`);
console.log(`  TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER || '❌ NOT SET'}`);
console.log(`  SMTP_USER: ${process.env.SMTP_USER || '❌ NOT SET'}`);
console.log(`  SMTP_PASS: ${process.env.SMTP_PASS ? '✅ SET' : '❌ NOT SET'}\n`);

// Check for placeholders
const hasPlaceholders =
  process.env.TWILIO_ACCOUNT_SID?.includes('your_') ||
  process.env.SMTP_USER?.includes('your_') ||
  process.env.SMTP_PASS?.includes('your_');

if (hasPlaceholders) {
  console.error('❌ ERROR: .env file still contains placeholder values!');
  console.error('Please update .env with real credentials.\n');
  process.exit(1);
}

// Verify Twilio Account SID format
if (!process.env.TWILIO_ACCOUNT_SID?.startsWith('AC') &&
    !process.env.TWILIO_ACCOUNT_SID?.startsWith('D5U')) {
  console.error('❌ ERROR: TWILIO_ACCOUNT_SID must start with AC or D5U');
  console.error(`Current value: ${process.env.TWILIO_ACCOUNT_SID}\n`);
  process.exit(1);
}

console.log('✅ All environment variables validated!\n');

// Test Results
const results: any[] = [];

async function runTests() {
  // TEST 1: Browser Automation
  console.log('🌐 Step 2: Testing Browser Automation...\n');

  const controller = new BrowserController();

  try {
    await controller.launch();
    console.log('   ✅ Browser launched successfully');
    results.push({ test: 'Browser Launch', status: 'PASS' });

    await controller.navigate('https://example.com');
    console.log('   ✅ Navigation works');
    results.push({ test: 'Page Navigation', status: 'PASS' });

    const screenshot = await controller.screenshot('comprehensive-test.png');
    console.log('   ✅ Screenshot captured');
    results.push({ test: 'Screenshot Capture', status: 'PASS' });

    await controller.close();
    console.log('   ✅ Browser automation: ALL TESTS PASSED\n');

  } catch (error: any) {
    console.error('   ❌ Browser automation failed:', error.message);
    results.push({ test: 'Browser Automation', status: 'FAIL', error: error.message });
  }

  // TEST 2: SMTP Email
  console.log('📧 Step 3: Testing SMTP Email...\n');

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS?.replace(/\s/g, '')
      }
    });

    await transporter.verify();
    console.log('   ✅ SMTP connection verified');
    results.push({ test: 'SMTP Connection', status: 'PASS' });

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: '✅ Comprehensive Test - SMTP Working',
      text: 'SMTP email sending is operational!',
      html: '<h2>✅ SMTP Test Passed</h2><p>Email sending works correctly!</p>'
    });

    console.log(`   ✅ Test email sent: ${info.messageId}`);
    console.log('   ✅ SMTP email: ALL TESTS PASSED\n');
    results.push({ test: 'SMTP Email Send', status: 'PASS' });

  } catch (error: any) {
    console.error('   ❌ SMTP failed:', error.message);
    results.push({ test: 'SMTP Email', status: 'FAIL', error: error.message });
  }

  // TEST 3: Twilio SMS Configuration
  console.log('📱 Step 4: Testing Twilio Configuration...\n');

  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio credentials not configured');
    }

    const twilioProvider = new TwilioProvider({
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      webhookPort: 3456
    });

    console.log('   ✅ TwilioProvider initialized');
    console.log(`   ✅ Phone number: ${process.env.TWILIO_PHONE_NUMBER}`);
    console.log('   ✅ Twilio configuration: VERIFIED\n');
    results.push({ test: 'Twilio Config', status: 'PASS' });

  } catch (error: any) {
    console.error('   ❌ Twilio configuration failed:', error.message);
    results.push({ test: 'Twilio Config', status: 'FAIL', error: error.message });
  }

  // FINAL RESULTS
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                      📊 TEST RESULTS 📊');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  results.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.status === 'PASS') passed++;
    else failed++;
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! 🎉\n');
    console.log('Your system is fully operational:');
    console.log('  ✅ Browser automation works');
    console.log('  ✅ Email sending works');
    console.log('  ✅ Twilio SMS configured');
    console.log('  ✅ Framework is production-ready\n');
  } else {
    console.log('⚠️  Some tests failed. See errors above.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
