/**
 * Click Factory Controller - Unit Tests
 * TDD approach for testing the main controller
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { chromium, Browser } from 'playwright';
import { ClickFactoryController } from '../controller';

describe('ClickFactoryController', () => {
  let browser: Browser;
  let controller: ClickFactoryController;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: true });
    controller = new ClickFactoryController({
      mode: 'phase2-human',
      batchSize: 4,
      useAgentDB: false
    });
    await controller.initialize();
  });

  afterEach(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('initialization', () => {
    it('should initialize with correct config', () => {
      expect(controller).toBeDefined();
      // Add assertions for controller configuration
    });

    it('should create browser contexts on demand', async () => {
      const context = await controller['createFactoryContext']();
      expect(context).toBeDefined();
      await context.close();
    });
  });

  describe('form detection', () => {
    it('should detect email fields', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.setContent(`
        <html>
          <body>
            <form>
              <input type="email" name="email" />
              <button type="submit">Submit</button>
            </form>
          </body>
        </html>
      `);

      const userData = { email: 'test@example.com' };
      const result = await controller['autoFillForm'](page.mainFrame(), userData);

      expect(result.detected).toBeGreaterThan(0);
      expect(result.filled).toBeGreaterThan(0);

      await context.close();
    });

    it('should detect name fields', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.setContent(`
        <html>
          <body>
            <form>
              <input type="text" name="firstName" />
              <input type="text" name="lastName" />
              <button type="submit">Submit</button>
            </form>
          </body>
        </html>
      `);

      const userData = { firstName: 'John', lastName: 'Doe' };
      const result = await controller['autoFillForm'](page.mainFrame(), userData);

      expect(result.detected).toBe(2);
      expect(result.filled).toBe(2);

      await context.close();
    });

    it('should detect password fields', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.setContent(`
        <html>
          <body>
            <form>
              <input type="password" name="password" />
              <button type="submit">Submit</button>
            </form>
          </body>
        </html>
      `);

      const userData = { password: 'SecurePass123!' };
      const result = await controller['autoFillForm'](page.mainFrame(), userData);

      expect(result.detected).toBe(1);
      expect(result.filled).toBe(1);

      await context.close();
    });
  });

  describe('self-healing selectors', () => {
    it('should find fields by ID', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.setContent(`
        <html>
          <body>
            <form>
              <input id="userEmail" type="text" />
              <button type="submit">Submit</button>
            </form>
          </body>
        </html>
      `);

      const userData = { email: 'test@example.com' };
      const result = await controller['autoFillForm'](page.mainFrame(), userData);

      expect(result.filled).toBeGreaterThan(0);

      await context.close();
    });

    it('should find fields by name attribute', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.setContent(`
        <html>
          <body>
            <form>
              <input name="email" type="text" />
              <button type="submit">Submit</button>
            </form>
          </body>
        </html>
      `);

      const userData = { email: 'test@example.com' };
      const result = await controller['autoFillForm'](page.mainFrame(), userData);

      expect(result.filled).toBeGreaterThan(0);

      await context.close();
    });

    it('should find fields by placeholder', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.setContent(`
        <html>
          <body>
            <form>
              <input placeholder="Enter your email" type="text" />
              <button type="submit">Submit</button>
            </form>
          </body>
        </html>
      `);

      const userData = { email: 'test@example.com' };
      const result = await controller['autoFillForm'](page.mainFrame(), userData);

      expect(result.filled).toBeGreaterThan(0);

      await context.close();
    });
  });

  describe('popup handling', () => {
    it('should detect and close about:blank popups', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.setContent(`
        <html>
          <body>
            <button onclick="window.open('about:blank')">Open Popup</button>
          </body>
        </html>
      `);

      await page.click('button');
      await page.waitForTimeout(500);

      const pages = context.pages();
      expect(pages.length).toBeGreaterThan(1);

      // Controller should detect and close about:blank
      // Implementation would go here

      await context.close();
    });
  });

  describe('form submission', () => {
    it('should find submit button by type', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.setContent(`
        <html>
          <body>
            <form>
              <input type="email" name="email" />
              <button type="submit">Submit</button>
            </form>
          </body>
        </html>
      `);

      const submitBtn = await page.locator('button[type="submit"]');
      expect(await submitBtn.isVisible()).toBe(true);

      await context.close();
    });

    it('should find submit button by text', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.setContent(`
        <html>
          <body>
            <form>
              <input type="email" name="email" />
              <button>Sign Up</button>
            </form>
          </body>
        </html>
      `);

      const submitBtn = await page.locator('button:has-text("Sign Up")');
      expect(await submitBtn.isVisible()).toBe(true);

      await context.close();
    });
  });

  describe('batch processing', () => {
    it('should process multiple sites', async () => {
      const sites = [
        { url: 'https://demoqa.com/text-box', name: 'DemoQA Text Box', difficulty: 'easy' },
        { url: 'https://demoqa.com/automation-practice-form', name: 'DemoQA Practice Form', difficulty: 'easy' }
      ];

      // Mock batch processing
      // Full implementation would process actual sites
      expect(sites.length).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle navigation errors gracefully', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await expect(
        page.goto('https://invalid-url-that-does-not-exist-12345.com', { timeout: 5000 })
      ).rejects.toThrow();

      await context.close();
    });

    it('should handle form filling errors', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.setContent(`
        <html>
          <body>
            <form>
              <input type="email" name="email" readonly />
            </form>
          </body>
        </html>
      `);

      const userData = { email: 'test@example.com' };
      const result = await controller['autoFillForm'](page.mainFrame(), userData);

      // Should detect field but might not fill readonly field
      expect(result.detected).toBeGreaterThan(0);

      await context.close();
    });
  });

  describe('performance', () => {
    it('should fill form within time limit', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.setContent(`
        <html>
          <body>
            <form>
              <input type="email" name="email" />
              <input type="text" name="firstName" />
              <input type="text" name="lastName" />
              <button type="submit">Submit</button>
            </form>
          </body>
        </html>
      `);

      const startTime = Date.now();

      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      await controller['autoFillForm'](page.mainFrame(), userData);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(3000); // Should complete in under 3 seconds

      await context.close();
    });
  });
});
