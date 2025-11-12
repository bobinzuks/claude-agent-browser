#!/usr/bin/env node

/**
 * PartnerStack Demo Form Guide - Detects "Book a demo" form
 */

import { chromium } from 'playwright';
import clipboardy from 'clipboardy';
import dotenv from 'dotenv';

dotenv.config();

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function partnerstackDemoForm() {
  console.log('🎮 PartnerStack Demo Form Guide\n');

  const userData = {
    firstName: process.env.USER_FIRST_NAME,
    lastName: process.env.USER_LAST_NAME,
    email: process.env.USER_EMAIL,
    company: process.env.USER_COMPANY,
  };

  console.log(`✅ Ready: ${userData.firstName} ${userData.lastName}`);
  console.log(`   Email: ${userData.email}\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  try {
    console.log('🌐 Opening PartnerStack partners page...\n');
    await page.goto('https://www.partnerstack.com/partners');
    await wait(3000);

    // Take screenshot
    await page.screenshot({ path: 'current-page.png' });
    console.log('📸 Screenshot saved: current-page.png\n');

    // Inject styles
    await page.addStyleTag({
      content: `
        .demo-arrow {
          position: fixed !important;
          font-size: 120px !important;
          z-index: 99999999 !important;
          text-shadow: 0 0 50px #00ff00 !important;
          animation: bounce-demo 1s infinite !important;
          pointer-events: none !important;
        }
        @keyframes bounce-demo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-25px); }
        }
        .demo-glow {
          outline: 10px solid #00ff00 !important;
          outline-offset: 8px !important;
          box-shadow: 0 0 40px 15px #00ff00 !important;
        }
        .demo-message {
          position: fixed !important;
          top: 80px !important;
          right: 40px !important;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          padding: 35px !important;
          border-radius: 18px !important;
          font-size: 26px !important;
          font-weight: bold !important;
          z-index: 99999998 !important;
          box-shadow: 0 15px 50px rgba(0,0,0,0.7) !important;
        }
      `
    });

    // Detect what's on the page
    const pageInfo = await page.evaluate(() => {
      const hasGetStarted = !!Array.from(document.querySelectorAll('a, button')).find(el =>
        el.textContent.toLowerCase().includes('get started')
      );

      const hasVendorChoice = document.body.textContent.includes("I'm a software vendor");

      const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input:not([type])'));
      const inputDetails = allInputs.map(input => ({
        name: input.name || input.id || input.placeholder || 'unknown',
        type: input.type,
        placeholder: input.placeholder
      }));

      const hasBookDemo = document.body.textContent.includes("Book a demo");

      return {
        hasGetStarted,
        hasVendorChoice,
        hasBookDemo,
        inputCount: allInputs.length,
        inputs: inputDetails
      };
    });

    console.log('📋 Page detection:', pageInfo, '\n');

    if (pageInfo.hasGetStarted && !pageInfo.hasBookDemo) {
      console.log('▶️  STEP 1: Click "Get started"\n');

      await page.evaluate(() => {
        const allLinks = Array.from(document.querySelectorAll('a, button'));
        const btn = allLinks.find(el => el.textContent.toLowerCase().includes('get started'));

        if (btn) {
          btn.classList.add('demo-glow');
          btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

          const arrow = document.createElement('div');
          arrow.className = 'demo-arrow';
          arrow.innerHTML = '👉';
          const rect = btn.getBoundingClientRect();
          arrow.style.position = 'fixed';
          arrow.style.left = (rect.left - 140) + 'px';
          arrow.style.top = (rect.top + rect.height/2 - 60) + 'px';
          document.body.appendChild(arrow);

          const msg = document.createElement('div');
          msg.className = 'demo-message';
          msg.innerHTML = '<div>👉 Click "Get started"</div>';
          document.body.appendChild(msg);
        }
      });

      console.log('👉 Arrow pointing to "Get started"\n');
      console.log('Waiting for you to click...\n');
      await wait(30000);

    } else if (pageInfo.hasVendorChoice && !pageInfo.hasBookDemo) {
      console.log('▶️  STEP 2: Click "I\'m a software vendor"\n');

      await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('*'));
        const vendorBtn = allElements.find(el =>
          el.textContent.includes("I'm a software vendor") &&
          el.offsetParent !== null
        );

        if (vendorBtn) {
          vendorBtn.classList.add('demo-glow');
          vendorBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

          const arrow = document.createElement('div');
          arrow.className = 'demo-arrow';
          arrow.innerHTML = '👇';
          const rect = vendorBtn.getBoundingClientRect();
          arrow.style.position = 'fixed';
          arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
          arrow.style.top = (rect.top - 140) + 'px';
          document.body.appendChild(arrow);

          const msg = document.createElement('div');
          msg.className = 'demo-message';
          msg.innerHTML = '<div>👇 Click "Software vendor"</div>';
          document.body.appendChild(msg);
        }
      });

      console.log('👇 Arrow pointing to "Software vendor"\n');
      await wait(30000);

    } else if (pageInfo.hasBookDemo || pageInfo.inputCount >= 2) {
      console.log('✅ FORM DETECTED! (Book a demo or signup)\n');

      // Clean old arrows
      await page.evaluate(() => {
        document.querySelectorAll('.demo-arrow, .demo-message').forEach(el => el.remove());
      });

      await wait(2000);

      // Find first text/email input
      console.log('▶️  STEP 3: First Name\n');
      await clipboardy.write(userData.firstName);
      console.log(`📋 "${userData.firstName}" copied!\n`);

      await page.evaluate(() => {
        const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input:not([type])'));
        const firstInput = allInputs[0];

        if (firstInput) {
          firstInput.classList.add('demo-glow');
          firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });

          const arrow = document.createElement('div');
          arrow.className = 'demo-arrow';
          arrow.innerHTML = '👇';
          const rect = firstInput.getBoundingClientRect();
          arrow.style.position = 'fixed';
          arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
          arrow.style.top = (rect.top - 140) + 'px';
          document.body.appendChild(arrow);

          const msg = document.createElement('div');
          msg.className = 'demo-message';
          msg.innerHTML = `<div>👇 First field: ${firstInput.placeholder || 'First name'}</div><div style="font-size: 18px; margin-top: 10px;">Ctrl+V</div>`;
          document.body.appendChild(msg);
        }
      });

      await wait(15000);

      // Second field
      console.log('▶️  STEP 4: Last Name\n');
      await clipboardy.write(userData.lastName);
      console.log(`📋 "${userData.lastName}" copied!\n`);

      await page.evaluate(() => {
        document.querySelectorAll('.demo-arrow, .demo-message').forEach(el => el.remove());

        const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input:not([type])'));
        const secondInput = allInputs[1];

        if (secondInput) {
          secondInput.classList.add('demo-glow');
          secondInput.scrollIntoView({ behavior: 'smooth', block: 'center' });

          const arrow = document.createElement('div');
          arrow.className = 'demo-arrow';
          arrow.innerHTML = '👇';
          const rect = secondInput.getBoundingClientRect();
          arrow.style.position = 'fixed';
          arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
          arrow.style.top = (rect.top - 140) + 'px';
          document.body.appendChild(arrow);

          const msg = document.createElement('div');
          msg.className = 'demo-message';
          msg.innerHTML = `<div>👇 Second field: ${secondInput.placeholder || 'Last name'}</div><div style="font-size: 18px; margin-top: 10px;">Ctrl+V</div>`;
          document.body.appendChild(msg);
        }
      });

      await wait(15000);

      // Email field
      console.log('▶️  STEP 5: Email\n');
      await clipboardy.write(userData.email);
      console.log(`📋 "${userData.email}" copied!\n`);

      await page.evaluate(() => {
        document.querySelectorAll('.demo-arrow, .demo-message').forEach(el => el.remove());

        // Look for email input specifically
        let emailInput = document.querySelector('input[type="email"]');
        if (!emailInput) {
          const allInputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
          emailInput = allInputs.find(input =>
            input.placeholder?.toLowerCase().includes('email') ||
            input.name?.toLowerCase().includes('email')
          );
          if (!emailInput) emailInput = allInputs[2]; // Third field as fallback
        }

        if (emailInput) {
          emailInput.classList.add('demo-glow');
          emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });

          const arrow = document.createElement('div');
          arrow.className = 'demo-arrow';
          arrow.innerHTML = '👇';
          const rect = emailInput.getBoundingClientRect();
          arrow.style.position = 'fixed';
          arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
          arrow.style.top = (rect.top - 140) + 'px';
          document.body.appendChild(arrow);

          const msg = document.createElement('div');
          msg.className = 'demo-message';
          msg.innerHTML = `<div>👇 Email field</div><div style="font-size: 18px; margin-top: 10px;">Ctrl+V</div>`;
          document.body.appendChild(msg);
        }
      });

      await wait(15000);

      console.log('\n✅ Basic fields guided!\n');
      console.log('Complete remaining fields manually\n');
    }

    console.log('Browser stays open for 3 minutes...\n');
    await wait(180000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('✅ Done!\n');
  }
}

partnerstackDemoForm().catch(console.error);
