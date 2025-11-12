#!/usr/bin/env node

/**
 * HOLDING HANDS GAMIFIED: Visual Guided Signup with Points & Achievements
 *
 * Features:
 * - 🎯 Visual arrows pointing to buttons
 * - 📋 Auto-clipboard copy for easy pasting
 * - 🏆 Points for every action (10 pts per field, 50 for submit!)
 * - 🎮 Achievements & level progression
 * - 🎵 Sound effects (text-based)
 * - 💎 Combo multipliers for speed
 * - 👑 Leaderboard tracking
 */

import { chromium } from 'playwright';
import readline from 'readline';
import clipboardy from 'clipboardy';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// GAMIFICATION STATE
const gameState = {
  totalPoints: 0,
  level: 1,
  comboMultiplier: 1,
  lastActionTime: Date.now(),
  achievements: [],
  fieldsCompleted: 0,
  signupsCompleted: 0,
  perfectStreak: 0
};

// ACHIEVEMENTS
const ACHIEVEMENTS = {
  first_field: { name: '🌟 First Steps', desc: 'Fill your first field', points: 25 },
  speed_demon: { name: '⚡ Speed Demon', desc: 'Complete field in under 5 seconds', points: 50 },
  combo_master: { name: '🔥 Combo Master', desc: 'Reach 3x combo multiplier', points: 100 },
  form_crusher: { name: '💪 Form Crusher', desc: 'Complete entire signup form', points: 200 },
  multi_network: { name: '🌐 Multi-Network Pro', desc: 'Sign up for 2 networks', points: 500 },
  affiliate_king: { name: '👑 Affiliate King', desc: 'Sign up for all 4 networks', points: 1000 }
};

function playSound(sound) {
  const sounds = {
    levelup: '🎺 *LEVEL UP!* 📈',
    achievement: '🎉 *ACHIEVEMENT UNLOCKED!* 🏆',
    combo: '🔥 *COMBO!* 💥',
    point: '✨ +points ✨',
    complete: '🎊 *COMPLETE!* 🎊'
  };
  console.log(`\n   ${sounds[sound] || sounds.point}\n`);
}

function addPoints(points, reason) {
  // Combo multiplier
  const timeSinceLastAction = Date.now() - gameState.lastActionTime;
  if (timeSinceLastAction < 8000) { // Under 8 seconds = combo!
    gameState.comboMultiplier = Math.min(gameState.comboMultiplier + 0.5, 5);
    if (gameState.comboMultiplier >= 3 && !gameState.achievements.includes('combo_master')) {
      unlockAchievement('combo_master');
    }
  } else {
    gameState.comboMultiplier = 1;
  }

  const finalPoints = Math.floor(points * gameState.comboMultiplier);
  gameState.totalPoints += finalPoints;
  gameState.lastActionTime = Date.now();

  console.log('╔═══════════════════════════════════════╗');
  console.log(`║  ✨ +${finalPoints} POINTS! ${reason.padEnd(21)}║`);
  if (gameState.comboMultiplier > 1) {
    console.log(`║  🔥 ${gameState.comboMultiplier}x COMBO MULTIPLIER! ${' '.repeat(17)}║`);
    playSound('combo');
  }
  console.log(`║  📊 Total: ${gameState.totalPoints} points ${' '.repeat(18)}║`);
  console.log('╚═══════════════════════════════════════╝\n');

  checkLevelUp();
}

function checkLevelUp() {
  const newLevel = Math.floor(gameState.totalPoints / 100) + 1;
  if (newLevel > gameState.level) {
    gameState.level = newLevel;
    playSound('levelup');
    console.log('╔════════════════════════════════════════════╗');
    console.log(`║         🎺 LEVEL ${gameState.level}! 🎺                  ║`);
    console.log('║   You\'re becoming an Affiliate Master!   ║');
    console.log('╚════════════════════════════════════════════╝\n');
  }
}

