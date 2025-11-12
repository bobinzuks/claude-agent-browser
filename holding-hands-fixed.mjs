#!/usr/bin/env node

/**
 * HOLDING HANDS FIXED: Proper Visual Guidance with Correct Field Detection
 */

import { chromium } from 'playwright';
import clipboardy from 'clipboardy';
import dotenv from 'dotenv';

dotenv.config();

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function holdingHandsSignup() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║        🎮 HOLDING HANDS - FIXED VERSION 🎮       ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const userData = {
    firstName: process.env.USER_FIRST_NAME,
    lastName: process.env.USER_LAST_NAME,
    email: process.env.USER_EMAIL,
    company: process.env.USER_COMPANY,
    website: process.env.USER_WEBSITE,
    phone: process.env.USER_PHONE
  };

  console.log('✅ Profile loaded:\n');
  console.log(`   Name: ${userData.firstName} ${userData.lastName}`);
  console.log(`   Email: ${userData.email}`);
  console.log(`   Company: ${userData.company}\n`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50
  });

  const page = await browser.newPage();

  try {
    console.log('🌐 Opening PartnerStack...\n');
    await page.goto('https://www.partnerstack.com/partners');
    await wait(3000);

    // Inject visual CSS
    await page.addStyleTag({
      content: `
        .hh-arrow {
          position: fixed !important;
          font-size: 80px !important;
          z-index: 999999 !important;
          color: #00ff00 !important;
          text-shadow: 3px 3px 10px rgba(0,0,0,0.8) !important;
          animation: bounce 1s infinite !important;
          pointer-events: none !important;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .hh-highlight {
          outline: 5px solid #00ff00 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 20px #00ff00 !important;
          animation: pulse 2s infinite !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .hh-message {
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          background: #667eea !important;
          color: white !important;
          padding: 25px !important;
          border-radius: 12px !important;
          font-size: 20px !important;
          font-weight: bold !important;
          z-index: 999998 !important;
          box-shadow: 0 5px 20px rgba(0,0,0,0.5) !important;
        }
      `
    });

    console.log('✅ Visual guidance injected!\n');

    // STEP 1: Find and highlight Sign Up button
    console.log('▶️  STEP 1: Click "Sign Up" button\n');

    const signupButton = await page.locator('a[href*="signup"], a:has-text("Sign up"), button:has-text("Sign up")').first();

    // Add arrow and highlight using direct element reference
    const btnHandle = await page.locator('a[href*="signup"]').first().elementHandle();

    if (btnHandle) {
      await page.evaluate((btn) => {
        if (btn) {
        btn.classList.add('hh-highlight');
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'hh-arrow';
        arrow.innerHTML = '👇';
        arrow.id = 'hh-arrow-1';
        const rect = btn.getBoundingClientRect();
        arrow.style.left = (rect.left + rect.width/2 - 40) + 'px';
        arrow.style.top = (rect.top - 100) + 'px';
        document.body.appendChild(arrow);

        const msg = document.createElement('div');
        msg.className = 'hh-message';
        msg.innerHTML = '👉 CLICK THE GREEN BUTTON';
        msg.id = 'hh-msg-1';
        document.body.appendChild(msg);
        }
      }, btnHandle);
    }

    console.log('👆 GREEN ARROW showing on screen!');
    console.log('   Click the "Sign Up" button when ready\n');

    await wait(15000); // Wait 15 seconds for click

    // Clean up arrow
    await page.evaluate(() => {
      document.getElementById('hh-arrow-1')?.remove();
      document.getElementById('hh-msg-1')?.remove();
    });

    console.log('✅ Moving to form...\n');
    await wait(3000);

    // STEP 2: Fill First Name
    console.log('▶️  STEP 2: Fill FIRST NAME\n');
    await clipboardy.write(userData.firstName);
    console.log(`📋 "${userData.firstName}" copied to clipboard!\n`);

    await page.evaluate(() => {
      const firstNameInput = document.querySelector('input[name*="first" i], input[placeholder*="first" i]');
      if (firstNameInput) {
        firstNameInput.classList.add('hh-highlight');
        firstNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'hh-arrow';
        arrow.innerHTML = '👇';
        arrow.id = 'hh-arrow-2';
        const rect = firstNameInput.getBoundingClientRect();
        arrow.style.left = (rect.left + rect.width/2 - 40) + 'px';
        arrow.style.top = (rect.top - 100) + 'px';
        document.body.appendChild(arrow);

        const msg = document.createElement('div');
        msg.className = 'hh-message';
        msg.innerHTML = 'PASTE HERE: First Name (Ctrl+V)';
        msg.id = 'hh-msg-2';
        document.body.appendChild(msg);
      }
    });

    console.log('👆 First Name field highlighted!');
    console.log('   1. Click the field');
    console.log('   2. Press Ctrl+V to paste\n');

    await wait(15000);

    await page.evaluate(() => {
      document.getElementById('hh-arrow-2')?.remove();
      document.getElementById('hh-msg-2')?.remove();
    });

    // STEP 3: Fill Last Name
    console.log('▶️  STEP 3: Fill LAST NAME\n');
    await clipboardy.write(userData.lastName);
    console.log(`📋 "${userData.lastName}" copied to clipboard!\n`);

    await page.evaluate(() => {
      const input = document.querySelector('input[name*="last" i], input[placeholder*="last" i]');
      if (input) {
        input.classList.add('hh-highlight');
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'hh-arrow';
        arrow.innerHTML = '👇';
        arrow.id = 'hh-arrow-3';
        const rect = input.getBoundingClientRect();
        arrow.style.left = (rect.left + rect.width/2 - 40) + 'px';
        arrow.style.top = (rect.top - 100) + 'px';
        document.body.appendChild(arrow);

        const msg = document.createElement('div');
        msg.className = 'hh-message';
        msg.innerHTML = 'PASTE HERE: Last Name (Ctrl+V)';
        msg.id = 'hh-msg-3';
        document.body.appendChild(msg);
      }
    });

    console.log('👆 Last Name field highlighted!\n');
    await wait(15000);

    await page.evaluate(() => {
      document.getElementById('hh-arrow-3')?.remove();
      document.getElementById('hh-msg-3')?.remove();
    });

    // STEP 4: Fill Email
    console.log('▶️  STEP 4: Fill EMAIL\n');
    await clipboardy.write(userData.email);
    console.log(`📋 "${userData.email}" copied to clipboard!\n`);

    await page.evaluate(() => {
      const input = document.querySelector('input[type="email"], input[name*="email" i]');
      if (input) {
        input.classList.add('hh-highlight');
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'hh-arrow';
        arrow.innerHTML = '👇';
        arrow.id = 'hh-arrow-4';
        const rect = input.getBoundingClientRect();
        arrow.style.left = (rect.left + rect.width/2 - 40) + 'px';
        arrow.style.top = (rect.top - 100) + 'px';
        document.body.appendChild(arrow);

        const msg = document.createElement('div');
        msg.className = 'hh-message';
        msg.innerHTML = 'PASTE HERE: Email (Ctrl+V)';
        msg.id = 'hh-msg-4';
        document.body.appendChild(msg);
      }
    });

    console.log('👆 Email field highlighted!\n');
    await wait(15000);

    await page.evaluate(() => {
      document.getElementById('hh-arrow-4')?.remove();
      document.getElementById('hh-msg-4')?.remove();
    });

    // STEP 5: Fill Company/Website
    console.log('▶️  STEP 5: Fill COMPANY/WEBSITE\n');
    await clipboardy.write(userData.company);
    console.log(`📋 "${userData.company}" copied to clipboard!\n`);

    await page.evaluate(() => {
      const input = document.querySelector('input[name*="company" i], input[name*="business" i], input[placeholder*="company" i]');
      if (input) {
        input.classList.add('hh-highlight');
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'hh-arrow';
        arrow.innerHTML = '👇';
        arrow.id = 'hh-arrow-5';
        const rect = input.getBoundingClientRect();
        arrow.style.left = (rect.left + rect.width/2 - 40) + 'px';
        arrow.style.top = (rect.top - 100) + 'px';
        document.body.appendChild(arrow);

        const msg = document.createElement('div');
        msg.className = 'hh-message';
        msg.innerHTML = 'PASTE HERE: Company (Ctrl+V)';
        msg.id = 'hh-msg-5';
        document.body.appendChild(msg);
      }
    });

    console.log('👆 Company field highlighted!\n');
    await wait(15000);

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║              ✅ BASIC FIELDS DONE! ✅             ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log('🔐 Now complete the rest manually:\n');
    console.log('   1. Create a password');
    console.log('   2. Accept Terms of Service');
    console.log('   3. Click Submit\n');
    console.log('Browser will stay open for 2 minutes...\n');

    await wait(120000); // 2 minutes

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Done!\n');
  }
}

holdingHandsSignup().catch(console.error);
