/**
 * Phone Verification Handler
 * Orchestrates phone verification flows with browser automation
 */

import { BrowserController } from '../../mcp-bridge/browser-controller.js';
import { SMSProvider } from './sms-provider.js';
import { AgentDBClient, ActionPattern } from '../../training/agentdb-client.js';

export interface VerificationFlow {
  type: 'sms' | 'voice' | 'whatsapp' | 'totp' | 'unknown';
  phoneInputSelector: string | null;
  codeInputSelector: string | null;
  submitButtonSelector: string | null;
  confidence: number; // 0-1 confidence in detection
}

export interface VerificationResult {
  success: boolean;
  flow: VerificationFlow | null;
  phoneNumber?: string;
  codeUsed?: string;
  error?: string;
  duration?: number;
}

export interface PhoneVerificationConfig {
  smsProvider: SMSProvider;
  agentDB?: AgentDBClient;
  detectTimeout?: number;
  codeTimeout?: number;
  autoSubmit?: boolean;
}

/**
 * PhoneVerificationHandler - Main orchestration class
 * Handles detection and automation of phone verification flows
 */
export class PhoneVerificationHandler {
  private controller: BrowserController;
  private config: PhoneVerificationConfig;

  constructor(controller: BrowserController, config: PhoneVerificationConfig) {
    this.controller = controller;
    this.config = {
      detectTimeout: 10000,
      codeTimeout: 60000,
      autoSubmit: true,
      ...config,
    };
  }