function unlockAchievement(achievementKey) {
  if (gameState.achievements.includes(achievementKey)) return;

  const achievement = ACHIEVEMENTS[achievementKey];
  gameState.achievements.push(achievementKey);
  gameState.totalPoints += achievement.points;

  playSound('achievement');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║          🏆 ACHIEVEMENT UNLOCKED! 🏆              ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║  ${achievement.name.padEnd(47)}║`);
  console.log(`║  ${achievement.desc.padEnd(47)}║`);
  console.log(`║  +${achievement.points} BONUS POINTS! ${' '.repeat(31)}║`);
  console.log('╚════════════════════════════════════════════════════╝\n');

  checkLevelUp();
}

async function saveProgress() {
  const saveData = {
    ...gameState,
    timestamp: new Date().toISOString(),
    savedAt: new Date().toLocaleString()
  };

  fs.writeFileSync('affiliate-game-progress.json', JSON.stringify(saveData, null, 2));
  console.log('💾 Progress saved!\n');
}

// Inject visual guidance + gamification UI
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

      @keyframes confetti {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
      }

      .holding-hands-highlight {
        outline: 4px solid #00ff00 !important;
        outline-offset: 5px !important;
        animation: pulse 1.5s infinite !important;
        position: relative !important;
        z-index: 999999 !important;
        background-color: rgba(0, 255, 0, 0.15) !important;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.5) !important;
      }

      .holding-hands-arrow {
        position: absolute !important;
        font-size: 64px !important;
        z-index: 1000000 !important;
        animation: arrow-bounce 1s infinite !important;
        text-shadow: 3px 3px 6px rgba(0,0,0,0.8) !important;
        pointer-events: none !important;
        filter: drop-shadow(0 0 10px #00ff00) !important;
      }

      .holding-hands-message {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        padding: 25px 35px !important;
        border-radius: 20px !important;
        font-size: 20px !important;
        font-weight: bold !important;
        z-index: 1000001 !important;
        box-shadow: 0 15px 40px rgba(0,0,0,0.4) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        max-width: 450px !important;
        animation: pulse 2s infinite !important;
      }

      .game-stats {
        position: fixed !important;
        top: 20px !important;
        left: 20px !important;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
        color: white !important;
        padding: 20px !important;
        border-radius: 15px !important;
        font-size: 16px !important;
        font-weight: bold !important;
        z-index: 1000001 !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        min-width: 250px !important;
      }

      .game-stats-row {
        margin: 8px 0 !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
      }

      .holding-hands-checklist {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        background: white !important;
        color: #333 !important;
        padding: 20px !important;
        border-radius: 15px !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
        z-index: 1000001 !important;
        max-width: 350px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }

      .holding-hands-checklist h3 {
        margin: 0 0 15px 0 !important;
        font-size: 18px !important;
        color: #667eea !important;
        border-bottom: 2px solid #667eea !important;
        padding-bottom: 10px !important;
      }

      .holding-hands-checklist-item {
        padding: 10px 0 !important;
        border-bottom: 1px solid #eee !important;
        font-size: 15px !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
      }

      .holding-hands-checklist-item.done {
        opacity: 0.5 !important;
      }

      .holding-hands-checklist-item.active {
        font-weight: bold !important;
        color: #667eea !important;
        background: linear-gradient(90deg, #f0f0ff 0%, transparent 100%) !important;
        padding-left: 10px !important;
        border-left: 4px solid #667eea !important;
      }

      .confetti {
        position: fixed !important;
        font-size: 30px !important;
        animation: confetti 2s ease-out forwards !important;
        z-index: 1000002 !important;
        pointer-events: none !important;
      }
    `
  });
}

