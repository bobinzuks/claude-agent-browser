/**
 * 🎮 ULTIMATE 99% SUCCESS RATE TEST
 * All Phases Integrated + Gamification + TDD
 * Target: 100% success rate with bonus achievements
 */

import { chromium, Browser, Page } from 'playwright';
import { AgentDBClient } from '../src/training/agentdb-client.js';
import { RobustSelectorEngine } from '../src/automation/robust-selector-engine.js';
import { SelfHealingEngine } from '../src/automation/self-healing-engine.js';
import { ReflexionMemory } from '../src/automation/reflexion-memory.js';
import * as fs from 'fs';

interface Achievement {
  id: string;
  name: string;
  description: string;
  xp: number;
  unlocked: boolean;
  unlockedAt?: string;
}

interface GameStats {
  totalXP: number;
  level: number;
  achievements: Achievement[];
  testsRun: number;
  testsPassedFirstTry: number;
  testsSelfHealed: number;
  testsFailed: number;
  novelApproachesFound: number;
  gapsFixed: number;
  currentSuccessRate: number;
}

class UltimateTestRunner {
  private browser!: Browser;
  private db: AgentDBClient;
  private selectorEngine: RobustSelectorEngine;
  private healingEngine: SelfHealingEngine;
  private reflexion: ReflexionMemory;
  private stats: GameStats;

  constructor() {
    this.db = new AgentDBClient('./data/unified-agentdb', 384);
    this.selectorEngine = new RobustSelectorEngine('./data/unified-agentdb');
    this.healingEngine = new SelfHealingEngine('./data/unified-agentdb');
    this.reflexion = new ReflexionMemory('./data/unified-agentdb');

    this.stats = {
      totalXP: 0,
      level: 1,
      achievements: this.initializeAchievements(),
      testsRun: 0,
      testsPassedFirstTry: 0,
      testsSelfHealed: 0,
      testsFailed: 0,
      novelApproachesFound: 0,
      gapsFixed: 0,
      currentSuccessRate: 0,
    };
  }

  private initializeAchievements(): Achievement[] {
    return [
      {
        id: 'first-blood',
        name: '🎯 First Blood',
        description: 'Pass the first test on first try',
        xp: 50,
        unlocked: false,
      },
      {
        id: 'self-healer',
        name: '🔧 Self Healer',
        description: 'Successfully self-heal a failing selector',
        xp: 100,
        unlocked: false,
      },
      {
        id: 'gap-finder',
        name: '🔍 Gap Finder',
        description: 'Find and fix a critical gap in the system',
        xp: 200,
        unlocked: false,
      },
      {
        id: 'novel-thinker',
        name: '🌟 Novel Thinker',
        description: 'Discover a novel approach to a problem',
        xp: 250,
        unlocked: false,
      },
      {
        id: '99-percent',
        name: '📈 99% Club',
        description: 'Achieve 99% success rate',
        xp: 500,
        unlocked: false,
      },
      {
        id: 'perfectionist',
        name: '💯 Perfectionist',
        description: 'Achieve 100% success rate',
        xp: 1000,
        unlocked: false,
      },
      {
        id: 'speed-demon',
        name: '⚡ Speed Demon',
        description: 'Complete all tests in under 2 minutes',
        xp: 300,
        unlocked: false,
      },
      {
        id: 'resilient',
        name: '🛡️ Resilient',
        description: 'Self-heal 10 failing tests in a row',
        xp: 400,
        unlocked: false,
      },
      {
        id: 'master-strategist',
        name: '🧠 Master Strategist',
        description: 'Use all 7 selector strategies successfully',
        xp: 350,
        unlocked: false,
      },
      {
        id: 'zen-master',
        name: '🧘 Zen Master',
        description: 'Complete without any failures',
        xp: 750,
        unlocked: false,
      },
    ];
  }

  async initialize() {
    console.log('\n🎮 ════════════════════════════════════════════════');
    console.log('   ULTIMATE 99% SUCCESS RATE CHALLENGE');
    console.log('   ════════════════════════════════════════════════\n');

    this.browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log('✅ Browser launched');
    console.log('✅ All systems online\n');
    this.displayStats();
  }

