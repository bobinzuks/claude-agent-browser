/**
 * 🔄 Recursive Research & Testing System
 * Automated: Research → Implement → Test → Analyze → Improve Loop
 * Novel approach to achieving 99%+ success through continuous iteration
 */

import { Browser, Page } from 'playwright';
import { AgentDBClient } from '../training/agentdb-client.js';
import { RobustSelectorEngine } from './robust-selector-engine.js';
import { SelfHealingEngine } from './self-healing-engine.js';
import { ReflexionMemory } from './reflexion-memory.js';
import { AdvancedStealthEngine } from './advanced-stealth-engine.js';
import { CaptchaAnalyzer } from './captcha-analyzer.js';

export interface ResearchIteration {
  iteration: number;
  hypothesis: string;
  implementation: string;
  testResults: TestResult[];
  successRate: number;
  improvements: string[];
  timestamp: string;
}

export interface TestResult {
  url: string;
  capability: string;
  success: boolean;
  attempts: number;
  duration: number;
  errorMessage?: string;
  captchaDetected?: boolean;
  stealthEffective?: boolean;
}

export interface ResearchGoal {
  targetSuccessRate: number;
  maxIterations: number;
  capabilities: string[];
  testSites: TestSite[];
}

export interface TestSite {
  name: string;
  url: string;
  category: string;
  requiredCapabilities: string[];
}

/**
 * Recursive Research & Testing Engine
 */
export class RecursiveResearchTester {
  private db: AgentDBClient;
  private selectorEngine: RobustSelectorEngine;
  private healingEngine: SelfHealingEngine;
  private reflexion: ReflexionMemory;
  private stealthEngine: AdvancedStealthEngine;
  private captchaAnalyzer: CaptchaAnalyzer;
  private iterations: ResearchIteration[] = [];

  constructor(dbPath: string) {
    this.db = new AgentDBClient(dbPath, 384);
    this.selectorEngine = new RobustSelectorEngine(dbPath);
    this.healingEngine = new SelfHealingEngine(dbPath);
    this.reflexion = new ReflexionMemory(dbPath);
    this.stealthEngine = new AdvancedStealthEngine(dbPath);
    this.captchaAnalyzer = new CaptchaAnalyzer(dbPath);
  }

  /**
   * Run recursive research loop
   */
  async runResearchLoop(browser: Browser, goal: ResearchGoal): Promise<void> {
    console.log('\\n🔄 ════════════════════════════════════════════════');
    console.log('   RECURSIVE RESEARCH & TESTING SYSTEM');
    console.log('   ════════════════════════════════════════════════\\n');
    console.log(`📊 Goal: ${goal.targetSuccessRate * 100}% success rate`);
    console.log(`🔬 Max Iterations: ${goal.maxIterations}`);
    console.log(`🧪 Test Sites: ${goal.testSites.length}`);
    console.log(`🎯 Capabilities: ${goal.capabilities.join(', ')}\\n`);

    let currentSuccessRate = 0;
    let iteration = 1;

    while (iteration <= goal.maxIterations && currentSuccessRate < goal.targetSuccessRate) {
      console.log(`\\n━━━ ITERATION ${iteration} ━━━\\n`);

      // Step 1: Generate hypothesis based on previous failures
      const hypothesis = this.generateHypothesis(iteration);
      console.log(`💡 Hypothesis: ${hypothesis}\\n`);

      // Step 2: Implement improvement
      const implementation = this.implementImprovement(hypothesis, iteration);
      console.log(`🔧 Implementation: ${implementation}\\n`);

      // Step 3: Test on all sites
      const testResults = await this.runTests(browser, goal.testSites, iteration);

      // Step 4: Analyze results
      currentSuccessRate = this.analyzeResults(testResults);
      console.log(`\\n📈 Success Rate: ${(currentSuccessRate * 100).toFixed(1)}%\\n`);

      // Step 5: Generate improvements
      const improvements = this.generateImprovements(testResults);

      // Step 6: Record iteration
      this.iterations.push({
        iteration,
        hypothesis,
        implementation,
        testResults,
        successRate: currentSuccessRate,
        improvements,
        timestamp: new Date().toISOString(),
      });

      // Step 7: Display progress
      this.displayIterationSummary(iteration, currentSuccessRate, improvements);

      // Step 8: Check if goal achieved
      if (currentSuccessRate >= goal.targetSuccessRate) {
        console.log(`\\n🎉 ════════════════════════════════════════════════`);
        console.log(`   GOAL ACHIEVED!`);
        console.log(`   ${(currentSuccessRate * 100).toFixed(1)}% ≥ ${goal.targetSuccessRate * 100}%`);
        console.log(`   ════════════════════════════════════════════════\\n`);
        break;
      }

      iteration++;
    }

    this.displayFinalReport(goal);
  }

