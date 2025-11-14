/**
 * 🔧 Self-Healing Automation Engine - Phase 3
 * Automatic selector repair and failure recovery
 * Target: 99.5% success rate with self-repair
 */

import { Page, ElementHandle } from 'playwright';
import { AgentDBClient } from '../training/agentdb-client.js';
import { RobustSelectorEngine, ElementIntent } from './robust-selector-engine.js';

export interface HealingAction {
  action: 'click' | 'fill' | 'select' | 'check';
  originalSelector: string;
  value?: string;
  intent?: string;
}

export interface HealingResult {
  success: boolean;
  attempts: number;
  originalSelector: string;
  workingSelector?: string;
  strategy?: string;
  duration: number;
  reflection: string;
}

/**
 * Self-Healing Automation Engine
 */
export class SelfHealingEngine {
  private db: AgentDBClient;
  private selectorEngine: RobustSelectorEngine;
  private selectorHistory = new Map<string, string[]>();
  private healingStats = {
    totalActions: 0,
    selfHealed: 0,
    immediateSuccess: 0,
    failed: 0,
  };

  constructor(dbPath: string) {
    this.db = new AgentDBClient(dbPath, 384);
    this.selectorEngine = new RobustSelectorEngine(dbPath);
  }

  /**
   * Execute action with self-healing
   */
  async execute(page: Page, action: HealingAction): Promise<HealingResult> {
    const startTime = Date.now();
    this.healingStats.totalActions++;

    // Attempt 1: Try original selector
    try {
      await this.performAction(page, action.originalSelector, action);

      // Success on first try!
      this.healingStats.immediateSuccess++;

      return {
        success: true,
        attempts: 1,
        originalSelector: action.originalSelector,
        workingSelector: action.originalSelector,
        strategy: 'Original',
        duration: Date.now() - startTime,
        reflection: '✓ Original selector worked immediately',
      };
    } catch (firstError) {
      // First attempt failed - activate self-healing
      console.log(`[Self-Heal] Original selector failed: ${action.originalSelector}`);
      console.log(`[Self-Heal] Error: ${(firstError as Error).message}`);

      return await this.selfHeal(page, action, startTime);
    }
  }

  /**
   * Self-healing process
   */
  private async selfHeal(page: Page, action: HealingAction, startTime: number): Promise<HealingResult> {
    // Strategy 1: Try alternative selectors from history
    const alternatives = await this.generateAlternatives(page, action);

    for (let i = 0; i < alternatives.length; i++) {
      try {
        await this.performAction(page, alternatives[i], action);

        // Success with alternative!
        this.healingStats.selfHealed++;

        console.log(`[Self-Heal] ✓ Fixed with alternative: ${alternatives[i]}`);

        // Record successful heal to AgentDB
        this.db.storeAction({
          action: action.action,
          selector: alternatives[i],
          url: page.url(),
          success: true,
          timestamp: new Date().toISOString(),
          metadata: {
            selfHealed: true,
            originalSelector: action.originalSelector,
            healingAttempt: i + 2, // +1 for original, +1 for 1-indexed
            healingStrategy: 'alternative-selector',
            source: 'self-healing-engine',
          },
        });

        return {
          success: true,
          attempts: i + 2,
          originalSelector: action.originalSelector,
          workingSelector: alternatives[i],
          strategy: 'Alternative',
          duration: Date.now() - startTime,
          reflection: `✓ Self-healed with alternative selector after ${i + 1} attempts`,
        };
      } catch {
        continue;
      }
    }

    // Strategy 2: Use robust selector engine
    const intent = this.actionToIntent(action);
    const result = await this.selectorEngine.findElement(page, intent);

    if (result.element) {
      try {
        await this.performActionOnElement(result.element, action);

        this.healingStats.selfHealed++;

        console.log(`[Self-Heal] ✓ Fixed with robust engine: ${result.strategy}`);

        this.db.storeAction({
          action: action.action,
          selector: result.selector,
          url: page.url(),
          success: true,
          timestamp: new Date().toISOString(),
          metadata: {
            selfHealed: true,
            originalSelector: action.originalSelector,
            healingStrategy: `robust-engine-${result.strategy}`,
            confidence: result.confidence,
            source: 'self-healing-engine',
          },
        });

        return {
          success: true,
          attempts: alternatives.length + 2,
          originalSelector: action.originalSelector,
          workingSelector: result.selector,
          strategy: result.strategy,
          duration: Date.now() - startTime,
          reflection: `✓ Self-healed using robust engine (${result.strategy} strategy)`,
        };
      } catch {
        // Even robust engine failed
      }
    }

    // All healing attempts failed
    this.healingStats.failed++;

    return {
      success: false,
      attempts: alternatives.length + 2,
      originalSelector: action.originalSelector,
      duration: Date.now() - startTime,
      reflection: `✗ Self-healing failed after ${alternatives.length + 2} attempts. Element may not exist or page structure changed significantly.`,
    };
  }

