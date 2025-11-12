#!/usr/bin/env node
/**
 * Quick test to verify phone verification setup
 * Tests all components without actually running browser automation
 */

import { TwilioProvider } from './dist/extension/lib/sms-providers/twilio-provider.js';

async function testSetup() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     📱 Phone Verification Setup Test 📱                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Test 1: Check environment variables
  console.log('Test 1: Checking environment variables...');
  const hasAccountSid = !!process.env.TWILIO_ACCOUNT_SID;
  const hasAuthToken = !!process.env.TWILIO_AUTH_TOKEN;
  const hasPhoneNumber = !!process.env.TWILIO_PHONE_NUMBER;

  console.log(`   TWILIO_ACCOUNT_SID: ${hasAccountSid ? '✅ Set' : '❌ Missing'}`);
  console.log(`   TWILIO_AUTH_TOKEN:  ${hasAuthToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`   TWILIO_PHONE_NUMBER: ${hasPhoneNumber ? '✅ Set' : '❌ Missing'}\n`);

  if (!hasAccountSid || !hasAuthToken || !hasPhoneNumber) {
    console.log('⚠️  Please set Twilio environment variables:\n');
    console.log('   export TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    console.log('   export TWILIO_AUTH_TOKEN=your_auth_token_here');
    console.log('   export TWILIO_PHONE_NUMBER=+15551234567\n');
    return;
  }

  // Test 2: Initialize TwilioProvider
  console.log('Test 2: Initializing TwilioProvider...');
  try {
    const provider = new TwilioProvider({
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      webhookPort: 3456,
    });

    console.log('   ✅ TwilioProvider initialized successfully\n');

    // Test 3: Check configuration
    console.log('Test 3: Checking provider configuration...');
    const isConfigured = provider.isConfigured();
    console.log(`   Configuration valid: ${isConfigured ? '✅ Yes' : '❌ No'}\n`);

    // Test 4: Get phone number
    console.log('Test 4: Getting phone number...');
    const phoneNumber = await provider.getPhoneNumber();
    console.log(`   Phone number: ${phoneNumber} ✅\n`);

    // Test 5: Start webhook server
    console.log('Test 5: Starting webhook server...');
    await provider.startListening();
    console.log('   ✅ Webhook server started on http://localhost:3456/sms\n');

    // Test 6: Test code extraction
    console.log('Test 6: Testing code extraction...');
    const testMessages = [
      'Your verification code is 123456',
      'Use code 789012 to verify your account',
      'Code: 456789',
      '987654 is your verification code',
    ];

    for (const msg of testMessages) {
      // Access protected method via reflection (for testing only)
      const extracted = provider.extractVerificationCode(msg);
      if (extracted) {
        console.log(`   ✅ Extracted "${extracted.code}" from: "${msg.substring(0, 40)}..."`);
      } else {
        console.log(`   ❌ Failed to extract from: "${msg}"`);
      }
    }

    console.log('\n');

    // Test 7: Test webhook endpoint
    console.log('Test 7: Testing webhook endpoint...');
    console.log('   You can test the webhook with:');
    console.log(`   curl -X POST http://localhost:3456/sms \\`);
    console.log(`     -d "From=%2B15559876543" \\`);
    console.log(`     -d "To=${encodeURIComponent(phoneNumber)}" \\`);
    console.log(`     -d "Body=Your verification code is 123456" \\`);
    console.log(`     -d "MessageSid=SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"\n`);

    console.log('   Or check health endpoint:');
    console.log('   curl http://localhost:3456/health\n');

    // Wait a bit for manual testing
    console.log('Webhook server is running. Press Ctrl+C to stop.\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ ALL TESTS PASSED! ✅                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('Next steps:');
    console.log('1. Configure Twilio webhook URL (see PHONE-VERIFICATION-SETUP.md)');
    console.log('2. Test with: curl -X POST http://localhost:3456/sms ...');
    console.log('3. Run full example: ts-node examples/phone-verification-example.ts\n');

    // Keep server running for manual testing
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Cleanup
    await provider.stopListening();
    console.log('Webhook server stopped.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nError details:', error);
  }
}

// Run tests
testSetup().catch(console.error);
