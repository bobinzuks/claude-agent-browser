/**
 * DOM Manipulator
 * Handles DOM interactions, element selection, and form manipulation
 */

interface FindElementOptions {
  includeShadowDOM?: boolean;
  includeIframes?: boolean;
}

export class DOMManipulator {
  private document: Document;

  constructor(document: Document) {
    this.document = document;
  }

  /**
   * Find an element using CSS selector
   */
  public findElement(selector: string, options: FindElementOptions = {}): Element | null {
    // Try regular DOM first
    let element = this.document.querySelector(selector);
    if (element) return element;

    // Search in shadow DOM if requested
    if (options.includeShadowDOM) {
      element = this.findInShadowDOM(selector);
      if (element) return element;
    }

    // Search in iframes if requested
    if (options.includeIframes) {
      element = this.findInIframes(selector);
      if (element) return element;
    }

    return null;
  }

  /**
   * Fill a form field with value
   */
  public fillField(selector: string, value: string): boolean {
    const element = this.findElement(selector);
    if (!element) return false;

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = value;

      // Trigger input and change events for React/Vue compatibility
      this.triggerEvent(element, 'input');
      this.triggerEvent(element, 'change');

      return true;
    }

    return false;
  }

  /**
   * Click an element
   */
  public clickElement(selector: string): boolean {
    const element = this.findElement(selector);
    if (!element) return false;

    if (element instanceof HTMLElement) {
      element.click();
      return true;
    }

    return false;
  }

  /**
   * Generate smart selector for common field types
   */
  public smartSelector(fieldType: string): string {
    const selectors: Record<string, string> = {
      email: 'input[type="email"], input[name*="email" i], input[id*="email" i]',
      password:
        'input[type="password"], input[name*="password" i], input[id*="password" i]',
      username:
        'input[name*="username" i], input[id*="username" i], input[name*="user" i]',
      submit:
        'button[type="submit"], input[type="submit"], button:contains("submit"), button:contains("sign")',
    };

    return selectors[fieldType.toLowerCase()] || `[name*="${fieldType}" i]`;
  }

  /**
   * Wait for an element to appear in the DOM
   */
  public async waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
    // Check if element already exists
    const existing = this.findElement(selector);
    if (existing) return existing;

    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const element = this.findElement(selector);
        if (element) {
          observer.disconnect();
          clearTimeout(timeoutId);
          resolve(element);
        }
      });

      const timeoutId = setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);

      observer.observe(this.document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  /**
   * Check if page has iframes
   */
  public hasIframes(): boolean {
    return this.document.querySelectorAll('iframe').length > 0;
  }

  /**
   * Find element in Shadow DOM
   */
  private findInShadowDOM(selector: string): Element | null {
    const allElements = this.document.querySelectorAll('*');

    for (const element of Array.from(allElements)) {
      if (element.shadowRoot) {
        const found = element.shadowRoot.querySelector(selector);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Find element in iframes
   */
  private findInIframes(selector: string): Element | null {
    const iframes = this.document.querySelectorAll('iframe');

    for (const iframe of Array.from(iframes)) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const element = iframeDoc.querySelector(selector);
          if (element) return element;
        }
      } catch (e) {
        // Cross-origin iframe, skip
        continue;
      }
    }

    return null;
  }

  /**
   * Trigger an event on an element
   */
  private triggerEvent(element: HTMLElement, eventType: string): void {
    const event = new Event(eventType, {
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(event);
  }
}
