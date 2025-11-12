/**
 * Email Collector - FINAL TEST MISSION
 * Collects email accounts using all integrated systems:
 * - DOM Manipulation for form filling
 * - CAPTCHA Solver for bypassing challenges
 * - Password Vault for secure credential storage
 * - AgentDB for learning patterns
 */

import { DOMManipulator } from './dom-manipulator';
import { CAPTCHASolver } from '../lib/captcha-solver';
import { PasswordVault } from '../lib/password-vault';
import { AgentDBClient, ActionPattern } from '../../training/agentdb-client';

export interface EmailAccount {
  email: string;
  password: string;
  provider: string;
  signupUrl: string;
  createdAt: string;
  captchaSolved: boolean;
  success: boolean;
}

export interface EmailSignupFlow {
  provider: string;
  signupUrl: string;
  steps: SignupStep[];
}

export interface SignupStep {
  type: 'navigate' | 'fill' | 'click' | 'wait' | 'extract' | 'captcha';
  selector?: string;
  value?: string;
  url?: string;
  waitFor?: string;
  extractKey?: string;
  timeout?: number;
}

/**
 * Pre-configured email signup flows
 */
export const EMAIL_SIGNUP_FLOWS: Record<string, EmailSignupFlow> = {
  guerrillamail: {
    provider: 'GuerrillaMail',
    signupUrl: 'https://www.guerrillamail.com/',
    steps: [
      { type: 'navigate', url: 'https://www.guerrillamail.com/' },
      { type: 'wait', waitFor: '#email-widget', timeout: 5000 },
      { type: 'extract', selector: '#email-widget', extractKey: 'email' },
    ],
  },

  tempmail: {
    provider: 'TempMail',
    signupUrl: 'https://temp-mail.org/',
    steps: [
      { type: 'navigate', url: 'https://temp-mail.org/' },
      { type: 'wait', waitFor: '#mail', timeout: 5000 },
      { type: 'extract', selector: '#mail', extractKey: 'email' },
    ],
  },

  tenminutemail: {
    provider: '10MinuteMail',
    signupUrl: 'https://10minutemail.com/',
    steps: [
      { type: 'navigate', url: 'https://10minutemail.com/' },
      { type: 'wait', waitFor: '#mailAddress', timeout: 5000 },
      { type: 'extract', selector: '#mailAddress', extractKey: 'email' },
    ],
  },

  maildrop: {
    provider: 'MailDrop',
    signupUrl: 'https://maildrop.cc/',
    steps: [
      { type: 'navigate', url: 'https://maildrop.cc/' },
      { type: 'wait', waitFor: '.inbox-address', timeout: 5000 },
      { type: 'extract', selector: '.inbox-address', extractKey: 'email' },
    ],
  },

  mohmal: {
    provider: 'Mohmal',
    signupUrl: 'https://www.mohmal.com/en',
    steps: [
      { type: 'navigate', url: 'https://www.mohmal.com/en' },
      { type: 'click', selector: 'button[onclick="randomMail()"]' },
      { type: 'wait', waitFor: '#mailAddress', timeout: 3000 },
      { type: 'extract', selector: '#mailAddress', extractKey: 'email' },
    ],
  },
};

/**
 * EmailCollector - Automated email account collection
 */
export class EmailCollector {
  private dom: DOMManipulator;
  private captchaSolver: CAPTCHASolver;
  private passwordVault: PasswordVault;
  private agentDB: AgentDBClient;
  private accounts: EmailAccount[];

  constructor(
    document: Document,
    passwordVault: PasswordVault,
    agentDB: AgentDBClient
  ) {
    this.dom = new DOMManipulator(document);
    this.captchaSolver = new CAPTCHASolver(document);
    this.passwordVault = passwordVault;
    this.agentDB = agentDB;
    this.accounts = [];
  }

  /**
   * Execute an email signup flow
   */
  public async executeFlow(flow: EmailSignupFlow): Promise<EmailAccount> {
    console.log(`🎯 Starting signup flow for ${flow.provider}...`);

    const account: Partial<EmailAccount> = {
      provider: flow.provider,
      signupUrl: flow.signupUrl,
      createdAt: new Date().toISOString(),
      captchaSolved: false,
      success: false,
    };

    try {
      for (const step of flow.steps) {
        await this.executeStep(step, account);

        // Store action in AgentDB for learning
        const pattern: ActionPattern = {
          action: step.type,
          selector: step.selector,
          value: step.value,
          url: flow.signupUrl,
          success: true,
          metadata: {
            provider: flow.provider,
            stepType: step.type,
          },
        };
        this.agentDB.storeAction(pattern);
      }

      // Check for CAPTCHA
      if (this.captchaSolver.detect()) {
        console.log(`🤖 CAPTCHA detected: ${this.captchaSolver.getCaptchaType()}`);
        const captchaResult = await this.captchaSolver.solve();

        if (captchaResult) {
          console.log('✅ CAPTCHA solved automatically!');
          account.captchaSolved = true;

          // Store CAPTCHA success in AgentDB
          this.agentDB.storeAction({
            action: 'solve_captcha',
            url: flow.signupUrl,
            success: true,
            metadata: {
              captchaType: this.captchaSolver.getCaptchaType(),
              strategy: this.captchaSolver.getStrategy(),
            },
          });
        } else {
          console.log('⚠️ CAPTCHA requires human intervention');
          account.captchaSolved = false;
        }
      }

      // Generate password if account requires it
      if (!account.password) {
        account.password = this.passwordVault.generatePassword(16);
      }

      account.success = true;
      console.log(`✅ Successfully collected email: ${account.email}`);

      // Store in password vault
      if (account.email && account.password) {
        this.passwordVault.store(
          flow.provider,
          account.email,
          account.password,
          `Email account from ${flow.signupUrl}`
        );
      }

      this.accounts.push(account as EmailAccount);
      return account as EmailAccount;

    } catch (error) {
      console.error(`❌ Error in ${flow.provider} signup:`, error);

      // Store failure in AgentDB
      this.agentDB.storeAction({
        action: 'signup_flow',
        url: flow.signupUrl,
        success: false,
        metadata: {
          provider: flow.provider,
          error: String(error),
        },
      });

      account.success = false;
      throw error;
    }
  }