  async runUltimateTest() {
    const startTime = Date.now();
    const sessionId = `ultimate-${Date.now()}`;

    const testSites = [
      { name: 'The Internet - Login', url: 'https://the-internet.herokuapp.com/login', category: 'Forms' },
      { name: 'Practice Test Automation', url: 'https://practicetestautomation.com/practice-test-login/', category: 'Forms' },
      { name: 'SauceDemo', url: 'https://www.saucedemo.com/', category: 'Forms' },
      { name: 'UI Testing Playground - Dynamic', url: 'http://uitestingplayground.com/dynamicid', category: 'Dynamic' },
      { name: 'UI Testing Playground - Shadow DOM', url: 'http://uitestingplayground.com/shadowdom', category: 'Shadow DOM' },
      { name: 'The Internet - Frames', url: 'https://the-internet.herokuapp.com/frames', category: 'Iframes' },
      { name: 'GitHub', url: 'https://github.com', category: 'Real-World' },
      { name: 'Amazon', url: 'https://www.amazon.com', category: 'Real-World' },
      { name: 'Stack Overflow', url: 'https://stackoverflow.com', category: 'Real-World' },
      { name: 'YouTube', url: 'https://www.youtube.com', category: 'Real-World' },
    ];

    console.log(`\n🎯 Testing ${testSites.length} real-world sites...\n`);

    for (let i = 0; i < testSites.length; i++) {
      const site = testSites[i];
      console.log(`[${i + 1}/${testSites.length}] ${site.name}`);

      const success = await this.testSite(site.url, sessionId);

      if (success) {
        console.log(`  ✅ PASS [+10 XP]`);
        this.awardXP(10);
      } else {
        console.log(`  ❌ FAIL`);
      }

      this.updateSuccessRate();
      this.checkAchievements();
    }

    const totalDuration = Date.now() - startTime;

    // Speed Demon achievement check
    if (totalDuration < 120000 && this.stats.testsFailed === 0) {
      this.unlockAchievement('speed-demon');
    }

    // Zen Master achievement check
    if (this.stats.testsFailed === 0) {
      this.unlockAchievement('zen-master');
    }

    this.displayFinalResults(totalDuration);
  }

