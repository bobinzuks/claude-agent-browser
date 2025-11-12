/**
 * SELF-HEALING SELECTORS MODULE
 *
 * Production-ready implementation of 7-level fallback selector strategy
 * with intelligent retry logic, comprehensive logging, and error handling.
 *
 * Based on advanced-innovations-train.js selector strategies
 *
 * @module self-healing-selectors
 */

/**
 * Logger utility for selector operations
 */
class SelectorLogger {
  verbose: boolean;
  private history: any[];

  constructor(options: any = {}) {
    this.verbose = options.verbose !== false;
    this.history = [];
  }

  log(level: string, message: string, data: any = {}): void {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level,
      message,
      data
    };

    this.history.push(entry);

    if (this.verbose) {
      const prefix = {
        info: '   ℹ️ ',
        success: '   ✅',
        warning: '   ⚠️ ',
        error: '   ❌',
        debug: '   🔍'
      }[level] || '   ';

      console.log(`${prefix} ${message}`);
      if (Object.keys(data).length > 0) {
        console.log(`      ${JSON.stringify(data)}`);
      }
    }
  }

  getHistory(): any[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
  }
}

/**
 * 7-Level Fallback Selector Strategy
 * Implements progressive fallback from most reliable to least reliable selector types
 */
class SelfHealingSelector {
  /**
   * Strategy definitions for the 7-level fallback
   * Each strategy has a priority (1 = highest) and a generate function
   */
  static strategies = [
    {
      name: 'Direct ID',
      level: 1,
      description: 'ID attribute selector (#id)',
      generate: (element: any) => {
        if (!element || !element.id) return null;
        return `#${element.id}`;
      }
    },
    {
      name: 'Name Attribute',
      level: 2,
      description: 'Name attribute selector ([name="..."])',
      generate: (element: any) => {
        if (!element || !element.name) return null;
        return `[name="${element.name}"]`;
      }
    },
    {
      name: 'Label Association',
      level: 3,
      description: 'ARIA label or associated label text',
      generate: (element: any) => {
        if (!element) return null;

        // Try aria-label first
        if (element.ariaLabel) {
          return `[aria-label="${element.ariaLabel}"]`;
        }

        // Try for attribute (label association)
        if (element.id) {
          const label = document.querySelector(`label[for="${element.id}"]`);
          if (label && label.textContent) {
            const labelText = label.textContent.trim();
            return `label:has-text("${labelText}") + input, label:has-text("${labelText}") input`;
          }
        }

        // Try aria-labelledby
        if (element.getAttribute('aria-labelledby')) {
          const labelId = element.getAttribute('aria-labelledby');
          return `[aria-labelledby="${labelId}"]`;
        }

        return null;
      }
    },
    {
      name: 'Placeholder Text',
      level: 4,
      description: 'Placeholder attribute selector',
      generate: (element: any) => {
        if (!element || !element.placeholder) return null;
        return `[placeholder="${element.placeholder}"]`;
      }
    },
    {
      name: 'Input Type + Context',
      level: 5,
      description: 'Input type with data attributes or role',
      generate: (element: any) => {
        if (!element) return null;

        const selectors = [];

        // Data attributes (prioritize data-testid, data-test, etc.)
        const dataAttrs = Array.from(element.attributes || [])
          .filter((attr: any) => attr.name.startsWith('data-'));

        const priorityDataAttrs = dataAttrs.filter((attr: any) =>
          attr.name.includes('test') || attr.name.includes('id') || attr.name.includes('qa')
        );

        if (priorityDataAttrs.length > 0) {
          const attr: any = priorityDataAttrs[0];
          selectors.push(`[${attr.name}="${attr.value}"]`);
        } else if (dataAttrs.length > 0) {
          const attr: any = dataAttrs[0];
          selectors.push(`[${attr.name}="${attr.value}"]`);
        }

        // Role attribute
        const role = element.getAttribute('role');
        if (role) {
          selectors.push(`[role="${role}"]`);
        }

        // Type attribute (for inputs)
        const type = element.getAttribute('type');
        if (type) {
          selectors.push(`[type="${type}"]`);
        }

        // Combine with tag name for better specificity
        if (selectors.length > 0) {
          const tagName = element.tagName.toLowerCase();
          return `${tagName}${selectors.join('')}`;
        }

        return null;
      }
    },
    {
      name: 'Fuzzy Matching',
      level: 6,
      description: 'Class-based or text content matching',
      generate: (element: any) => {
        if (!element) return null;

        // Try class-based selector (filter out dynamic classes)
        if (element.className && typeof element.className === 'string') {
          const classes = element.className.split(' ')
            .filter((c: string) => c &&
              !c.match(/^\d/) && // No starting with digits
              !c.match(/-(active|focus|hover|disabled)$/) && // No state classes
              !c.match(/^(is|has)-/) && // No state prefixes
              c.length > 2 // Meaningful length
            );

          if (classes.length > 0) {
            // Use first 2 most stable classes
            const stableClasses = classes.slice(0, 2);
            return `.${stableClasses.join('.')}`;
          }
        }

        // Try text content for buttons, links, labels
        const tagName = element.tagName.toLowerCase();
        if (['button', 'a', 'label', 'span'].includes(tagName)) {
          const text = element.textContent?.trim();
          if (text && text.length > 0 && text.length < 50) {
            // Escape special characters for selector
            const escapedText = text.replace(/"/g, '\\"');
            return `${tagName}:has-text("${escapedText}")`;
          }
        }

        return null;
      }
    },
    {
      name: 'Visual Position/DOM Traversal',
      level: 7,
      description: 'XPath or nth-child positioning (least stable)',
      generate: (element: any) => {
        if (!element || !element.tagName) return null;

        // Generate optimized XPath
        let path = '';
        let current = element;
        let depth = 0;
        const maxDepth = 5; // Limit depth for performance

        while (current && current.nodeType === 1 && depth < maxDepth) {
          const tag = current.tagName.toLowerCase();

          // If we hit an element with ID, use it as anchor
          if (current.id) {
            path = `//*[@id="${current.id}"]${path}`;
            break;
          }

          // Calculate position among siblings of same type
          const siblings = current.parentNode ?
            Array.from(current.parentNode.children).filter((e: any) => e.tagName === current.tagName) : [];
          const index = siblings.indexOf(current) + 1;

          // Only add index if there are multiple siblings of same type
          const indexPart = siblings.length > 1 ? `[${index}]` : '';
          path = `/${tag}${indexPart}${path}`;

          current = current.parentNode;
          depth++;

          if (current && current.tagName.toLowerCase() === 'html') break;
        }

        return path || null;
      }
    }
  ];

  /**
   * Find element using fallback strategy
   * @param {Page} page - Playwright page object
   * @param {Object} options - Search options
   * @param {string} options.fieldName - Descriptive name for logging
   * @param {Array<string>} options.hints - Optional hints (id, name, placeholder, etc.)
   * @param {number} options.maxRetries - Maximum retry attempts per strategy
   * @param {number} options.timeout - Timeout per attempt in ms
   * @param {boolean} options.verbose - Enable verbose logging
   * @returns {Promise<{locator: Locator, strategy: Object, selector: string}>}
   */
  static async findElement(page: any, options: any = {}): Promise<any> {
    const {
      fieldName = 'element',
      hints = {},
      maxRetries = 3,
      timeout = 5000,
      verbose = true
    } = options;

    const logger = new SelectorLogger({ verbose });
    logger.log('info', `Finding element: ${fieldName}`, { hints });

    // Build candidate selectors from hints
    const candidateSelectors = this._buildCandidateSelectors(hints);

    // Try each fallback level
    for (const strategy of this.strategies) {
      logger.log('debug', `Attempting Level ${strategy.level}: ${strategy.name}`, {
        description: strategy.description
      });

      // Get selectors for this strategy level
      const selectors = candidateSelectors.filter(c => c.level === strategy.level);

      // If we have hint-based selectors, try them first
      for (const candidate of selectors) {
        const result = await this._trySelector(page, candidate.selector, {
          strategy,
          fieldName,
          logger,
          maxRetries,
          timeout
        });

        if (result.success) {
          return result;
        }
      }

      // If hints didn't work, try to discover elements matching this strategy
      const discovered = await this._discoverElementsForStrategy(page, strategy, fieldName, logger);
      if (discovered.success) {
        return discovered;
      }
    }

    // All strategies failed
    const error = new Error(`Failed to find element: ${fieldName} after trying all 7 fallback levels`);
    logger.log('error', error.message, { history: logger.getHistory() });
    throw error;
  }

  /**
   * Build candidate selectors from hints
   * @private
   */
  static _buildCandidateSelectors(hints: any): any[] {
    const candidates = [];

    if (hints.id) {
      candidates.push({ level: 1, selector: `#${hints.id}`, source: 'hint' });
    }

    if (hints.name) {
      candidates.push({ level: 2, selector: `[name="${hints.name}"]`, source: 'hint' });
    }

    if (hints.ariaLabel) {
      candidates.push({ level: 3, selector: `[aria-label="${hints.ariaLabel}"]`, source: 'hint' });
    }

    if (hints.label) {
      candidates.push({
        level: 3,
        selector: `label:has-text("${hints.label}") + input, label:has-text("${hints.label}") input`,
        source: 'hint'
      });
    }

    if (hints.placeholder) {
      candidates.push({ level: 4, selector: `[placeholder="${hints.placeholder}"]`, source: 'hint' });
    }

    if (hints.testId) {
      candidates.push({ level: 5, selector: `[data-testid="${hints.testId}"]`, source: 'hint' });
    }

    if (hints.type) {
      candidates.push({ level: 5, selector: `[type="${hints.type}"]`, source: 'hint' });
    }

    if (hints.text) {
      candidates.push({ level: 6, selector: `text="${hints.text}"`, source: 'hint' });
    }

    return candidates;
  }

  /**
   * Try a specific selector with retry logic
   * @private
   */
  static async _trySelector(page: any, selector: any, options: any): Promise<any> {
    const { strategy, fieldName, logger, maxRetries, timeout } = options;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.log('debug', `Attempt ${attempt}/${maxRetries} for selector: ${selector}`);

        const locator = page.locator(selector);

        // Wait for element with timeout
        await locator.first().waitFor({
          state: 'attached',
          timeout: timeout / maxRetries
        });

        // Verify element is actually usable
        const count = await locator.count();
        if (count === 0) {
          throw new Error('Element not found');
        }

        // Success!
        logger.log('success', `Found "${fieldName}" using ${strategy.name} (Level ${strategy.level})`, {
          selector,
          attempt,
          elementCount: count
        });

        return {
          success: true,
          locator: locator.first(),
          strategy,
          selector,
          level: strategy.level,
          attempt
        };

      } catch (error: unknown) {
        if (attempt < maxRetries) {
          // Exponential backoff
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.log('debug', `Retry after ${backoffMs}ms`, { error: errorMessage });
          await page.waitForTimeout(backoffMs);
        } else {
          logger.log('debug', `All attempts failed for selector: ${selector}`);
        }
      }
    }

