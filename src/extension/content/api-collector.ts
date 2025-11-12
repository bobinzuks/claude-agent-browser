/**
 * API Collector Agent
 * Automates signup flows and collects API credentials
 * BONUS LEVEL: The API Collector
 */

import { DOMManipulator } from './dom-manipulator';

export interface APICredential {
  service: string;
  email: string;
  apiKey?: string;
  token?: string;
  accountId?: string;
  signupUrl: string;
  apiDocsUrl: string;
  collectedAt: string;
  metadata: Record<string, unknown>;
}

export interface SignupFlow {
  steps: SignupStep[];
  service: string;
}

export interface SignupStep {
  type: 'navigate' | 'fill' | 'click' | 'wait' | 'extract';
  selector?: string;
  value?: string;
  url?: string;
  waitFor?: string;
  extractKey?: string;
}

export class APICollector {
  private dom: DOMManipulator;
  private credentials: APICredential[] = [];

  constructor(document: Document) {
    this.dom = new DOMManipulator(document);
  }

  /**
   * Execute a signup flow and collect credentials
   */
  public async executeFlow(flow: SignupFlow, userEmail: string): Promise<APICredential> {
    const credential: Partial<APICredential> = {
      service: flow.service,
      email: userEmail,
      collectedAt: new Date().toISOString(),
      metadata: {},
    };

    for (const step of flow.steps) {
      await this.executeStep(step, credential, userEmail);
    }

    const finalCredential = credential as APICredential;
    this.credentials.push(finalCredential);
    return finalCredential;
  }

  /**
   * Execute a single signup step
   */
  private async executeStep(
    step: SignupStep,
    credential: Partial<APICredential>,
    userEmail: string
  ): Promise<void> {
    switch (step.type) {
      case 'navigate':
        if (step.url) {
          credential.signupUrl = step.url;
          // In real browser, would navigate: window.location.href = step.url
        }
        break;

      case 'fill':
        if (step.selector && step.value !== undefined) {
          const value = step.value.replace('{{email}}', userEmail);
          this.dom.fillField(step.selector, value);
        }
        break;

      case 'click':
        if (step.selector) {
          this.dom.clickElement(step.selector);
        }
        break;

      case 'wait':
        if (step.waitFor) {
          await this.dom.waitForElement(step.waitFor, 10000);
        }
        break;

      case 'extract':
        if (step.selector && step.extractKey) {
          const element = this.dom.findElement(step.selector);
          if (element && element.textContent) {
            const value = element.textContent.trim();
            if (step.extractKey === 'apiKey') {
              credential.apiKey = value;
            } else if (step.extractKey === 'token') {
              credential.token = value;
            } else if (step.extractKey === 'accountId') {
              credential.accountId = value;
            } else {
              credential.metadata = credential.metadata || {};
              credential.metadata[step.extractKey] = value;
            }
          }
        }
        break;
    }
  }

  /**
   * Get all collected credentials
   */
  public getCredentials(): APICredential[] {
    return this.credentials;
  }

  /**
   * Find credential by service name
   */
  public findCredential(service: string): APICredential | undefined {
    return this.credentials.find((cred) => cred.service === service);
  }

  /**
   * Save credentials to JSON
   */
  public exportCredentials(): string {
    return JSON.stringify(
      {
        version: '1.0',
        collectedAt: new Date().toISOString(),
        credentials: this.credentials,
      },
      null,
      2
    );
  }

  /**
   * Load credentials from JSON
   */
  public importCredentials(json: string): void {
    const data = JSON.parse(json);
    if (data.credentials && Array.isArray(data.credentials)) {
      this.credentials = data.credentials;
    }
  }

  /**
   * Generate training data from collected flows
   */
  public generateTrainingData(): string {
    const trainingData = this.credentials.map((cred) => ({
      service: cred.service,
      signupUrl: cred.signupUrl,
      success: !!(cred.apiKey || cred.token),
      timestamp: cred.collectedAt,
      // Pattern learning: email field detection, submit button, etc.
      patterns: {
        emailField: 'detected',
        submitButton: 'detected',
        apiKeyLocation: cred.apiKey ? 'extracted' : 'not_found',
      },
    }));

    return JSON.stringify({ training: trainingData }, null, 2);
  }
}

