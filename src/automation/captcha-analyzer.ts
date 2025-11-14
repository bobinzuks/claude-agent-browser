/**
 * 🔍 CAPTCHA Detection & Analysis System
 * Defensive analysis for understanding CAPTCHA patterns
 * NOT for bypassing - for awareness and detection
 */

import { Page } from 'playwright';
import { AgentDBClient } from '../training/agentdb-client.js';

export interface CaptchaDetection {
  type: 'recaptcha-v2' | 'recaptcha-v3' | 'hcaptcha' | 'cloudflare' | 'funcaptcha' | 'none';
  detected: boolean;
  confidence: number;
  selectors: string[];
  requiresInteraction: boolean;
  difficultyScore: number; // 0-10
}

export interface BehavioralSignals {
  mouseMovements: boolean;
  scrollingDetected: boolean;
  typingPatterns: boolean;
  dwellTime: number;
  clickPatterns: boolean;
}

/**
 * CAPTCHA Analyzer - Defensive Detection System
 */
export class CaptchaAnalyzer {
  private db: AgentDBClient;
  private detectionHistory: CaptchaDetection[] = [];

  constructor(dbPath: string) {
    this.db = new AgentDBClient(dbPath, 384);
  }

  /**
   * Detect CAPTCHA presence on page
   */
  async detectCaptcha(page: Page): Promise<CaptchaDetection> {
    const detections = await Promise.all([
      this.detectReCaptchaV2(page),
      this.detectReCaptchaV3(page),
      this.detectHCaptcha(page),
      this.detectCloudflare(page),
      this.detectFunCaptcha(page),
    ]);

    // Return highest confidence detection
    const detected = detections.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    this.detectionHistory.push(detected);

    // Record in AgentDB
    this.db.storeAction({
      action: 'captcha-detection',
      selector: detected.selectors.join(', '),
      url: page.url(),
      success: detected.detected,
      timestamp: new Date().toISOString(),
      metadata: {
        type: detected.type,
        confidence: detected.confidence,
        requiresInteraction: detected.requiresInteraction,
        difficultyScore: detected.difficultyScore,
        source: 'captcha-analyzer',
      },
    });

    return detected;
  }