  /**
   * Generate alternative selectors
   */
  private async generateAlternatives(page: Page, action: HealingAction): Promise<string[]> {
    const alternatives: string[] = [];
    const original = action.originalSelector;

    // 1. Query AgentDB for similar successful patterns
    const similar = this.db.findSimilar({
      action: action.action,
      url: page.url(),
      success: true,
    }, 10, { successOnly: true });

    alternatives.push(...similar.map(s => s.pattern.selector!).filter(Boolean));

    // 2. Relax selector specificity
    if (original.includes('>')) {
      alternatives.push(original.replace(/>/g, ' ')); // Change child to descendant
    }

    if (original.includes(':nth-child')) {
      alternatives.push(original.replace(/:nth-child\(\d+\)/g, '')); // Remove position
    }

    if (original.includes(':nth-of-type')) {
      alternatives.push(original.replace(/:nth-of-type\(\d+\)/g, ''));
    }

    // 3. Simplify complex selectors
    if (original.includes('.')) {
      const parts = original.split('.');
      if (parts.length > 2) {
        alternatives.push(parts.slice(0, 2).join('.')); // Use only first class
      }
    }

    // 4. Try ID alone if present
    const idMatch = original.match(/#([\w-]+)/);
    if (idMatch) {
      alternatives.push(`#${idMatch[1]}`);
    }

    // 5. Try common variations for input fields
    if (action.action === 'fill' && action.intent) {
      const intent = action.intent.toLowerCase();
      const commonSelectors = {
        email: ['#email', '[name="email"]', '[type="email"]', '[placeholder*="email"]'],
        password: ['#password', '[name="password"]', '[type="password"]'],
        username: ['#username', '[name="username"]', '#user', '[name="user"]'],
      };

      if (commonSelectors[intent as keyof typeof commonSelectors]) {
        alternatives.push(...commonSelectors[intent as keyof typeof commonSelectors]);
      }
    }

    // Deduplicate and filter out original
    return [...new Set(alternatives)].filter(s => s !== original);
  }

  /**
   * Perform action on page
   */
  private async performAction(page: Page, selector: string, action: HealingAction): Promise<void> {
    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    await this.performActionOnElement(element, action);
  }

  /**
   * Perform action on element
   */
  private async performActionOnElement(element: ElementHandle, action: HealingAction): Promise<void> {
    switch (action.action) {
      case 'click':
        await element.click();
        break;

      case 'fill':
        if (!action.value) throw new Error('Fill action requires value');
        await element.fill(action.value);
        break;

      case 'select':
        if (!action.value) throw new Error('Select action requires value');
        await element.selectOption(action.value);
        break;

      case 'check':
        await element.check();
        break;

      default:
        throw new Error(`Unknown action: ${action.action}`);
    }
  }

  /**
   * Convert action to intent for robust engine
   */
  private actionToIntent(action: HealingAction): ElementIntent {
    const typeMap: Record<string, 'button' | 'input' | 'link' | 'any'> = {
      click: 'button',
      fill: 'input',
      select: 'input',
      check: 'input',
    };

    return {
      type: typeMap[action.action] || 'any',
      purpose: action.intent,
      text: action.intent,
    };
  }

  /**
   * Get healing statistics
   */
  getStats() {
    return {
      ...this.healingStats,
      healingRate: this.healingStats.totalActions > 0 ?
        this.healingStats.selfHealed / this.healingStats.totalActions : 0,
      immediateSuccessRate: this.healingStats.totalActions > 0 ?
        this.healingStats.immediateSuccess / this.healingStats.totalActions : 0,
      failureRate: this.healingStats.totalActions > 0 ?
        this.healingStats.failed / this.healingStats.totalActions : 0,
    };
  }
}
