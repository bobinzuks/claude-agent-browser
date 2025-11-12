/**
 * Popup Handler for Playwright
 *
 * Handles about:blank popups and ensures correct page focus
 * before clicking submit buttons or interacting with forms
 */

import { Page, BrowserContext } from 'playwright';

export interface PopupHandlerOptions {
  autoCloseBlank?: boolean;
  waitForLoad?: boolean;
  bringToFront?: boolean;
  focusDelay?: number;
}

export class PopupHandler {
  private context: BrowserContext;
  private targetPage: Page;
  private popupListeners: Set<(page: Page) => void> = new Set();

  constructor(context: BrowserContext, targetPage: Page) {
    this.context = context;
    this.targetPage = targetPage;
  }

  /**
   * Set up automatic popup handling
   */
  setupAutoHandler(options: PopupHandlerOptions = {}): void {
    const {
      autoCloseBlank = true,
      waitForLoad = true
    } = options;

    // Listen for new pages (popups, new tabs)
    this.context.on('page', async (newPage) => {
      console.log(`[PopupHandler] New page detected: ${newPage.url()}`);

      // Wait a moment for URL to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      const url = newPage.url();

      // Close about:blank popups
      if (autoCloseBlank && (url === 'about:blank' || url === '')) {
        console.log('[PopupHandler] Closing about:blank popup');
        await newPage.close();
        return;
      }

      // Wait for other pages to load if needed
      if (waitForLoad && url !== 'about:blank' && url !== '') {
        try {
          await newPage.waitForLoadState('domcontentloaded', { timeout: 5000 });
          console.log(`[PopupHandler] Page loaded: ${url}`);
        } catch (error) {
          console.warn(`[PopupHandler] Page load timeout: ${url}`);
        }
      }

      // Notify listeners
      this.notifyListeners(newPage);
    });
  }

  /**
   * Ensure target page has focus before interaction
   */
  async ensureFocus(options: PopupHandlerOptions = {}): Promise<void> {
    const {
      bringToFront = true,
      focusDelay = 200
    } = options;

    if (bringToFront) {
      await this.targetPage.bringToFront();
      console.log('[PopupHandler] Brought target page to front');
    }

    // Small delay to ensure focus is settled
    if (focusDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, focusDelay));
    }
  }

  /**
   * Click with automatic popup handling and focus management
   */
  async clickWithFocus(
    selector: string,
    options: {
      waitForVisible?: boolean;
      timeout?: number;
      force?: boolean;
    } = {}
  ): Promise<void> {
    const {
      waitForVisible = true,
      timeout = 10000,
      force = false
    } = options;

    // Ensure page has focus
    await this.ensureFocus();

    // Wait for page to be fully loaded
    await this.targetPage.waitForLoadState('domcontentloaded');

    // Wait for submit button to be ready
    const locator = this.targetPage.locator(selector);

    if (waitForVisible) {
      await locator.waitFor({ state: 'visible', timeout });
    }

    // Scroll into view
    await locator.scrollIntoViewIfNeeded();

    // Click it
    await locator.click({ force });

    console.log(`[PopupHandler] Clicked: ${selector}`);
  }

  /**
   * Wait for specific page to be ready (not about:blank)
   */
  async waitForRealPage(
    urlPattern?: string | RegExp,
    options: { timeout?: number } = {}
  ): Promise<Page> {
    const { timeout = 30000 } = options;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        // Check timeout
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Timeout waiting for real page'));
          return;
        }

        // Get all pages
        const pages = this.context.pages();

        for (const page of pages) {
          const url = page.url();

          // Skip about:blank
          if (url === 'about:blank' || url === '') {
            continue;
          }

          // Check URL pattern if provided
          if (urlPattern) {
            const matches = typeof urlPattern === 'string'
              ? url.includes(urlPattern)
              : urlPattern.test(url);

            if (matches) {
              clearInterval(checkInterval);
              resolve(page);
              return;
            }
          } else {
            // Any non-blank page
            clearInterval(checkInterval);
            resolve(page);
            return;
          }
        }
      }, 200);
    });
  }

  /**
   * Close all about:blank pages
   */
  async closeAllBlankPages(): Promise<number> {
    const pages = this.context.pages();
    let closedCount = 0;

    for (const page of pages) {
      const url = page.url();
      if (url === 'about:blank' || url === '') {
        await page.close();
        closedCount++;
      }
    }

    if (closedCount > 0) {
      console.log(`[PopupHandler] Closed ${closedCount} about:blank pages`);
    }

    return closedCount;
  }

  /**
   * Get the target page (main page)
   */
  getTargetPage(): Page {
    return this.targetPage;
  }

  /**
   * Get all non-blank pages
   */
  getRealPages(): Page[] {
    return this.context.pages().filter(page => {
      const url = page.url();
      return url !== 'about:blank' && url !== '';
    });
  }

  /**
   * Add listener for new pages
   */
  onNewPage(callback: (page: Page) => void): void {
    this.popupListeners.add(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback: (page: Page) => void): void {
    this.popupListeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(page: Page): void {
    this.popupListeners.forEach(listener => {
      try {
        listener(page);
      } catch (error) {
        console.error('[PopupHandler] Listener error:', error);
      }
    });
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.context.removeAllListeners('page');
    this.popupListeners.clear();
  }
}

/**
 * Standalone helper function for quick setup
 */
export async function handlePopupsAndClick(
  page: Page,
  selector: string,
  options: {
    autoCloseBlank?: boolean;
    waitForVisible?: boolean;
    timeout?: number;
  } = {}
): Promise<void> {
  const context = page.context();
  const handler = new PopupHandler(context, page);

  // Setup auto-handling
  handler.setupAutoHandler({
    autoCloseBlank: options.autoCloseBlank ?? true
  });

  // Click with focus
  await handler.clickWithFocus(selector, {
    waitForVisible: options.waitForVisible ?? true,
    timeout: options.timeout ?? 10000
  });
}