  /**
   * Detect phone verification flow on current page
   * Uses pattern matching and AgentDB similarity search
   */
  async detectVerificationFlow(): Promise<VerificationFlow | null> {
    try {
      // Execute detection script in browser
      const result = await this.controller.executeScript(`() => {
        // Common selectors for phone inputs
        const phonePatterns = [
          'input[type="tel"]',
          'input[name*="phone" i]',
          'input[id*="phone" i]',
          'input[placeholder*="phone" i]',
          'input[name*="mobile" i]',
          'input[autocomplete="tel"]',
        ];

        // Common selectors for verification code inputs
        const codePatterns = [
          'input[name*="code" i]',
          'input[id*="code" i]',
          'input[placeholder*="code" i]',
          'input[name*="otp" i]',
          'input[name*="verify" i]',
          'input[autocomplete="one-time-code"]',
          'input[inputmode="numeric"]',
        ];

        // Find phone input
        let phoneInput = null;
        for (const pattern of phonePatterns) {
          const el = document.querySelector(pattern);
          if (el && el.offsetParent !== null) { // visible check
            phoneInput = pattern;
            break;
          }
        }

        // Find code input
        let codeInput = null;
        for (const pattern of codePatterns) {
          const el = document.querySelector(pattern);
          if (el && el.offsetParent !== null) {
            codeInput = pattern;
            break;
          }
        }

        // Find submit button
        const submitPatterns = [
          'button[type="submit"]',
          'input[type="submit"]',
          'button:has-text("Verify")',
          'button:has-text("Continue")',
          'button:has-text("Next")',
        ];

        let submitButton = null;
        for (const pattern of submitPatterns) {
          try {
            const el = document.querySelector(pattern);
            if (el && el.offsetParent !== null) {
              submitButton = pattern;
              break;
            }
          } catch (e) {
            // Skip invalid selectors
          }
        }

        // Detect verification type
        let type = 'unknown';
        const pageText = document.body.textContent?.toLowerCase() || '';

        if (pageText.includes('sms') || pageText.includes('text message')) {
          type = 'sms';
        } else if (pageText.includes('whatsapp')) {
          type = 'whatsapp';
        } else if (pageText.includes('call') || pageText.includes('voice')) {
          type = 'voice';
        } else if (codeInput) {
          type = 'sms'; // Default to SMS if code input found
        }

        return {
          type,
          phoneInputSelector: phoneInput,
          codeInputSelector: codeInput,
          submitButtonSelector: submitButton,
          confidence: (phoneInput || codeInput) ? 0.8 : 0.3,
        };
      }`);

      if (!result.success || !result.data) {
        return null;
      }

      const flow = result.data as VerificationFlow;

      // Store pattern in AgentDB if available
      if (this.config.agentDB && flow.confidence > 0.5) {
        const pageUrl = await this.controller.executeScript('() => window.location.href');
        if (pageUrl.success) {
          this.config.agentDB.storeAction({
            action: 'phone_verification_detected',
            url: pageUrl.data as string,
            selector: flow.phoneInputSelector || flow.codeInputSelector || '',
            success: true,
            metadata: {
              flow,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      return flow;
    } catch (error) {
      console.error('[PhoneVerification] Detection failed:', error);
      return null;
    }
  }

  /**
   * Enter phone number into detected input field
   */
  async enterPhoneNumber(phoneNumber: string, selector?: string): Promise<boolean> {
    try {
      const flow = selector ? null : await this.detectVerificationFlow();
      const inputSelector = selector || flow?.phoneInputSelector;

      if (!inputSelector) {
        console.error('[PhoneVerification] No phone input selector found');
        return false;
      }

      await this.controller.waitForSelector(inputSelector, undefined, this.config.detectTimeout);
      await this.controller.fill(inputSelector, phoneNumber);

      console.log(`[PhoneVerification] Entered phone number: ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('[PhoneVerification] Failed to enter phone number:', error);
      return false;
    }
  }

  /**
   * Wait for verification code via SMS provider
   */
  async waitForVerificationCode(timeout?: number): Promise<string | null> {
    const waitTime = timeout || this.config.codeTimeout!;
    console.log(`[PhoneVerification] Waiting for verification code (${waitTime}ms)...`);

    const code = await this.config.smsProvider.waitForCode(waitTime);

    if (code) {
      console.log(`[PhoneVerification] Received code: ${code}`);
    } else {
      console.log('[PhoneVerification] No code received (timeout)');
    }

    return code;
  }

  /**
   * Enter verification code into detected input field
   */
  async enterVerificationCode(code: string, selector?: string): Promise<boolean> {
    try {
      const flow = selector ? null : await this.detectVerificationFlow();
      const inputSelector = selector || flow?.codeInputSelector;

      if (!inputSelector) {
        console.error('[PhoneVerification] No code input selector found');
        return false;
      }

      await this.controller.waitForSelector(inputSelector, undefined, this.config.detectTimeout);
      await this.controller.fill(inputSelector, code);

      console.log(`[PhoneVerification] Entered verification code`);

      // Auto-submit if enabled
      if (this.config.autoSubmit && flow?.submitButtonSelector) {
        await this.controller.click(flow.submitButtonSelector);
        console.log('[PhoneVerification] Submitted verification form');
      }

      return true;
    } catch (error) {
      console.error('[PhoneVerification] Failed to enter code:', error);
      return false;
    }
  }

  /**
   * Complete full phone verification flow
   * @param phoneNumber - Optional phone number (uses provider default if not specified)
   */
  async handleVerification(phoneNumber?: string): Promise<VerificationResult> {
    const startTime = Date.now();

    try {
      // Step 1: Detect verification flow
      console.log('[PhoneVerification] Step 1: Detecting verification flow...');
      const flow = await this.detectVerificationFlow();

      if (!flow) {
        return {
          success: false,
          flow: null,
          error: 'Could not detect verification flow',
        };
      }

      console.log(`[PhoneVerification] Detected ${flow.type} verification (confidence: ${flow.confidence})`);

      // Step 2: Get phone number
      const phone = phoneNumber || await this.config.smsProvider.getPhoneNumber();
      console.log(`[PhoneVerification] Step 2: Using phone number: ${phone}`);

      // Step 3: Enter phone number
      if (flow.phoneInputSelector) {
        console.log('[PhoneVerification] Step 3: Entering phone number...');
        const entered = await this.enterPhoneNumber(phone);
        if (!entered) {
          return {
            success: false,
            flow,
            phoneNumber: phone,
            error: 'Failed to enter phone number',
          };
        }

        // Submit phone number if there's a button
        if (flow.submitButtonSelector && !flow.codeInputSelector) {
          await this.controller.click(flow.submitButtonSelector);
          console.log('[PhoneVerification] Submitted phone number');

          // Wait for code input to appear
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Step 4: Wait for verification code
      console.log('[PhoneVerification] Step 4: Waiting for verification code...');
      const code = await this.waitForVerificationCode();

      if (!code) {
        return {
          success: false,
          flow,
          phoneNumber: phone,
          error: 'No verification code received',
          duration: Date.now() - startTime,
        };
      }

      // Step 5: Enter verification code
      console.log('[PhoneVerification] Step 5: Entering verification code...');
      const codeEntered = await this.enterVerificationCode(code);

      if (!codeEntered) {
        return {
          success: false,
          flow,
          phoneNumber: phone,
          codeUsed: code,
          error: 'Failed to enter verification code',
          duration: Date.now() - startTime,
        };
      }

      // Success!
      const duration = Date.now() - startTime;
      console.log(`[PhoneVerification] ✅ Verification completed in ${duration}ms`);

      // Store success pattern in AgentDB
      if (this.config.agentDB) {
        const pageUrl = await this.controller.executeScript('() => window.location.href');
        if (pageUrl.success) {
          this.config.agentDB.storeAction({
            action: 'phone_verification_completed',
            url: pageUrl.data as string,
            selector: flow.codeInputSelector || '',
            success: true,
            metadata: {
              flow,
              duration,
              timestamp: new Date().toISOString(),
            },
          });
          this.config.agentDB.save();
        }
      }

      return {
        success: true,
        flow,
        phoneNumber: phone,
        codeUsed: code,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[PhoneVerification] Verification failed:', error);

      return {
        success: false,
        flow: null,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    }
  }

  /**
   * Query AgentDB for similar verification patterns
   */
  async findSimilarPatterns(url: string, limit: number = 5): Promise<ActionPattern[]> {
    if (!this.config.agentDB) {
      return [];
    }

    const results = this.config.agentDB.findSimilar(
      {
        action: 'phone_verification_detected',
        url,
      },
      limit,
      { successOnly: true, minSimilarity: 0.7 }
    );

    return results.map(r => r.pattern);
  }
}
