#!/usr/bin/env npx tsx
/**
 * SMTP Connection Test
 * Verifies Gmail app password and SMTP configuration
 */

import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSMTP() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              📧 SMTP Connection Test 📧                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Check environment variables
  console.log('Step 1: Checking environment variables...');
  if (!process.env.SMTP_USER) {
    console.error('❌ SMTP_USER not set in .env file');
    process.exit(1);
  }
  if (!process.env.SMTP_PASS) {
    console.error('❌ SMTP_PASS not set in .env file');
    process.exit(1);
  }

  console.log(`   SMTP_USER: ${process.env.SMTP_USER} ✅`);
  console.log(`   SMTP_PASS: ${process.env.SMTP_PASS.substring(0, 4)}${'*'.repeat(12)} ✅\n`);

  // Strip spaces from password (common mistake)
  const password = process.env.SMTP_PASS.replace(/\s/g, '');
  if (password !== process.env.SMTP_PASS) {
    console.log('⚠️  Warning: Removed spaces from password');
    console.log(`   Original length: ${process.env.SMTP_PASS.length}`);
    console.log(`   Cleaned length: ${password.length}\n`);
  }

  // Create transporter
  console.log('Step 2: Creating SMTP transporter...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: password
    },
    logger: false, // Set to true for detailed logs
    debug: false   // Set to true for debugging
  });

  console.log('   Transporter created ✅\n');

  // Test connection
  console.log('Step 3: Verifying SMTP connection...');
  try {
    await transporter.verify();
    console.log('   ✅ SMTP connection successful!\n');
  } catch (error: any) {
    console.error('   ❌ SMTP connection failed!');
    console.error('   Error:', error.message);

    if (error.message.includes('Username and Password not accepted')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Make sure 2FA is enabled on your Gmail account');
      console.error('   2. Generate an App Password at: https://myaccount.google.com/apppasswords');
      console.error('   3. Copy the 16-character password WITHOUT spaces');
      console.error('   4. Update .env file: SMTP_PASS=abcdefghijklmnop\n');
    }

    process.exit(1);
  }

  // Send test email
  console.log('Step 4: Sending test email...');
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to self
      subject: '✅ SMTP Test Successful - Claude Browser Agent',
      text: `SMTP connection is working!

This email confirms that your Gmail SMTP configuration is correct.

Configuration:
- SMTP Host: smtp.gmail.com
- SMTP Port: 587
- Security: STARTTLS
- User: ${process.env.SMTP_USER}

Timestamp: ${new Date().toISOString()}

Your browser automation framework can now send emails!`,
      html: `<h2>✅ SMTP Test Successful</h2>
<p>SMTP connection is working!</p>

<p>This email confirms that your Gmail SMTP configuration is correct.</p>

<h3>Configuration:</h3>
<ul>
  <li>SMTP Host: smtp.gmail.com</li>
  <li>SMTP Port: 587</li>
  <li>Security: STARTTLS</li>
  <li>User: ${process.env.SMTP_USER}</li>
</ul>

<p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>

<p>Your browser automation framework can now send emails!</p>`
    });

    console.log('   ✅ Test email sent!');
    console.log(`   Message ID: ${info.messageId}\n`);

  } catch (error: any) {
    console.error('   ❌ Failed to send email');
    console.error('   Error:', error.message);
    process.exit(1);
  }

  // Success
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                  ✅ ALL TESTS PASSED! ✅                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('Next steps:');
  console.log('1. Check your inbox for the test email');
  console.log('2. Run full integration test: npx tsx tests/discord-signup-demo.ts');
  console.log('3. Or test Twitter (harder): npx tsx tests/twitter-signup-demo.ts\n');
}

// Run test
testSMTP().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
