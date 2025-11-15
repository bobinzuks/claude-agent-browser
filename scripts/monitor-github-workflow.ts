/**
 * Automated GitHub Workflow Monitor with Screenshots
 * Opens GitHub Actions page, takes screenshots, monitors progress
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const GITHUB_REPO = 'https://github.com/bobinzuks/claude-agent-browser';
const ACTIONS_URL = `${GITHUB_REPO}/actions`;
const WORKFLOW_URL = `${GITHUB_REPO}/actions/workflows/create-gmail-account.yml`;

async function monitorWorkflow() {
  console.log('🔍 GitHub Workflow Monitor - Starting...\n');

  const browser = await chromium.launch({
    headless: false, // Visible browser
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Navigate to workflow page
    console.log('📂 Opening GitHub Actions...');
    await page.goto(WORKFLOW_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await takeScreenshot(page, 'workflow-page');

    // Check for errors
    console.log('\n🔍 Checking for workflow errors...');
    const errorBanner = await page.$('.flash-error, .flash-warn, [role="alert"]');

    if (errorBanner) {
      const errorText = await errorBanner.textContent();
      console.log('⚠️  Error detected:');
      console.log(errorText);

      await takeScreenshot(page, 'workflow-error');

      // Try to select and copy error text
      await errorBanner.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Control+C');

      console.log('\n📋 Error text copied to clipboard (if possible)');
    } else {
      console.log('✅ No errors detected on workflow page');
    }

    // Check workflow status
    console.log('\n📊 Checking workflow runs...');
    await page.goto(ACTIONS_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Get latest run
    const latestRun = await page.$('.Box-row:first-child');
    if (latestRun) {
      const statusIcon = await latestRun.$('.octicon-check, .octicon-x, .octicon-dot-fill');
      const runTitle = await latestRun.$('.Link--primary');

      const status = await statusIcon?.getAttribute('class');
      const title = await runTitle?.textContent();

      console.log(`Latest run: ${title}`);
      console.log(`Status: ${status?.includes('check') ? '✅ Success' : status?.includes('x') ? '❌ Failed' : '⏳ In Progress'}`);

      await takeScreenshot(page, 'latest-runs');

      // Click into latest run
      if (runTitle) {
        console.log('\n🔗 Opening latest run details...');
        await runTitle.click();
        await page.waitForTimeout(3000);

        await takeScreenshot(page, 'run-details');

        // Get job details
        const jobs = await page.$$('[data-test-selector="job-card"]');
        console.log(`\nFound ${jobs.length} jobs:`);

        for (let i = 0; i < jobs.length; i++) {
          const job = jobs[i];
          const jobName = await job.$('h3');
          const jobStatus = await job.$('.Label');

          const name = await jobName?.textContent();
          const status = await jobStatus?.textContent();

          console.log(`  ${i + 1}. ${name}: ${status}`);
        }

        await takeScreenshot(page, 'jobs-overview');
      }
    }

    console.log('\n📸 All screenshots saved to: ./github-workflow-monitor/');
    console.log('\n✅ Monitoring complete. Browser will stay open for inspection.');
    console.log('Press Ctrl+C to close when done.');

    // Keep browser open
    await new Promise(() => {}); // Wait forever

  } catch (error) {
    console.error('❌ Error:', error);
    await takeScreenshot(page, 'error-state');
  }
}

async function takeScreenshot(page: Page, name: string) {
  const dir = './github-workflow-monitor';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(dir, filename);

  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot: ${filename}`);
}

// Run
monitorWorkflow();
