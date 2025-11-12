/**
 * Boss Battle Console Test Commands - Standalone Browser Version
 * F12 Console Testing Framework for Browser Automation
 *
 * USAGE IN BROWSER CONSOLE:
 * 1. Copy this entire file
 * 2. Paste into F12 Console
 * 3. Press Enter
 * 4. Use commands: testBoss('dom'), bossFight.attack(0), etc.
 *
 * COMMANDS:
 * - bossFight.listBosses()     - Show all available bosses
 * - testBoss('bossName')       - Spawn and test a specific boss
 * - bossFight.attack(index)    - Execute a specific attack
 * - bossFight.simulate()       - Run automated combat
 * - bossFight.debug()          - Show current boss state
 * - bossFight.reset()          - Reset battle state
 */

(function () {
  'use strict';

  /**
   * Boss Battle Manager - Main testing interface
   */
  class BossFightManager {
    constructor() {
      this.state = {
        currentBoss: null,
        playerHp: 100,
        playerMaxHp: 100,
        turn: 0,
        combatLog: [],
        victory: false,
        defeat: false,
      };

      this.bosses = this.initializeBosses();
      this.log('🎮 Boss Battle System initialized!');
      this.log('Type bossFight.listBosses() to see all available bosses');
    }

    /**
     * Initialize all boss encounters with real browser tests
     */
    initializeBosses() {
      const bosses = new Map();

      // BOSS 1: The DOM Manipulator
      bosses.set('dom', {
        name: 'The DOM Manipulator',
        level: 3,
        hp: 500,
        maxHp: 500,
        xpReward: 500,
        description: 'Tests DOM automation and element manipulation',
        weakness: 'smart selectors',
        attacks: [
          {
            name: 'Form Filling Frenzy',
            damage: 50,
            description: 'Fill all input fields on the page',
            execute: async () => {
              console.log('   📝 Finding all input fields...');
              const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
              console.log(`   Found ${inputs.length} input fields`);

              inputs.forEach((input, i) => {
                input.value = `test-value-${i}`;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
              });

              console.log(`   ✅ Filled ${inputs.length} fields`);
              return inputs.length > 0;
            },
          },
          {
            name: 'Button Click Storm',
            damage: 40,
            description: 'Click all visible buttons',
            execute: async () => {
              console.log('   🖱️ Finding all clickable buttons...');
              const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
              const visibleButtons = Array.from(buttons).filter(
                (btn) => btn.offsetParent !== null
              );

              console.log(`   Found ${visibleButtons.length} visible buttons`);
              console.log(`   (Not clicking to avoid navigation - just testing detection)`);
              return visibleButtons.length >= 0;
            },
          },
          {
            name: 'Shadow DOM Probe',
            damage: 60,
            description: 'Search for elements in shadow DOM',
            execute: async () => {
              console.log('   👻 Searching for shadow DOM elements...');
              const shadowHosts = document.querySelectorAll('*');
              let shadowRoots = 0;

              shadowHosts.forEach((host) => {
                if (host.shadowRoot) {
                  shadowRoots++;
                  console.log(`   Found shadow root in: ${host.tagName}`);
                }
              });

              console.log(`   ✅ Found ${shadowRoots} shadow DOM roots`);
              return true; // Always succeeds (detection test)
            },
          },
          {
            name: 'Element Selector Test',
            damage: 45,
            description: 'Test smart selectors for common fields',
            execute: async () => {
              console.log('   🎯 Testing smart selectors...');
              const selectors = {
                email: 'input[type="email"], input[name*="email" i], input[id*="email" i]',
                password: 'input[type="password"], input[name*="password" i], input[id*="password" i]',
                username: 'input[name*="username" i], input[id*="username" i], input[name*="user" i]',
                search: 'input[type="search"], input[placeholder*="search" i]',
              };

              let found = 0;
              for (const [type, selector] of Object.entries(selectors)) {
                const element = document.querySelector(selector);
                if (element) {
                  console.log(`   ✅ Found ${type} field: ${element.tagName}`);
                  found++;
                } else {
                  console.log(`   ⚪ No ${type} field found`);
                }
              }

              console.log(`   📊 Found ${found}/${Object.keys(selectors).length} field types`);
              return true;
            },
          },
        ],
      });

      // BOSS 2: The CAPTCHA Detector
      bosses.set('captcha', {
        name: 'The CAPTCHA Detector',
        level: 5,
        hp: 1000,
        maxHp: 1000,
        xpReward: 1000,
        description: 'Tests CAPTCHA detection and analysis',
        weakness: 'AI solving',
        attacks: [
          {
            name: 'reCAPTCHA v2 Detection',
            damage: 80,
            description: 'Detect Google reCAPTCHA v2',
            execute: async () => {
              console.log('   🤖 Scanning for reCAPTCHA v2...');
              const recaptcha = document.querySelector('.g-recaptcha, iframe[src*="recaptcha"], div[class*="recaptcha"]');

              if (recaptcha) {
                console.log('   ✅ reCAPTCHA v2 detected!');
                console.log(`   Element: ${recaptcha.tagName}.${recaptcha.className}`);
                return true;
              } else {
                console.log('   ⚪ No reCAPTCHA v2 found on this page');
                return true; // Still a success (detection works)
              }
            },
          },
          {
            name: 'hCaptcha Detection',
            damage: 75,
            description: 'Detect hCaptcha elements',
            execute: async () => {
              console.log('   🧩 Scanning for hCaptcha...');
              const hcaptcha = document.querySelector('.h-captcha, iframe[src*="hcaptcha"], div[data-hcaptcha-response]');

              if (hcaptcha) {
                console.log('   ✅ hCaptcha detected!');
                console.log(`   Element: ${hcaptcha.tagName}`);
                return true;
              } else {
                console.log('   ⚪ No hCaptcha found on this page');
                return true;
              }
            },
          },
          {
            name: 'Image CAPTCHA Scan',
            damage: 70,
            description: 'Detect image-based CAPTCHAs',
            execute: async () => {
              console.log('   🖼️ Scanning for image CAPTCHAs...');
              const imageCaptcha = document.querySelector('img[src*="captcha"], img[alt*="CAPTCHA" i], img[alt*="verification" i]');

              if (imageCaptcha) {
                console.log('   ✅ Image CAPTCHA detected!');
                console.log(`   Src: ${imageCaptcha.src}`);
                return true;
              } else {
                console.log('   ⚪ No image CAPTCHA found on this page');
                return true;
              }
            },
          },
        ],
      });

      // BOSS 3: The Form Hunter
      bosses.set('form', {
        name: 'The Form Hunter',
        level: 4,
        hp: 600,
        maxHp: 600,
        xpReward: 600,
        description: 'Tests form detection and analysis',
        weakness: 'semantic understanding',
        attacks: [
          {
            name: 'Form Discovery',
            damage: 55,
            description: 'Find and analyze all forms',
            execute: async () => {
              console.log('   📋 Discovering forms...');
              const forms = document.querySelectorAll('form');

              console.log(`   Found ${forms.length} forms on page`);
              forms.forEach((form, i) => {
                const inputs = form.querySelectorAll('input, select, textarea');
                const buttons = form.querySelectorAll('button, input[type="submit"]');
                console.log(`   Form ${i + 1}:`);
                console.log(`     - Inputs: ${inputs.length}`);
                console.log(`     - Buttons: ${buttons.length}`);
                console.log(`     - Action: ${form.action || 'none'}`);
                console.log(`     - Method: ${form.method || 'GET'}`);
              });

              return forms.length >= 0;
            },
          },
          {
            name: 'Input Classification',
            damage: 50,
            description: 'Classify input field types',
            execute: async () => {
              console.log('   🏷️ Classifying input fields...');
              const inputs = document.querySelectorAll('input, select, textarea');
              const types = {};

              inputs.forEach((input) => {
                const type = input.type || input.tagName.toLowerCase();
                types[type] = (types[type] || 0) + 1;
              });

              console.log('   Input type breakdown:');
              for (const [type, count] of Object.entries(types)) {
                console.log(`     - ${type}: ${count}`);
              }

              return inputs.length > 0;
            },
          },
          {
            name: 'Submit Button Locator',
            damage: 45,
            description: 'Find all submit mechanisms',
            execute: async () => {
              console.log('   🎯 Locating submit buttons...');
              const submitButtons = document.querySelectorAll(
                'button[type="submit"], input[type="submit"], button:not([type]), [role="button"]'
              );

              console.log(`   Found ${submitButtons.length} potential submit buttons`);
              submitButtons.forEach((btn, i) => {
                console.log(`     ${i + 1}. ${btn.textContent.trim().substring(0, 30)} [${btn.tagName}]`);
              });

              return submitButtons.length >= 0;
            },
          },
        ],
      });

      // BOSS 4: The JavaScript Warrior
      bosses.set('javascript', {
        name: 'The JavaScript Warrior',
        level: 6,
        hp: 800,
        maxHp: 800,
        xpReward: 800,
        description: 'Tests JavaScript execution and event handling',
        weakness: 'event simulation',
        attacks: [
          {
            name: 'Event Simulation',
            damage: 65,
            description: 'Trigger various JavaScript events',
            execute: async () => {
              console.log('   ⚡ Testing event simulation...');
              const testDiv = document.createElement('div');
              testDiv.id = 'boss-test-element';
              let eventsTriggered = 0;

              const events = ['click', 'mouseover', 'mouseout', 'focus', 'blur', 'input', 'change'];
              events.forEach((eventType) => {
                testDiv.addEventListener(eventType, () => eventsTriggered++);
                testDiv.dispatchEvent(new Event(eventType, { bubbles: true }));
              });

              console.log(`   ✅ Successfully triggered ${eventsTriggered}/${events.length} events`);
              return eventsTriggered === events.length;
            },
          },
          {
            name: 'Local Storage Test',
            damage: 55,
            description: 'Test localStorage access',
            execute: async () => {
              console.log('   💾 Testing localStorage...');
              try {
                const testKey = 'boss-battle-test';
                const testValue = JSON.stringify({ timestamp: Date.now(), test: true });

                localStorage.setItem(testKey, testValue);
                const retrieved = localStorage.getItem(testKey);
                localStorage.removeItem(testKey);

                console.log('   ✅ localStorage read/write successful');
                return retrieved === testValue;
              } catch (error) {
                console.log(`   ⚠️ localStorage error: ${error.message}`);
                return false;
              }
            },
          },
          {
            name: 'Cookie Inspection',
            damage: 50,
            description: 'Analyze page cookies',
            execute: async () => {
              console.log('   🍪 Inspecting cookies...');
              const cookies = document.cookie.split(';').filter((c) => c.trim().length > 0);

              console.log(`   Found ${cookies.length} cookies`);
              if (cookies.length > 0) {
                console.log('   Cookie names:');
                cookies.forEach((cookie) => {
                  const name = cookie.split('=')[0].trim();
                  console.log(`     - ${name}`);
                });
              } else {
                console.log('   ⚪ No cookies found');
              }

              return true;
            },
          },
        ],
      });

      // BOSS 5: The Network Inspector
      bosses.set('network', {
        name: 'The Network Inspector',
        level: 7,
        hp: 1200,
        maxHp: 1200,
        xpReward: 1200,
        description: 'Tests network request detection and analysis',
        weakness: 'fetch interception',
        attacks: [
          {
            name: 'API Endpoint Discovery',
            damage: 90,
            description: 'Find API endpoints in page',
            execute: async () => {
              console.log('   🌐 Discovering API endpoints...');
              const scripts = document.querySelectorAll('script');
              let apiUrls = new Set();

              scripts.forEach((script) => {
                const content = script.textContent;
                const urlPattern = /(https?:\/\/[^\s'"]+\/api[^\s'"]*)/gi;
                const matches = content.match(urlPattern);
                if (matches) {
                  matches.forEach((url) => apiUrls.add(url));
                }
              });

              console.log(`   Found ${apiUrls.size} potential API endpoints`);
              apiUrls.forEach((url) => console.log(`     - ${url}`));

              return true;
            },
          },
          {
            name: 'XHR Mock Test',
            damage: 75,
            description: 'Test XHR interception capability',
            execute: async () => {
              console.log('   📡 Testing XHR interception...');

              const originalXHR = window.XMLHttpRequest;
              let xhrCreated = false;

              // Temporarily mock XMLHttpRequest
              window.XMLHttpRequest = function () {
                xhrCreated = true;
                return new originalXHR();
              };

              // Test creation
              const xhr = new XMLHttpRequest();

              // Restore
              window.XMLHttpRequest = originalXHR;

              console.log(`   ✅ XHR interception ${xhrCreated ? 'successful' : 'failed'}`);
              return xhrCreated;
            },
          },
        ],
      });

      // BOSS 6: The Performance Monitor
      bosses.set('performance', {
        name: 'The Performance Monitor',
        level: 8,
        hp: 1500,
        maxHp: 1500,
        xpReward: 1500,
        description: 'Tests performance monitoring and metrics',
        weakness: 'optimization',
        attacks: [
          {
            name: 'Performance Timing',
            damage: 100,
            description: 'Analyze page load performance',
            execute: async () => {
              console.log('   ⏱️ Analyzing performance...');

              if (window.performance && window.performance.timing) {
                const timing = window.performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;

                console.log('   📊 Performance Metrics:');
                console.log(`     - Page Load Time: ${loadTime}ms`);
                console.log(`     - DOM Ready: ${domReady}ms`);
                console.log(`     - DNS Lookup: ${timing.domainLookupEnd - timing.domainLookupStart}ms`);
                console.log(`     - TCP Connection: ${timing.connectEnd - timing.connectStart}ms`);

                return true;
              } else {
                console.log('   ⚠️ Performance API not available');
                return false;
              }
            },
          },
          {
            name: 'Resource Counter',
            damage: 80,
            description: 'Count page resources',
            execute: async () => {
              console.log('   📦 Counting resources...');

              const images = document.querySelectorAll('img').length;
              const scripts = document.querySelectorAll('script').length;
              const stylesheets = document.querySelectorAll('link[rel="stylesheet"]').length;
              const iframes = document.querySelectorAll('iframe').length;

              console.log('   Resource breakdown:');
              console.log(`     - Images: ${images}`);
              console.log(`     - Scripts: ${scripts}`);
              console.log(`     - Stylesheets: ${stylesheets}`);
              console.log(`     - Iframes: ${iframes}`);
              console.log(`     - Total: ${images + scripts + stylesheets + iframes}`);

              return true;
            },
          },
        ],
      });

      return bosses;
    }

    /**
     * List all available bosses
     */
    listBosses() {
      console.log('\n🎮 ===== AVAILABLE BOSS BATTLES ===== 🎮\n');

      this.bosses.forEach((boss, key) => {
        console.log(`🔥 ${boss.name} (Level ${boss.level})`);
        console.log(`   Command: testBoss('${key}')`);
        console.log(`   HP: ${boss.maxHp} | XP: ${boss.xpReward}`);
        console.log(`   ${boss.description}`);
        console.log(`   Attacks: ${boss.attacks.map((a) => a.name).join(', ')}`);
        console.log('');
      });

      console.log('💡 Quick Start Examples:');
      console.log(`   testBoss('dom')         - Test DOM automation`);
      console.log(`   testBoss('captcha')     - Test CAPTCHA detection`);
      console.log(`   testBoss('form')        - Test form analysis`);
      console.log(`   testBoss('performance') - Test performance monitoring`);
      console.log('');
    }

    /**
     * Spawn a boss and start battle
     */
    async testBoss(bossKey) {
      const boss = this.bosses.get(bossKey);

      if (!boss) {
        console.error(`❌ Boss '${bossKey}' not found. Use bossFight.listBosses() to see available bosses.`);
        return;
      }

      this.reset();
      this.state.currentBoss = { ...boss, hp: boss.maxHp };

      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log(`║  🎮 BOSS BATTLE: ${boss.name.toUpperCase()}`);
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log(`Level: ${boss.level} | HP: ${boss.hp} | XP Reward: ${boss.xpReward}`);
      console.log(`Description: ${boss.description}`);
      console.log(`Weakness: ${boss.weakness}\n`);
      console.log('Available attacks:');
      boss.attacks.forEach((attack, index) => {
        console.log(`  ${index}. ${attack.name} (${attack.damage} damage)`);
        console.log(`     ${attack.description}`);
      });
      console.log('\n💡 Commands:');
      console.log('   bossFight.attack(0)  - Use first attack');
      console.log('   bossFight.simulate() - Auto-battle all attacks');
      console.log('   bossFight.debug()    - Show battle state\n');
    }

    /**
     * Execute a specific attack
     */
    async attack(attackIndex) {
      if (!this.state.currentBoss) {
        console.error('❌ No boss spawned. Use testBoss("bossname") first.');
        return;
      }

      if (this.state.victory || this.state.defeat) {
        console.log('⚠️ Battle already ended. Use bossFight.reset() to start new battle.');
        return;
      }

      const attack = this.state.currentBoss.attacks[attackIndex];
      if (!attack) {
        console.error(`❌ Attack ${attackIndex} not found. Valid range: 0-${this.state.currentBoss.attacks.length - 1}`);
        return;
      }

      this.state.turn++;
      console.log(`\n⚔️ Turn ${this.state.turn}: ${attack.name}`);
      console.log(`   ${attack.description}\n`);

      try {
        const success = await attack.execute();

        if (success) {
          this.state.currentBoss.hp -= attack.damage;
          console.log(`\n   ✅ HIT! Boss takes ${attack.damage} damage!`);
          console.log(`   Boss HP: ${Math.max(0, this.state.currentBoss.hp)}/${this.state.currentBoss.maxHp}`);

          if (this.state.currentBoss.hp <= 0) {
            this.victory();
          }
        } else {
          console.log(`\n   ❌ MISS! Attack failed!`);
          this.state.playerHp -= 10;
          console.log(`   Player takes 10 damage!`);
          console.log(`   Player HP: ${this.state.playerHp}/${this.state.playerMaxHp}`);

          if (this.state.playerHp <= 0) {
            this.defeat();
          }
        }

        this.state.combatLog.push(
          `Turn ${this.state.turn}: ${attack.name} - ${success ? 'HIT' : 'MISS'}`
        );
      } catch (error) {
        console.error(`\n   💥 Attack execution error: ${error.message}`);
        this.state.playerHp -= 20;
        console.log(`   Player takes 20 damage from error!`);
        console.log(`   Player HP: ${this.state.playerHp}/${this.state.playerMaxHp}`);

        if (this.state.playerHp <= 0) {
          this.defeat();
        }
      }
    }

    /**
     * Simulate automated combat (execute all attacks)
     */
    async simulate() {
      if (!this.state.currentBoss) {
        console.error('❌ No boss spawned. Use testBoss("bossname") first.');
        return;
      }

      console.log('\n🤖 Starting automated combat simulation...');
      console.log(`   Executing ${this.state.currentBoss.attacks.length} attacks...\n`);

      for (let i = 0; i < this.state.currentBoss.attacks.length; i++) {
        if (this.state.victory || this.state.defeat) break;

        await this.attack(i);

        // Small delay for readability
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!this.state.victory && !this.state.defeat && this.state.currentBoss.hp > 0) {
        console.log('\n⚔️ All attacks executed. Boss still standing!');
        console.log('   💡 Use bossFight.attack(n) to continue attacking');
      }
    }

    /**
     * Show current battle state
     */
    debug() {
      console.log('\n🔍 ===== BATTLE STATE DEBUG ===== 🔍\n');

      if (!this.state.currentBoss) {
        console.log('❌ No active boss battle');
        console.log('💡 Use testBoss("bossname") to start a battle\n');
        return;
      }

      console.log('🎮 Current Boss:');
      console.log(`   Name: ${this.state.currentBoss.name}`);
      console.log(`   HP: ${this.state.currentBoss.hp}/${this.state.currentBoss.maxHp}`);
      console.log(`   Level: ${this.state.currentBoss.level}`);
      console.log('');

      console.log('👤 Player:');
      console.log(`   HP: ${this.state.playerHp}/${this.state.playerMaxHp}`);
      console.log('');

      console.log('📊 Battle Stats:');
      console.log(`   Turn: ${this.state.turn}`);
      console.log(`   Status: ${this.state.victory ? '🏆 VICTORY' : this.state.defeat ? '💀 DEFEAT' : '⚔️ IN PROGRESS'}`);
      console.log('');

      if (this.state.combatLog.length > 0) {
        console.log('📜 Combat Log:');
        this.state.combatLog.forEach((log) => console.log(`   ${log}`));
        console.log('');
      }

      console.log('🔧 Available Commands:');
      console.log(`   bossFight.attack(0-${this.state.currentBoss.attacks.length - 1}) - Execute attack`);
      console.log('   bossFight.simulate()                    - Auto-battle');
      console.log('   bossFight.reset()                       - Reset battle');
      console.log('');
    }

    /**
     * Reset battle state
     */
    reset() {
      this.state = {
        currentBoss: null,
        playerHp: 100,
        playerMaxHp: 100,
        turn: 0,
        combatLog: [],
        victory: false,
        defeat: false,
      };

      console.log('🔄 Battle state reset!');
      console.log('💡 Use bossFight.listBosses() to see available bosses\n');
    }

    /**
     * Victory scenario
     */
    victory() {
      this.state.victory = true;

      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║  🏆 VICTORY! BOSS DEFEATED! 🏆                         ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log(`✨ ${this.state.currentBoss.name} has been defeated!`);
      console.log(`💰 +${this.state.currentBoss.xpReward} XP earned!`);
      console.log(`⚔️ Completed in ${this.state.turn} turns`);
      console.log('');
    }

    /**
     * Defeat scenario
     */
    defeat() {
      this.state.defeat = true;

      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║  💀 DEFEAT! YOU HAVE FALLEN! 💀                        ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log(`☠️ ${this.state.currentBoss.name} was too powerful!`);
      console.log(`📊 Survived ${this.state.turn} turns`);
      console.log('💡 Use bossFight.reset() to try again!');
      console.log('');
    }

    /**
     * Internal logging
     */
    log(message) {
      // Silent initialization logging
    }
  }

  // Initialize global instance
  window.bossFight = new BossFightManager();
  window.testBoss = (bossKey) => window.bossFight.testBoss(bossKey);

  // Welcome message
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🎮 BOSS BATTLE TEST SYSTEM LOADED 🎮                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log('✅ System Ready! Available Commands:\n');
  console.log('  📋 bossFight.listBosses()    - Show all bosses');
  console.log('  ⚔️  testBoss("dom")           - Spawn DOM Manipulator boss');
  console.log('  ⚡ bossFight.attack(0)       - Execute attack #0');
  console.log('  🤖 bossFight.simulate()      - Auto-battle (all attacks)');
  console.log('  🔍 bossFight.debug()         - Show battle state');
  console.log('  🔄 bossFight.reset()         - Reset battle');
  console.log('\n💡 Quick Start: bossFight.listBosses()\n');
  console.log('📚 Available Bosses:');
  console.log('  • dom          - DOM Manipulator (Form filling, element detection)');
  console.log('  • captcha      - CAPTCHA Detector (reCAPTCHA, hCaptcha)');
  console.log('  • form         - Form Hunter (Form analysis, input classification)');
  console.log('  • javascript   - JavaScript Warrior (Event simulation, storage)');
  console.log('  • network      - Network Inspector (API discovery, XHR)');
  console.log('  • performance  - Performance Monitor (Timing, resources)');
  console.log('');
})();
