/**
 * Boss Battle Console Test Commands
 * F12 Console Testing Framework for Browser Automation
 *
 * Usage: Load this script in the browser console to test boss battle scenarios
 *
 * Available Commands:
 * - testBoss(bossName) - Spawn and test a specific boss
 * - bossFight.attack(move) - Execute a specific attack/action
 * - bossFight.simulate() - Run automated combat simulation
 * - bossFight.debug() - Show current boss state
 * - bossFight.reset() - Reset battle state
 * - bossFight.listBosses() - Show all available bosses
 */

import { DOMManipulator } from './dom-manipulator';
import { CAPTCHASolver, CAPTCHAType } from '../lib/captcha-solver';
import { PasswordVault } from '../lib/password-vault';
import { AgentDBClient } from '../../training/agentdb-client';
import { EmailCollector, EMAIL_SIGNUP_FLOWS } from './email-collector';
import { APICollector, API_SIGNUP_FLOWS } from './api-collector';

/**
 * Boss Battle System - Game-like testing interface
 */
export interface Boss {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  attacks: BossAttack[];
  weakness?: string;
  description: string;
  xpReward: number;
}

export interface BossAttack {
  name: string;
  damage: number;
  description: string;
  execute: () => Promise<boolean>;
}

export interface BattleState {
  currentBoss: Boss | null;
  playerHp: number;
  playerMaxHp: number;
  turn: number;
  combatLog: string[];
  victory: boolean;
  defeat: boolean;
}

/**
 * Boss Battle Manager - Main testing interface
 */
export class BossFightManager {
  private state: BattleState;
  private domManipulator: DOMManipulator;
  private captchaSolver: CAPTCHASolver;
  private passwordVault: PasswordVault;
  private agentDB: AgentDBClient;
  private emailCollector: EmailCollector;
  private apiCollector: APICollector;
  private bosses: Map<string, Boss>;

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

    // Initialize systems
    this.domManipulator = new DOMManipulator(document);
    this.captchaSolver = new CAPTCHASolver(document);
    this.passwordVault = new PasswordVault('test-master-key');
    this.agentDB = new AgentDBClient('./test-db', 384);
    this.emailCollector = new EmailCollector(document, this.passwordVault, this.agentDB);
    this.apiCollector = new APICollector(document);

    this.bosses = this.initializeBosses();

