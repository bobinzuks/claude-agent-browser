#!/usr/bin/env node

/**
 * HOLDING HANDS AUTO: Fully Automated Visual Guidance
 * Shows arrows and highlights, waits automatically instead of requiring Enter
 */

import { chromium } from 'playwright';
import clipboardy from 'clipboardy';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Game state
const gameState = {
  totalPoints: 0,
  level: 1,
  achievements: [],
  fieldsCompleted: 0
};

const ACHIEVEMENTS = {
  first_field: { name: '🌟 First Steps', points: 25 },
  speed_demon: { name: '⚡ Speed Demon', points: 50 },
  form_crusher: { name: '💪 Form Crusher', points: 200 }
};

function addPoints(points, reason) {
  gameState.totalPoints += points;
  console.log(`\n✨ +${points} POINTS! ${reason}`);
  console.log(`📊 Total: ${gameState.totalPoints} points\n`);

  const newLevel = Math.floor(gameState.totalPoints / 100) + 1;
  if (newLevel > gameState.level) {
    gameState.level = newLevel;
    console.log(`🎺 LEVEL ${gameState.level}! 🎺\n`);
  }
}

function unlockAchievement(key) {
  if (!gameState.achievements.includes(key)) {
    gameState.achievements.push(key);
    const ach = ACHIEVEMENTS[key];
    console.log(`\n🎉 ACHIEVEMENT UNLOCKED! ${ach.name} 🏆`);
    console.log(`   +${ach.points} bonus points!\n`);
    gameState.totalPoints += ach.points;
  }
}

async function injectVisualGuide(page) {
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

      .hh-highlight {
        outline: 3px solid #00ff00 !important;
        outline-offset: 5px !important;
        animation: pulse 2s infinite !important;
        position: relative !important;
        z-index: 999999 !important;
        background-color: rgba(0, 255, 0, 0.1) !important;
      }

      .hh-arrow {
        position: absolute !important;
        font-size: 64px !important;
        color: #00ff00 !important;
        z-index: 1000000 !important;
        animation: arrow-bounce 1s infinite !important;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
        pointer-events: none !important;
      }

      .hh-message {
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
      }

      .hh-stats {
        position: fixed !important;
        top: 100px !important;
        right: 20px !important;
        background: white !important;
        color: #333 !important;
        padding: 15px 20px !important;
        border-radius: 10px !important;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2) !important;
        z-index: 1000001 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }
    `
  });
}

async function showArrow(page, selector, message) {
  await page.evaluate(({ selector, message }) => {
    document.querySelectorAll('.hh-arrow, .hh-highlight, .hh-message').forEach(el => el.remove());

    const target = document.querySelector(selector);
    if (!target) return false;

    target.classList.add('hh-highlight');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const arrow = document.createElement('div');
    arrow.className = 'hh-arrow';
    arrow.textContent = '👇';

    const rect = target.getBoundingClientRect();
    arrow.style.left = (rect.left + rect.width / 2 - 32) + 'px';
    arrow.style.top = (rect.top - 80 + window.scrollY) + 'px';

    document.body.appendChild(arrow);

    const msg = document.createElement('div');
    msg.className = 'hh-message';
    msg.innerHTML = `👆 ${message}`;
    document.body.appendChild(msg);

    return true;
  }, { selector, message });
}

async function updateStats(page, points, level) {
  await page.evaluate(({ points, level }) => {
    document.querySelectorAll('.hh-stats').forEach(el => el.remove());

    const stats = document.createElement('div');
    stats.className = 'hh-stats';
    stats.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">🎮 GAME STATS</div>
      <div>Level: ${level}</div>
      <div>Points: ${points}</div>
    `;
    document.body.appendChild(stats);
  }, { points, level });
}

