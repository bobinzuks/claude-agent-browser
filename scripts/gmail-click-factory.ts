/**
 * Gmail Account Creation with Click Factory
 * Auto-fills Gmail signup form with human-in-loop verification
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

interface FormField {
  selector: string;
  type: string;
  label: string;
  value?: string;
}

class GmailClickFactory {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async init() {
    console.log('🚀 Launching browser...');

    // Detect if running in CI environment
    const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

    // Launch browser in non-headless mode with VISIBLE window
    this.browser = await chromium.launch({
      headless: isCI, // Use headless mode in CI
      channel: isCI ? undefined : 'chrome', // Try to use system Chrome if available (local only)
      args: [
        '--start-maximized',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=TranslateUI',
        '--disable-infobars'
      ]
    });

    // Create context with realistic viewport and NEW PAGE immediately
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    this.page = await this.context.newPage();

    console.log('✅ Browser window should now be visible!');
    await this.page.waitForTimeout(1000);
  }

  async navigateToGmail() {
    if (!this.page) throw new Error('Browser not initialized');

    console.log('🌐 Navigating to Gmail signup...');
    await this.page.goto('https://accounts.google.com/signup', {
      waitUntil: 'domcontentloaded'
    });

    await this.page.waitForTimeout(2000);
    console.log('✅ Page loaded');
  }

  async detectFormFields(): Promise<FormField[]> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log('🔍 Detecting form fields...');

    const fields: FormField[] = [];

    // Generate highly complex name with randomization
    const firstNames = ['Maximilian', 'Alessandro', 'Bartholomew', 'Constantine', 'Fitzgerald', 'Montgomery'];
    const middleNames = ['Xavier', 'Dominique', 'Augustine', 'Cornelius', 'Remington', 'Wellington'];
    const lastNames = ['Van-der-Berg', 'O\'Sullivan', 'Weatherington', 'Pemberton-Smith', 'MacPherson', 'DelaRosa'];
    const prefixes = ['Dr', 'Prof', 'Sir', ''];
    const suffixes = ['Jr', 'III', 'PhD', 'Esq', ''];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 8999);
    const randomYear = Math.floor(1975 + Math.random() * 30);

    // Build complex full names
    const fullFirstName = prefix ? `${prefix} ${firstName}` : firstName;
    const fullLastName = suffix ? `${lastName} ${suffix}` : lastName;
    const complexUsername = `${firstName.toLowerCase()}.${middleName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}${randomYear}`;

    // Common Gmail signup field selectors
    const fieldMappings = [
      { selector: 'input[name="firstName"]', type: 'text', label: 'First Name', value: `${firstName} ${middleName}` },
      { selector: 'input[name="lastName"]', type: 'text', label: 'Last Name', value: fullLastName },
      { selector: 'input[name="Username"]', type: 'text', label: 'Username', value: complexUsername },
      { selector: 'input[name="Passwd"]', type: 'password', label: 'Password', value: 'SecurePass123!' },
      { selector: 'input[name="PasswdAgain"]', type: 'password', label: 'Confirm Password', value: 'SecurePass123!' },
      { selector: 'input[name="phoneNumber"]', type: 'tel', label: 'Phone Number', value: '' },
      { selector: 'input[name="recoveryEmail"]', type: 'email', label: 'Recovery Email', value: '' },
      { selector: 'select[name="birthMonth"]', type: 'select', label: 'Birth Month', value: '1' },
      { selector: 'select[name="month"]', type: 'select', label: 'Month', value: '1' },
      { selector: 'input[name="day"]', type: 'number', label: 'Day', value: '15' },
      { selector: 'input[name="year"]', type: 'number', label: 'Year', value: '1990' },
      { selector: 'select[name="gender"]', type: 'select', label: 'Gender', value: '3' },
      { selector: 'select[id*="gender"]', type: 'select', label: 'Gender (alt)', value: '3' },
      { selector: 'select[aria-label*="Gender"]', type: 'select', label: 'Gender (aria)', value: '3' },
      // Try radio buttons for gender
      { selector: 'input[type="radio"][value="3"]', type: 'radio', label: 'Gender Radio', value: '3' },
      { selector: 'input[type="radio"][value="1"]', type: 'radio', label: 'Gender Radio Male', value: '1' }
    ];

    for (const mapping of fieldMappings) {
      try {
        const element = await this.page.$(mapping.selector);
        if (element) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            fields.push(mapping);
            console.log(`  ✓ Found: ${mapping.label}`);
          }
        }
      } catch (error) {
        // Field not found, continue
      }
    }

    console.log(`📊 Detected ${fields.length} form fields`);
    return fields;
  }

  async fillFields(fields: FormField[]) {
    if (!this.page) throw new Error('Browser not initialized');

    console.log('✍️ Filling form fields...');

    for (const field of fields) {
      try {
        if (field.value) {
          console.log(`  📝 Filling: ${field.label}`);

          if (field.type === 'select') {
            await this.page.selectOption(field.selector, field.value);
          } else if (field.type === 'radio') {
            await this.page.click(field.selector);
          } else {
            await this.page.fill(field.selector, field.value);
          }

          await this.page.waitForTimeout(300); // Natural typing delay
        }
      } catch (error) {
        console.log(`  ⚠️ Could not fill: ${field.label}`);
      }
    }

    // Wait a bit longer for dynamic content
    console.log('⏳ Waiting for dropdowns to load...');
    await this.page.waitForTimeout(2000);

    // Auto-detect and fill ALL visible dropdowns using page.evaluate
    console.log('🔍 Auto-detecting dropdowns with page.evaluate...');

    try {
      const result = await this.page.evaluate(() => {
        const results: string[] = [];

        // Find all select elements
        const selects = Array.from(document.querySelectorAll('select'));
        results.push(`Found ${selects.length} select elements`);

        for (let i = 0; i < selects.length; i++) {
          const select = selects[i] as HTMLSelectElement;
          if (!select.offsetParent) {
            results.push(`  Select ${i}: HIDDEN`);
            continue;
          }

          const ariaLabel = select.getAttribute('aria-label') || '';
          const name = select.name || '';
          const id = select.id || '';
          const label = `${ariaLabel} ${name} ${id}`.toLowerCase();

          results.push(`  Select ${i}: ${ariaLabel || name || id || 'unnamed'} (visible)`);
          results.push(`    Label text: "${label}"`);

          // Month
          if (label.includes('month') || label.includes('mm')) {
            select.value = '1';
            select.dispatchEvent(new Event('change', { bubbles: true }));
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('blur', { bubbles: true }));
            results.push(`    ✅ Filled Month`);
          }
          // Gender
          else if (label.includes('gender')) {
            select.value = '3';
            select.dispatchEvent(new Event('change', { bubbles: true }));
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('blur', { bubbles: true }));
            results.push(`    ✅ Filled Gender`);
          }
        }

        return results;
      });

      result.forEach(r => console.log(`  ${r}`));
    } catch (error) {
      console.log(`  ⚠️ Dropdown detection error: ${error}`);
    }

    console.log('✅ Form filling complete');
  }

  async showDoneButton() {
    if (!this.page) throw new Error('Browser not initialized');

    console.log('🎯 Finding Next button and adding DONE overlay...');

    // Better centering - maximize zoom and scroll to center
    await this.page.evaluate(() => {
      // Reset zoom to 100%
      (document.body.style as any).zoom = '100%';
      document.body.style.transform = 'scale(1)';

      // Try to find the main form/content area
      const formElement = document.querySelector('form') ||
                         document.querySelector('[role="main"]') ||
                         document.querySelector('main') ||
                         document.body;

      // Scroll to top first
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Wait a moment then scroll to center
      setTimeout(() => {
        // Get the center point of the viewport
        const viewportHeight = window.innerHeight;
        const formRect = formElement.getBoundingClientRect();
        const formCenter = formRect.top + (formRect.height / 2);
        const viewportCenter = viewportHeight / 2;
        const scrollAmount = formCenter - viewportCenter;

        window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
      }, 300);

      // Find the actual Next/Continue/Submit button on Gmail
      const nextButton = Array.from(document.querySelectorAll('button, [role="button"]'))
        .find(el => {
          const text = el.textContent?.toLowerCase() || '';
          return text.includes('next') || text.includes('continue') || text.includes('create');
        }) as HTMLElement;

      if (nextButton) {
        // Get button position
        const rect = nextButton.getBoundingClientRect();

        // Create green overlay box around the actual button
        const overlay = document.createElement('div');
        overlay.id = 'click-factory-done';
        overlay.style.cssText = `
          position: fixed;
          left: ${rect.left - 10}px;
          top: ${rect.top - 10}px;
          width: ${rect.width + 20}px;
          height: ${rect.height + 20}px;
          z-index: 999999;
          background: rgba(0, 255, 0, 0.3);
          border: 4px solid #00ff00;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(0,255,0,0.6), inset 0 0 20px rgba(0,255,0,0.3);
          animation: pulse 1.5s infinite;
          pointer-events: none;
        `;

        // Store reference to the button so we can click it
        (window as any).__currentNextButton = nextButton;

        // Add pulsing animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(0,255,0,0.6), inset 0 0 20px rgba(0,255,0,0.3); }
            50% { box-shadow: 0 0 40px rgba(0,255,0,0.9), inset 0 0 30px rgba(0,255,0,0.5); }
          }
        `;
        document.head.appendChild(style);

        // Add DONE label that IS clickable
        const label = document.createElement('div');
        label.textContent = 'CLICK TO SUBMIT ✓';
        label.style.cssText = `
          position: absolute;
          top: -50px;
          left: 50%;
          transform: translateX(-50%);
          background: #00ff00;
          color: #000;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(0,255,0,0.4);
          white-space: nowrap;
          pointer-events: all;
          cursor: pointer;
        `;

        // Make label clickable - it will trigger the Next button
        label.addEventListener('click', () => {
          label.textContent = 'SUBMITTING... ✓';
          label.style.background = '#ffaa00';

          // Click the actual Next button
          setTimeout(() => {
            (nextButton as HTMLElement).click();
          }, 300);
        });

        overlay.appendChild(label);
        document.body.appendChild(overlay);
      } else {
        // Fallback: center of screen
        const overlay = document.createElement('div');
        overlay.id = 'click-factory-done';
        overlay.textContent = 'CLICK HERE WHEN READY ✓';
        overlay.style.cssText = `
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 999999;
          padding: 30px 60px;
          background: #00ff00;
          color: #000;
          border: 5px solid #00aa00;
          border-radius: 12px;
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0,255,0,0.6);
          animation: pulse 1.5s infinite;
        `;
        document.body.appendChild(overlay);
      }
    });

    console.log('✅ Green DONE overlay added - Click when ready!');
  }

  async waitForDone(): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log('⏳ Waiting for you to click DONE...');

    // Store reference to the actual Next button
    const nextButtonSelector = await this.page.evaluate(() => {
      (window as any).__clickFactoryClicked = false;

      // Find the actual Next button
      const nextButton = Array.from(document.querySelectorAll('button, [role="button"]'))
        .find(el => {
          const text = el.textContent?.toLowerCase() || '';
          return text.includes('next') || text.includes('continue') || text.includes('create');
        }) as HTMLElement;

      if (nextButton) {
        (window as any).__nextButton = nextButton;
      }

      // Find the clickable label inside the overlay
      const label = document.querySelector('#click-factory-done div') as HTMLElement;

      if (label) {
        // Check if label was clicked by monitoring the click event
        const checkInterval = setInterval(() => {
          if (label.textContent?.includes('SUBMITTING')) {
            (window as any).__clickFactoryClicked = true;
            clearInterval(checkInterval);
          }
        }, 100);

        // Also set flag if button was clicked
        if ((window as any).__currentNextButton) {
          const btn = (window as any).__currentNextButton as HTMLElement;
          btn.addEventListener('click', () => {
            (window as any).__clickFactoryClicked = true;
          });
        }
      } else {
        // Fallback: user clicked the real button
        if ((window as any).__currentNextButton) {
          ((window as any).__currentNextButton as HTMLElement).addEventListener('click', () => {
            (window as any).__clickFactoryClicked = true;
          });
        }
      }

      return nextButton ? 'found' : 'not-found';
    });

    console.log(`Next button: ${nextButtonSelector}`);

    // Poll for the click flag
    await this.page.waitForFunction(() => {
      return (window as any).__clickFactoryClicked === true;
    }, { timeout: 600000 }); // 10 minute timeout

    console.log('✅ DONE button clicked! Submitting form...');

    // Wait for navigation to next page
    await this.page.waitForTimeout(3000);

    console.log('🔍 Checking for additional pages...');
  }

  async handleNextPage(): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');

    // Wait for page to load
    await this.page.waitForTimeout(2000);

    // Check if there are more form fields to fill
    const hasMoreFields = await this.page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"], input[type="tel"], select');
      return inputs.length > 0;
    });

    if (!hasMoreFields) {
      console.log('✅ No more fields detected - form complete!');
      return false;
    }

    console.log('📝 Found another page - detecting and filling fields...');

    // Detect and fill fields on this page
    const fields = await this.detectFormFields();

    if (fields.length > 0) {
      await this.fillFields(fields);
      await this.showDoneButton();
      await this.waitForDone();
      return true; // More pages may exist
    }

    return false;
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function main() {
  const factory = new GmailClickFactory();

  try {
    await factory.init();
    await factory.navigateToGmail();

    const fields = await factory.detectFormFields();

    if (fields.length > 0) {
      await factory.fillFields(fields);
      await factory.showDoneButton();

      console.log('\n' + '='.repeat(60));
      console.log('🎯 READY FOR YOUR REVIEW');
      console.log('='.repeat(60));
      console.log('1. Review the auto-filled form');
      console.log('2. Make any manual adjustments');
      console.log('3. Click the green DONE button in top-right');
      console.log('4. You will then manually submit the form');
      console.log('='.repeat(60) + '\n');

      await factory.waitForDone();

      // Check for and handle additional pages
      let hasMorePages = true;
      let pageCount = 1;

      while (hasMorePages && pageCount < 5) { // Max 5 pages
        pageCount++;
        console.log(`\n📄 Checking for page ${pageCount}...`);
        hasMorePages = await factory.handleNextPage();
      }

      console.log('\n✅ All pages completed!');
      console.log('👉 You can now manually review and submit on Gmail');

      // Keep browser open for manual submission
      console.log('\n⏳ Browser will stay open - manually close when done');
      console.log('Press Ctrl+C in terminal to exit.\n');

      // Wait indefinitely - browser stays open
      await new Promise<void>((resolve) => {
        // Never resolve - keeps process alive
        process.on('SIGINT', () => {
          console.log('\n👋 Shutting down...');
          factory.cleanup().then(() => process.exit(0));
        });
      });
    } else {
      console.log('❌ No form fields detected. Gmail may have changed their form.');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    // Don't cleanup on timeout - keep browser open!
    if (error instanceof Error && error.message.includes('Timeout')) {
      console.log('\n⚠️ Click timeout - but browser will stay open!');
      console.log('Press Ctrl+C when done.\n');
      await new Promise<void>((resolve) => {
        process.on('SIGINT', () => {
          console.log('\n👋 Shutting down...');
          process.exit(0);
        });
      });
    } else {
      await factory.cleanup();
    }
  }
}

main();
