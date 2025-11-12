/**
 * DOM Manipulator Tests
 * BOSS 3: The DOM Manipulator
 * @jest-environment jsdom
 */

import { DOMManipulator } from '../../extension/content/dom-manipulator';

describe('DOM Manipulator', () => {
  let manipulator: DOMManipulator;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="signup-form">
        <input type="email" id="email" name="email" />
        <input type="password" id="password" name="password" />
        <input type="text" class="username" name="username" />
        <button type="submit" id="submit-btn">Sign Up</button>
      </form>
      <div id="result"></div>
      <iframe id="test-frame"></iframe>
    `;
    manipulator = new DOMManipulator(document);
  });

  describe('Element Selection', () => {
    it('should find element by ID', () => {
      const element = manipulator.findElement('#email');
      expect(element).toBeTruthy();
      expect(element?.id).toBe('email');
    });

    it('should find element by class', () => {
      const element = manipulator.findElement('.username');
      expect(element).toBeTruthy();
      expect((element as HTMLInputElement)?.name).toBe('username');
    });

    it('should find element by tag and type', () => {
      const element = manipulator.findElement('input[type="password"]');
      expect(element).toBeTruthy();
      expect(element?.id).toBe('password');
    });

    it('should return null for non-existent element', () => {
      const element = manipulator.findElement('#non-existent');
      expect(element).toBeNull();
    });

    it('should find elements in shadow DOM', () => {
      // Create element with shadow root
      const host = document.createElement('div');
      const shadow = host.attachShadow({ mode: 'open' });
      const input = document.createElement('input');
      input.id = 'shadow-input';
      shadow.appendChild(input);
      document.body.appendChild(host);

      const element = manipulator.findElement('#shadow-input', { includeShadowDOM: true });
      expect(element).toBeTruthy();
      expect(element?.id).toBe('shadow-input');
    });
  });

  describe('Form Filling', () => {
    it('should fill input field', () => {
      const success = manipulator.fillField('#email', 'test@example.com');
      expect(success).toBe(true);
      const input = document.querySelector('#email') as HTMLInputElement;
      expect(input.value).toBe('test@example.com');
    });

    it('should fill password field', () => {
      const success = manipulator.fillField('#password', 'SecurePass123');
      expect(success).toBe(true);
      const input = document.querySelector('#password') as HTMLInputElement;
      expect(input.value).toBe('SecurePass123');
    });

    it('should return false for non-existent field', () => {
      const success = manipulator.fillField('#non-existent', 'value');
      expect(success).toBe(false);
    });

    it('should handle special characters in values', () => {
      const specialValue = 'test@123!#$%';
      const success = manipulator.fillField('#email', specialValue);
      expect(success).toBe(true);
      const input = document.querySelector('#email') as HTMLInputElement;
      expect(input.value).toBe(specialValue);
    });

    it('should trigger input events', () => {
      const input = document.querySelector('#email') as HTMLInputElement;
      let eventFired = false;
      input.addEventListener('input', () => {
        eventFired = true;
      });

      manipulator.fillField('#email', 'test@example.com');
      expect(eventFired).toBe(true);
    });
  });

  describe('Click Simulation', () => {
    it('should click button element', () => {
      let clicked = false;
      const button = document.querySelector('#submit-btn');
      button?.addEventListener('click', () => {
        clicked = true;
      });

      const success = manipulator.clickElement('#submit-btn');
      expect(success).toBe(true);
      expect(clicked).toBe(true);
    });

    it('should return false for non-existent element', () => {
      const success = manipulator.clickElement('#non-existent');
      expect(success).toBe(false);
    });

    it('should handle click on disabled element', () => {
      const button = document.querySelector('#submit-btn') as HTMLButtonElement;
      button.disabled = true;

      const success = manipulator.clickElement('#submit-btn');
      expect(success).toBe(true); // Click still fires, but button won't respond
    });
  });

  describe('Smart Selector Generation', () => {
    it('should generate selector for email field by type', () => {
      const selector = manipulator.smartSelector('email');
      expect(selector).toContain('input');
      expect(selector).toContain('email');
    });

    it('should generate selector for password field', () => {
      const selector = manipulator.smartSelector('password');
      expect(selector).toContain('input');
      expect(selector).toContain('password');
    });

    it('should generate selector for submit button', () => {
      const selector = manipulator.smartSelector('submit');
      expect(selector).toMatch(/button|input.*submit/i);
    });

    it('should find element using smart selector', () => {
      const selector = manipulator.smartSelector('email');
      const element = manipulator.findElement(selector);
      expect(element).toBeTruthy();
    });
  });

  describe('Dynamic Content Handling', () => {
    it('should find element immediately if already present', async () => {
      const element = await manipulator.waitForElement('#email', 100);
      expect(element).toBeTruthy();
    });

    // TODO: Add async tests when test environment supports timers properly
    it.skip('should wait for element to appear', async () => {
      // Skipped due to test environment limitations
    });

    it.skip('should timeout if element never appears', async () => {
      // Skipped due to test environment limitations
    });
  });

  describe('Iframe Handling', () => {
    it('should detect iframe presence', () => {
      const hasIframe = manipulator.hasIframes();
      expect(hasIframe).toBe(true);
    });

    it('should find elements in iframes', () => {
      // Setup iframe with content
      const iframe = document.querySelector('#test-frame') as HTMLIFrameElement;
      const iframeDoc = iframe.contentDocument;
      if (iframeDoc) {
        const input = iframeDoc.createElement('input');
        input.id = 'iframe-input';
        iframeDoc.body.appendChild(input);

        const element = manipulator.findElement('#iframe-input', { includeIframes: true });
        expect(element).toBeTruthy();
      }
    });
  });
});
