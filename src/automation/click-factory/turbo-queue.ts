#!/usr/bin/env ts-node
/**
 * Phase 2: TURBO QUEUE MODE
 *
 * Continuous loading queue:
 * - Start with 4-6 tabs (based on CPU)
 * - When tab closes, immediately load next site
 * - Always keep queue full
 * - No waiting between batches
 * - Auto-retry failed sites at end
 */

import { ClickFactoryController } from './controller';
import type { BatchSite } from './controller';
import * as fs from 'fs';
import * as path from 'path';

const TEST_SITES_FILE = path.join(__dirname, '..', 'automation-test-websites.json');
const allTestSites = JSON.parse(fs.readFileSync(TEST_SITES_FILE, 'utf-8'));

// TURBO QUEUE SETTINGS
const MAX_CONCURRENT_TABS = 4; // Always 4 active when user is clicking
const MAX_QUEUED_TABS = 7; // Max total tabs (4 ready + 3 loading) - pause loading if reached
const QUEUE_CHECK_INTERVAL = 300; // Check every 300ms for faster response
const PAUSE_DETECTION_TIME = 30000; // If no DONE clicks for 30s, stop loading new sites

// Comprehensive user data
const comprehensiveUserData = {
  email: 'test@example.com',
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser123',
  password: 'TestPass123!',
  phone: '5551234567',
  company: 'Test Company LLC',
  website: 'https://example.com',
  address: '123 Main Street',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94105',
  country: 'United States',
  taxId: '12-3456789',
  paymentMethod: 'PayPal',
  paypalEmail: 'payment@example.com',
  trafficMethod: 'Search Engine Optimization',
  monthlyTraffic: '50000',
  monthlyRevenue: '10000',
  experienceYears: '5',
  niche: 'Technology',
  mobileNumber: '5551234567'
};

/**
 * Add control buttons to page
 */
