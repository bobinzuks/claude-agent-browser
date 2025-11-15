/**
 * Fully Automated GitHub Workflow Trigger
 * Opens GitHub, logs in if needed, clicks "Run workflow" button
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const WORKFLOW_URL = 'https://github.com/bobinzuks/claude-agent-browser/actions/workflows/create-gmail-account.yml';

async function autoTriggerWorkflow() {
  console.log('🤖 Automated GitHub Workflow Trigger\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Navigate to workflow
    console.log('📂 Opening workflow page...');
    await page.goto(WORKFLOW_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    await screenshot(page, '01-workflow-page');

    // Look for "Run workflow" button
    console.log('\n🔍 Looking for "Run workflow" button...');

    const runWorkflowButton = await page.getByRole('button', { name: 'Run workflow' }).first();

    if (runWorkflowButton && await runWorkflowButton.isVisible()) {
      console.log('✅ Found "Run workflow" button!');
      await screenshot(page, '02-before-click');

      // Click it
      console.log('🖱️  Clicking "Run workflow"...');
      await runWorkflowButton.click();
      await page.waitForTimeout(2000);

      await screenshot(page, '03-dropdown-opened');

      // Select parallel jobs
      console.log('\n⚙️  Configuring workflow inputs...');

      // Look for parallel_jobs dropdown
      const parallelJobsSelect = await page.locator('select[name="parallel_jobs"]').first();
      if (await parallelJobsSelect.isVisible()) {
        await parallelJobsSelect.selectOption('3');
        console.log('  ✓ Parallel jobs: 3');
      }

      // Look for accounts_per_job dropdown
      const accountsPerJobSelect = await page.locator('select[name="accounts_per_job"]').first();
      if (await accountsPerJobSelect.isVisible()) {
        await accountsPerJobSelect.selectOption('1');
        console.log('  ✓ Accounts per job: 1');
      }

      await page.waitForTimeout(1000);
      await screenshot(page, '04-configured');

      // Find and click the green "Run workflow" button (the submit button)
      console.log('\n🚀 Triggering workflow...');
      const submitButton = await page.getByRole('button', { name: 'Run workflow' }).last();

      if (submitButton && await submitButton.isVisible()) {
        await submitButton.click();
        console.log('✅ Workflow triggered!');

        await page.waitForTimeout(3000);
        await screenshot(page, '05-triggered');

        // Wait for page to update
        console.log('\n⏳ Waiting for workflow to start...');
        await page.waitForTimeout(5000);

        // Check for the new run
        await page.reload();
        await page.waitForTimeout(2000);
        await screenshot(page, '06-after-trigger');

        console.log('\n✅ SUCCESS! Workflow has been triggered!');
        console.log('\n📊 Monitoring workflow runs...');

        // Navigate to runs page
        await page.goto('https://github.com/bobinzuks/claude-agent-browser/actions', {
          waitUntil: 'domcontentloaded'
        });
        await page.waitForTimeout(3000);
        await screenshot(page, '07-runs-list');

        // Get the first run (latest)
        const latestRun = await page.locator('.Box-row').first();
        if (latestRun) {
          const runText = await latestRun.textContent();
          console.log(`\nLatest run: ${runText?.slice(0, 100)}...`);

          // Click into it
          const runLink = await latestRun.locator('a').first();
          if (runLink) {
            await runLink.click();
            await page.waitForTimeout(3000);
            await screenshot(page, '08-run-details');

            console.log('\n✅ Opened workflow run details');
            console.log('📸 All screenshots saved to: ./workflow-trigger/');
          }
        }

        console.log('\n🎉 Workflow is running! Browser will stay open for monitoring.');
        console.log('Press Ctrl+C when done.\n');

        // Keep browser open
        await new Promise(() => {});

      } else {
        console.log('❌ Could not find submit button');
        await screenshot(page, 'error-no-submit');
      }

    } else {
      console.log('❌ "Run workflow" button not found or not visible');
      console.log('ℹ️  You may need to sign in to GitHub first');

      await screenshot(page, 'error-no-button');

      console.log('\n🔐 Browser will stay open - please sign in manually');
      console.log('Then re-run this script.');

      await new Promise(() => {});
    }

  } catch (error) {
    console.error('❌ Error:', error);
    await screenshot(page, 'error-exception');
    throw error;
  }
}

async function screenshot(page: Page, name: string) {
  const dir = './workflow-trigger';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(dir, filename);

  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`   📸 ${filename}`);
}

// Run
autoTriggerWorkflow();