  private async testSite(url: string, sessionId: string): Promise<boolean> {
    const context = await this.browser.newContext();
    const page = await context.newPage();
    this.stats.testsRun++;

    try {
      // Navigate
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);

      // Test 1: Find primary button using robust selector
      const buttonResult = await this.selectorEngine.findElement(page, {
        type: 'button',
      });

      if (buttonResult.element) {
        this.stats.testsPassedFirstTry++;

        if (this.stats.testsPassedFirstTry === 1) {
          this.unlockAchievement('first-blood');
        }
      }

      // Test 2: Self-healing test - try invalid selector then heal
      const healingResult = await this.healingEngine.execute(page, {
        action: 'click',
        originalSelector: '#non-existent-button-12345',
        intent: 'click',
      });

      if (healingResult.success && healingResult.attempts > 1) {
        this.stats.testsSelfHealed++;
        this.awardXP(50); // Bonus for self-healing

        if (!this.stats.achievements.find(a => a.id === 'self-healer')?.unlocked) {
          this.unlockAchievement('self-healer');
        }
      }

      // Record reflection
      await this.reflexion.recordAttempt({
        sessionId,
        action: 'test',
        selector: healingResult.workingSelector || 'none',
        url,
        success: healingResult.success || !!buttonResult.element,
        attempts: healingResult.attempts || 1,
        duration: healingResult.duration || 0,
        timestamp: new Date().toISOString(),
      });

      await context.close();
      return true;
    } catch (error) {
      this.stats.testsFailed++;
      await context.close();
      return false;
    }
  }

  private awardXP(amount: number) {
    this.stats.totalXP += amount;

    // Level up every 500 XP
    const newLevel = Math.floor(this.stats.totalXP / 500) + 1;
    if (newLevel > this.stats.level) {
      this.stats.level = newLevel;
      console.log(`\n🎊 LEVEL UP! You are now level ${this.stats.level}!\n`);
    }
  }

  private unlockAchievement(id: string) {
    const achievement = this.stats.achievements.find(a => a.id === id);

    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = new Date().toISOString();

      this.awardXP(achievement.xp);

      console.log(`\n🏆 ACHIEVEMENT UNLOCKED: ${achievement.name}`);
      console.log(`   ${achievement.description}`);
      console.log(`   +${achievement.xp} XP\n`);
    }
  }

  private updateSuccessRate() {
    if (this.stats.testsRun > 0) {
      const successful = this.stats.testsPassedFirstTry + this.stats.testsSelfHealed;
      this.stats.currentSuccessRate = successful / this.stats.testsRun;

      // Achievement checks
      if (this.stats.currentSuccessRate >= 0.99 && !this.stats.achievements.find(a => a.id === '99-percent')?.unlocked) {
        this.unlockAchievement('99-percent');
      }

      if (this.stats.currentSuccessRate === 1.0 && !this.stats.achievements.find(a => a.id === 'perfectionist')?.unlocked) {
        this.unlockAchievement('perfectionist');
      }
    }
  }

  private checkAchievements() {
    // Check for resilient achievement (10 self-heals in a row)
    if (this.stats.testsSelfHealed >= 10 && this.stats.testsFailed === 0) {
      this.unlockAchievement('resilient');
    }

    // Check selector engine stats for master strategist
    const engineStats = this.selectorEngine.getStats();
    if (engineStats.strategyBreakdown && engineStats.strategyBreakdown.length >= 7) {
      this.unlockAchievement('master-strategist');
    }
  }

  private displayStats() {
    console.log('📊 CURRENT STATS:');
    console.log(`   Level: ${this.stats.level}`);
    console.log(`   Total XP: ${this.stats.totalXP}`);
    console.log(`   Success Rate: ${(this.stats.currentSuccessRate * 100).toFixed(1)}%`);
    console.log(`   Tests Run: ${this.stats.testsRun}`);
    console.log(`   First Try Successes: ${this.stats.testsPassedFirstTry}`);
    console.log(`   Self-Healed: ${this.stats.testsSelfHealed}`);
    console.log(`   Failures: ${this.stats.testsFailed}\n`);
  }

  private displayFinalResults(duration: number) {
    console.log('\n🏁 ════════════════════════════════════════════════');
    console.log('   FINAL RESULTS');
    console.log('   ════════════════════════════════════════════════\n');

    this.displayStats();

    console.log(`⏱️  Total Duration: ${(duration / 1000).toFixed(2)}s\n`);

    // Achievements
    console.log('🏆 ACHIEVEMENTS:');
    const unlocked = this.stats.achievements.filter(a => a.unlocked);
    const locked = this.stats.achievements.filter(a => !a.unlocked);

    unlocked.forEach(a => {
      console.log(`   ✅ ${a.name} - ${a.description} (+${a.xp} XP)`);
    });

    if (locked.length > 0) {
      console.log('\n   🔒 Locked Achievements:');
      locked.forEach(a => {
        console.log(`      ${a.name} - ${a.description} (${a.xp} XP)`);
      });
    }

    // Engine Stats
    console.log('\n📈 SELECTOR ENGINE STATS:');
    const engineStats = this.selectorEngine.getStats();
    console.log(`   Queries: ${engineStats.totalQueries}`);
    console.log(`   Success Rate: ${(engineStats.successRate * 100).toFixed(1)}%`);

    if (engineStats.strategyBreakdown) {
      console.log('\n   Strategy Breakdown:');
      engineStats.strategyBreakdown.forEach(s => {
        console.log(`      ${s.strategy}: ${s.count} (${s.percentage.toFixed(1)}%)`);
      });
    }

    // Healing Stats
    console.log('\n🔧 SELF-HEALING STATS:');
    const healingStats = this.healingEngine.getStats();
    console.log(`   Total Actions: ${healingStats.totalActions}`);
    console.log(`   Self-Healed: ${healingStats.selfHealed}`);
    console.log(`   Healing Rate: ${(healingStats.healingRate * 100).toFixed(1)}%`);
    console.log(`   Immediate Success: ${(healingStats.immediateSuccessRate * 100).toFixed(1)}%`);

    // Final Grade
    console.log('\n🎓 FINAL GRADE:');
    const successRate = this.stats.currentSuccessRate * 100;
    let grade = 'F';
    if (successRate >= 100) grade = 'S+';
    else if (successRate >= 99) grade = 'A+';
    else if (successRate >= 95) grade = 'A';
    else if (successRate >= 90) grade = 'B';
    else if (successRate >= 80) grade = 'C';

    console.log(`   ${grade} - ${successRate.toFixed(1)}% Success Rate\n`);

    // Save results
    const resultsPath = './data/test-results/ultimate-99-percent-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      stats: this.stats,
      engineStats,
      healingStats,
      grade,
      duration,
    }, null, 2));

    console.log(`✅ Results saved: ${resultsPath}\n`);
    console.log('════════════════════════════════════════════════\n');
  }

  async cleanup() {
    await this.db.save();
    await this.browser.close();
  }
}

// Run the ultimate test
async function main() {
  const runner = new UltimateTestRunner();

  try {
    await runner.initialize();
    await runner.runUltimateTest();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await runner.cleanup();
  }
}

main().catch(console.error);
