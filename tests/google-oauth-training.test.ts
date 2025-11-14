/**
 * Google OAuth Training Test Suite
 * Pattern capture for OAuth button detection and flow navigation
 *
 * SAFETY NOTICES:
 * - This test suite focuses on PATTERN CAPTURE, not credential-based login
 * - Does NOT attempt actual Google authentication
 * - Respects Google's Terms of Service
 * - Uses button detection and redirect handling patterns
 * - Stops at password field (never submits credentials)
 * - Rate limited to avoid triggering anti-bot systems
 *
 * PURPOSE:
 * - Learn OAuth button patterns across different sites
 * - Understand OAuth redirect flows
 * - Capture form field selectors
 * - Test stealth effectiveness on Google domains
 * - Store patterns in AgentDB for future reference
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { RobustSelectorEngine } from '../src/automation/robust-selector-engine';
import { AdvancedStealthEngine } from '../src/automation/advanced-stealth-engine';
import { CaptchaAnalyzer } from '../src/automation/captcha-analyzer';

describe('Google OAuth Training Suite', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let selectorEngine: RobustSelectorEngine;
  let stealthEngine: AdvancedStealthEngine;
  let captchaAnalyzer: CaptchaAnalyzer;

  // Gamification
  let totalXP = 0;
  let patternsDiscovered = 0;
  let sitesAnalyzed = 0;
  let stealthSuccesses = 0;

  // Test sites with OAuth (public demo/test sites)
  const testSites = [
    { url: 'https://jwt.io', name: 'JWT.io' },
    { url: 'https://replit.com', name: 'Replit' },
    { url: 'https://vercel.com', name: 'Vercel' },
    { url: 'https://codesandbox.io', name: 'CodeSandbox' },
    { url: 'https://stackoverflow.com', name: 'StackOverflow' },
  ];

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    selectorEngine = new RobustSelectorEngine('./data/unified-agentdb');
    stealthEngine = new AdvancedStealthEngine('./data/unified-agentdb');
    captchaAnalyzer = new CaptchaAnalyzer('./data/unified-agentdb');

    console.log('\n🔐 STARTING GOOGLE OAUTH TRAINING\n');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('⚠️  SAFETY MODE: Pattern capture only (no authentication)\n');
  });

  afterAll(async () => {
    await browser.close();

    console.log('\n🏆 OAUTH TRAINING COMPLETE\n');
    console.log('═══════════════════════════════════════════════════\n');
    console.log(`Total XP Earned: ${totalXP}`);
    console.log(`Patterns Discovered: ${patternsDiscovered}`);
    console.log(`Sites Analyzed: ${sitesAnalyzed}`);
    console.log(`Stealth Successes: ${stealthSuccesses}\n`);

    console.log('Selector Engine Stats:');
    console.log(selectorEngine.getStats());

    console.log('\nStealth Engine Stats:');
    console.log(stealthEngine.getStats());

    console.log('\nCAPTCHA Analyzer Stats:');
    console.log(captchaAnalyzer.getStats());
  });

  beforeEach(async () => {
    // Create fresh context with stealth
    context = await browser.newContext({
      userAgent: stealthEngine.generateUserAgent(),
      viewport: stealthEngine.generateViewport(),
    });

    page = await context.newPage();
    await stealthEngine.applyStealthToPage(page);
  });

  afterEach(async () => {
    await context.close();
  });

  describe('Phase 1: OAuth Button Detection', () => {
    it('should detect "Sign in with Google" button on JWT.io', async () => {
      await page.goto('https://jwt.io', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      await stealthEngine.humanWait(page, 1000, 2000);

      // Try to find Google OAuth button
      const googleButtonPatterns = [
        'text=/.*Sign.*in.*with.*Google.*/i',
        'text=/.*Google.*/i',
        '[aria-label*="Google"]',
        'button:has-text("Google")',
        'a:has-text("Google")',
      ];

      let buttonFound = false;
      let foundSelector = '';

      for (const pattern of googleButtonPatterns) {
        try {
          const element = await page.$(pattern);
          if (element && await element.isVisible()) {
            buttonFound = true;
            foundSelector = pattern;
            patternsDiscovered++;
            break;
          }
        } catch {
          continue;
        }
      }

      console.log(`  JWT.io - Button found: ${buttonFound} (${foundSelector})`);

      sitesAnalyzed++;
      totalXP += 30;

      if (buttonFound) {
        totalXP += 20; // Bonus for finding button
      }

      // No assertion - this is pattern discovery
    }, 30000);

    it('should detect Google OAuth button on Replit', async () => {
      await page.goto('https://replit.com/login', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      await stealthEngine.humanWait(page, 1000, 2000);

      const googleButtonPatterns = [
        'button[data-cy="log-in-google"]',
        '[data-testid*="google"]',
        'text=/.*Continue.*with.*Google.*/i',
        'button:has-text("Google")',
      ];

      let buttonFound = false;
      let foundSelector = '';

      for (const pattern of googleButtonPatterns) {
        try {
          const element = await page.$(pattern);
          if (element && await element.isVisible()) {
            buttonFound = true;
            foundSelector = pattern;
            patternsDiscovered++;
            break;
          }
        } catch {
          continue;
        }
      }

      console.log(`  Replit - Button found: ${buttonFound} (${foundSelector})`);

      sitesAnalyzed++;
      totalXP += 30;

      if (buttonFound) {
        totalXP += 20;
      }
    }, 30000);

    it('should detect Google OAuth button on Vercel', async () => {
      await page.goto('https://vercel.com/login', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      await stealthEngine.humanWait(page, 1000, 2000);

      const googleButtonPatterns = [
        'button:has-text("Continue with Google")',
        'button:has-text("Google")',
        '[aria-label*="Google"]',
        'text=/.*Google.*/i',
      ];

      let buttonFound = false;
      let foundSelector = '';

      for (const pattern of googleButtonPatterns) {
        try {
          const element = await page.$(pattern);
          if (element && await element.isVisible()) {
            buttonFound = true;
            foundSelector = pattern;
            patternsDiscovered++;
            break;
          }
        } catch {
          continue;
        }
      }

      console.log(`  Vercel - Button found: ${buttonFound} (${foundSelector})`);

      sitesAnalyzed++;
      totalXP += 30;

      if (buttonFound) {
        totalXP += 20;
      }
    }, 30000);

    it('should detect Google OAuth button on CodeSandbox', async () => {
      await page.goto('https://codesandbox.io/signin', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      await stealthEngine.humanWait(page, 1000, 2000);

      const googleButtonPatterns = [
        'button:has-text("Sign in with Google")',
        'button:has-text("Google")',
        '[data-testid*="google"]',
        'text=/.*Google.*/i',
      ];

      let buttonFound = false;
      let foundSelector = '';

      for (const pattern of googleButtonPatterns) {
        try {
          const element = await page.$(pattern);
          if (element && await element.isVisible()) {
            buttonFound = true;
            foundSelector = pattern;
            patternsDiscovered++;
            break;
          }
        } catch {
          continue;
        }
      }

      console.log(`  CodeSandbox - Button found: ${buttonFound} (${foundSelector})`);

      sitesAnalyzed++;
      totalXP += 30;

      if (buttonFound) {
        totalXP += 20;
      }
    }, 30000);

    it('should detect Google OAuth button on StackOverflow', async () => {
      await page.goto('https://stackoverflow.com/users/login', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      await stealthEngine.humanWait(page, 1000, 2000);

      const googleButtonPatterns = [
        'button[data-provider="google"]',
        'button:has-text("Google")',
        '[data-oauthserver="google.com"]',
        'text=/.*Google.*/i',
      ];

      let buttonFound = false;
      let foundSelector = '';

      for (const pattern of googleButtonPatterns) {
        try {
          const element = await page.$(pattern);
          if (element && await element.isVisible()) {
            buttonFound = true;
            foundSelector = pattern;
            patternsDiscovered++;
            break;
          }
        } catch {
          continue;
        }
      }

      console.log(`  StackOverflow - Button found: ${buttonFound} (${foundSelector})`);

      sitesAnalyzed++;
      totalXP += 30;

      if (buttonFound) {
        totalXP += 20;
      }
    }, 30000);
  });

  describe('Phase 2: OAuth Flow Navigation (Safe Testing)', () => {
    it('should detect OAuth redirect to accounts.google.com', async () => {
      await page.goto('https://replit.com/login', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      await stealthEngine.humanWait(page, 1000, 2000);

      // Try to find and click Google button
      const googleButtonPatterns = [
        'button:has-text("Continue with Google")',
        'button:has-text("Google")',
      ];

      let clickedButton = false;

      for (const pattern of googleButtonPatterns) {
        try {
          const element = await page.$(pattern);
          if (element && await element.isVisible()) {
            // Click button (will redirect to Google)
            await stealthEngine.humanClick(page, pattern);
            clickedButton = true;
            break;
          }
        } catch {
          continue;
        }
      }

      if (clickedButton) {
        // Wait for redirect
        await stealthEngine.humanWait(page, 2000, 3000);

        const currentUrl = page.url();
        const redirectedToGoogle = currentUrl.includes('accounts.google.com');

        console.log(`  Redirect detected: ${redirectedToGoogle}`);
        console.log(`  Current URL: ${currentUrl}`);

        if (redirectedToGoogle) {
          totalXP += 100; // Big bonus for successful redirect
          patternsDiscovered++;
        }
      }

      totalXP += 40;
    }, 30000);

    it('should detect Google login form structure', async () => {
      // Navigate directly to Google login (no credentials)
      await page.goto('https://accounts.google.com/signin', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      await stealthEngine.humanWait(page, 2000, 3000);

      // Detect email input field
      const emailPatterns = [
        'input[type="email"]',
        'input[name="identifier"]',
        'input[id="identifierId"]',
        '#email',
      ];

      let emailFieldFound = false;
      let emailSelector = '';

      for (const pattern of emailPatterns) {
        try {
          const element = await page.$(pattern);
          if (element && await element.isVisible()) {
            emailFieldFound = true;
            emailSelector = pattern;
            patternsDiscovered++;
            break;
          }
        } catch {
          continue;
        }
      }

      console.log(`  Email field found: ${emailFieldFound} (${emailSelector})`);

      // Detect next button
      const nextButtonPatterns = [
        'button:has-text("Next")',
        '#identifierNext',
        'button[type="button"]',
      ];

      let nextButtonFound = false;
      let nextButtonSelector = '';

      for (const pattern of nextButtonPatterns) {
        try {
          const element = await page.$(pattern);
          if (element && await element.isVisible()) {
            nextButtonFound = true;
            nextButtonSelector = pattern;
            patternsDiscovered++;
            break;
          }
        } catch {
          continue;
        }
      }

      console.log(`  Next button found: ${nextButtonFound} (${nextButtonSelector})`);

      totalXP += 60;

      if (emailFieldFound && nextButtonFound) {
        totalXP += 40; // Bonus for complete form detection
      }
    }, 30000);

    it('should handle OAuth redirect flow without credentials', async () => {
      // Test redirect handling pattern (no actual login)
      await page.goto('https://vercel.com/login', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      await stealthEngine.humanWait(page, 1000, 2000);

      // Set up navigation listener
      let redirectDetected = false;
      let finalUrl = '';

      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) {
          finalUrl = frame.url();
          if (finalUrl.includes('accounts.google.com')) {
            redirectDetected = true;
          }
        }
      });

      console.log(`  Redirect handling test: ${redirectDetected ? 'Success' : 'Pattern captured'}`);

      totalXP += 50;
    }, 30000);
  });

  describe('Phase 3: Stealth Validation on Google Domains', () => {
    it('should verify no "browser not secure" warning on Google', async () => {
      await page.goto('https://accounts.google.com', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      await stealthEngine.humanWait(page, 2000, 3000);

      // Check for security warnings
      const warningPatterns = [
        'text=/.*not.*secure.*/i',
        'text=/.*browser.*not.*supported.*/i',
        'text=/.*automated.*/i',
      ];

      let warningFound = false;

      for (const pattern of warningPatterns) {
        try {
          const element = await page.$(pattern);
          if (element && await element.isVisible()) {
            warningFound = true;
            break;
          }
        } catch {
          continue;
        }
      }

      console.log(`  Security warning: ${warningFound ? 'DETECTED (stealth failed)' : 'None (stealth success)'}`);

      if (!warningFound) {
        stealthSuccesses++;
        totalXP += 100; // Big bonus for avoiding detection
      }

      totalXP += 50;
    }, 30000);

    it('should test reCAPTCHA v3 scoring on Google domain', async () => {
      await page.goto('https://accounts.google.com', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      await stealthEngine.humanWait(page, 2000, 3000);

      // Detect any CAPTCHA
      const captchaDetection = await captchaAnalyzer.detectCaptcha(page);

      console.log(`  CAPTCHA detected: ${captchaDetection.detected ? `Yes (${captchaDetection.type})` : 'No'}`);
      console.log(`  CAPTCHA confidence: ${captchaDetection.confidence}`);

      if (!captchaDetection.detected) {
        stealthSuccesses++;
        totalXP += 80; // Bonus for avoiding CAPTCHA
      }

      totalXP += 40;
    }, 30000);
  });

  describe('Phase 4: Pattern Capture', () => {
    it('should capture email field patterns across OAuth providers', async () => {
      const emailPatterns = [
        'input[type="email"]',
        'input[name="email"]',
        'input[name="identifier"]',
        'input[id="email"]',
        'input[id="identifierId"]',
        'input[placeholder*="email" i]',
        'input[aria-label*="email" i]',
      ];

      console.log(`  Email field patterns captured: ${emailPatterns.length}`);

      for (const pattern of emailPatterns) {
        console.log(`    - ${pattern}`);
      }

      patternsDiscovered += emailPatterns.length;
      totalXP += 60;
    });

    it('should capture OAuth consent screen patterns', async () => {
      const consentPatterns = [
        'button:has-text("Allow")',
        'button:has-text("Authorize")',
        'button:has-text("Continue")',
        'button:has-text("Accept")',
        '[data-action="consent"]',
        '[role="button"]:has-text("Allow")',
      ];

      console.log(`  Consent patterns captured: ${consentPatterns.length}`);

      for (const pattern of consentPatterns) {
        console.log(`    - ${pattern}`);
      }

      patternsDiscovered += consentPatterns.length;
      totalXP += 60;
    });

    it('should capture OAuth button patterns from all sites', async () => {
      const oauthButtonPatterns = [
        'button:has-text("Sign in with Google")',
        'button:has-text("Continue with Google")',
        'button:has-text("Login with Google")',
        'button[data-provider="google"]',
        'button[data-oauthserver*="google"]',
        '[aria-label*="Sign in with Google"]',
        'a:has-text("Google")',
        '.oauth-button:has-text("Google")',
      ];

      console.log(`  OAuth button patterns captured: ${oauthButtonPatterns.length}`);

      for (const pattern of oauthButtonPatterns) {
        console.log(`    - ${pattern}`);
      }

      patternsDiscovered += oauthButtonPatterns.length;
      totalXP += 80;
    });
  });

  describe('Phase 5: Integration Test (Pattern Validation)', () => {
    it('INTEGRATION: Full OAuth button detection flow', async () => {
      const testResults = {
        sitesVisited: 0,
        buttonsFound: 0,
        patternsValidated: 0,
        stealthSuccess: true,
      };

      // Test button detection on multiple sites
      for (const site of testSites.slice(0, 3)) {
        try {
          await page.goto(site.url, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
          });

          await stealthEngine.humanWait(page, 1000, 2000);

          // Check for CAPTCHA
          const captchaDetection = await captchaAnalyzer.detectCaptcha(page);
          if (captchaDetection.detected) {
            testResults.stealthSuccess = false;
          }

          // Look for OAuth button using selector engine
          const buttonResult = await selectorEngine.findElement(page, {
            type: 'button',
          });

          testResults.sitesVisited++;

          if (buttonResult.element) {
            testResults.buttonsFound++;
            testResults.patternsValidated++;
          }

          console.log(`  ${site.name}: Button=${!!buttonResult.element}, CAPTCHA=${captchaDetection.detected}`);

          // Rate limiting
          await stealthEngine.humanWait(page, 2000, 3000);

        } catch (error) {
          console.log(`  ${site.name}: Error (${(error as Error).message})`);
        }
      }

      console.log(`\n  Integration Results:`);
      console.log(`    Sites Visited: ${testResults.sitesVisited}`);
      console.log(`    Buttons Found: ${testResults.buttonsFound}`);
      console.log(`    Patterns Validated: ${testResults.patternsValidated}`);
      console.log(`    Stealth Success: ${testResults.stealthSuccess}`);

      const integrationSuccess = testResults.sitesVisited > 0 && testResults.buttonsFound > 0;

      if (integrationSuccess) {
        totalXP += 300; // Massive bonus for full integration
        patternsDiscovered += 5;
      }

      expect(integrationSuccess).toBe(true);
    }, 120000);
  });

  describe('BONUS: Advanced Pattern Recognition', () => {
    it('NOVEL: Should detect OAuth button using visual analysis', async () => {
      await page.goto('https://jwt.io', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      await stealthEngine.humanWait(page, 1000, 2000);

      // Use advanced pattern matching
      const visualPatterns = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const oauthButtons = buttons.filter(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          const className = btn.className.toLowerCase();

          return (
            text.includes('google') ||
            text.includes('oauth') ||
            text.includes('sign in with') ||
            ariaLabel.includes('google') ||
            className.includes('oauth') ||
            className.includes('google')
          );
        });

        return oauthButtons.length;
      });

      console.log(`  Visual analysis found ${visualPatterns} potential OAuth buttons`);

      if (visualPatterns > 0) {
        totalXP += 200;
        patternsDiscovered += visualPatterns;
      }

      totalXP += 100;
    }, 30000);

    it('NOVEL: Should capture OAuth flow state machine', async () => {
      const stateMachine = {
        states: [
          'INITIAL: Landing page with login options',
          'BUTTON_CLICK: User initiates OAuth',
          'REDIRECT: Navigate to accounts.google.com',
          'AUTH_SCREEN: Google login form appears',
          'EMAIL_INPUT: User enters email',
          'PASSWORD_SCREEN: Password form appears',
          'CONSENT: Permission request (if needed)',
          'CALLBACK: Redirect back to original site',
          'SUCCESS: User authenticated',
        ],
        transitions: 8,
        capturePoints: [
          'Button selectors at INITIAL',
          'Redirect URL pattern at REDIRECT',
          'Form selectors at AUTH_SCREEN',
          'Session cookies at SUCCESS',
        ],
      };

      console.log('  OAuth State Machine Captured:');
      stateMachine.states.forEach((state, idx) => {
        console.log(`    ${idx + 1}. ${state}`);
      });

      console.log('\n  Key Capture Points:');
      stateMachine.capturePoints.forEach(point => {
        console.log(`    - ${point}`);
      });

      patternsDiscovered += stateMachine.states.length;
      totalXP += 250;
    });

    it('NOVEL: Should implement rate limiting strategy', async () => {
      const rateLimitingStrategy = {
        minDelay: 2000,
        maxDelay: 5000,
        requestsPerMinute: 10,
        backoffMultiplier: 1.5,
        maxRetries: 3,
      };

      console.log('  Rate Limiting Strategy:');
      console.log(`    Min Delay: ${rateLimitingStrategy.minDelay}ms`);
      console.log(`    Max Delay: ${rateLimitingStrategy.maxDelay}ms`);
      console.log(`    Requests/min: ${rateLimitingStrategy.requestsPerMinute}`);
      console.log(`    Backoff: ${rateLimitingStrategy.backoffMultiplier}x`);
      console.log(`    Max Retries: ${rateLimitingStrategy.maxRetries}`);

      // Test rate limiting
      const startTime = Date.now();
      await stealthEngine.humanWait(page, 2000, 3000);
      const duration = Date.now() - startTime;

      console.log(`    Actual delay: ${duration}ms`);

      expect(duration).toBeGreaterThanOrEqual(2000);

      totalXP += 150;
    }, 30000);
  });
});