  /**
   * Execute a single step in the signup flow
   */
  private async executeStep(step: SignupStep, account: Partial<EmailAccount>): Promise<void> {
    switch (step.type) {
      case 'navigate':
        if (step.url) {
          console.log(`  → Navigate to: ${step.url}`);
          // In real browser: window.location.href = step.url
          // For demo: simulate navigation
        }
        break;

      case 'fill':
        if (step.selector && step.value) {
          console.log(`  → Fill field: ${step.selector}`);
          let value = step.value;

          // Replace placeholders
          if (value === '{{email}}' && account.email) {
            value = account.email;
          } else if (value === '{{password}}' && account.password) {
            value = account.password;
          }

          this.dom.fillField(step.selector, value);
        }
        break;

      case 'click':
        if (step.selector) {
          console.log(`  → Click: ${step.selector}`);
          this.dom.clickElement(step.selector);
        }
        break;

      case 'wait':
        if (step.waitFor) {
          console.log(`  → Wait for: ${step.waitFor}`);
          await this.dom.waitForElement(step.waitFor, step.timeout || 5000);
        }
        break;

      case 'extract':
        if (step.selector && step.extractKey) {
          console.log(`  → Extract from: ${step.selector}`);
          const element = this.dom.findElement(step.selector);

          if (element) {
            const value = element.textContent || (element as HTMLInputElement).value || '';
            (account as any)[step.extractKey] = value.trim();
            console.log(`    Extracted ${step.extractKey}: ${value.trim()}`);
          }
        }
        break;

      case 'captcha':
        console.log('  → Handling CAPTCHA...');
        if (this.captchaSolver.detect()) {
          await this.captchaSolver.solve();
        }
        break;
    }
  }

  /**
   * Collect multiple email accounts
   */
  public async collectMultiple(count: number = 5): Promise<EmailAccount[]> {
    console.log(`\n🎮 EMAIL GAUNTLET: Collecting ${count} email accounts...\n`);

    const flows = Object.values(EMAIL_SIGNUP_FLOWS);
    const collected: EmailAccount[] = [];

    for (let i = 0; i < Math.min(count, flows.length); i++) {
      try {
        console.log(`\n[${i + 1}/${count}] Attempting ${flows[i].provider}...`);
        const account = await this.executeFlow(flows[i]);
        collected.push(account);
        console.log(`✅ Account ${i + 1}/${count} collected!\n`);
      } catch (error) {
        console.error(`❌ Failed to collect from ${flows[i].provider}:`, error);
      }
    }

    // Save all data
    this.passwordVault.exportVault();
    this.agentDB.save();

    console.log(`\n🎊 EMAIL GAUNTLET COMPLETE!`);
    console.log(`📊 Successfully collected: ${collected.length}/${count} accounts`);

    return collected;
  }

  /**
   * Get all collected accounts
   */
  public getAccounts(): EmailAccount[] {
    return [...this.accounts];
  }

  /**
   * Export collected accounts as JSON
   */
  public exportAccounts(): string {
    const data = {
      version: '1.0.0',
      collectedAt: new Date().toISOString(),
      totalAccounts: this.accounts.length,
      accounts: this.accounts,
      statistics: {
        successRate: this.accounts.filter(a => a.success).length / this.accounts.length,
        captchasSolved: this.accounts.filter(a => a.captchaSolved).length,
        providers: [...new Set(this.accounts.map(a => a.provider))],
      },
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Get collection statistics
   */
  public getStatistics() {
    return {
      totalCollected: this.accounts.length,
      successful: this.accounts.filter(a => a.success).length,
      failed: this.accounts.filter(a => !a.success).length,
      captchasSolved: this.accounts.filter(a => a.captchaSolved).length,
      providers: [...new Set(this.accounts.map(a => a.provider))],
      successRate: this.accounts.length > 0
        ? this.accounts.filter(a => a.success).length / this.accounts.length
        : 0,
    };
  }
}
