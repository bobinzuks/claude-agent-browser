#!/usr/bin/env node

/**
 * HOLDING HANDS MODE: Visual Guided Signup
 * Shows arrows, highlights, and guides you step-by-step
 * Auto-copies data to clipboard for pasting
 * ToS Compliant: YOU click, system just guides
 */

import { chromium } from 'playwright';
import readline from 'readline';
import clipboardy from 'clipboardy';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// Inject visual guidance into page
async function injectHoldingHands(page) {
  await page.addStyleTag({
    content: `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }

      @keyframes arrow-bounce {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }

      .holding-hands-highlight {
        outline: 3px solid #00ff00 !important;
        outline-offset: 5px !important;
        animation: pulse 2s infinite !important;
        position: relative !important;
        z-index: 999999 !important;
        background-color: rgba(0, 255, 0, 0.1) !important;
      }

      .holding-hands-arrow {
        position: absolute !important;
        font-size: 48px !important;
        color: #00ff00 !important;
        z-index: 1000000 !important;
        animation: arrow-bounce 1s infinite !important;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
        pointer-events: none !important;
      }

      .holding-hands-message {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        padding: 20px 30px !important;
        border-radius: 15px !important;
        font-size: 18px !important;
        font-weight: bold !important;
        z-index: 1000001 !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        max-width: 400px !important;
      }

      .holding-hands-checklist {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        background: white !important;
        color: #333 !important;
        padding: 20px !important;
        border-radius: 10px !important;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2) !important;
        z-index: 1000001 !important;
        max-width: 300px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }

      .holding-hands-checklist h3 {
        margin: 0 0 15px 0 !important;
        font-size: 16px !important;
        color: #667eea !important;
      }

      .holding-hands-checklist-item {
        padding: 8px 0 !important;
        border-bottom: 1px solid #eee !important;
        font-size: 14px !important;
      }

      .holding-hands-checklist-item.done {
        text-decoration: line-through !important;
        opacity: 0.5 !important;
      }

      .holding-hands-checklist-item.active {
        font-weight: bold !important;
        color: #667eea !important;
      }
    `
  });
}

async function showArrow(page, selector, message) {
  await page.evaluate(({ selector, message }) => {
    // Remove old arrows and highlights
    document.querySelectorAll('.holding-hands-arrow, .holding-hands-highlight, .holding-hands-message').forEach(el => el.remove());

    // Find target element
    const target = document.querySelector(selector);
    if (!target) return;

    // Highlight element
    target.classList.add('holding-hands-highlight');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Create arrow
    const arrow = document.createElement('div');
    arrow.className = 'holding-hands-arrow';
    arrow.textContent = '👇';

    const rect = target.getBoundingClientRect();
    arrow.style.left = (rect.left + rect.width / 2 - 24) + 'px';
    arrow.style.top = (rect.top - 60 + window.scrollY) + 'px';

    document.body.appendChild(arrow);

    // Create message
    const msg = document.createElement('div');
    msg.className = 'holding-hands-message';
    msg.innerHTML = `👆 ${message}`;
    document.body.appendChild(msg);

  }, { selector, message });
}

async function showChecklist(page, items, currentStep) {
  await page.evaluate(({ items, currentStep }) => {
    // Remove old checklist
    document.querySelectorAll('.holding-hands-checklist').forEach(el => el.remove());

    const checklist = document.createElement('div');
    checklist.className = 'holding-hands-checklist';

    let html = '<h3>📋 Progress</h3>';
    items.forEach((item, i) => {
      const className = i < currentStep ? 'done' : i === currentStep ? 'active' : '';
      const check = i < currentStep ? '✅' : i === currentStep ? '▶️' : '⬜';
      html += `<div class="holding-hands-checklist-item ${className}">${check} ${item}</div>`;
    });

    checklist.innerHTML = html;
    document.body.appendChild(checklist);
  }, { items, currentStep });
}

async function copyToClipboard(text, label) {
  try {
    await clipboardy.write(text);
    console.log(`📋 ✅ Copied to clipboard: ${label}`);
    console.log(`   Value: ${text}`);
    console.log(`   👉 Press Ctrl+V to paste\n`);
  } catch (e) {
    console.log(`⚠️  Could not copy to clipboard. Value: ${text}`);
  }
}

