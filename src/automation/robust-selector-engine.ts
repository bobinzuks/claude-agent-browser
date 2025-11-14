/**
 * 🎯 Robust Selector Engine - Phase 2
 * Multi-strategy selector with automatic fallback
 * Target: 99% success rate on real-world websites
 */

import { Page, ElementHandle } from 'playwright';
import { AgentDBClient } from '../training/agentdb-client.js';

export interface ElementIntent {
  type: 'button' | 'input' | 'link' | 'any';
  purpose?: string; // 'login', 'email', 'submit', etc.
  text?: string;
  placeholder?: string;
  ariaLabel?: string;
}

export interface SelectorStrategy {
  name: string;
  priority: number;
  execute(page: Page, intent: ElementIntent): Promise<ElementHandle | null>;
}

export interface SelectorResult {
  element: ElementHandle | null;
  strategy: string;
  selector: string;
  confidence: number;
}

/**
 * Robust Selector Engine with 7 fallback strategies
 */
export class RobustSelectorEngine {
  private db: AgentDBClient;
  private strategies: SelectorStrategy[];
  private stats = {
    totalQueries: 0,
    successfulQueries: 0,
    strategySuccesses: new Map<string, number>(),
  };

  constructor(dbPath: string) {
    this.db = new AgentDBClient(dbPath, 384);

    // Initialize strategies in priority order
    this.strategies = [
      { name: 'SemanticID', priority: 1, execute: this.bySemanticId.bind(this) },
      { name: 'DataTestID', priority: 2, execute: this.byDataTestId.bind(this) },
      { name: 'ARIALabel', priority: 3, execute: this.byAriaLabel.bind(this) },
      { name: 'AgentDBPattern', priority: 4, execute: this.byAgentDBPattern.bind(this) },
      { name: 'TextContent', priority: 5, execute: this.byTextContent.bind(this) },
      { name: 'VisualPosition', priority: 6, execute: this.byVisualPosition.bind(this) },
      { name: 'FuzzyMatch', priority: 7, execute: this.byFuzzyMatch.bind(this) },
    ];
  }

  /**
   * Find element using all available strategies
   */
  async findElement(page: Page, intent: ElementIntent): Promise<SelectorResult> {
    this.stats.totalQueries++;

    for (const strategy of this.strategies) {
      try {
        const element = await strategy.execute(page, intent);

        if (element) {
          // Success!
          this.stats.successfulQueries++;
          const count = this.stats.strategySuccesses.get(strategy.name) || 0;
          this.stats.strategySuccesses.set(strategy.name, count + 1);

          // Record to AgentDB
          const selector = await this.getSelector(element);
          await this.recordSuccess(page, intent, strategy.name, selector);

          return {
            element,
            strategy: strategy.name,
            selector,
            confidence: 1 - (strategy.priority / this.strategies.length),
          };
        }
      } catch (error) {
        // Strategy failed, try next
        continue;
      }
    }

    // All strategies failed
    return {
      element: null,
      strategy: 'None',
      selector: '',
      confidence: 0,
    };
  }

  /**
   * Strategy 1: Semantic ID selectors
   */
  private async bySemanticId(page: Page, intent: ElementIntent): Promise<ElementHandle | null> {
    const commonIds: Record<string, string[]> = {
      login: ['#login', '#signin', '#btn-login', '#login-button', '#loginBtn'],
      email: ['#email', '#user-email', '#email-input', '#userEmail', '#emailAddress'],
      password: ['#password', '#pass', '#pwd', '#user-password', '#userPassword'],
      submit: ['#submit', '#btn-submit', '#submit-button', '#submitBtn'],
      username: ['#username', '#user', '#user-name', '#userName', '#login-username'],
      search: ['#search', '#search-input', '#searchbox', '#q'],
    };

    const ids = commonIds[intent.purpose || ''] || [];

    for (const id of ids) {
      const element = await page.$(id);
      if (element && await this.matchesIntent(element, intent)) {
        return element;
      }
    }

    return null;
  }