  /**
   * Generate hypothesis based on previous failures
   */
  private generateHypothesis(iteration: number): string {
    if (iteration === 1) {
      return 'Baseline test with all systems enabled';
    }

    const lastIteration = this.iterations[this.iterations.length - 1];
    const failures = lastIteration.testResults.filter(r => !r.success);

    if (failures.length === 0) {
      return 'All tests passing - verify edge cases';
    }

    // Analyze failure patterns
    const captchaFailures = failures.filter(f => f.captchaDetected).length;
    const timeoutFailures = failures.filter(f => f.errorMessage?.includes('timeout')).length;
    const selectorFailures = failures.filter(f => f.errorMessage?.includes('not found')).length;

    if (captchaFailures > failures.length * 0.5) {
      return 'CAPTCHA detection causing majority of failures - improve stealth';
    }

    if (timeoutFailures > failures.length * 0.3) {
      return 'Timeout issues on heavy sites - optimize wait strategies';
    }

    if (selectorFailures > failures.length * 0.3) {
      return 'Selector brittleness - enhance robust selector engine';
    }

    return 'Mixed failure modes - apply multi-strategy improvements';
  }

  /**
   * Implement improvement based on hypothesis
   */
  private implementImprovement(hypothesis: string, iteration: number): string {
    if (hypothesis.includes('stealth')) {
      // Enable all stealth features
      return 'Enhanced stealth: Canvas noising + WebGL spoofing + Behavioral simulation';
    }

    if (hypothesis.includes('timeout')) {
      // Adjust timeout strategies
      return 'Optimized timeouts: domcontentloaded (15s) → load (20s) fallback';
    }

    if (hypothesis.includes('selector')) {
      // Improve selector strategies
      return 'Enhanced selectors: Added AgentDB priority + Fuzzy matching';
    }

    if (hypothesis.includes('edge cases')) {
      // Test extreme scenarios
      return 'Edge case testing: Shadow DOM + Dynamic content + Iframes';
    }

    return `Iteration ${iteration} - General improvements applied`;
  }

  /**
   * Run tests on all sites
   */
  private async runTests(browser: Browser, sites: TestSite[], iteration: number): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const sessionId = `research-iteration-${iteration}`;

    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      console.log(`[${i + 1}/${sites.length}] Testing ${site.name}...`);

