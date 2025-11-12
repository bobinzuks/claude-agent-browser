#!/usr/bin/env node

/**
 * RECURSIVE TRAINING MODE - Full automation for testing
 * Tests the "holding hands" guidance system on a local test form
 */

import { chromium } from 'playwright';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function recursiveTraining() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     🎓 RECURSIVE TRAINING MODE - FULL AUTO 🎓     ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const userData = {
    firstName: process.env.USER_FIRST_NAME || 'Terrance',
    lastName: process.env.USER_LAST_NAME || 'Isaak',
    email: process.env.USER_EMAIL || 'bobinzuks@gmail.com',
    company: process.env.USER_COMPANY || 'https://github.com/bobinzuks',
    phone: process.env.USER_PHONE || '+17787241607'
  };

  console.log('✅ Test user data loaded:\n');
  console.log(`   Name: ${userData.firstName} ${userData.lastName}`);
  console.log(`   Email: ${userData.email}\n`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down for visibility
  });

  const page = await browser.newPage();
  const testResults = [];

  try {
    // Load local test form
    const formPath = path.join(__dirname, 'test-local-form.html');
    console.log(`📂 Loading test form: ${formPath}\n`);
    await page.goto(`file://${formPath}`);
    await wait(2000);

    // Inject arrow styles
    console.log('💉 Injecting visual guidance system...\n');
    await page.addStyleTag({
      content: `
        .train-arrow {
          position: fixed !important;
          font-size: 120px !important;
          z-index: 99999999 !important;
          text-shadow: 0 0 50px #00ff00 !important;
          animation: bounce-train 1s infinite !important;
          pointer-events: none !important;
        }
        @keyframes bounce-train {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-25px); }
        }
        .train-glow {
          outline: 10px solid #00ff00 !important;
          outline-offset: 8px !important;
          box-shadow: 0 0 40px 15px #00ff00 !important;
        }
        .train-message {
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
      };
      window.logDebug('🎓 Training mode initialized');
    });

    // Helper function to show arrow and debug
    async function showArrow(selector, message, emoji = '👇') {
      console.log(`\n▶️  ${message}\n`);

      const success = await page.evaluate(({ selector, message, emoji }) => {
        window.logDebug(`Searching for: ${selector}`);

        const target = document.querySelector(selector);
        if (!target) {
          window.logDebug(`❌ Not found: ${selector}`);
          return false;
        }

        window.logDebug(`✅ Found: ${selector}`);

        // Remove old arrows
        document.querySelectorAll('.train-arrow, .train-message').forEach(el => el.remove());

        target.classList.add('train-glow');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const arrow = document.createElement('div');
        arrow.className = 'train-arrow';
        arrow.innerHTML = emoji;
        const rect = target.getBoundingClientRect();
        arrow.style.position = 'fixed';
        arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
        arrow.style.top = (rect.top - 140) + 'px';
        document.body.appendChild(arrow);

        const msg = document.createElement('div');
        msg.className = 'train-message';
        msg.innerHTML = `<div>${message}</div>`;
        document.body.appendChild(msg);

        window.logDebug(`👁️ Arrow visible`);
        return true;
      }, { selector, message, emoji });

      if (!success) {
        throw new Error(`Failed to find element: ${selector}`);
      }

      await page.screenshot({ path: `training-${Date.now()}.png` });
      return success;
    }

    // Helper function to click with debugging
    async function clickElement(selector, description) {
      console.log(`🖱️  Clicking: ${description}\n`);

      await page.evaluate((sel) => {
        window.logDebug(`🖱️ Clicking: ${sel}`);
      }, selector);

      await page.click(selector);
      await wait(2000);

      await page.evaluate(() => {
        window.logDebug('✅ Click successful');
      });
    }

    // Helper function to fill input with debugging
    async function fillInput(selector, value, description) {
      console.log(`⌨️  Filling ${description}: "${value}"\n`);

      await page.evaluate((sel) => {
        window.logDebug(`⌨️ Filling: ${sel}`);
      }, selector);

      await page.fill(selector, value);
      await wait(1000);

      await page.evaluate((val) => {
        window.logDebug(`✅ Entered: ${val}`);
      }, value);
    }

    // STEP 1: Landing Page - Click "Get Started"
    console.log('═══ STEP 1: Landing Page ═══\n');
    testResults.push({ step: 1, name: 'Landing Page', status: 'starting' });

    await showArrow('.btn-primary', '👉 Click "Get Started"', '👉');
    await wait(3000);
    await clickElement('.btn-primary', 'Get Started button');

    testResults[testResults.length - 1].status = 'success';
    console.log('✅ STEP 1 COMPLETE\n');

    // STEP 2: Choice Page - Select user type
    console.log('═══ STEP 2: Choice Page ═══\n');
    testResults.push({ step: 2, name: 'Choice Page', status: 'starting' });

    await wait(2000);
    await showArrow('.choice-card:first-child', '👇 Click "Software Vendor"');
    await wait(3000);
    await clickElement('.choice-card:first-child', 'Software Vendor choice');

    testResults[testResults.length - 1].status = 'success';
    console.log('✅ STEP 2 COMPLETE\n');

    // STEP 3: Form Page - Fill out form
    console.log('═══ STEP 3: Form Page ═══\n');
    testResults.push({ step: 3, name: 'Form Page', status: 'starting' });

    await wait(2000);

    // First Name
    await showArrow('#firstName', '👇 First Name field');
    await wait(2000);
    await fillInput('#firstName', userData.firstName, 'First Name');
    await wait(1000);

    // Last Name
    await showArrow('#lastName', '👇 Last Name field');
    await wait(2000);
    await fillInput('#lastName', userData.lastName, 'Last Name');
    await wait(1000);

    // Email
    await showArrow('#email', '👇 Email field');
    await wait(2000);
    await fillInput('#email', userData.email, 'Email');
    await wait(1000);

    // Company
    await showArrow('#company', '👇 Company/Website field');
    await wait(2000);
    await fillInput('#company', userData.company, 'Company');
    await wait(1000);

    // Phone (optional)
    await showArrow('#phone', '👇 Phone field (optional)');
    await wait(2000);
    await fillInput('#phone', userData.phone, 'Phone');
    await wait(1000);

    testResults[testResults.length - 1].status = 'success';
    console.log('✅ STEP 3 COMPLETE\n');

    // STEP 4: Submit Form
    console.log('═══ STEP 4: Submit Form ═══\n');
    testResults.push({ step: 4, name: 'Submit', status: 'starting' });

    await showArrow('button[type="submit"]', '👉 Click Submit', '👉');
    await wait(3000);
    await clickElement('button[type="submit"]', 'Submit button');

    testResults[testResults.length - 1].status = 'success';
    console.log('✅ STEP 4 COMPLETE\n');

    // STEP 5: Success Page
    console.log('═══ STEP 5: Success Page ═══\n');
    testResults.push({ step: 5, name: 'Success', status: 'starting' });

    await wait(3000);

    const successVisible = await page.isVisible('#success');
    if (successVisible) {
      console.log('✅ Success page displayed!\n');
      testResults[testResults.length - 1].status = 'success';
    } else {
      console.log('❌ Success page not visible\n');
      testResults[testResults.length - 1].status = 'failed';
    }

    // Final screenshot
    await page.screenshot({ path: 'training-final.png' });

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║              🎉 TRAINING COMPLETE! 🎉              ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log('📊 TEST RESULTS:\n');
    testResults.forEach(result => {
      const icon = result.status === 'success' ? '✅' : '❌';
      console.log(`   ${icon} Step ${result.step}: ${result.name} - ${result.status}`);
    });

    console.log('\n🖼️  Screenshots saved to training-*.png\n');
    console.log('⏳ Browser will stay open for 1 minute...\n');

    await wait(60000);

  } catch (error) {
    console.error('\n❌ TRAINING ERROR:', error.message);
    console.error('\n📸 Taking error screenshot...\n');
    await page.screenshot({ path: 'training-error.png' });

    console.log('\n📊 PARTIAL RESULTS:\n');
    testResults.forEach(result => {
      const icon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⏸️';
      console.log(`   ${icon} Step ${result.step}: ${result.name} - ${result.status}`);
    });
  } finally {
    await browser.close();
    console.log('\n✅ Training session ended\n');
  }
}

recursiveTraining().catch(console.error);