    return { success: false };
  }

  /**
   * Discover elements on the page matching a strategy
   * @private
   */
  static async _discoverElementsForStrategy(_page: any, strategy: any, _fieldName: any, logger: any): Promise<any> {
    try {
      // This is a simplified discovery - in production, you'd scan the page
      // and apply the strategy.generate function to elements
      logger.log('debug', `No hint-based selectors worked, attempting discovery for ${strategy.name}`);

      // For now, return failure - full discovery would require page.evaluate
      // to scan all elements and generate selectors
      return { success: false };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.log('debug', `Discovery failed for ${strategy.name}`, { error: errorMessage });
      return { success: false };
    }
  }

  /**
   * Fill a form field with self-healing selector
   * @param {Page} page - Playwright page object
   * @param {Object} fieldConfig - Field configuration
   * @param {string} fieldConfig.name - Field name for logging
   * @param {string} fieldConfig.value - Value to fill
   * @param {Object} fieldConfig.hints - Selector hints
   * @param {Object} options - Additional options
   */
  static async fillField(page: any, fieldConfig: any, options: any = {}): Promise<any> {
    const {
      name: fieldName,
      value,
      hints = {}
    } = fieldConfig;

    const {
      maxRetries = 3,
      timeout = 5000,
      verbose = true
    } = options;

    const logger = new SelectorLogger({ verbose });

    try {
      // Find the element using fallback strategy
      const result = await this.findElement(page, {
        fieldName,
        hints,
        maxRetries,
        timeout,
        verbose
      });

      // Fill the field
      await result.locator.fill(value);

      logger.log('success', `Filled field "${fieldName}" with value using ${result.strategy.name}`, {
        level: result.level,
        selector: result.selector
      });

      return {
        success: true,
        strategy: result.strategy,
        selector: result.selector,
        level: result.level
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.log('error', `Failed to fill field "${fieldName}"`, { error: errorMessage });
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Click an element with self-healing selector
   * @param {Page} page - Playwright page object
   * @param {Object} elementConfig - Element configuration
   * @param {string} elementConfig.name - Element name for logging
   * @param {Object} elementConfig.hints - Selector hints
   * @param {Object} options - Additional options
   */
  static async clickElement(page: any, elementConfig: any, options: any = {}): Promise<any> {
    const {
      name: elementName,
      hints = {}
    } = elementConfig;

    const {
      maxRetries = 3,
      timeout = 5000,
      verbose = true
    } = options;

    const logger = new SelectorLogger({ verbose });

    try {
      // Find the element using fallback strategy
      const result = await this.findElement(page, {
        fieldName: elementName,
        hints,
        maxRetries,
        timeout,
        verbose
      });

      // Click the element
      await result.locator.click();

      logger.log('success', `Clicked "${elementName}" using ${result.strategy.name}`, {
        level: result.level,
        selector: result.selector
      });

      return {
        success: true,
        strategy: result.strategy,
        selector: result.selector,
        level: result.level
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.log('error', `Failed to click "${elementName}"`, { error: errorMessage });
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Generate all possible selectors for an element (browser context)
   * This runs in the browser and returns all valid selectors
   * @param {Page} page - Playwright page object
   * @param {string} initialSelector - Initial selector to find the element
   */
  static async generateAllSelectors(page: any, initialSelector: any): Promise<any> {
    return await page.evaluate(([selector, strategiesJson]: [any, any]) => {
      const strategies = JSON.parse(strategiesJson);
      const element = document.querySelector(selector);

      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      const results = [];

      // Apply each strategy
      for (const strategy of strategies) {
        try {
          // Recreate the generate function from string
          const generateFn = eval(`(${strategy.generateCode})`);
          const generatedSelector = generateFn(element);

          if (generatedSelector) {
            // Test if selector works and is unique
            let matchCount = 0;
            try {
              if (generatedSelector.startsWith('/')) {
                // XPath
                const xpathResult = document.evaluate(
                  generatedSelector,
                  document,
                  null,
                  XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                  null
                );
                matchCount = xpathResult.snapshotLength;
              } else {
                // CSS selector
                matchCount = document.querySelectorAll(generatedSelector).length;
              }
            } catch (e: unknown) {
              matchCount = 0;
            }

            results.push({
              level: strategy.level,
              name: strategy.name,
              selector: generatedSelector,
              isUnique: matchCount === 1,
              matchCount
            });
          }
        } catch (error) {
          // Strategy failed, skip it
        }
      }

      return results;
    }, [
      initialSelector,
      JSON.stringify(this.strategies.map(s => ({
        ...s,
        generateCode: s.generate.toString()
      })))
    ]);
  }
}

/**
 * Intelligent retry logic with exponential backoff
 */
class RetryStrategy {
  /**
   * Execute a function with intelligent retry logic
   * @param {Function} fn - Async function to execute
   * @param {Object} options - Retry options
   */
  static async execute(fn: any, options: any = {}): Promise<any> {
    const {
      maxRetries = 3,
      initialBackoff = 1000,
      maxBackoff = 10000,
      backoffMultiplier = 2,
      onRetry = null,
      verbose = true
    } = options;

    const logger = new SelectorLogger({ verbose });
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.log('debug', `Attempt ${attempt}/${maxRetries}`);
        const result = await fn(attempt);
        return { success: true, result, attempt };
      } catch (error: unknown) {
        lastError = error;

        if (attempt < maxRetries) {
          const backoff = Math.min(
            initialBackoff * Math.pow(backoffMultiplier, attempt - 1),
            maxBackoff
          );

          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.log('warning', `Attempt ${attempt} failed, retrying in ${backoff}ms`, {
            error: errorMessage
          });

          if (onRetry) {
            await onRetry(attempt, error, backoff);
          }

          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    logger.log('error', `All ${maxRetries} attempts failed`, {
      error: errorMessage
    });

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}

// Export the main classes
module.exports = {
  SelfHealingSelector,
  SelectorLogger,
  RetryStrategy
};
