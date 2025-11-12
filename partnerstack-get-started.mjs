#!/usr/bin/env node

/**
 * PartnerStack Signup - Point to "Get started" button
 */

import { chromium } from 'playwright';
import clipboardy from 'clipboardy';
import dotenv from 'dotenv';

dotenv.config();

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function partnerstackSignup() {
  console.log('🎮 PartnerStack Signup Guide\n');

  const userData = {
    firstName: process.env.USER_FIRST_NAME,
    lastName: process.env.USER_LAST_NAME,
    email: process.env.USER_EMAIL,
    company: process.env.USER_COMPANY,
  };

  console.log(`✅ Using: ${userData.firstName} ${userData.lastName}`);
  console.log(`   Email: ${userData.email}\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  try {
    console.log('🌐 Opening PartnerStack...\n');
    await page.goto('https://www.partnerstack.com/partners');
    await wait(3000);

    // Inject arrow styles
    await page.addStyleTag({
      content: `
        .ps-arrow {
          position: fixed !important;
          font-size: 100px !important;
          z-index: 99999999 !important;
          text-shadow: 0 0 50px #00ff00 !important;
          animation: bounce-ps 1s infinite !important;
          pointer-events: none !important;
        }
        @keyframes bounce-ps {
          0%, 100% { transform: translateY(0) rotate(-45deg); }
          50% { transform: translateY(-20px) rotate(-45deg); }
        }
        .ps-glow {
          outline: 8px solid #00ff00 !important;
          outline-offset: 5px !important;
          box-shadow: 0 0 30px 10px #00ff00 !important;
          animation: glow-ps 2s infinite !important;
        }
        @keyframes glow-ps {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .ps-message {
          position: fixed !important;
          top: 100px !important;
          right: 30px !important;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          padding: 30px !important;
          border-radius: 15px !important;
          font-size: 24px !important;
          font-weight: bold !important;
          z-index: 99999998 !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.6) !important;
        }
      `
    });

    console.log('📍 STEP 1: Click "Get started" button\n');

    // Point to "Get started" button in top right
    await page.evaluate(() => {
      // Find the "Get started" button using multiple methods
      let btn = null;

      // Try href attribute
      btn = document.querySelector('a[href*="get-started"]');

      // If not found, search all links and buttons for text content
      if (!btn) {
        const allLinks = Array.from(document.querySelectorAll('a, button'));
        btn = allLinks.find(el => el.textContent.toLowerCase().includes('get started'));
      }

      if (btn) {
        btn.classList.add('ps-glow');
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'ps-arrow';
        arrow.innerHTML = '👉';
        arrow.id = 'ps-arrow-1';
        const rect = btn.getBoundingClientRect();
        arrow.style.position = 'fixed';
        arrow.style.left = (rect.left - 120) + 'px';
        arrow.style.top = (rect.top + rect.height/2 - 50) + 'px';
        document.body.appendChild(arrow);

        const msg = document.createElement('div');
        msg.className = 'ps-message';
        msg.id = 'ps-msg-1';
        msg.innerHTML = `
          <div style="margin-bottom: 15px;">🎯 STEP 1</div>
          <div>Click the GREEN "Get started" button →</div>
        `;
        document.body.appendChild(msg);
      }
    });

    console.log('👉 GREEN ARROW pointing to "Get started" button!');
    console.log('   Click it when ready\n');
    console.log('⏳ Waiting 20 seconds...\n');

    await wait(20000);

    // Clean up
    await page.evaluate(() => {
      document.getElementById('ps-arrow-1')?.remove();
      document.getElementById('ps-msg-1')?.remove();
    });

    console.log('✅ Moving to form...\n');
    await wait(3000);

    // STEP 2: First Name
    console.log('📍 STEP 2: First Name\n');
    await clipboardy.write(userData.firstName);
    console.log(`📋 "${userData.firstName}" copied!\n`);

    await page.evaluate(() => {
      const input = document.querySelector('input[name*="first" i], input[placeholder*="first" i], #firstName, [name="firstName"]');
      if (input) {
        input.classList.add('ps-glow');
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'ps-arrow';
        arrow.innerHTML = '👇';
        arrow.id = 'ps-arrow-2';
        const rect = input.getBoundingClientRect();
        arrow.style.position = 'fixed';
        arrow.style.left = (rect.left + rect.width/2 - 50) + 'px';
        arrow.style.top = (rect.top - 120) + 'px';
        document.body.appendChild(arrow);

        const msg = document.createElement('div');
        msg.className = 'ps-message';
        msg.id = 'ps-msg-2';
        msg.innerHTML = `
          <div style="margin-bottom: 15px;">🎯 STEP 2 of 4</div>
          <div>Click field below</div>
          <div style="margin-top: 10px; font-size: 18px;">Press <strong>Ctrl+V</strong></div>
        `;
        document.body.appendChild(msg);
      }
    });

    console.log('👇 First Name field highlighted!\n');
    await wait(20000);

    await page.evaluate(() => {
      document.getElementById('ps-arrow-2')?.remove();
      document.getElementById('ps-msg-2')?.remove();
    });

    // STEP 3: Last Name
    console.log('📍 STEP 3: Last Name\n');
    await clipboardy.write(userData.lastName);
    console.log(`📋 "${userData.lastName}" copied!\n`);

    await page.evaluate(() => {
      const input = document.querySelector('input[name*="last" i], input[placeholder*="last" i], #lastName, [name="lastName"]');
      if (input) {
        input.classList.add('ps-glow');
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'ps-arrow';
        arrow.innerHTML = '👇';
        arrow.id = 'ps-arrow-3';
        const rect = input.getBoundingClientRect();
        arrow.style.position = 'fixed';
        arrow.style.left = (rect.left + rect.width/2 - 50) + 'px';
        arrow.style.top = (rect.top - 120) + 'px';
        document.body.appendChild(arrow);

        const msg = document.createElement('div');
        msg.className = 'ps-message';
        msg.id = 'ps-msg-3';
        msg.innerHTML = `
          <div style="margin-bottom: 15px;">🎯 STEP 3 of 4</div>
          <div>Last Name</div>
          <div style="margin-top: 10px; font-size: 18px;">Press <strong>Ctrl+V</strong></div>
        `;
        document.body.appendChild(msg);
      }
    });

    console.log('👇 Last Name highlighted!\n');
    await wait(20000);

    await page.evaluate(() => {
      document.getElementById('ps-arrow-3')?.remove();
      document.getElementById('ps-msg-3')?.remove();
    });

    // STEP 4: Email
    console.log('📍 STEP 4: Email\n');
    await clipboardy.write(userData.email);
    console.log(`📋 "${userData.email}" copied!\n`);

    await page.evaluate(() => {
      const input = document.querySelector('input[type="email"], input[name*="email" i], #email');
      if (input) {
        input.classList.add('ps-glow');
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'ps-arrow';
        arrow.innerHTML = '👇';
        arrow.id = 'ps-arrow-4';
        const rect = input.getBoundingClientRect();
        arrow.style.position = 'fixed';
        arrow.style.left = (rect.left + rect.width/2 - 50) + 'px';
        arrow.style.top = (rect.top - 120) + 'px';
        document.body.appendChild(arrow);

        const msg = document.createElement('div');
        msg.className = 'ps-message';
        msg.id = 'ps-msg-4';
        msg.innerHTML = `
          <div style="margin-bottom: 15px;">🎯 STEP 4 of 4</div>
          <div>Email</div>
          <div style="margin-top: 10px; font-size: 18px;">Press <strong>Ctrl+V</strong></div>
        `;
        document.body.appendChild(msg);
      }
    });

    console.log('👇 Email highlighted!\n');
    await wait(20000);

    console.log('\n✅ BASIC INFO DONE!\n');
    console.log('Now complete manually:');
    console.log('   - Company/Website');
    console.log('   - Accept terms');
    console.log('   - Click Submit\n');
    console.log('Browser stays open for 3 minutes...\n');

    await wait(180000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Done!\n');
  }
}

partnerstackSignup().catch(console.error);