async function showArrow(page, selector, message) {
  await page.evaluate(({ selector, message }) => {
    document.querySelectorAll('.holding-hands-arrow, .holding-hands-highlight, .holding-hands-message').forEach(el => el.remove());

    const target = document.querySelector(selector);
    if (!target) return;

    target.classList.add('holding-hands-highlight');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const arrow = document.createElement('div');
    arrow.className = 'holding-hands-arrow';
    arrow.textContent = '👇';

    const rect = target.getBoundingClientRect();
    arrow.style.position = 'fixed';
    arrow.style.left = (rect.left + rect.width / 2 - 32) + 'px';
    arrow.style.top = (rect.top - 80) + 'px';

    document.body.appendChild(arrow);

    const msg = document.createElement('div');
    msg.className = 'holding-hands-message';
    msg.innerHTML = `🎯 ${message}`;
    document.body.appendChild(msg);

  }, { selector, message });
}

async function updateGameUI(page) {
  await page.evaluate((state) => {
    let statsEl = document.querySelector('.game-stats');
    if (!statsEl) {
      statsEl = document.createElement('div');
      statsEl.className = 'game-stats';
      document.body.appendChild(statsEl);
    }

    const comboText = state.comboMultiplier > 1 ? `🔥 ${state.comboMultiplier}x` : '';

    statsEl.innerHTML = `
      <div style="font-size: 20px; margin-bottom: 10px; text-align: center;">🎮 GAME STATS</div>
      <div class="game-stats-row">
        <span>⭐ Level:</span>
        <span>${state.level}</span>
      </div>
      <div class="game-stats-row">
        <span>💎 Points:</span>
        <span>${state.totalPoints}</span>
      </div>
      <div class="game-stats-row">
        <span>🏆 Achievements:</span>
        <span>${state.achievements.length}/${Object.keys(state.allAchievements).length}</span>
      </div>
      <div class="game-stats-row">
        <span>✅ Fields:</span>
        <span>${state.fieldsCompleted}</span>
      </div>
      ${comboText ? `<div style="text-align: center; margin-top: 10px; font-size: 24px;">${comboText}</div>` : ''}
    `;
  }, {
    ...gameState,
    allAchievements: ACHIEVEMENTS
  });
}

async function showConfetti(page) {
  await page.evaluate(() => {
    const emojis = ['🎉', '🎊', '⭐', '💎', '🏆', '✨', '🌟'];
    for (let i = 0; i < 20; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      confetti.style.left = Math.random() * window.innerWidth + 'px';
      confetti.style.top = window.innerHeight + 'px';
      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 2000);
    }
  });
}

async function showChecklist(page, items, currentStep) {
  await page.evaluate(({ items, currentStep }) => {
    let checklist = document.querySelector('.holding-hands-checklist');
    if (!checklist) {
      checklist = document.createElement('div');
      checklist.className = 'holding-hands-checklist';
      document.body.appendChild(checklist);
    }

    let html = '<h3>📋 Quest Progress</h3>';
    items.forEach((item, i) => {
      const className = i < currentStep ? 'done' : i === currentStep ? 'active' : '';
      const icon = i < currentStep ? '✅' : i === currentStep ? '▶️' : '⬜';
      html += `<div class="holding-hands-checklist-item ${className}">
        <span style="font-size: 20px;">${icon}</span>
        <span>${item}</span>
      </div>`;
    });

    checklist.innerHTML = html;
  }, { items, currentStep });
}