/**
 * Pre-configured signup flows for popular APIs
 */
export const API_SIGNUP_FLOWS: Record<string, SignupFlow> = {
  github: {
    service: 'GitHub',
    steps: [
      { type: 'navigate', url: 'https://github.com/signup' },
      { type: 'fill', selector: 'input[name="email"]', value: '{{email}}' },
      { type: 'fill', selector: 'input[name="password"]', value: 'SecurePass123!' },
      { type: 'fill', selector: 'input[name="login"]', value: 'testuser' },
      { type: 'click', selector: 'button[type="submit"]' },
      { type: 'wait', waitFor: '.dashboard' },
      // Navigate to settings -> tokens
      { type: 'navigate', url: 'https://github.com/settings/tokens/new' },
      { type: 'fill', selector: 'input[name="oauth_access_description"]', value: 'API Access' },
      { type: 'click', selector: 'button[type="submit"]' },
      { type: 'wait', waitFor: '.token' },
      { type: 'extract', selector: '.token code', extractKey: 'token' },
    ],
  },

  openweathermap: {
    service: 'OpenWeatherMap',
    steps: [
      { type: 'navigate', url: 'https://home.openweathermap.org/users/sign_up' },
      { type: 'fill', selector: 'input[name="user[username]"]', value: 'testuser' },
      { type: 'fill', selector: 'input[name="user[email]"]', value: '{{email}}' },
      { type: 'fill', selector: 'input[name="user[password]"]', value: 'SecurePass123!' },
      {
        type: 'fill',
        selector: 'input[name="user[password_confirmation]"]',
        value: 'SecurePass123!',
      },
      { type: 'click', selector: 'input[type="checkbox"]' },
      { type: 'click', selector: 'input[type="submit"]' },
      { type: 'wait', waitFor: '.api-key' },
      { type: 'extract', selector: '.api-key', extractKey: 'apiKey' },
    ],
  },

  newsapi: {
    service: 'NewsAPI',
    steps: [
      { type: 'navigate', url: 'https://newsapi.org/register' },
      { type: 'fill', selector: 'input[name="email"]', value: '{{email}}' },
      { type: 'fill', selector: 'input[name="password"]', value: 'SecurePass123!' },
      { type: 'click', selector: 'button[type="submit"]' },
      { type: 'wait', waitFor: '.api-key' },
      { type: 'extract', selector: 'code.key', extractKey: 'apiKey' },
    ],
  },

  rapidapi: {
    service: 'RapidAPI',
    steps: [
      { type: 'navigate', url: 'https://rapidapi.com/auth/sign-up' },
      { type: 'fill', selector: 'input[name="email"]', value: '{{email}}' },
      { type: 'fill', selector: 'input[name="password"]', value: 'SecurePass123!' },
      { type: 'click', selector: 'button[type="submit"]' },
      { type: 'wait', waitFor: '.dashboard' },
      { type: 'navigate', url: 'https://rapidapi.com/developer/security' },
      { type: 'wait', waitFor: '.api-key' },
      { type: 'extract', selector: '[data-key]', extractKey: 'apiKey' },
    ],
  },

  anthropic: {
    service: 'Anthropic Claude',
    steps: [
      { type: 'navigate', url: 'https://console.anthropic.com/signup' },
      { type: 'fill', selector: 'input[type="email"]', value: '{{email}}' },
      { type: 'fill', selector: 'input[type="password"]', value: 'SecurePass123!' },
      { type: 'click', selector: 'button[type="submit"]' },
      { type: 'wait', waitFor: '.dashboard' },
      { type: 'navigate', url: 'https://console.anthropic.com/settings/keys' },
      { type: 'click', selector: 'button:contains("Create Key")' },
      { type: 'wait', waitFor: '.api-key' },
      { type: 'extract', selector: '.api-key code', extractKey: 'apiKey' },
    ],
  },
};
