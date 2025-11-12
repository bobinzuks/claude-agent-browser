#!/usr/bin/env node

/**
 * PartnerStack Adaptive Guide - Detects pages and adapts guidance
 */

import { chromium } from 'playwright';
import clipboardy from 'clipboardy';
import dotenv from 'dotenv';

dotenv.config();

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function partnerstackAdaptive() {
  console.log('🎮 PartnerStack Adaptive Guide\n');

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
    console.log('🌐 Opening PartnerStack...\n');
    await page.goto('https://www.partnerstack.com/partners');
    await wait(3000);

    // Inject styles
    await page.addStyleTag({
      content: `
        .pa-arrow {
          position: fixed !important;
          font-size: 120px !important;
          z-index: 99999999 !important;
          text-shadow: 0 0 50px #00ff00 !important;
          animation: bounce-pa 1s infinite !important;
          pointer-events: none !important;
        }
        @keyframes bounce-pa {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-25px); }
        }
        .pa-glow {
          outline: 10px solid #00ff00 !important;
          outline-offset: 8px !important;
          box-shadow: 0 0 40px 15px #00ff00 !important;
          animation: glow-pa 1.5s infinite !important;
        }
        @keyframes glow-pa {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .pa-message {
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

    let currentPage = 'landing';
    let stepNumber = 1;

    // Function to detect current page
    async function detectPage() {
      return await page.evaluate(() => {
        // Check for "Get started" button (landing page)
        const getStarted = Array.from(document.querySelectorAll('a, button')).find(el =>
          el.textContent.toLowerCase().includes('get started')
        );
        if (getStarted) return 'landing';

        // Check for partner choice page
        const partnerChoice = Array.from(document.querySelectorAll('*')).find(el =>
          el.textContent.includes("I'm a partner") || el.textContent.includes("What best describes you")
        );
        if (partnerChoice) return 'choice';

        // Check for form fields
        const hasForm = document.querySelector('input[name*="first" i], input[placeholder*="first" i]');
        if (hasForm) return 'form';

        return 'unknown';
      });
    }

    // Function to show arrow
    async function showArrow(selector, message, arrowEmoji = '👇', offsetX = 0, offsetY = -140) {
      await page.evaluate(({ selector, message, arrowEmoji, offsetX, offsetY }) => {
        // Remove old arrows
        document.querySelectorAll('.pa-arrow, .pa-message').forEach(el => el.remove());

        const target = document.querySelector(selector);
        if (!target) return false;

        target.classList.add('pa-glow');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'pa-arrow';
        arrow.innerHTML = arrowEmoji;
        const rect = target.getBoundingClientRect();
        arrow.style.position = 'fixed';
        arrow.style.left = (rect.left + rect.width/2 + offsetX - 60) + 'px';
        arrow.style.top = (rect.top + offsetY) + 'px';
        document.body.appendChild(arrow);

        const msg = document.createElement('div');
        msg.className = 'pa-message';
        msg.innerHTML = message;
        document.body.appendChild(msg);

        return true;
      }, { selector, message, arrowEmoji, offsetX, offsetY });
    }

    // Main guidance loop
    while (true) {
      currentPage = await detectPage();
      console.log(`📍 Current page: ${currentPage}\n`);

      if (currentPage === 'landing') {
        console.log(`▶️  STEP ${stepNumber}: Click "Get started"\n`);
        await page.screenshot({ path: 'step-1-landing.png' });

        await page.evaluate(() => {
          // Remove old elements
          document.querySelectorAll('.pa-arrow, .pa-message').forEach(el => el.remove());

          const allLinks = Array.from(document.querySelectorAll('a, button'));
          const btn = allLinks.find(el => el.textContent.toLowerCase().includes('get started'));

          if (btn) {
            btn.classList.add('pa-glow');
            btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

            const arrow = document.createElement('div');
            arrow.className = 'pa-arrow';
            arrow.innerHTML = '👉';
            const rect = btn.getBoundingClientRect();
            arrow.style.position = 'fixed';
            arrow.style.left = (rect.left - 140) + 'px';
            arrow.style.top = (rect.top + rect.height/2 - 60) + 'px';
            document.body.appendChild(arrow);

            const msg = document.createElement('div');
            msg.className = 'pa-message';
            msg.innerHTML = `<div>👉 Click "Get started"</div>`;
            document.body.appendChild(msg);
          }
        });

        console.log('👉 Arrow pointing right to "Get started"\n');
        stepNumber++;
        await wait(5000);

      } else if (currentPage === 'choice') {
        console.log(`▶️  STEP ${stepNumber}: Choose "I'm a software vendor"\n`);
        await page.screenshot({ path: 'step-2-choice.png' });

        // Wait for page to be stable before injecting
        await wait(2000);

        try {
          await page.evaluate(() => {
            // Remove old elements
            document.querySelectorAll('.pa-arrow, .pa-message').forEach(el => el.remove());

            // Find the "I'm a software vendor" card/button
            const allElements = Array.from(document.querySelectorAll('*'));
            const vendorBtn = allElements.find(el =>
              el.textContent.includes("I'm a software vendor") &&
              (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'DIV' || el.hasAttribute('role'))
            );

            if (vendorBtn) {
              vendorBtn.classList.add('pa-glow');
              vendorBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

              const arrow = document.createElement('div');
              arrow.className = 'pa-arrow';
              arrow.innerHTML = '👇';
              const rect = vendorBtn.getBoundingClientRect();
              arrow.style.position = 'fixed';
              arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
              arrow.style.top = (rect.top - 140) + 'px';
              document.body.appendChild(arrow);

              const msg = document.createElement('div');
              msg.className = 'pa-message';
              msg.innerHTML = `<div>👇 Click "I'm a software vendor"</div><div style="font-size: 18px; margin-top: 10px;">To run your own affiliate program</div>`;
              document.body.appendChild(msg);
            }
          });

          console.log('👇 Arrow pointing down to "I\'m a software vendor"\n');
        } catch (error) {
          console.log('⚠️  Page navigated, continuing...\n');
        }

        stepNumber++;
        await wait(8000); // Longer wait for user to click

      } else if (currentPage === 'form') {
        console.log('✅ Form page detected!\n');
        await page.screenshot({ path: 'step-3-form.png' });

        // First Name
        console.log(`▶️  STEP ${stepNumber}: First Name\n`);
        await clipboardy.write(userData.firstName);
        console.log(`📋 "${userData.firstName}" copied!\n`);

        await page.evaluate(() => {
          document.querySelectorAll('.pa-arrow, .pa-message').forEach(el => el.remove());

          const input = document.querySelector('input[name*="first" i], input[placeholder*="first" i]');
          if (input) {
            input.classList.add('pa-glow');
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });

            const arrow = document.createElement('div');
            arrow.className = 'pa-arrow';
            arrow.innerHTML = '👇';
            const rect = input.getBoundingClientRect();
            arrow.style.position = 'fixed';
            arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
            arrow.style.top = (rect.top - 140) + 'px';
            document.body.appendChild(arrow);

            const msg = document.createElement('div');
            msg.className = 'pa-message';
            msg.innerHTML = `<div>👇 First Name</div><div style="font-size: 18px; margin-top: 10px;">Ctrl+V to paste</div>`;
            document.body.appendChild(msg);
          }
        });

        await wait(15000);
        stepNumber++;

        // Last Name
        console.log(`▶️  STEP ${stepNumber}: Last Name\n`);
        await clipboardy.write(userData.lastName);
        console.log(`📋 "${userData.lastName}" copied!\n`);

        await page.evaluate(() => {
          document.querySelectorAll('.pa-arrow, .pa-message').forEach(el => el.remove());

          const input = document.querySelector('input[name*="last" i], input[placeholder*="last" i]');
          if (input) {
            input.classList.add('pa-glow');
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });

            const arrow = document.createElement('div');
            arrow.className = 'pa-arrow';
            arrow.innerHTML = '👇';
            const rect = input.getBoundingClientRect();
            arrow.style.position = 'fixed';
            arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
            arrow.style.top = (rect.top - 140) + 'px';
            document.body.appendChild(arrow);

            const msg = document.createElement('div');
            msg.className = 'pa-message';
            msg.innerHTML = `<div>👇 Last Name</div><div style="font-size: 18px; margin-top: 10px;">Ctrl+V</div>`;
            document.body.appendChild(msg);
          }
        });

        await wait(15000);
        stepNumber++;

        // Email
        console.log(`▶️  STEP ${stepNumber}: Email\n`);
        await clipboardy.write(userData.email);
        console.log(`📋 "${userData.email}" copied!\n`);

        await page.evaluate(() => {
          document.querySelectorAll('.pa-arrow, .pa-message').forEach(el => el.remove());

          const input = document.querySelector('input[type="email"]');
          if (input) {
            input.classList.add('pa-glow');
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });

            const arrow = document.createElement('div');
            arrow.className = 'pa-arrow';
            arrow.innerHTML = '👇';
            const rect = input.getBoundingClientRect();
            arrow.style.position = 'fixed';
            arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
            arrow.style.top = (rect.top - 140) + 'px';
            document.body.appendChild(arrow);

            const msg = document.createElement('div');
            msg.className = 'pa-message';
            msg.innerHTML = `<div>👇 Email</div><div style="font-size: 18px; margin-top: 10px;">Ctrl+V</div>`;
            document.body.appendChild(msg);
          }
        });

        await wait(15000);

        console.log('\n✅ Basic fields guided!\n');
        console.log('Complete remaining fields manually:\n');
        console.log('   - Company/Website');
        console.log('   - Password');
        console.log('   - Terms acceptance\n');

        break; // Exit loop
      }

      await wait(2000); // Check page every 2 seconds
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

partnerstackAdaptive().catch(console.error);