async function holdingHandsGameMode(network, userData) {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log(`║     🎮 GAMIFIED SIGNUP: ${network.name.padEnd(25)}║`);
  console.log('╚════════════════════════════════════════════════════╝\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  try {
    console.log('🌐 Loading page...\n');
    await page.goto(network.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await injectHoldingHands(page);
    await updateGameUI(page);

    const steps = network.steps;
    const startTime = Date.now();

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStart = Date.now();

      console.log(`\n▶️  QUEST ${i + 1}/${steps.length}: ${step.action}\n`);

      await showChecklist(page, steps.map(s => s.action), i);

      if (step.type === 'click') {
        await showArrow(page, step.selector, `CLICK: ${step.label}`);
        console.log(`   👆 Look for the GREEN ARROW on your screen!`);
        console.log(`   💚 Click the highlighted "${step.label}" button\n`);

        await ask(`   ✋ Press Enter after clicking: `);

        const stepTime = Date.now() - stepStart;
        if (stepTime < 5000) {
          unlockAchievement('speed_demon');
        }

        addPoints(20, 'Button clicked!');
        await showConfetti(page);
        await updateGameUI(page);

      } else if (step.type === 'fill') {
        await showArrow(page, step.selector, `FILL: ${step.label}`);

        const value = userData[step.field];
        if (value) {
          await clipboardy.write(value);
          console.log(`   📋 ✅ "${value}" copied to clipboard!`);
          console.log(`   👆 Field "${step.label}" is highlighted`);
          console.log(`   1️⃣  Click the green field`);
          console.log(`   2️⃣  Press Ctrl+V (Cmd+V on Mac)`);
          console.log(`   3️⃣  Press Enter when done\n`);
        }

        await ask(`   ✋ Press Enter after filling: `);

        gameState.fieldsCompleted++;
        if (gameState.fieldsCompleted === 1) {
          unlockAchievement('first_field');
        }

        addPoints(10, 'Field filled!');
        await updateGameUI(page);

      } else if (step.type === 'wait') {
        console.log(`   ⏳ ${step.message}`);
        console.log(`   (No auto-fill for security/compliance)\n`);
        await ask('   ✋ Press Enter when done: ');
        addPoints(15, 'Security step!');
        await updateGameUI(page);
      }

      await page.evaluate(() => {
        document.querySelectorAll('.holding-hands-arrow, .holding-hands-highlight, .holding-hands-message').forEach(el => el.remove());
      });
    }

    const totalTime = Math.floor((Date.now() - startTime) / 1000);

    playSound('complete');
    await showConfetti(page);

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║              🎊 SIGNUP COMPLETE! 🎊               ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    addPoints(100, 'SIGNUP COMPLETE!');
    gameState.signupsCompleted++;

    if (gameState.signupsCompleted === 1) {
      unlockAchievement('form_crusher');
    } else if (gameState.signupsCompleted === 2) {
      unlockAchievement('multi_network');
    } else if (gameState.signupsCompleted === 4) {
      unlockAchievement('affiliate_king');
    }

    console.log(`   ⏱️  Time: ${totalTime} seconds`);
    console.log(`   ⭐ Final Level: ${gameState.level}`);
    console.log(`   💎 Total Points: ${gameState.totalPoints}`);
    console.log(`   🏆 Achievements: ${gameState.achievements.length}/${Object.keys(ACHIEVEMENTS).length}\n`);

    await saveProgress();

    console.log('   📧 Check your email for verification!\n');

    await ask('Press Enter to continue: ');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

// MAIN
(async () => {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║        🎮 GAMIFIED AFFILIATE SIGNUP 🎮            ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log('║  Earn points, unlock achievements, level up!      ║');
  console.log('║  🏆 Complete quests to become an Affiliate King!  ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // Try to load from .env file first
  let userData = null;
  if (process.env.USER_FIRST_NAME && process.env.USER_EMAIL) {
    userData = {
      firstName: process.env.USER_FIRST_NAME,
      lastName: process.env.USER_LAST_NAME || '',
      email: process.env.USER_EMAIL,
      company: process.env.USER_COMPANY || '',
      website: process.env.USER_WEBSITE || '',
      phone: process.env.USER_PHONE || '',
    };
    console.log('✅ Loaded profile from .env file!\n');
    console.log(`   Name: ${userData.firstName} ${userData.lastName || '[not set]'}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Company: ${userData.company || '[not set]'}`);
    console.log('   ✅ Auto-using this profile...\n');
  }

  // Fall back to JSON file
  if (!userData) {
    try {
      const profileData = fs.readFileSync('./user-profile.json', 'utf8');
      userData = JSON.parse(profileData);
      console.log('✅ Loaded saved profile from user-profile.json!\n');
      console.log(`   Name: ${userData.firstName} ${userData.lastName}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Company: ${userData.company}\n`);

      const useProfile = await ask('Use this profile? (yes/no): ');
      if (useProfile.toLowerCase() !== 'yes') {
        userData = null;
      }
    } catch (e) {
      console.log('📋 No saved profile found. Let\'s collect your info:\n');
    }
  }

  // Manual input if nothing loaded
  if (!userData) {
    userData = {
      firstName: await ask('First Name: '),
      lastName: await ask('Last Name: '),
      email: await ask('Email: '),
      company: await ask('Company: '),
      website: await ask('Website URL: '),
      phone: await ask('Phone (optional): ') || '',
    };

    // Save for next time
    const save = await ask('\nSave this profile to .env file? (yes/no): ');
    if (save.toLowerCase() === 'yes') {
      const envContent = fs.readFileSync('./.env', 'utf8');
      const updatedEnv = envContent
        .replace(/USER_FIRST_NAME=.*/, `USER_FIRST_NAME=${userData.firstName}`)
        .replace(/USER_LAST_NAME=.*/, `USER_LAST_NAME=${userData.lastName}`)
        .replace(/USER_EMAIL=.*/, `USER_EMAIL=${userData.email}`)
        .replace(/USER_COMPANY=.*/, `USER_COMPANY=${userData.company}`)
        .replace(/USER_WEBSITE=.*/, `USER_WEBSITE=${userData.website}`)
        .replace(/USER_PHONE=.*/, `USER_PHONE=${userData.phone}`);
      fs.writeFileSync('./.env', updatedEnv);
      console.log('✅ Profile saved to .env file\n');
    }
  }

  console.log('\n✅ Data collected! Starting your affiliate journey...\n');
  console.log('🎮 GAME RULES:\n');
  console.log('   • +10 points per field filled');
  console.log('   • +20 points per button clicked');
  console.log('   • +100 points for completing signup');
  console.log('   • 🔥 Combo multiplier for speed (up to 5x!)');
  console.log('   • 🏆 Unlock achievements for bonus points');
  console.log('   • ⭐ Level up every 100 points\n');

  const network = {
    name: 'PartnerStack',
    url: 'https://www.partnerstack.com/partners',
    steps: [
      { type: 'click', selector: 'a[href*="signup"]', label: 'Sign Up', action: 'Find & Click Sign Up' },
      { type: 'fill', selector: 'input[name*="first"]', field: 'firstName', label: 'First Name', action: 'Fill First Name' },
      { type: 'fill', selector: 'input[name*="last"]', field: 'lastName', label: 'Last Name', action: 'Fill Last Name' },
      { type: 'fill', selector: 'input[type="email"]', field: 'email', label: 'Email', action: 'Fill Email' },
      { type: 'fill', selector: 'input[name*="company"]', field: 'company', label: 'Company', action: 'Fill Company' },
      { type: 'wait', message: 'Create a strong password', action: 'Create Password' },
      { type: 'wait', message: 'Accept Terms of Service', action: 'Accept ToS' },
      { type: 'click', selector: 'button[type="submit"]', label: 'Submit', action: 'Click Submit' },
    ]
  };

  await holdingHandsGameMode(network, userData);

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║              🎮 GAME SESSION COMPLETE 🎮          ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║  Final Level: ${String(gameState.level).padEnd(37)}║`);
  console.log(`║  Total Points: ${String(gameState.totalPoints).padEnd(36)}║`);
  console.log(`║  Achievements: ${gameState.achievements.length}/${Object.keys(ACHIEVEMENTS).length}${' '.repeat(32)}║`);
  console.log('╚════════════════════════════════════════════════════╝\n');

  console.log('🎯 Want to continue? Run this again for more networks!\n');
  console.log('   • ShareASale = +200 points');
  console.log('   • Impact.com = +200 points');
  console.log('   • CJ Affiliate = +200 points\n');

  console.log('🏆 Complete all 4 to unlock AFFILIATE KING achievement!\n');

  rl.close();
})();