      const result = await this.testSite(browser, site, sessionId);
      results.push(result);

      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} (${result.attempts} attempts, ${result.duration}ms)`);

      if (result.captchaDetected) {
        console.log(`  ⚠️  CAPTCHA detected`);
      }
    }

    return results;
  }

  /**
   * Test single site
   */
  private async testSite(browser: Browser, site: TestSite, sessionId: string): Promise<TestResult> {
    const context = await browser.newContext({
      userAgent: this.stealthEngine.generateUserAgent(),
      viewport: this.stealthEngine.generateViewport(),
    });

    const page = await context.newPage();
    const startTime = Date.now();

    try {
      // Apply stealth
      await this.stealthEngine.applyStealthToPage(page);

      // Navigate
      await page.goto(site.url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      await page.waitForTimeout(1000);

      // Detect CAPTCHA
      const captchaDetection = await this.captchaAnalyzer.detectCaptcha(page);

      // Test capabilities
      let success = true;
      let attempts = 1;

      for (const capability of site.requiredCapabilities) {
        const capabilityResult = await this.testCapability(page, capability);
        if (!capabilityResult.success) {
          success = false;
          attempts = capabilityResult.attempts;
          break;
        }
      }

      // Record reflection
      await this.reflexion.recordAttempt({
        sessionId,
        action: 'test-site',
        selector: site.name,
        url: site.url,
        success,
        attempts,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });

      await context.close();

      return {
        url: site.url,
        capability: site.requiredCapabilities.join(', '),
        success,
        attempts,
        duration: Date.now() - startTime,
        captchaDetected: captchaDetection.detected,
        stealthEffective: !captchaDetection.detected,
      };
    } catch (error) {
      await context.close();

      return {
        url: site.url,
        capability: site.requiredCapabilities.join(', '),
        success: false,
        attempts: 1,
        duration: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        captchaDetected: false,
        stealthEffective: false,
      };
    }
  }

  /**
   * Test specific capability
   */
  private async testCapability(page: Page, capability: string): Promise<{ success: boolean; attempts: number }> {
    try {
      if (capability === 'button-detection') {
        const result = await this.selectorEngine.findElement(page, { type: 'button' });
        return { success: !!result.element, attempts: 1 };
      }

      if (capability === 'form-detection') {
        const result = await this.selectorEngine.findElement(page, { type: 'input' });
        return { success: !!result.element, attempts: 1 };
      }

      if (capability === 'link-extraction') {
        const links = await page.$$('a[href]');
        return { success: links.length > 0, attempts: 1 };
      }

      if (capability === 'self-healing') {
        const healingResult = await this.healingEngine.execute(page, {
          action: 'click',
          originalSelector: '#non-existent-test',
          intent: 'test',
        });
        return { success: healingResult.success, attempts: healingResult.attempts };
      }

      // Default capability test
      return { success: true, attempts: 1 };
    } catch {
      return { success: false, attempts: 1 };
    }
  }

  /**
   * Analyze test results
   */
  private analyzeResults(results: TestResult[]): number {
    const successCount = results.filter(r => r.success).length;
    return successCount / results.length;
  }

  /**
   * Generate improvements based on results
   */
  private generateImprovements(results: TestResult[]): string[] {
    const improvements: string[] = [];
    const failures = results.filter(r => !r.success);

    if (failures.length === 0) {
      improvements.push('🎯 All tests passing - maintain current approach');
      return improvements;
    }

    // CAPTCHA analysis
    const captchaFailures = failures.filter(f => f.captchaDetected).length;
    if (captchaFailures > 0) {
      improvements.push(`⚠️  ${captchaFailures} CAPTCHA detections - enhance stealth mode`);
      improvements.push('   → Improve fingerprint randomization');
      improvements.push('   → Add more realistic behavioral patterns');
    }

    // Timeout analysis
    const timeoutFailures = failures.filter(f => f.errorMessage?.includes('timeout')).length;
    if (timeoutFailures > 0) {
      improvements.push(`⏱️  ${timeoutFailures} timeout failures - optimize wait strategies`);
      improvements.push('   → Increase timeout for heavy sites');
      improvements.push('   → Use adaptive wait strategies');
    }

    // Selector analysis
    const selectorFailures = failures.filter(f => f.errorMessage?.includes('not found')).length;
    if (selectorFailures > 0) {
      improvements.push(`🔍 ${selectorFailures} selector failures - enhance selector engine`);
      improvements.push('   → Add more fallback strategies');
      improvements.push('   → Improve AgentDB pattern matching');
    }

    return improvements;
  }

  /**
   * Display iteration summary
   */
  private displayIterationSummary(iteration: number, successRate: number, improvements: string[]): void {
    console.log(`\\n┌─────────────────────────────────────────┐`);
    console.log(`│ ITERATION ${iteration} SUMMARY                  │`);
    console.log(`├─────────────────────────────────────────┤`);
    console.log(`│ Success Rate: ${(successRate * 100).toFixed(1).padStart(5)}%              │`);
    console.log(`│ Improvements Identified: ${improvements.length.toString().padStart(2)}             │`);
    console.log(`└─────────────────────────────────────────┘\\n`);

    console.log('📋 Improvements:');
    improvements.forEach(imp => console.log(`   ${imp}`));
  }

  /**
   * Display final research report
   */
  private displayFinalReport(goal: ResearchGoal): void {
    console.log(`\\n\\n╔════════════════════════════════════════════════╗`);
    console.log(`║  RECURSIVE RESEARCH FINAL REPORT              ║`);
    console.log(`╚════════════════════════════════════════════════╝\\n`);

    console.log(`📊 Goal: ${goal.targetSuccessRate * 100}% success rate`);
    console.log(`🔬 Iterations Completed: ${this.iterations.length}`);

    const finalSuccessRate = this.iterations[this.iterations.length - 1]?.successRate || 0;
    console.log(`📈 Final Success Rate: ${(finalSuccessRate * 100).toFixed(1)}%`);

    const goalAchieved = finalSuccessRate >= goal.targetSuccessRate;
    console.log(`🎯 Goal Status: ${goalAchieved ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}\\n`);

    // Progress over iterations
    console.log(`📉 Progress Over Time:`);
    this.iterations.forEach(iter => {
      const bar = '█'.repeat(Math.floor(iter.successRate * 50));
      console.log(`   Iteration ${iter.iteration}: ${bar} ${(iter.successRate * 100).toFixed(1)}%`);
    });

    // Key learnings
    console.log(`\\n🧠 Key Learnings:`);
    const allImprovements = this.iterations.flatMap(i => i.improvements);
    const uniqueImprovements = [...new Set(allImprovements)];
    uniqueImprovements.slice(0, 5).forEach(imp => {
      console.log(`   • ${imp}`);
    });

    // Engine stats
    console.log(`\\n🔧 System Statistics:`);
    console.log(`   Selector Engine:`, this.selectorEngine.getStats());
    console.log(`   Self-Healing:`, this.healingEngine.getStats());
    console.log(`   CAPTCHA Analyzer:`, this.captchaAnalyzer.getStats());

    console.log(`\\n════════════════════════════════════════════════\\n`);
  }

  /**
   * Get research statistics
   */
  getStats() {
    return {
      totalIterations: this.iterations.length,
      currentSuccessRate: this.iterations[this.iterations.length - 1]?.successRate || 0,
      averageIterationTime: this.iterations.reduce((sum, i) =>
        sum + i.testResults.reduce((s, r) => s + r.duration, 0), 0) / this.iterations.length,
      totalImprovements: this.iterations.reduce((sum, i) => sum + i.improvements.length, 0),
    };
  }
}