async function addControlButtons(page: any, siteName: string): Promise<void> {
  try {
    await page.evaluate((name: string) => {
      const existing = document.getElementById('claude-controls');
      if (existing) existing.remove();

      const panel = document.createElement('div');
      panel.id = 'claude-controls';
      panel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 2147483647;
        background: white;
        border: 3px solid #000;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif;
      `;

      const label = document.createElement('div');
      label.textContent = name;
      label.style.cssText = `
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 10px;
        text-align: center;
      `;
      panel.appendChild(label);

      const doneBtn = document.createElement('button');
      doneBtn.textContent = '✅ DONE (Submit & Close)';
      doneBtn.style.cssText = `
        display: block;
        width: 100%;
        padding: 15px;
        margin-bottom: 8px;
        background: #00FF00;
        color: black;
        border: 3px solid #000;
        border-radius: 5px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      `;
      doneBtn.onclick = () => {
        doneBtn.style.background = '#FF0000';
        doneBtn.textContent = '⏳ Submitting...';

        // Find and click submit
        const submitSelectors = [
          'button[type="submit"]',
          'input[type="submit"]',
          'button:has-text("Submit")',
          'form button'
        ];

        for (const selector of submitSelectors) {
          try {
            const btn = document.querySelector(selector) as HTMLElement;
            if (btn && btn.offsetParent !== null) {
              btn.click();
              break;
            }
          } catch (e) {}
        }

        doneBtn.textContent = '✅ Submitted! Closing...';
        (window as any).__claudeDone = true;
      };
      panel.appendChild(doneBtn);

      // Add NEXT button (minimize for later)
      const nextBtn = document.createElement('button');
      nextBtn.textContent = '➡️ NEXT (Minimize)';
      nextBtn.style.cssText = `
        display: block;
        width: 100%;
        padding: 12px;
        background: #FFA500;
        color: black;
        border: 2px solid #000;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
      `;
      nextBtn.onclick = () => {
        (window as any).__claudeNext = true;
        nextBtn.textContent = '✅ Queued for later';
        nextBtn.style.background = '#808080';
      };
      panel.appendChild(nextBtn);
      document.body.appendChild(panel);
    }, siteName);
  } catch (e) {
    console.log(`    ⚠️  Could not add control buttons: ${e}`);
  }
}

/**
 * Add green box around submit button
 */
async function addGreenBox(page: any): Promise<void> {
  try {
    await page.evaluate(() => {
      let button: HTMLElement | null = null;

      const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
      if (submitButtons.length > 0) {
        button = submitButtons[0] as HTMLElement;
      }

      if (!button) {
        const allButtons = document.querySelectorAll('button');
        for (const el of allButtons) {
          const text = el.textContent?.toLowerCase() || '';
          if (text.match(/submit|sign up|register|send/i)) {
            button = el;
            break;
          }
        }
      }

      if (button) {
        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          if (!button) return;
          const rect = button.getBoundingClientRect();
          const highlight = document.createElement('div');
          highlight.style.cssText = `
            position: fixed;
            top: ${rect.top - 10}px;
            left: ${rect.left - 10}px;
            width: ${rect.width + 20}px;
            height: ${rect.height + 20}px;
            border: 5px solid #00FF00;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
            pointer-events: none;
            z-index: 2147483646;
            animation: pulse 1.5s infinite;
          `;

          const style = document.createElement('style');
          style.textContent = `
            @keyframes pulse {
              0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.8); }
              50% { box-shadow: 0 0 40px rgba(0, 255, 0, 1); }
            }
          `;
          document.head.appendChild(style);
          document.body.appendChild(highlight);
        }, 500);
      }
    });
  } catch (e) {}
}

/**
 * Poll for DONE and close context
 */
async function pollForDone(page: any, context: any, siteName: string): Promise<void> {
  const maxPolls = 300;
  let polls = 0;

  while (polls < maxPolls) {
    try {
      const isDone = await page.evaluate(() => (window as any).__claudeDone === true);
      if (isDone) {
        console.log(`    ✅ ${siteName} - DONE! Closing...`);
        await context.close();
        return;
      }
      await page.waitForTimeout(1000);
      polls++;
    } catch (e) {
      return;
    }
  }
}

/**
 * Load and fill a single site
 */
async function loadSite(
  factory: ClickFactoryController,
  site: BatchSite,
  slotNumber: number
): Promise<{ context: any, page: any, result: any, site: BatchSite }> {
  console.log(`  [SLOT ${slotNumber}] Loading ${site.name}...`);

  const browser = (factory as any)['browser'];
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  try {
    console.log(`    [SLOT ${slotNumber}] Navigating to ${site.url}...`);

    await page.goto(site.url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    }).catch((e: any) => {
      console.log(`    [SLOT ${slotNumber}] ⚠️  Navigation warning: ${e.message}`);
    });

    // Wait for network to settle
    console.log(`    [SLOT ${slotNumber}] Waiting for network idle...`);
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      console.log(`    [SLOT ${slotNumber}] ⏱️  Network not idle, continuing...`);
    });

    // CRITICAL: Wait longer for page to fully render and be ready for filling
    console.log(`    [SLOT ${slotNumber}] Page loaded, waiting for full render...`);
    await page.waitForTimeout(5000); // Increased to 5 seconds

    // Verify page actually loaded
    const pageUrl = page.url();
    if (pageUrl === 'about:blank' || pageUrl === '') {
      console.log(`    [SLOT ${slotNumber}] ❌ Page is blank, skipping...`);
      throw new Error('Page failed to load (about:blank)');
    }

    // Check for forms
    console.log(`    [SLOT ${slotNumber}] Looking for form fields...`);
    try {
      await page.waitForSelector('input, textarea, select', {
        timeout: 10000,
        state: 'attached'
      });
      console.log(`    [SLOT ${slotNumber}] ✅ Form fields found`);
    } catch (e) {
      console.log(`    [SLOT ${slotNumber}] ⚠️  No form fields detected`);
    }

    // Close about:blank popups
    const allPages = context.pages();
    for (const p of allPages) {
      if (p !== page && (p.url() === 'about:blank' || p.url() === '')) {
        await p.close().catch(() => {});
      }
    }

    // Bring to front
    await page.bringToFront();
    await page.waitForTimeout(200);

    // Fill form
    console.log(`    [SLOT ${slotNumber}] Filling form...`);
    const { detected, filled } = await factory['autoFillForm'](page.mainFrame(), comprehensiveUserData);

    console.log(`    [SLOT ${slotNumber}] ${site.name} - ${filled}/${detected} fields filled`);

    // Extra wait after filling to ensure all fields are populated
    await page.waitForTimeout(1000);

    // Add UI
    console.log(`    [SLOT ${slotNumber}] Adding control buttons...`);
    await addControlButtons(page, site.name);
    console.log(`    [SLOT ${slotNumber}] Adding green box...`);
    await addGreenBox(page);
    console.log(`    [SLOT ${slotNumber}] Bringing to front...`);
    await page.bringToFront();
    console.log(`    [SLOT ${slotNumber}] ✅ READY - Click DONE button in top-right!`);

    // Start polling for DONE
    pollForDone(page, context, site.name).catch(() => {});

    return {
      context,
      page,
      site,
      result: {
        site,
        success: filled > 0,
        fieldsDetected: detected,
        fieldsFilled: filled,
        submitted: false
      }
    };
  } catch (error) {
    console.log(`    [SLOT ${slotNumber}] ❌ Error: ${(error as Error).message}`);

    // Close the context on error
    await context.close().catch(() => {});

    return {
      context,
      page,
      site,
      result: {
        site,
        success: false,
        fieldsDetected: 0,
        fieldsFilled: 0,
        submitted: false,
        error: (error as Error).message
      }
    };
  }
}

async function main() {
  console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  console.log('┃   🚀 TURBO QUEUE - 100 SITE TEST             ┃');
  console.log('┃   Human-in-Loop with Smart Queue Management   ┃');
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n');

  console.log(`🎯 Target Sites: 100 (from ${allTestSites.length} total)`);
  console.log(`⚡ Active Tabs: ${MAX_CONCURRENT_TABS} ready to click`);
  console.log(`📦 Queue Limit: ${MAX_QUEUED_TABS} total tabs (stops loading when full)`);
  console.log(`⏸️  Auto-pause: Stops loading if no clicks for ${PAUSE_DETECTION_TIME/1000}s`);
  console.log(`🔄 Workflow: Click DONE → Next loads immediately (if queue not full)\n`);

  const factory = new ClickFactoryController({
    mode: 'phase2-human',
    batchSize: 4,
    useAgentDB: false
  });

  await factory.initialize();

  // Filter sites
  const blankPagePatterns = [
    /\/elements\/?$/i,
    /\/forms\/?$/i,
    /\/widgets\/?$/i
  ];

  const batchSites: BatchSite[] = allTestSites
    .filter((site: any) => !blankPagePatterns.some(p => p.test(site.url)))
    .slice(0, 100) // Take first 100 sites for this test
    .map((site: any) => ({
      url: site.url,
      name: site.name || site.url,
      difficulty: 'easy'
    }));

  console.log(`✅ ${batchSites.length} sites ready to process\n`);
  console.log(`🚀 Starting TURBO QUEUE...\n`);

  // Track active slots
  const activeSlots = new Map<number, { context: any, page: any, site: BatchSite }>();
  const allResults: any[] = [];
  let siteIndex = 0;
  let processedCount = 0;
  let lastDoneClickTime = Date.now(); // Track when user last clicked DONE

  // Fill initial slots IN PARALLEL - all start at once!
  console.log(`🔄 Loading ${MAX_CONCURRENT_TABS} tabs in PARALLEL...\n`);

  const initialLoads = [];
  for (let slot = 0; slot < MAX_CONCURRENT_TABS && siteIndex < batchSites.length; slot++) {
    console.log(`📍 Starting slot ${slot + 1}/${MAX_CONCURRENT_TABS}...`);
    initialLoads.push(
      loadSite(factory, batchSites[siteIndex], slot + 1).then(result => ({ slot, result }))
    );
    siteIndex++;
  }

  // Wait for all initial loads to complete
  const loadedSlots = await Promise.all(initialLoads);

  // Add successful loads to active slots
  for (const { slot, result } of loadedSlots) {
    if (result.result.success || result.result.fieldsDetected > 0) {
      activeSlots.set(slot, result);
    }
  }

  console.log(`\n✅ ${activeSlots.size} tabs loaded and ready! Start clicking DONE...\n`);

  // Queue management loop
  while (processedCount < batchSites.length) {
    await new Promise(resolve => setTimeout(resolve, QUEUE_CHECK_INTERVAL));

    // Check each slot
    for (const [slot, data] of activeSlots.entries()) {
      try {
        // Check if context is closed (user clicked DONE)
        const pages = data.context.pages();
        if (pages.length === 0) {
          // Slot is free!
          processedCount++;
          allResults.push(data);
          activeSlots.delete(slot);

          console.log(`📊 Progress: ${processedCount}/${batchSites.length} (${((processedCount/batchSites.length)*100).toFixed(1)}%)`);

          // Update last click time
          lastDoneClickTime = Date.now();

          // Check if we should load next site
          const currentTabCount = activeSlots.size;
          const timeSinceLastClick = Date.now() - lastDoneClickTime;
          const userIsPaused = timeSinceLastClick > PAUSE_DETECTION_TIME;

          if (siteIndex < batchSites.length) {
            // Only load if we haven't hit the queue limit OR user is actively clicking
            if (currentTabCount < MAX_QUEUED_TABS && !userIsPaused) {
              console.log(`🔄 [SLOT ${slot + 1}] Loading next site (${currentTabCount}/${MAX_QUEUED_TABS} tabs)...`);
              const result = await loadSite(factory, batchSites[siteIndex], slot + 1);
              activeSlots.set(slot, result);
              siteIndex++;
            } else if (currentTabCount >= MAX_QUEUED_TABS) {
              console.log(`⏸️  [SLOT ${slot + 1}] Queue full (${currentTabCount}/${MAX_QUEUED_TABS}), waiting for you to catch up...`);
            } else if (userIsPaused) {
              console.log(`⏸️  [SLOT ${slot + 1}] No DONE clicks for ${timeSinceLastClick/1000}s, paused loading. Click DONE to resume!`);
            }
          }
        }
      } catch (e) {
        // Context already closed
        processedCount++;
        allResults.push(data);
        activeSlots.delete(slot);

        if (siteIndex < batchSites.length) {
          const result = await loadSite(factory, batchSites[siteIndex], slot + 1);
          activeSlots.set(slot, result);
          siteIndex++;
        }
      }
    }
  }

  // Close remaining tabs
  for (const [_slot, data] of activeSlots.entries()) {
    await data.context.close().catch(() => {});
  }

  console.log('\n🎉 All sites processed!');

  // Statistics
  const successCount = allResults.filter((r: any) => r.result.success && r.result.fieldsFilled > 0).length;
  const successRate = ((successCount / allResults.length) * 100).toFixed(1);

  console.log('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  console.log('┃   📊 TURBO QUEUE RESULTS                  ┃');
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
  console.log(`Total: ${allResults.length}`);
  console.log(`✅ Success: ${successCount} (${successRate}%)`);
  console.log(`⚠️  Failed: ${allResults.length - successCount}`);

  await (factory as any).close();
  console.log('\n✅ TURBO QUEUE shutdown\n');
}

main().catch(console.error);
