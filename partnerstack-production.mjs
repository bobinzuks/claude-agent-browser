#!/usr/bin/env node

/**
 * PartnerStack Production - Using proven training techniques
 * Human-in-loop with visual guidance (ToS compliant)
 */

import { chromium } from 'playwright';
import clipboardy from 'clipboardy';
import dotenv from 'dotenv';

dotenv.config();

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function partnerstackProduction() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║       🎯 PartnerStack Production Guide 🎯         ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const userData = {
    firstName: process.env.USER_FIRST_NAME,
    lastName: process.env.USER_LAST_NAME,
    email: process.env.USER_EMAIL,
    company: process.env.USER_COMPANY,
  };

  console.log('✅ User data loaded:\n');
  console.log(`   Name: ${userData.firstName} ${userData.lastName}`);
  console.log(`   Email: ${userData.email}\n`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const page = await browser.newPage();

  try {
    console.log('🌐 Opening PartnerStack...\n');
    await page.goto('https://www.partnerstack.com/partners');
    await wait(3000);

    // Inject styles using proven training CSS
    console.log('💉 Injecting visual guidance...\n');
    await page.addStyleTag({
      content: `
        .prod-arrow {
          position: fixed !important;
          font-size: 120px !important;
          z-index: 99999999 !important;
          text-shadow: 0 0 50px #00ff00, 0 0 100px #00ff00 !important;
          animation: bounce-prod 1s infinite !important;
          pointer-events: none !important;
        }
        @keyframes bounce-prod {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-25px); }
        }
        .prod-glow {
          outline: 10px solid #00ff00 !important;
          outline-offset: 8px !important;
          box-shadow: 0 0 40px 15px #00ff00 !important;
        }
        .prod-message {
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
        .debug-log {
          position: fixed !important;
          bottom: 20px !important;
          left: 20px !important;
          background: rgba(0,0,0,0.9) !important;
          color: #00ff00 !important;
          padding: 15px !important;
          border-radius: 10px !important;
          font-family: monospace !important;
          font-size: 14px !important;
          z-index: 99999997 !important;
          max-width: 400px !important;
          max-height: 200px !important;
          overflow-y: auto !important;
        }
      `
    });

    // Inject debug logger
    await page.evaluate(() => {
      window.debugLog = [];
      window.logDebug = (message) => {
        window.debugLog.push(`[${new Date().toLocaleTimeString()}] ${message}`);
        let debugDiv = document.getElementById('debug-log');
        if (!debugDiv) {
          debugDiv = document.createElement('div');
          debugDiv.id = 'debug-log';
          debugDiv.className = 'debug-log';
          document.body.appendChild(debugDiv);
        }
        debugDiv.innerHTML = window.debugLog.slice(-10).join('<br>');
        console.log(message);
      };
      window.logDebug('🎯 Production mode initialized');
    });

    console.log('✅ Debug logger active (bottom-left corner)\n');

    // Helper to show arrows
    async function showArrow(searchStrategy, message, emoji = '👇') {
      console.log(`\n▶️  ${message}\n`);

      const success = await page.evaluate(({ searchStrategy, message, emoji }) => {
        window.logDebug(`🔍 Searching: ${searchStrategy.type}`);

        let target = null;

        // Strategy 1: Direct selector
        if (searchStrategy.selector) {
          target = document.querySelector(searchStrategy.selector);
          if (target) window.logDebug(`✅ Found via selector: ${searchStrategy.selector}`);
        }

        // Strategy 2: Text search
        if (!target && searchStrategy.text) {
          const allElements = Array.from(document.querySelectorAll('a, button, div, input, label'));
          target = allElements.find(el => {
            const text = el.textContent || el.placeholder || '';
            const matches = text.toLowerCase().includes(searchStrategy.text.toLowerCase());
            return matches && el.offsetParent !== null; // Must be visible
          });
          if (target) window.logDebug(`✅ Found via text: "${searchStrategy.text}"`);
        }

        // Strategy 3: Attribute search
        if (!target && searchStrategy.attr) {
          const selector = `[${searchStrategy.attr.name}*="${searchStrategy.attr.value}"]`;
          target = document.querySelector(selector);
          if (target) window.logDebug(`✅ Found via attr: ${selector}`);
        }

        if (!target) {
          window.logDebug(`❌ Not found: ${searchStrategy.type}`);
          return false;
        }

        // Remove old arrows
        document.querySelectorAll('.prod-arrow, .prod-message').forEach(el => el.remove());

        target.classList.add('prod-glow');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'prod-arrow';
        arrow.innerHTML = emoji;
        const rect = target.getBoundingClientRect();
        arrow.style.position = 'fixed';

        if (emoji === '👉') {
          arrow.style.left = (rect.left - 140) + 'px';
          arrow.style.top = (rect.top + rect.height/2 - 60) + 'px';
        } else {
          arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
          arrow.style.top = (rect.top - 140) + 'px';
        }

        document.body.appendChild(arrow);

        const msg = document.createElement('div');
        msg.className = 'prod-message';
        msg.innerHTML = `<div>${message}</div>`;
        document.body.appendChild(msg);

        window.logDebug(`👁️ Arrow visible`);
        return true;
      }, { searchStrategy, message, emoji });

      await page.screenshot({ path: `prod-step-${Date.now()}.png` });
      return success;
    }

    let currentPage = 'landing';
    let stepNumber = 1;

    // Main guidance loop
    while (true) {
      await wait(2000);

      // Re-inject debug logger if needed (page may have navigated)
      await page.evaluate(() => {
        if (!window.logDebug) {
          window.debugLog = [];
          window.logDebug = (message) => {
            window.debugLog.push(`[${new Date().toLocaleTimeString()}] ${message}`);
            let debugDiv = document.getElementById('debug-log');
            if (!debugDiv) {
              debugDiv = document.createElement('div');
              debugDiv.id = 'debug-log';
              debugDiv.className = 'debug-log';
              document.body.appendChild(debugDiv);
            }
            debugDiv.innerHTML = window.debugLog.slice(-10).join('<br>');
            console.log(message);
          };
        }
      }).catch(() => {});

      const pageState = await page.evaluate(() => {
        const body = document.body.textContent;

        // Find ALL inputs
        const allInputs = Array.from(document.querySelectorAll('input'));
        const textInputs = allInputs.filter(inp =>
          !inp.type || inp.type === 'text' || inp.type === 'email' || inp.type === 'tel'
        );

        // Check for first name field with many selectors
        const firstNameField = document.querySelector(
          'input[name*="first" i], input[placeholder*="first" i], ' +
          'input[id*="first" i], input[aria-label*="first" i]'
        );

        return {
          url: window.location.href,
          hasGetStarted: body.includes('Get started') || body.includes('Get Started'),
          hasVendorChoice: body.includes("I'm a software vendor"),
          hasPartnerChoice: body.includes("I'm a partner"),
          hasBookDemo: body.includes('Book a demo') || body.includes('Book Demo'),
          hasFirstName: !!firstNameField,
          inputCount: textInputs.length,
          allInputCount: allInputs.length,
          // Debug: log what inputs exist
          inputTypes: allInputs.map(i => i.type || 'text').slice(0, 10)
        };
      });

      await page.evaluate((state) => {
        if (window.logDebug) window.logDebug(`📍 Page: ${JSON.stringify(state).substring(0, 100)}`);
      }, pageState).catch(() => {});

      console.log(`📍 Page state:`, pageState);
      console.log(`📍 Current page mode: ${currentPage}\n`);

      // Priority-based page detection (check most specific first)

      // FORM PAGE - Highest priority (has actual form fields)
      if ((pageState.hasFirstName || pageState.inputCount >= 2 || pageState.allInputCount >= 3) && currentPage === 'waiting-form') {
        console.log(`═══ STEP ${stepNumber}: Form Page ═══\n`);
        currentPage = 'form';
        stepNumber++;

        await wait(2000);

        // First Name
        console.log(`📋 FIELD 1: First Name\n`);
        await clipboardy.write(userData.firstName);
        console.log(`📋 "${userData.firstName}" copied to clipboard\n`);

        await showArrow(
          { type: 'input', selector: 'input[name*="first" i], input[placeholder*="first" i]' },
          '👇 First Name - Ctrl+V'
        );

        await wait(15000);

        // Last Name
        console.log(`📋 FIELD 2: Last Name\n`);
        await clipboardy.write(userData.lastName);
        console.log(`📋 "${userData.lastName}" copied to clipboard\n`);

        await showArrow(
          { type: 'input', selector: 'input[name*="last" i], input[placeholder*="last" i]' },
          '👇 Last Name - Ctrl+V'
        );

        await wait(15000);

        // Email
        console.log(`📋 FIELD 3: Email\n`);
        await clipboardy.write(userData.email);
        console.log(`📋 "${userData.email}" copied to clipboard\n`);

        await showArrow(
          { type: 'input', selector: 'input[type="email"]' },
          '👇 Email - Ctrl+V'
        );

        await wait(15000);

        console.log('\n✅ Basic fields complete!\n');
        console.log('📝 Please complete remaining fields manually:\n');
        console.log('   - Company/Website');
        console.log('   - Any other required fields\n');

        break; // Exit loop
      }

      // CHOICE PAGE - Check for vendor/partner choice
      else if ((pageState.hasVendorChoice || pageState.hasPartnerChoice) && currentPage === 'waiting-choice') {
        console.log(`═══ STEP ${stepNumber}: Choice Page ═══\n`);

        await wait(2000);

        await showArrow(
          { type: 'button', text: "I'm a software vendor" },
          '👇 Click "Software vendor"'
        );

        console.log('⏳ Waiting for click...\n');
        currentPage = 'after-choice';
        stepNumber++;
        await wait(8000);
      }

      // BOOK A DEMO - Appears after clicking vendor
      else if (pageState.hasBookDemo && (currentPage === 'after-choice' || currentPage === 'landing')) {
        console.log(`═══ STEP ${stepNumber}: Book a Demo ═══\n`);

        await wait(2000);

        await showArrow(
          { type: 'button', text: 'book a demo' },
          '👉 Click "Book a demo"',
          '👉'
        );

        console.log('⏳ Waiting for click...\n');
        if (currentPage === 'landing') {
          currentPage = 'waiting-choice'; // Go to choice page next
        } else {
          currentPage = 'waiting-form'; // Already chose, go to form
        }
        stepNumber++;
        await wait(8000);
      }

      // GET STARTED - Initial landing page
      else if (pageState.hasGetStarted && currentPage === 'landing') {
        console.log(`═══ STEP ${stepNumber}: Landing - Get Started ═══\n`);

        await showArrow(
          { type: 'button', text: 'get started' },
          '👉 Click "Get started"',
          '👉'
        );

        console.log('⏳ Waiting for click...\n');
        currentPage = 'waiting-choice';
        stepNumber++;
        await wait(5000);
      }

      await wait(2000);
    }

    console.log('🎉 Guidance complete! Browser stays open for 3 minutes...\n');
    await wait(180000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'prod-error.png' });
  } finally {
    await browser.close();
    console.log('\n✅ Session ended\n');
  }
}

partnerstackProduction().catch(console.error);