  /**
   * Detect reCAPTCHA v2
   */
  private async detectReCaptchaV2(page: Page): Promise<CaptchaDetection> {
    const selectors = [
      'iframe[src*="google.com/recaptcha"]',
      '.g-recaptcha',
      '#g-recaptcha',
      'div[class*="recaptcha"]',
    ];

    let detected = false;
    let foundSelectors: string[] = [];

    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        detected = true;
        foundSelectors.push(selector);
      }
    }

    // Check for reCAPTCHA script
    const hasScript = await page.evaluate(() => {
      return !!document.querySelector('script[src*="recaptcha"]');
    });

    if (hasScript) {
      detected = true;
      foundSelectors.push('script[src*="recaptcha"]');
    }

    return {
      type: 'recaptcha-v2',
      detected,
      confidence: detected ? 0.95 : 0.0,
      selectors: foundSelectors,
      requiresInteraction: true,
      difficultyScore: 6, // Medium difficulty
    };
  }

  /**
   * Detect reCAPTCHA v3 (invisible)
   */
  private async detectReCaptchaV3(page: Page): Promise<CaptchaDetection> {
    const hasV3 = await page.evaluate(() => {
      // Check for grecaptcha object with v3 methods
      return !!(window as any).grecaptcha?.execute;
    });

    const hasV3Script = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(s => s.src.includes('recaptcha') && s.src.includes('render='));
    });

    const detected = hasV3 || hasV3Script;

    return {
      type: 'recaptcha-v3',
      detected,
      confidence: detected ? 0.9 : 0.0,
      selectors: detected ? ['window.grecaptcha.execute'] : [],
      requiresInteraction: false,
      difficultyScore: 8, // High difficulty (behavioral analysis)
    };
  }

  /**
   * Detect hCaptcha
   */
  private async detectHCaptcha(page: Page): Promise<CaptchaDetection> {
    const selectors = [
      'iframe[src*="hcaptcha.com"]',
      '.h-captcha',
      '#h-captcha',
      'div[class*="hcaptcha"]',
    ];

    let detected = false;
    let foundSelectors: string[] = [];

    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        detected = true;
        foundSelectors.push(selector);
      }
    }

    const hasScript = await page.evaluate(() => {
      return !!document.querySelector('script[src*="hcaptcha"]');
    });

    if (hasScript) {
      detected = true;
      foundSelectors.push('script[src*="hcaptcha"]');
    }

    return {
      type: 'hcaptcha',
      detected,
      confidence: detected ? 0.95 : 0.0,
      selectors: foundSelectors,
      requiresInteraction: true,
      difficultyScore: 7, // Medium-high difficulty
    };
  }

  /**
   * Detect Cloudflare Turnstile/Challenge
   */
  private async detectCloudflare(page: Page): Promise<CaptchaDetection> {
    const selectors = [
      'iframe[src*="cloudflare"]',
      '#cf-challenge-running',
      '.cf-challenge',
      'div[id*="cloudflare"]',
    ];

    let detected = false;
    let foundSelectors: string[] = [];

    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        detected = true;
        foundSelectors.push(selector);
      }
    }

    // Check page title for Cloudflare challenge
    const title = await page.title();
    if (title.includes('Just a moment') || title.includes('Cloudflare')) {
      detected = true;
      foundSelectors.push('title:Cloudflare');
    }

    return {
      type: 'cloudflare',
      detected,
      confidence: detected ? 0.9 : 0.0,
      selectors: foundSelectors,
      requiresInteraction: true,
      difficultyScore: 9, // Very high difficulty
    };
  }

  /**
   * Detect FunCaptcha (ArkoseLabs)
   */
  private async detectFunCaptcha(page: Page): Promise<CaptchaDetection> {
    const selectors = [
      'iframe[src*="arkoselabs"]',
      'iframe[src*="funcaptcha"]',
      '#FunCaptcha',
      '.funcaptcha',
    ];

    let detected = false;
    let foundSelectors: string[] = [];

    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        detected = true;
        foundSelectors.push(selector);
      }
    }

    return {
      type: 'funcaptcha',
      detected,
      confidence: detected ? 0.95 : 0.0,
      selectors: foundSelectors,
      requiresInteraction: true,
      difficultyScore: 8, // High difficulty
    };
  }

  /**
   * Analyze behavioral signals that trigger CAPTCHA
   */
  async analyzeBehavioralSignals(page: Page): Promise<BehavioralSignals> {
    const signals = await page.evaluate(() => {
      const signals: any = {
        mouseMovements: false,
        scrollingDetected: false,
        typingPatterns: false,
        dwellTime: 0,
        clickPatterns: false,
      };

      // Check if page is tracking mouse movements
      const hasMouseTracking = !!(window as any).onmousemove ||
        document.querySelectorAll('[onmousemove]').length > 0;
      signals.mouseMovements = hasMouseTracking;

      // Check if page is tracking scroll
      const hasScrollTracking = !!(window as any).onscroll ||
        document.querySelectorAll('[onscroll]').length > 0;
      signals.scrollingDetected = hasScrollTracking;

      // Check if page is tracking keyboard
      const hasKeyboardTracking = !!(window as any).onkeydown ||
        document.querySelectorAll('[onkeydown]').length > 0;
      signals.typingPatterns = hasKeyboardTracking;

      // Check if page is tracking clicks
      const hasClickTracking = !!(window as any).onclick ||
        document.querySelectorAll('[onclick]').length > 0;
      signals.clickPatterns = hasClickTracking;

      return signals;
    });

    return signals;
  }

  /**
   * Get CAPTCHA difficulty assessment
   */
  assessDifficulty(detection: CaptchaDetection): string {
    if (detection.difficultyScore >= 9) return 'Very High - Advanced behavioral analysis';
    if (detection.difficultyScore >= 7) return 'High - Multi-layer verification';
    if (detection.difficultyScore >= 5) return 'Medium - Standard challenge';
    if (detection.difficultyScore >= 3) return 'Low - Simple verification';
    return 'None';
  }

  /**
   * Get recommendations for avoiding CAPTCHA
   */
  getAvoidanceRecommendations(detection: CaptchaDetection): string[] {
    const recommendations: string[] = [];

    if (detection.type === 'recaptcha-v3') {
      recommendations.push('Use realistic behavioral patterns (mouse, scroll, typing)');
      recommendations.push('Maintain consistent IP address and fingerprint');
      recommendations.push('Add random delays between actions (500-2000ms)');
      recommendations.push('Simulate human-like dwell time before interactions');
    }

    if (detection.type === 'cloudflare') {
      recommendations.push('Use residential proxy with clean IP reputation');
      recommendations.push('Ensure browser fingerprint matches real device');
      recommendations.push('Wait for automatic verification (5-10 seconds)');
      recommendations.push('Avoid rapid successive requests');
    }

    if (detection.type === 'hcaptcha' || detection.type === 'recaptcha-v2') {
      recommendations.push('Consider using accessibility alternatives if available');
      recommendations.push('Ensure cookies are enabled');
      recommendations.push('Use realistic user-agent and headers');
      recommendations.push('Maintain session consistency');
    }

    if (detection.requiresInteraction) {
      recommendations.push('DEFENSIVE NOTICE: Interactive CAPTCHAs require human verification');
      recommendations.push('Automated solving may violate Terms of Service');
      recommendations.push('Best approach: Design automation to minimize CAPTCHA triggers');
    }

    return recommendations;
  }

  /**
   * Get detection statistics
   */
  getStats() {
    const totalDetections = this.detectionHistory.length;
    const captchaEncounters = this.detectionHistory.filter(d => d.detected).length;
    const encounterRate = totalDetections > 0 ? captchaEncounters / totalDetections : 0;

    const typeBreakdown = this.detectionHistory
      .filter(d => d.detected)
      .reduce((acc, d) => {
        acc[d.type] = (acc[d.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalDetections,
      captchaEncounters,
      encounterRate,
      typeBreakdown,
      avgDifficulty: this.detectionHistory
        .filter(d => d.detected)
        .reduce((sum, d) => sum + d.difficultyScore, 0) / (captchaEncounters || 1),
    };
  }

  /**
   * Clear detection history
   */
  clearHistory(): void {
    this.detectionHistory = [];
  }
}
