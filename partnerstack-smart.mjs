#!/usr/bin/env node

/**
 * PartnerStack Smart Guide - Tracks page changes and user interactions
 */

import { chromium } from 'playwright';
import clipboardy from 'clipboardy';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function partnerstackSmartGuide() {
  console.log('🎮 PartnerStack Smart Guide (with page tracking)\n');

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

  // Track clicks and page changes
  let clickCount = 0;
  let currentStep = 'landing';

  try {
    console.log('🌐 Opening PartnerStack...\n');
    await page.goto('https://www.partnerstack.com/partners');
    await wait(3000);

    // Take initial screenshot
    await page.screenshot({ path: 'screenshot-landing.png' });
    console.log('📸 Screenshot saved: screenshot-landing.png\n');

    // Inject arrow styles
    await page.addStyleTag({
      content: `
        .smart-arrow {
          position: fixed !important;
          font-size: 100px !important;
          z-index: 99999999 !important;
          text-shadow: 0 0 50px #00ff00 !important;
          animation: bounce-smart 1s infinite !important;
          pointer-events: none !important;
        }
        @keyframes bounce-smart {
          0%, 100% { transform: translateY(0) rotate(-45deg); }
          50% { transform: translateY(-20px) rotate(-45deg); }
        }
        .smart-glow {
          outline: 8px solid #00ff00 !important;
          outline-offset: 5px !important;
          box-shadow: 0 0 30px 10px #00ff00 !important;
        }
        .smart-message {
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
        .mouse-tracker {
          position: fixed !important;
          width: 30px !important;
          height: 30px !important;
          background: rgba(255, 0, 0, 0.5) !important;
          border: 3px solid red !important;
          border-radius: 50% !important;
          pointer-events: none !important;
          z-index: 99999997 !important;
          display: none !important;
        }
      `
    });

    // Inject mouse and click tracking
    await page.evaluate(() => {
      // Track mouse movements
      window.mouseTracker = document.createElement('div');
      window.mouseTracker.className = 'mouse-tracker';
      document.body.appendChild(window.mouseTracker);

      document.addEventListener('mousemove', (e) => {
        window.mouseTracker.style.display = 'block';
        window.mouseTracker.style.left = (e.clientX - 15) + 'px';
        window.mouseTracker.style.top = (e.clientY - 15) + 'px';
      });

      // Track clicks
      window.clickLog = [];
      document.addEventListener('click', (e) => {
        const clickInfo = {
          x: e.clientX,
          y: e.clientY,
          target: e.target.tagName,
          text: e.target.textContent?.substring(0, 50),
          time: new Date().toISOString()
        };
        window.clickLog.push(clickInfo);
        console.log('🖱️ Click detected:', clickInfo);
      });
    });

    console.log('✅ Mouse and click tracking active!\n');

    // STEP 1: Landing page - point to "Get started"
    console.log('📍 STEP 1: Landing Page - Click "Get started"\n');

    await page.evaluate(() => {
      let btn = null;
      const allLinks = Array.from(document.querySelectorAll('a, button'));
      btn = allLinks.find(el => el.textContent.toLowerCase().includes('get started'));

      if (btn) {
        btn.classList.add('smart-glow');
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'smart-arrow';
        arrow.innerHTML = '👉';
        arrow.id = 'arrow-1';
        const rect = btn.getBoundingClientRect();
        arrow.style.position = 'fixed';
        arrow.style.left = (rect.left - 120) + 'px';
        arrow.style.top = (rect.top + rect.height/2 - 50) + 'px';
        document.body.appendChild(arrow);

        const msg = document.createElement('div');
        msg.className = 'smart-message';
        msg.id = 'msg-1';
        msg.innerHTML = '<div>👉 CLICK "Get started"</div>';
        document.body.appendChild(msg);
      }
    });

    console.log('👉 Arrow pointing to "Get started" button');
    console.log('   Waiting for you to click...\n');

    // Monitor for page navigation
    page.on('framenavigated', async () => {
      currentStep = 'form';
      await page.screenshot({ path: 'screenshot-form.png' });
      console.log('📸 Page changed! Screenshot: screenshot-form.png\n');
    });

    // Wait and check for clicks
    await wait(20000);

    // Get click log
    const clicks = await page.evaluate(() => window.clickLog || []).catch(() => []);
    console.log(`🖱️ Detected ${clicks.length} clicks:\n`);
    if (clicks && clicks.length > 0) {
      clicks.forEach((click, i) => {
        console.log(`   ${i + 1}. ${click.target} - "${click.text}"`);
      });
    }

    // Clean up step 1
    await page.evaluate(() => {
      document.getElementById('arrow-1')?.remove();
      document.getElementById('msg-1')?.remove();
    });

    // Check current URL to determine which step
    const currentUrl = page.url();
    console.log(`\n📍 Current URL: ${currentUrl}\n`);

    // Take screenshot of current state
    await page.screenshot({ path: 'screenshot-current.png' });
    console.log('📸 Current state: screenshot-current.png\n');

    // Check for form fields
    const hasFormFields = await page.evaluate(() => {
      const firstName = document.querySelector('input[name*="first" i], input[placeholder*="first" i]');
      const lastName = document.querySelector('input[name*="last" i], input[placeholder*="last" i]');
      const email = document.querySelector('input[type="email"]');
      return {
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        hasEmail: !!email
      };
    });

    console.log('📋 Form detection:', hasFormFields, '\n');

    // If on form page, guide through fields
    if (hasFormFields.hasFirstName) {
      console.log('✅ Form detected! Guiding through fields...\n');

      // STEP 2: First Name
      console.log('📍 STEP 2: First Name\n');
      await clipboardy.write(userData.firstName);
      console.log(`📋 "${userData.firstName}" copied!\n`);

      await page.evaluate(() => {
        const input = document.querySelector('input[name*="first" i], input[placeholder*="first" i]');
        if (input) {
          input.classList.add('smart-glow');
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });

          const arrow = document.createElement('div');
          arrow.className = 'smart-arrow';
          arrow.innerHTML = '👇';
          arrow.id = 'arrow-2';
          const rect = input.getBoundingClientRect();
          arrow.style.position = 'fixed';
          arrow.style.left = (rect.left + rect.width/2 - 50) + 'px';
          arrow.style.top = (rect.top - 120) + 'px';
          arrow.style.transform = 'rotate(0deg)';
          document.body.appendChild(arrow);

          const msg = document.createElement('div');
          msg.className = 'smart-message';
          msg.id = 'msg-2';
          msg.innerHTML = '<div>👇 First Name</div><div style="font-size: 18px; margin-top: 10px;">Ctrl+V to paste</div>';
          document.body.appendChild(msg);
        }
      });

      await wait(20000);

      await page.evaluate(() => {
        document.getElementById('arrow-2')?.remove();
        document.getElementById('msg-2')?.remove();
      });

      // STEP 3: Last Name
      console.log('📍 STEP 3: Last Name\n');
      await clipboardy.write(userData.lastName);
      console.log(`📋 "${userData.lastName}" copied!\n`);

      await page.evaluate(() => {
        const input = document.querySelector('input[name*="last" i], input[placeholder*="last" i]');
        if (input) {
          input.classList.add('smart-glow');
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });

          const arrow = document.createElement('div');
          arrow.className = 'smart-arrow';
          arrow.innerHTML = '👇';
          arrow.id = 'arrow-3';
          const rect = input.getBoundingClientRect();
          arrow.style.position = 'fixed';
          arrow.style.left = (rect.left + rect.width/2 - 50) + 'px';
          arrow.style.top = (rect.top - 120) + 'px';
          arrow.style.transform = 'rotate(0deg)';
          document.body.appendChild(arrow);

          const msg = document.createElement('div');
          msg.className = 'smart-message';
          msg.id = 'msg-3';
          msg.innerHTML = '<div>👇 Last Name</div><div style="font-size: 18px; margin-top: 10px;">Ctrl+V</div>';
          document.body.appendChild(msg);
        }
      });

      await wait(20000);

      await page.evaluate(() => {
        document.getElementById('arrow-3')?.remove();
        document.getElementById('msg-3')?.remove();
      });

      // STEP 4: Email
      console.log('📍 STEP 4: Email\n');
      await clipboardy.write(userData.email);
      console.log(`📋 "${userData.email}" copied!\n`);

      await page.evaluate(() => {
        const input = document.querySelector('input[type="email"]');
        if (input) {
          input.classList.add('smart-glow');
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });

          const arrow = document.createElement('div');
          arrow.className = 'smart-arrow';
          arrow.innerHTML = '👇';
          arrow.id = 'arrow-4';
          const rect = input.getBoundingClientRect();
          arrow.style.position = 'fixed';
          arrow.style.left = (rect.left + rect.width/2 - 50) + 'px';
          arrow.style.top = (rect.top - 120) + 'px';
          arrow.style.transform = 'rotate(0deg)';
          document.body.appendChild(arrow);

          const msg = document.createElement('div');
          msg.className = 'smart-message';
          msg.id = 'msg-4';
          msg.innerHTML = '<div>👇 Email</div><div style="font-size: 18px; margin-top: 10px;">Ctrl+V</div>';
          document.body.appendChild(msg);
        }
      });

      await wait(20000);
    }

    console.log('\n✅ Guided steps complete!');
    console.log('📸 Check screenshots to see page states\n');
    console.log('Browser stays open for 3 minutes...\n');

    // Final click log
    const finalClicks = await page.evaluate(() => window.clickLog || []).catch(() => []);
    console.log(`\n🖱️ Total clicks detected: ${finalClicks.length}\n`);
    if (finalClicks && finalClicks.length > 0) {
      finalClicks.forEach((click, i) => {
        console.log(`   ${i + 1}. [${click.time}] ${click.target} - "${click.text}"`);
      });
    }

    await wait(180000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Done!\n');
  }
}

partnerstackSmartGuide().catch(console.error);