async function autoSignup() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║        🎮 AUTO GAMIFIED AFFILIATE SIGNUP 🎮       ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const userData = {
    firstName: process.env.USER_FIRST_NAME,
    lastName: process.env.USER_LAST_NAME || '',
    email: process.env.USER_EMAIL,
    company: process.env.USER_COMPANY || '',
    website: process.env.USER_WEBSITE || '',
    phone: process.env.USER_PHONE || ''
  };

  console.log('✅ Loaded profile from .env\n');
  console.log(`   ${userData.firstName} ${userData.lastName}`);
  console.log(`   ${userData.email}\n`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const page = await browser.newPage();

  try {
    console.log('🌐 Opening PartnerStack...\n');
    await page.goto('https://www.partnerstack.com/partners', { waitUntil: 'domcontentloaded' });
    await wait(2000);

    await injectVisualGuide(page);

    console.log('👆 Browser opened! Watch for green arrows!\n');
    console.log('🎮 The system will:\n');
    console.log('   1. Show green arrow pointing to Sign Up button');
    console.log('   2. WAIT 10 seconds for YOU to click it');
    console.log('   3. Show arrows for each form field');
    console.log('   4. Copy values to clipboard for you to paste');
    console.log('   5. Award points for each action!\n');

    // Step 1: Find Sign Up button
    console.log('\n▶️  QUEST 1: Find Sign Up button\n');
    await showArrow(page, 'a[href*="signup"]', 'CLICK HERE: Sign Up');
    await updateStats(page, gameState.totalPoints, gameState.level);
    console.log('   ⏳ Waiting 10 seconds for you to click...\n');
    await wait(10000);
    addPoints(20, 'Sign Up clicked!');

    await wait(2000);

    // Step 2: Fill first name
    console.log('\n▶️  QUEST 2: Fill First Name\n');
    await showArrow(page, 'input[name*="first"]', 'FILL: First Name');
    await clipboardy.write(userData.firstName);
    console.log(`   📋 "${userData.firstName}" copied to clipboard!`);
    console.log('   👉 Click field and press Ctrl+V\n');
    await updateStats(page, gameState.totalPoints, gameState.level);
    await wait(10000);
    gameState.fieldsCompleted++;
    if (gameState.fieldsCompleted === 1) unlockAchievement('first_field');
    addPoints(10, 'First Name filled!');

    // Step 3: Fill last name
    console.log('\n▶️  QUEST 3: Fill Last Name\n');
    await showArrow(page, 'input[name*="last"]', 'FILL: Last Name');
    if (userData.lastName) {
      await clipboardy.write(userData.lastName);
      console.log(`   📋 "${userData.lastName}" copied to clipboard!\n`);
    }
    await updateStats(page, gameState.totalPoints, gameState.level);
    await wait(10000);
    addPoints(10, 'Last Name filled!');

    // Step 4: Fill email
    console.log('\n▶️  QUEST 4: Fill Email\n');
    await showArrow(page, 'input[type="email"]', 'FILL: Email');
    await clipboardy.write(userData.email);
    console.log(`   📋 "${userData.email}" copied to clipboard!\n`);
    await updateStats(page, gameState.totalPoints, gameState.level);
    await wait(10000);
    addPoints(10, 'Email filled!');

    // Step 5: Fill company
    console.log('\n▶️  QUEST 5: Fill Company\n');
    await showArrow(page, 'input[name*="company"]', 'FILL: Company');
    await clipboardy.write(userData.company);
    console.log(`   📋 "${userData.company}" copied to clipboard!\n`);
    await updateStats(page, gameState.totalPoints, gameState.level);
    await wait(10000);
    addPoints(10, 'Company filled!');

    // Step 6: Password
    console.log('\n▶️  QUEST 6: Create Password\n');
    console.log('   🔐 Create a strong password (not auto-filled for security)\n');
    await wait(15000);
    addPoints(15, 'Password created!');

    // Step 7: ToS
    console.log('\n▶️  QUEST 7: Accept Terms of Service\n');
    console.log('   ✅ Read and accept ToS\n');
    await wait(10000);
    addPoints(15, 'ToS accepted!');

    // Step 8: Submit
    console.log('\n▶️  QUEST 8: Submit Form\n');
    await showArrow(page, 'button[type="submit"]', 'CLICK HERE: Submit');
    await updateStats(page, gameState.totalPoints, gameState.level);
    console.log('   ⏳ Waiting for you to click Submit...\n');
    await wait(15000);
    addPoints(100, 'Signup completed!');
    unlockAchievement('form_crusher');

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║              🎮 GAME COMPLETE! 🎮                 ║');
    console.log('╠════════════════════════════════════════════════════╣');
    console.log(`║  Final Level: ${gameState.level}                                    ║`);
    console.log(`║  Total Points: ${gameState.totalPoints}                                 ║`);
    console.log(`║  Achievements: ${gameState.achievements.length}/3                                ║`);
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log('Press Ctrl+C to close browser\n');
    await wait(60000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

autoSignup().catch(console.error);
