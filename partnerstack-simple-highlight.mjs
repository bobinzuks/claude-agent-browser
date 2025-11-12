#!/usr/bin/env node

/**
 * PartnerStack with Playwright's built-in highlight (more reliable)
 */

import { chromium } from 'playwright';
import clipboardy from 'clipboardy';
import dotenv from 'dotenv';

dotenv.config();

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simplifiedGuide() {
  console.log('🎯 PartnerStack Simple Guide (with built-in highlights)\n');

  const userData = {
    firstName: process.env.USER_FIRST_NAME,
    lastName: process.env.USER_LAST_NAME,
    email: process.env.USER_EMAIL,
  };

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.partnerstack.com/partners');
    await wait(3000);

    console.log('\n═══ Manual Instructions ═══\n');
    console.log('STEP 1: Click "Book a demo" button (top left)\n');
    console.log('⏳ Waiting 15 seconds...\n');
    await wait(15000);

    console.log('STEP 2: On the choice page, click "I\'m a software vendor"\n');
    console.log('⏳ Waiting 15 seconds...\n');
    await wait(15000);

    console.log('STEP 3: Fill the form that appears\n');
    console.log(`   First Name: ${userData.firstName}`);
    console.log(`   Last Name: ${userData.lastName}`);
    console.log(`   Email: ${userData.email}\n`);

    // Copy first name to clipboard
    await clipboardy.write(userData.firstName);
    console.log(`📋 "${userData.firstName}" copied - paste with Ctrl+V\n`);
    await wait(15000);

    // Copy last name
    await clipboardy.write(userData.lastName);
    console.log(`📋 "${userData.lastName}" copied - paste with Ctrl+V\n`);
    await wait(15000);

    // Copy email
    await clipboardy.write(userData.email);
    console.log(`📋 "${userData.email}" copied - paste with Ctrl+V\n`);
    await wait(15000);

    console.log('\n✅ Fill remaining fields and submit!\n');
    console.log('Browser stays open for 2 minutes...\n');
    await wait(120000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

simplifiedGuide().catch(console.error);
