/**
 * SPA Detector Utility
 * Detects Single Page Application frameworks and waits for hydration
 */

import { type Frame } from 'playwright';

export interface HydrationOptions {
  timeout?: number;
  framework?: string;
}

/**
 * Utility class for detecting and handling SPA frameworks
 */
export class SPADetector {
  /**
   * Detect which SPA framework is being used
   */
  async detectFramework(frame: Frame): Promise<string> {
    try {
      const framework = await frame.evaluate(() => {
        // Check for React
        if ((window as any).React || document.querySelector('[data-reactroot]') || document.querySelector('[data-reactid]')) {
          return 'React';
        }

        // Check for Vue
        if ((window as any).Vue || (window as any).__VUE__) {
          return 'Vue';
        }

        // Check for Angular
        if ((window as any).ng || document.querySelector('[ng-version]')) {
          return 'Angular';
        }

        // Check for Next.js
        if ((window as any).__NEXT_DATA__) {
          return 'Next.js';
        }

        // Check for Svelte
        if ((window as any).__SVELTE__) {
          return 'Svelte';
        }

        // Check for Nuxt.js
        if ((window as any).__NUXT__) {
          return 'Nuxt.js';
        }

        return 'unknown';
      });

      return framework;
    } catch (error) {
      console.error('[SPADetector] Error detecting framework:', error);
      return 'unknown';
    }
  }

  /**
   * Wait for SPA to hydrate and become interactive
   */
  async waitForHydration(frame: Frame, options: HydrationOptions = {}): Promise<void> {
    const timeout = options.timeout || 5000;
    const framework = options.framework || await this.detectFramework(frame);

    try {
      // Wait for DOM content to be loaded
      await frame.waitForLoadState('domcontentloaded', { timeout });

      // Framework-specific hydration checks
      if (framework === 'React' || framework === 'Next.js') {
        await this.waitForReactHydration(frame, timeout);
      } else if (framework === 'Vue' || framework === 'Nuxt.js') {
        await this.waitForVueHydration(frame, timeout);
      } else if (framework === 'Angular') {
        await this.waitForAngularHydration(frame, timeout);
      } else {
        // Generic wait for unknown frameworks
        await frame.waitForTimeout(500);
      }

      // Additional buffer to ensure everything is ready
      await frame.waitForTimeout(300);
    } catch (error) {
      console.error('[SPADetector] Error waiting for hydration:', error);
      // Continue anyway - site might still be usable
    }
  }

  /**
   * Wait for React hydration to complete
   */
  private async waitForReactHydration(frame: Frame, _timeout: number): Promise<void> {
    try {
      await frame.evaluate(() => {
        return new Promise<void>((resolve) => {
          // Check if React is hydrating
          if ((window as any)._reactRootContainer || document.querySelector('[data-reactroot]')) {
            // Wait for React to finish hydration
            const checkHydration = () => {
              // React hydration is complete when the app is interactive
              if (document.querySelector('[data-reactroot]') && document.readyState === 'complete') {
                resolve();
              } else {
                requestAnimationFrame(checkHydration);
              }
            };
            checkHydration();
          } else {
            resolve();
          }
        });
      }).catch(() => {
        // Timeout or error - continue anyway
      });

      // Additional wait for React effects to run
      await frame.waitForTimeout(500);
    } catch (error) {
      // Continue if evaluation fails
    }
  }

  /**
   * Wait for Vue hydration to complete
   */
  private async waitForVueHydration(frame: Frame, _timeout: number): Promise<void> {
    try {
      await frame.evaluate(() => {
        return new Promise<void>((resolve) => {
          if ((window as any).Vue || (window as any).__VUE__) {
            // Vue hydration check
            const checkVue = () => {
              if (document.readyState === 'complete') {
                resolve();
              } else {
                requestAnimationFrame(checkVue);
              }
            };
            checkVue();
          } else {
            resolve();
          }
        });
      }).catch(() => {});

      await frame.waitForTimeout(500);
    } catch (error) {
      // Continue if evaluation fails
    }
  }

  /**
   * Wait for Angular hydration to complete
   */
  private async waitForAngularHydration(frame: Frame, _timeout: number): Promise<void> {
    try {
      await frame.evaluate(() => {
        return new Promise<void>((resolve) => {
          if ((window as any).ng) {
            // Angular stability check
            const checkAngular = () => {
              if (document.readyState === 'complete') {
                resolve();
              } else {
                requestAnimationFrame(checkAngular);
              }
            };
            checkAngular();
          } else {
            resolve();
          }
        });
      }).catch(() => {});

      await frame.waitForTimeout(500);
    } catch (error) {
      // Continue if evaluation fails
    }
  }
}
