#!/usr/bin/env ts-node
/**
 * Phone Verification Example
 * Demonstrates how to use Twilio SMS provider for phone verification automation
 */

import { ExtendedBrowserController } from '../src/extension/lib/browser-controller-extensions.js';
import { TwilioProvider } from '../src/extension/lib/sms-providers/twilio-provider.js';

async function example() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         📱 Phone Verification Automation Example 📱          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Step 1: Initialize Twilio SMS Provider
  console.log('Step 1: Initializing Twilio SMS Provider...');
  const twilioProvider = new TwilioProvider({
    accountSid: process.env.TWILIO_ACCOUNT_SID || 'YOUR_ACCOUNT_SID',
    authToken: process.env.TWILIO_AUTH_TOKEN || 'YOUR_AUTH_TOKEN',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '+15551234567',
    webhookPort: 3456,
  });

  // Start webhook server to receive SMS
  await twilioProvider.startListening();
  console.log('✅ Twilio webhook server started\n');

  // Step 2: Initialize Browser Controller
  console.log('Step 2: Launching browser...');
  const controller = new ExtendedBrowserController({
    headless: false,
    slowMo: 100,
  });

  await controller.launch();
  console.log('✅ Browser launched\n');

  // Step 3: Setup phone verification
  console.log('Step 3: Setting up phone verification...');
  controller.setupPhoneVerification(twilioProvider, './verification-db');
  console.log('✅ Phone verification configured\n');

  try {
    // Step 4: Navigate to site with phone verification
    console.log('Step 4: Navigating to example site...');
    // Replace with actual site that requires phone verification
    await controller.navigate('https://example.com/signup');
    console.log('✅ Page loaded\n');

    // Step 5: Fill in other form fields (username, email, password, etc.)
    console.log('Step 5: Filling in registration form...');
    // Example - adjust selectors for your target site
    /*
    await controller.fill('#username', 'testuser123');
    await controller.fill('#email', 'test@example.com');
    await controller.fill('#password', 'SecurePassword123!');
    */
    console.log('✅ Form filled\n');

    // Step 6: Handle phone verification automatically
    console.log('Step 6: Handling phone verification...');
    console.log('   → Detecting verification flow');
    console.log('   → Entering phone number');
    console.log('   → Waiting for SMS code');
    console.log('   → Entering verification code');
    console.log('   → Submitting form\n');

    const result = await controller.handlePhoneVerification();

    if (result.success) {
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║              ✅ PHONE VERIFICATION SUCCESSFUL! ✅             ║');
      console.log('╚══════════════════════════════════════════════════════════════╝\n');
      console.log(`Phone Number: ${result.phoneNumber}`);
      console.log(`Code Used: ${result.codeUsed}`);
      console.log(`Duration: ${result.duration}ms`);
      console.log(`Flow Type: ${result.flow?.type}\n`);
    } else {
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║              ❌ PHONE VERIFICATION FAILED! ❌                ║');
      console.log('╚══════════════════════════════════════════════════════════════╝\n');
      console.log(`Error: ${result.error}\n`);
    }

    // Step 7: View statistics
    console.log('Step 7: Verification Statistics...');
    const stats = controller.getVerificationStats();
    if (stats) {
      console.log(`   Total Actions: ${stats.totalActions}`);
      console.log(`   Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
      console.log(`   Action Types:`, stats.actionTypes);
    }

    // Save patterns for future use
    controller.saveVerificationPatterns();
    console.log('✅ Patterns saved to database\n');

    // Wait to see results
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cleanup
    console.log('\nCleaning up...');
    await controller.close();
    await twilioProvider.stopListening();
    console.log('✅ Done!\n');
  }
}

// Run example
example().catch(console.error);
