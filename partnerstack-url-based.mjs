#!/usr/bin/env node

/**
 * PartnerStack URL-Based Guide - Detects pages by URL changes
 */

import { chromium } from 'playwright';
import clipboardy from 'clipboardy';
import dotenv from 'dotenv';

dotenv.config();

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function partnerstackUrlBased() {
  console.log('🎮 PartnerStack URL-Based Guide\n');

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
        .url-arrow {
          position: fixed !important;
          font-size: 120px !important;
          z-index: 99999999 !important;
          text-shadow: 0 0 50px #00ff00 !important;
          animation: bounce-url 1s infinite !important;
          pointer-events: none !important;
        }
        @keyframes bounce-url {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-25px); }
        }
        .url-glow {
          outline: 10px solid #00ff00 !important;
          outline-offset: 8px !important;
          box-shadow: 0 0 40px 15px #00ff00 !important;
        }
        .url-message {
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

    let lastUrl = '';
    let pagesVisited = new Set();

    // Track URL changes
    page.on('framenavigated', async () => {
      const newUrl = page.url();
      if (newUrl !== lastUrl) {
        console.log(`🔄 URL changed to: ${newUrl}\n`);
        lastUrl = newUrl;
      }
    });

    while (true) {
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}\n`);

      // Landing page - has /partners in URL
      if (currentUrl.includes('/partners') && !currentUrl.includes('signup') && !pagesVisited.has('landing')) {
        console.log('▶️  STEP 1: Click "Get started"\n');
        pagesVisited.add('landing');

        await page.evaluate(() => {
          document.querySelectorAll('.url-arrow, .url-message').forEach(el => el.remove());

          const allLinks = Array.from(document.querySelectorAll('a, button'));
          const btn = allLinks.find(el => el.textContent.toLowerCase().includes('get started'));

          if (btn) {
            btn.classList.add('url-glow');
            btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

            const arrow = document.createElement('div');
            arrow.className = 'url-arrow';
            arrow.innerHTML = '👉';
            const rect = btn.getBoundingClientRect();
            arrow.style.position = 'fixed';
            arrow.style.left = (rect.left - 140) + 'px';
            arrow.style.top = (rect.top + rect.height/2 - 60) + 'px';
            document.body.appendChild(arrow);

            const msg = document.createElement('div');
            msg.className = 'url-message';
            msg.innerHTML = '<div>👉 Click "Get started"</div>';
            document.body.appendChild(msg);
          }
        });

        console.log('👉 Arrow visible!\n');
        await wait(3000);
      }

      // Choice page - check for vendor/partner buttons
      else {
        const pageContent = await page.evaluate(() => document.body.textContent).catch(() => '');

        if (pageContent.includes("I'm a software vendor") && pageContent.includes("I'm a partner") && !pagesVisited.has('choice')) {
          console.log('▶️  STEP 2: Click "I\'m a software vendor"\n');
          pagesVisited.add('choice');

          await wait(1000); // Wait for page stability

          try {
            await page.evaluate(() => {
              document.querySelectorAll('.url-arrow, .url-message').forEach(el => el.remove());

              const allElements = Array.from(document.querySelectorAll('*'));
              const vendorBtn = allElements.find(el => {
                const text = el.textContent || '';
                return text.includes("I'm a software vendor") &&
                       (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'DIV') &&
                       el.offsetParent !== null; // Visible element
              });

              if (vendorBtn) {
                vendorBtn.classList.add('url-glow');
                vendorBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

                const arrow = document.createElement('div');
                arrow.className = 'url-arrow';
                arrow.innerHTML = '👇';
                const rect = vendorBtn.getBoundingClientRect();
                arrow.style.position = 'fixed';
                arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
                arrow.style.top = (rect.top - 140) + 'px';
                document.body.appendChild(arrow);

                const msg = document.createElement('div');
                msg.className = 'url-message';
                msg.innerHTML = '<div>👇 Click "Software vendor"</div>';
                document.body.appendChild(msg);
              }
            });

            console.log('👇 Arrow visible!\n');
          } catch (error) {
            console.log('⚠️  Page navigated\n');
          }

          await wait(3000);
        }

        // Form page - has input fields
        else {
          const hasForm = await page.evaluate(() => {
            return !!document.querySelector('input[name*="first" i], input[placeholder*="first" i]');
          }).catch(() => false);

          if (hasForm && !pagesVisited.has('form')) {
            console.log('✅ FORM PAGE DETECTED!\n');
            pagesVisited.add('form');

            // Clean up any old arrows
            await page.evaluate(() => {
              document.querySelectorAll('.url-arrow, .url-message, .url-glow').forEach(el => {
                el.classList.remove('url-glow');
                if (el.classList.contains('url-arrow') || el.classList.contains('url-message')) {
                  el.remove();
                }
              });
            });

            await wait(2000);

            // First Name
            console.log('▶️  STEP 3: First Name\n');
            await clipboardy.write(userData.firstName);
            console.log(`📋 "${userData.firstName}" copied!\n`);

            await page.evaluate(() => {
              const input = document.querySelector('input[name*="first" i], input[placeholder*="first" i]');
              if (input) {
                input.classList.add('url-glow');
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });

                const arrow = document.createElement('div');
                arrow.className = 'url-arrow';
                arrow.innerHTML = '👇';
                const rect = input.getBoundingClientRect();
                arrow.style.position = 'fixed';
                arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
                arrow.style.top = (rect.top - 140) + 'px';
                document.body.appendChild(arrow);

                const msg = document.createElement('div');
                msg.className = 'url-message';
                msg.innerHTML = '<div>👇 First Name</div><div style="font-size: 18px; margin-top: 10px;">Ctrl+V</div>';
                document.body.appendChild(msg);
              }
            });

            await wait(15000);

            // Last Name
            console.log('▶️  STEP 4: Last Name\n');
            await clipboardy.write(userData.lastName);
            console.log(`📋 "${userData.lastName}" copied!\n`);

            await page.evaluate(() => {
              document.querySelectorAll('.url-arrow, .url-message').forEach(el => el.remove());

              const input = document.querySelector('input[name*="last" i], input[placeholder*="last" i]');
              if (input) {
                input.classList.add('url-glow');
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });

                const arrow = document.createElement('div');
                arrow.className = 'url-arrow';
                arrow.innerHTML = '👇';
                const rect = input.getBoundingClientRect();
                arrow.style.position = 'fixed';
                arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
                arrow.style.top = (rect.top - 140) + 'px';
                document.body.appendChild(arrow);

                const msg = document.createElement('div');
                msg.className = 'url-message';
                msg.innerHTML = '<div>👇 Last Name</div><div style="font-size: 18px; margin-top: 10px;">Ctrl+V</div>';
                document.body.appendChild(msg);
              }
            });

            await wait(15000);

            // Email
            console.log('▶️  STEP 5: Email\n');
            await clipboardy.write(userData.email);
            console.log(`📋 "${userData.email}" copied!\n`);

            await page.evaluate(() => {
              document.querySelectorAll('.url-arrow, .url-message').forEach(el => el.remove());

              const input = document.querySelector('input[type="email"]');
              if (input) {
                input.classList.add('url-glow');
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });

                const arrow = document.createElement('div');
                arrow.className = 'url-arrow';
                arrow.innerHTML = '👇';
                const rect = input.getBoundingClientRect();
                arrow.style.position = 'fixed';
                arrow.style.left = (rect.left + rect.width/2 - 60) + 'px';
                arrow.style.top = (rect.top - 140) + 'px';
                document.body.appendChild(arrow);

                const msg = document.createElement('div');
                msg.className = 'url-message';
                msg.innerHTML = '<div>👇 Email</div><div style="font-size: 18px; margin-top: 10px;">Ctrl+V</div>';
                document.body.appendChild(msg);
              }
            });

            await wait(15000);

            console.log('\n✅ Basic fields done!\n');
            console.log('Complete remaining manually\n');
            break;
          }
        }
      }

      await wait(2000); // Check every 2 seconds
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

partnerstackUrlBased().catch(console.error);