async function holdingHandsSignup(network, userData) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🤝 HOLDING HANDS MODE: ${network.name}`);
  console.log(`${'═'.repeat(60)}\n`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  try {
    console.log('🌐 Opening page...\n');
    await page.goto(network.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await injectHoldingHands(page);

    const steps = network.steps;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      console.log(`\n▶️  STEP ${i + 1}/${steps.length}: ${step.action}\n`);

      await showChecklist(page, steps.map(s => s.action), i);

      if (step.type === 'click') {
        // Show arrow pointing to element
        await showArrow(page, step.selector, `CLICK HERE: ${step.label}`);
        console.log(`👆 LOOK AT YOUR SCREEN!`);
        console.log(`   Green arrow pointing to: "${step.label}"`);
        console.log(`   💚 Element is highlighted\n`);

        await ask(`✋ Click "${step.label}" then press Enter: `);

        // Try to detect if they clicked
        await page.waitForTimeout(1000);

      } else if (step.type === 'fill') {
        // Highlight field
        await showArrow(page, step.selector, `FILL THIS FIELD: ${step.label}`);

        // Copy value to clipboard
        const value = userData[step.field];
        if (value) {
          await copyToClipboard(value, step.label);
          console.log(`👆 Field highlighted: "${step.label}"`);
          console.log(`📋 Value copied to clipboard!`);
          console.log(`   1. Click the field`);
          console.log(`   2. Press Ctrl+V (or Cmd+V on Mac)`);
          console.log(`   3. Press Enter when done\n`);
        }

        await ask(`✋ Filled "${step.label}"? Press Enter: `);

      } else if (step.type === 'wait') {
        console.log(`⏳ ${step.message}\n`);
        await ask('Press Enter when ready: ');
      }

      // Remove arrows and highlights before next step
      await page.evaluate(() => {
        document.querySelectorAll('.holding-hands-arrow, .holding-hands-highlight, .holding-hands-message').forEach(el => el.remove());
      });
    }

    console.log('\n✅ ALL STEPS COMPLETE!\n');
    console.log('🎉 Check your email for verification link\n');

    await ask('Press Enter to close browser: ');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Main
(async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🤝 HOLDING HANDS: VISUAL GUIDED SIGNUP');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('This system will:\n');
  console.log('✅ Show green arrows pointing to exactly what to click');
  console.log('✅ Highlight fields in green that need filling');
  console.log('✅ Copy values to your clipboard for easy pasting');
  console.log('✅ Display a progress checklist');
  console.log('✅ Guide you step-by-step (ToS compliant - YOU click!)\n');

  const userData = {
    firstName: await ask('Your First Name: '),
    lastName: await ask('Your Last Name: '),
    email: await ask('Your Email: '),
    company: await ask('Company Name: '),
    website: await ask('Website URL: '),
    phone: await ask('Phone (optional): ') || '',
  };

  console.log('\n✅ Data collected! Starting guided signup...\n');

  const networks = [
    {
      name: 'PartnerStack',
      url: 'https://www.partnerstack.com/partners',
      steps: [
        { type: 'click', selector: 'a[href*="signup"], button:has-text("Sign"), a:has-text("Get Started")', label: 'Sign Up button', action: 'Click Sign Up' },
        { type: 'fill', selector: 'input[name*="first" i]', field: 'firstName', label: 'First Name', action: 'Fill First Name' },
        { type: 'fill', selector: 'input[name*="last" i]', field: 'lastName', label: 'Last Name', action: 'Fill Last Name' },
        { type: 'fill', selector: 'input[type="email"]', field: 'email', label: 'Email', action: 'Fill Email' },
        { type: 'fill', selector: 'input[name*="company" i]', field: 'company', label: 'Company', action: 'Fill Company' },
        { type: 'wait', message: 'Create a password (not auto-filled for security)', action: 'Create Password' },
        { type: 'wait', message: 'Accept Terms of Service', action: 'Accept ToS' },
        { type: 'click', selector: 'button[type="submit"], button:has-text("Submit"), button:has-text("Sign")', label: 'Submit button', action: 'Click Submit' },
      ]
    }
  ];

  await holdingHandsSignup(networks[0], userData);

  rl.close();
  console.log('\n✅ Done! Run this script again for other networks.\n');
})();
