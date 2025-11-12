#!/usr/bin/env node

import { chromium } from 'playwright';
import clipboardy from 'clipboardy';
import dotenv from 'dotenv';

dotenv.config();

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function partnerstackSignup() {
  console.log('🎮 PartnerStack Holding Hands Signup\n');

  const userData = {
    firstName: process.env.USER_FIRST_NAME,
    lastName: process.env.USER_LAST_NAME,
    email: process.env.USER_EMAIL,
  };

  console.log(`✅ Using: ${userData.firstName} ${userData.lastName}`);
  console.log(`   Email: ${userData.email}\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  try {
    console.log('🌐 Opening PartnerStack...\n');
    await page.goto('https://www.partnerstack.com/partners');
    await wait(3000);

    // Inject visual styles
    await page.addStyleTag({
      content: `
        .arrow-point {
          position: fixed !important;
          font-size: 100px !important;
          z-index: 999999 !important;
          color: #00ff00 !important;
          text-shadow: 5px 5px 15px rgba(0,0,0,1) !important;
          animation: bounce-arrow 1s infinite !important;
          pointer-events: none !important;
        }
        @keyframes bounce-arrow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }
        .field-glow {
          outline: 8px solid #00ff00 !important;
          outline-offset: 5px !important;
          box-shadow: 0 0 30px 10px #00ff00 !important;
          animation: glow-pulse 2s infinite !important;
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .instruction-box {
          position: fixed !important;
          top: 30px !important;
          right: 30px !important;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          padding: 30px !important;
          border-radius: 15px !important;
          font-size: 24px !important;
          font-weight: bold !important;
          z-index: 999998 !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.6) !important;
          max-width: 500px !important;
        }
      `
    });

    console.log('✅ Visual guidance ready!\n');

    // STEP 1: First Name
    console.log('📍 STEP 1: First Name Field\n');
    await clipboardy.write(userData.firstName);
    console.log(`📋 "${userData.firstName}" copied to clipboard!\n`);

    await page.evaluate(() => {
      const input = document.querySelector('input[name*="first" i], input[placeholder*="first" i], #firstName, [name="firstName"]');
      if (input) {
        input.classList.add('field-glow');
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'arrow-point';
        arrow.innerHTML = '👇';
        arrow.id = 'arrow-1';
        const rect = input.getBoundingClientRect();
        arrow.style.left = (rect.left + rect.width/2 - 50) + 'px';
        arrow.style.top = (rect.top - 120) + 'px';
        document.body.appendChild(arrow);

        const box = document.createElement('div');
        box.className = 'instruction-box';
        box.id = 'box-1';
        box.innerHTML = `
          <div style="margin-bottom: 15px;">🎯 STEP 1 of 3</div>
          <div>Click the GREEN field below</div>
          <div style="margin-top: 10px; font-size: 18px;">Then press <strong>Ctrl+V</strong> to paste</div>
        `;
        document.body.appendChild(box);
      }
    });

    console.log('👀 Look for the HUGE GREEN ARROW on your screen!');
    console.log('   1. Click the glowing green First Name field');
    console.log('   2. Press Ctrl+V to paste\n');
    console.log('⏳ Waiting 20 seconds...\n');

    await wait(20000);

    await page.evaluate(() => {
      document.getElementById('arrow-1')?.remove();
      document.getElementById('box-1')?.remove();
    });

    // STEP 2: Last Name
    console.log('📍 STEP 2: Last Name Field\n');
    await clipboardy.write(userData.lastName);
    console.log(`📋 "${userData.lastName}" copied!\n`);

    await page.evaluate(() => {
      const input = document.querySelector('input[name*="last" i], input[placeholder*="last" i], #lastName, [name="lastName"]');
      if (input) {
        input.classList.add('field-glow');
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'arrow-point';
        arrow.innerHTML = '👇';
        arrow.id = 'arrow-2';
        const rect = input.getBoundingClientRect();
        arrow.style.left = (rect.left + rect.width/2 - 50) + 'px';
        arrow.style.top = (rect.top - 120) + 'px';
        document.body.appendChild(arrow);

        const box = document.createElement('div');
        box.className = 'instruction-box';
        box.id = 'box-2';
        box.innerHTML = `
          <div style="margin-bottom: 15px;">🎯 STEP 2 of 3</div>
          <div>Click the GREEN field</div>
          <div style="margin-top: 10px; font-size: 18px;">Press <strong>Ctrl+V</strong></div>
        `;
        document.body.appendChild(box);
      }
    });

    console.log('👇 Last Name field highlighted!\n');
    await wait(20000);

    await page.evaluate(() => {
      document.getElementById('arrow-2')?.remove();
      document.getElementById('box-2')?.remove();
    });

    // STEP 3: Email
    console.log('📍 STEP 3: Email Field\n');
    await clipboardy.write(userData.email);
    console.log(`📋 "${userData.email}" copied!\n`);

    await page.evaluate(() => {
      const input = document.querySelector('input[type="email"], input[name*="email" i], #email');
      if (input) {
        input.classList.add('field-glow');
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'arrow-point';
        arrow.innerHTML = '👇';
        arrow.id = 'arrow-3';
        const rect = input.getBoundingClientRect();
        arrow.style.left = (rect.left + rect.width/2 - 50) + 'px';
        arrow.style.top = (rect.top - 120) + 'px';
        document.body.appendChild(arrow);

        const box = document.createElement('div');
        box.className = 'instruction-box';
        box.id = 'box-3';
        box.innerHTML = `
          <div style="margin-bottom: 15px;">🎯 STEP 3 of 3</div>
          <div>Email (Business email)</div>
          <div style="margin-top: 10px; font-size: 18px;">Paste with <strong>Ctrl+V</strong></div>
        `;
        document.body.appendChild(box);
      }
    });

    console.log('👇 Email field highlighted!\n');
    await wait(20000);

    console.log('\n✅ DONE! Now you can:');
    console.log('   - Accept privacy policy checkbox');
    console.log('   - Click "Get Started" button\n');
    console.log('Browser will stay open for 2 minutes...\n');

    await wait(120000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Complete!\n');
  }
}

partnerstackSignup().catch(console.error);