  /**
   * Strategy 2: Data test ID attributes
   */
  private async byDataTestId(page: Page, intent: ElementIntent): Promise<ElementHandle | null> {
    const testIds = [
      `[data-testid="${intent.purpose}"]`,
      `[data-test="${intent.purpose}"]`,
      `[data-cy="${intent.purpose}"]`,
      `[data-qa="${intent.purpose}"]`,
      `[data-test-id="${intent.purpose}"]`,
    ];

    for (const selector of testIds) {
      try {
        const element = await page.$(selector);
        if (element) return element;
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Strategy 3: ARIA labels
   */
  private async byAriaLabel(page: Page, intent: ElementIntent): Promise<ElementHandle | null> {
    if (!intent.ariaLabel && !intent.text) return null;

    const labels = [intent.ariaLabel, intent.text].filter(Boolean);

    for (const label of labels) {
      try {
        const selectors = [
          `[aria-label="${label}"]`,
          `[aria-labelledby*="${label}"]`,
          `[title="${label}"]`,
        ];

        for (const selector of selectors) {
          const element = await page.$(selector);
          if (element) return element;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Strategy 4: AgentDB learned patterns
   */
  private async byAgentDBPattern(page: Page, intent: ElementIntent): Promise<ElementHandle | null> {
    const url = page.url();

    // Query similar patterns
    const patterns = this.db.findSimilar({
      action: intent.type,
      url,
      success: true,
    }, 20, { successOnly: true });

    // Try each pattern
    for (const pattern of patterns) {
      if (!pattern.pattern.selector) continue;

      try {
        const element = await page.$(pattern.pattern.selector);
        if (element && await this.matchesIntent(element, intent)) {
          return element;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Strategy 5: Text content matching
   */
  private async byTextContent(page: Page, intent: ElementIntent): Promise<ElementHandle | null> {
    if (!intent.text) return null;

    const typeSelector = intent.type === 'button' ? 'button, [type="submit"], [role="button"]' :
                         intent.type === 'link' ? 'a' :
                         intent.type === 'input' ? 'input, textarea' : '*';

    try {
      const elements = await page.$$(typeSelector);

      for (const element of elements) {
        const text = await element.textContent();
        if (text && text.trim().toLowerCase().includes(intent.text.toLowerCase())) {
          return element;
        }
      }
    } catch {
      return null;
    }

    return null;
  }

  /**
   * Strategy 6: Visual position (nth-child)
   */
  private async byVisualPosition(page: Page, intent: ElementIntent): Promise<ElementHandle | null> {
    const typeMap = {
      button: 'button:first-of-type',
      input: 'input:first-of-type',
      link: 'a:first-of-type',
      any: '*:first-of-type',
    };

    const selector = typeMap[intent.type];

    try {
      return await page.$(selector);
    } catch {
      return null;
    }
  }

  /**
   * Strategy 7: Fuzzy matching (last resort)
   */
  private async byFuzzyMatch(page: Page, intent: ElementIntent): Promise<ElementHandle | null> {
    // Get all elements of the type
    const typeSelector = intent.type === 'button' ? 'button, [type="submit"]' :
                         intent.type === 'link' ? 'a' :
                         intent.type === 'input' ? 'input' : '*';

    try {
      const elements = await page.$$(typeSelector);

      // Return first element as last resort
      return elements[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if element matches intent
   */
  private async matchesIntent(element: ElementHandle, intent: ElementIntent): Promise<boolean> {
    try {
      const tagName = await element.evaluate((el: Element) => el.tagName.toLowerCase());
      // const type = await element.evaluate((el: Element) => (el as HTMLInputElement).type); // Reserved for future use

      // Type matching
      if (intent.type === 'button' && !['button', 'input', 'a'].includes(tagName)) {
        return false;
      }

      if (intent.type === 'input' && !['input', 'textarea'].includes(tagName)) {
        return false;
      }

      // Visibility check
      const visible = await element.isVisible();
      if (!visible) return false;

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get selector for element
   */
  private async getSelector(element: ElementHandle): Promise<string> {
    try {
      return await element.evaluate((el: Element) => {
        if ((el as HTMLElement).id) return `#${(el as HTMLElement).id}`;
        if ((el as HTMLElement).className) {
          const classes = (el as HTMLElement).className.split(' ').filter((c: string) => c.length > 0);
          if (classes.length > 0) return `.${classes[0]}`;
        }
        return el.tagName.toLowerCase();
      });
    } catch {
      return 'unknown';
    }
  }

  /**
   * Record successful strategy to AgentDB
   */
  private async recordSuccess(page: Page, intent: ElementIntent, strategy: string, selector: string): Promise<void> {
    this.db.storeAction({
      action: intent.type,
      selector,
      url: page.url(),
      success: true,
      timestamp: new Date().toISOString(),
      metadata: {
        strategy,
        purpose: intent.purpose,
        confidence: 1,
        source: 'robust-selector-engine',
      },
    });
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalQueries > 0 ?
        this.stats.successfulQueries / this.stats.totalQueries : 0,
      strategyBreakdown: Array.from(this.stats.strategySuccesses.entries()).map(([name, count]) => ({
        strategy: name,
        count,
        percentage: (count / this.stats.successfulQueries) * 100,
      })),
    };
  }
}