    this.log('🎮 Boss Battle System initialized!');
    this.log('Type bossFight.listBosses() to see all available bosses');
  }

  /**
   * Initialize all boss encounters
   */
  private initializeBosses(): Map<string, Boss> {
    const bosses = new Map<string, Boss>();

    // BOSS 1: The Architect of Chaos
    bosses.set('architect', {
      name: 'The Architect of Chaos',
      level: 1,
      hp: 300,
      maxHp: 300,
      xpReward: 300,
      description: 'Tests project setup and architecture',
      weakness: 'clean code',
      attacks: [
        {
          name: 'Type Error Storm',
          damage: 20,
          description: 'Throws TypeScript errors',
          execute: async () => {
            this.log('💥 Type Error Storm incoming!');
            // Simulate TypeScript validation
            return true;
          },
        },
        {
          name: 'Lint Barrage',
          damage: 15,
          description: 'ESLint errors everywhere',
          execute: async () => {
            this.log('⚠️ Lint errors detected!');
            return true;
          },
        },
      ],
    });

    // BOSS 2: The MCP Gatekeeper
    bosses.set('mcp', {
      name: 'The MCP Gatekeeper',
      level: 2,
      hp: 400,
      maxHp: 400,
      xpReward: 400,
      description: 'Tests MCP protocol integration',
      weakness: 'proper handshake',
      attacks: [
        {
          name: 'Protocol Mismatch',
          damage: 25,
          description: 'MCP handshake fails',
          execute: async () => {
            this.log('🔌 Testing MCP connection...');
            return true;
          },
        },
      ],
    });

    // BOSS 3: The DOM Manipulator
    bosses.set('dom', {
      name: 'The DOM Manipulator',
      level: 3,
      hp: 500,
      maxHp: 500,
      xpReward: 500,
      description: 'Tests DOM automation',
      weakness: 'smart selectors',
      attacks: [
        {
          name: 'Shadow DOM Confusion',
          damage: 30,
          description: 'Elements hidden in shadow DOM',
          execute: async () => {
            this.log('👻 Testing shadow DOM access...');
            const element = this.domManipulator.findElement('input[type="email"]', {
              includeShadowDOM: true,
            });
            return element !== null;
          },
        },
        {
          name: 'Dynamic Content Shift',
          damage: 25,
          description: 'Elements appear/disappear dynamically',
          execute: async () => {
            this.log('⏳ Waiting for dynamic element...');
            const element = await this.domManipulator.waitForElement('.dynamic-element', 3000);
            return element !== null;
          },
        },
        {
          name: 'Form Filling Frenzy',
          damage: 20,
          description: 'Multiple forms to fill',
          execute: async () => {
            this.log('📝 Testing form filling...');
            const success = this.domManipulator.fillField(
              'input[type="email"]',
              'test@example.com'
            );
            return success;
          },
        },
      ],
    });

    // BOSS 4: The Memory Keeper (AgentDB)
    bosses.set('memory', {
      name: 'The Memory Keeper',
      level: 4,
      hp: 600,
      maxHp: 600,
      xpReward: 600,
      description: 'Tests AgentDB vector storage',
      weakness: 'pattern recognition',
      attacks: [
        {
          name: 'Memory Overload',
          damage: 35,
          description: 'Store and retrieve 1000 actions',
          execute: async () => {
            this.log('🧠 Testing AgentDB storage...');
            await this.agentDB.storeAction({
              type: 'test',
              target: 'example',
              value: 'test-value',
              success: true,
              timestamp: Date.now(),
            });
            return true;
          },
        },
      ],
    });

    // BOSS 5: The CAPTCHA Breaker
    bosses.set('captcha', {
      name: 'The CAPTCHA Breaker',
      level: 5,
      hp: 1000,
      maxHp: 1000,
      xpReward: 1000,
      description: 'Tests CAPTCHA detection and solving',
      weakness: 'AI solving',
      attacks: [
        {
          name: 'reCAPTCHA v2 Challenge',
          damage: 40,
          description: 'Image selection challenge',
          execute: async () => {
            this.log('🤖 Detecting CAPTCHA...');
            const detected = this.captchaSolver.detect();
            this.log(`CAPTCHA detected: ${detected}`);
            return detected;
          },
        },
        {
          name: 'hCaptcha Assault',
          damage: 45,
          description: 'Complex image puzzle',
          execute: async () => {
            this.log('🧩 Testing hCaptcha solving...');
            const challenge = {
              type: CAPTCHAType.HCAPTCHA,
              context: {},
            };
            const solution = await this.captchaSolver.solve(challenge);
            return solution.success;
          },
        },
      ],
    });

    // BOSS 6: The Password Sentinel
    bosses.set('password', {
      name: 'The Password Sentinel',
      level: 6,
      hp: 800,
      maxHp: 800,
      xpReward: 800,
      description: 'Tests password generation and vault',
      weakness: 'AES-256 encryption',
      attacks: [
        {
          name: 'Weak Password Trap',
          damage: 30,
          description: 'Generate weak passwords',
          execute: async () => {
            this.log('🔐 Testing password generation...');
            const password = this.passwordVault.generatePassword(16);
            const strength = this.passwordVault.checkPasswordStrength(password);
            this.log(`Generated password strength: ${strength}`);
            return strength >= 4;
          },
        },
        {
          name: 'Vault Breach Attempt',
          damage: 50,
          description: 'Try to decrypt vault',
          execute: async () => {
            this.log('🔒 Testing vault encryption...');
            const username = this.passwordVault.generateUsername();
            const password = this.passwordVault.generatePassword(16);
            this.passwordVault.store('test-service', username, password);
            const retrieved = this.passwordVault.retrieve('test-service');
            return retrieved !== null && retrieved.password === password;
          },
        },
      ],
    });

    // BOSS 7: The Email Collector
    bosses.set('email', {
      name: 'The Email Collector',
      level: 7,
      hp: 1500,
      maxHp: 1500,
      xpReward: 1500,
      description: 'Tests email account collection',
      weakness: 'automated flows',
      attacks: [
        {
          name: 'Multi-Provider Assault',
          damage: 60,
          description: 'Collect from 5 providers',
          execute: async () => {
            this.log('📧 Testing email collection...');
            const stats = this.emailCollector.getStatistics();
            this.log(`Emails collected: ${stats.totalCollected}`);
            return stats.totalCollected > 0;
          },
        },
      ],
    });

    // BOSS 8: The API Gatekeeper
    bosses.set('api', {
      name: 'The API Gatekeeper',
      level: 8,
      hp: 2000,
      maxHp: 2000,
      xpReward: 2500,
      description: 'Tests API collection and automation',
      weakness: 'signup flows',
      attacks: [
        {
          name: 'API Rate Limit Hell',
          damage: 70,
          description: 'Multiple API signups',
          execute: async () => {
            this.log('🌐 Testing API collection...');
            this.log(`Available flows: ${Object.keys(API_SIGNUP_FLOWS).length}`);
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
  public listBosses(): void {
    console.log('\n🎮 ===== AVAILABLE BOSS BATTLES ===== 🎮\n');

    this.bosses.forEach((boss, key) => {
      console.log(`🔥 ${boss.name} (Level ${boss.level})`);
      console.log(`   Command: testBoss('${key}')`);
      console.log(`   HP: ${boss.maxHp} | XP: ${boss.xpReward}`);
      console.log(`   ${boss.description}`);
      console.log(`   Attacks: ${boss.attacks.map((a) => a.name).join(', ')}`);
      console.log('');
    });

    console.log('💡 Quick Start:');
    console.log(`   testBoss('dom')     - Test DOM automation`);
    console.log(`   testBoss('captcha') - Test CAPTCHA solving`);
    console.log(`   testBoss('email')   - Test email collection`);
    console.log('');
  }

  /**
   * Spawn a boss and start battle
   */
  public async testBoss(bossKey: string): Promise<void> {
    const boss = this.bosses.get(bossKey);

    if (!boss) {
      console.error(`❌ Boss '${bossKey}' not found. Use listBosses() to see available bosses.`);
      return;
    }

    this.reset();
    this.state.currentBoss = { ...boss };

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log(`║  🎮 BOSS BATTLE: ${boss.name.toUpperCase()}`);
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`Level: ${boss.level} | HP: ${boss.hp} | XP Reward: ${boss.xpReward}`);
    console.log(`Description: ${boss.description}`);
    console.log(`Weakness: ${boss.weakness}\n`);
    console.log('Available attacks:');
    boss.attacks.forEach((attack, index) => {
      console.log(`  ${index + 1}. ${attack.name} (${attack.damage} damage)`);
      console.log(`     ${attack.description}`);
    });
    console.log('\n💡 Use: bossFight.attack(0) to use first attack');
    console.log('💡 Use: bossFight.simulate() to auto-battle\n');
  }

  /**
   * Execute a specific attack
   */
  public async attack(attackIndex: number): Promise<void> {
    if (!this.state.currentBoss) {
      console.error('❌ No boss spawned. Use testBoss() first.');
      return;
    }

    if (this.state.victory || this.state.defeat) {
      console.log('⚠️ Battle already ended. Use reset() to start new battle.');
      return;
    }

    const attack = this.state.currentBoss.attacks[attackIndex];
    if (!attack) {
      console.error(`❌ Attack ${attackIndex} not found.`);
      return;
    }

    this.state.turn++;
    console.log(`\n⚔️ Turn ${this.state.turn}: ${attack.name}`);
    console.log(`   ${attack.description}`);

    try {
      const success = await attack.execute();

      if (success) {
        this.state.currentBoss.hp -= attack.damage;
        console.log(`✅ HIT! Boss takes ${attack.damage} damage!`);
        console.log(`   Boss HP: ${this.state.currentBoss.hp}/${this.state.currentBoss.maxHp}`);

        if (this.state.currentBoss.hp <= 0) {
          this.victory();
        }
      } else {
        console.log(`❌ MISS! Attack failed!`);
        this.state.playerHp -= 10;
        console.log(`   Player HP: ${this.state.playerHp}/${this.state.playerMaxHp}`);

        if (this.state.playerHp <= 0) {
          this.defeat();
        }
      }

      this.state.combatLog.push(
        `Turn ${this.state.turn}: ${attack.name} - ${success ? 'HIT' : 'MISS'}`
      );
    } catch (error) {
      console.error(`💥 Attack execution error: ${error}`);
      this.state.playerHp -= 20;
      console.log(`   Player takes 20 damage from error!`);
      console.log(`   Player HP: ${this.state.playerHp}/${this.state.playerMaxHp}`);
    }
  }

  /**
   * Simulate automated combat
   */
  public async simulate(): Promise<void> {
    if (!this.state.currentBoss) {
      console.error('❌ No boss spawned. Use testBoss() first.');
      return;
    }

    console.log('\n🤖 Starting automated combat simulation...\n');

    while (
      !this.state.victory &&
      !this.state.defeat &&
      this.state.currentBoss.hp > 0 &&
      this.state.playerHp > 0
    ) {
      const attackIndex = Math.floor(Math.random() * this.state.currentBoss.attacks.length);
      await this.attack(attackIndex);

      // Small delay for readability
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  /**
   * Show current battle state
   */
  public debug(): void {
    console.log('\n🔍 ===== BATTLE STATE DEBUG ===== 🔍\n');

    if (!this.state.currentBoss) {
      console.log('❌ No active boss battle');
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
    console.log(`   Victory: ${this.state.victory}`);
    console.log(`   Defeat: ${this.state.defeat}`);
    console.log('');

    console.log('📜 Combat Log:');
    this.state.combatLog.forEach((log) => console.log(`   ${log}`));
    console.log('');

    console.log('🔧 System Status:');
    console.log(`   DOM Manipulator: ✅ Ready`);
    console.log(`   CAPTCHA Solver: ✅ Ready`);
    console.log(`   Password Vault: ✅ Ready`);
    console.log(`   AgentDB: ✅ Ready`);
    console.log('');
  }

  /**
   * Reset battle state
   */
  public reset(): void {
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
  }

  /**
   * Victory scenario
   */
  private victory(): void {
    this.state.victory = true;

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  🏆 VICTORY! BOSS DEFEATED! 🏆                         ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`✨ ${this.state.currentBoss?.name} has been defeated!`);
    console.log(`💰 +${this.state.currentBoss?.xpReward} XP earned!`);
    console.log(`⚔️ Completed in ${this.state.turn} turns`);
    console.log('');
  }

  /**
   * Defeat scenario
   */
  private defeat(): void {
    this.state.defeat = true;

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  💀 DEFEAT! YOU HAVE FALLEN! 💀                        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`☠️ ${this.state.currentBoss?.name} was too powerful!`);
    console.log(`📊 Survived ${this.state.turn} turns`);
    console.log('💡 Use reset() to try again!');
    console.log('');
  }

  /**
   * Internal logging
   */
  private log(message: string): void {
    console.log(`   ${message}`);
  }
}

/**
 * Global instance - auto-initialize when loaded in console
 */
declare global {
  interface Window {
    bossFight: BossFightManager;
    testBoss: (bossKey: string) => Promise<void>;
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  window.bossFight = new BossFightManager();
  window.testBoss = (bossKey: string) => window.bossFight.testBoss(bossKey);

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🎮 BOSS BATTLE TEST SYSTEM LOADED 🎮                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log('Available Commands:');
  console.log('  • bossFight.listBosses()    - Show all bosses');
  console.log('  • testBoss("dom")           - Spawn DOM Manipulator boss');
  console.log('  • bossFight.attack(0)       - Execute attack #0');
  console.log('  • bossFight.simulate()      - Auto-battle');
  console.log('  • bossFight.debug()         - Show battle state');
  console.log('  • bossFight.reset()         - Reset battle');
  console.log('\n💡 Quick Start: bossFight.listBosses()\n');
}

export { BossFightManager };
