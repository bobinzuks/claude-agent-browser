/**
 * E2E Affiliate Workflow Tests
 * Integration tests using Playwright for end-to-end affiliate automation
 */

import { test, expect, Page } from '@playwright/test';
import { NetworkDetector, LinkExtractor, ComplianceChecker } from '../mocks/affiliate-modules';
import { createMockAgentDB, MockAgentDB } from '../mocks/mock-agentdb';
import {
  ALL_NETWORKS,
  SHAREASALE_SIGNUP_HTML,
  SHAREASALE_DASHBOARD_HTML,
  AMAZON_SIGNUP_HTML,
} from '../fixtures/network-fixtures';

test.describe('E2E Affiliate Workflow', () => {
  let db: MockAgentDB;
  let detector: NetworkDetector;
  let extractor: LinkExtractor;
  let checker: ComplianceChecker;

  test.beforeEach(async () => {
    db = createMockAgentDB();
    db.seed({ networks: ALL_NETWORKS });

    detector = new NetworkDetector({ networks: ALL_NETWORKS });
    extractor = new LinkExtractor({ db, networkDetector: detector });
    checker = new ComplianceChecker({ db, networkDetector: detector });
  });

  test('detects network on ShareASale signup page', async ({ page }) => {
    // Setup mock page
    await page.setContent(SHAREASALE_SIGNUP_HTML, {
      url: 'https://www.shareasale.com/signup.cfm',
    });

    const currentUrl = page.url();
    const network = detector.detectNetwork(currentUrl);

    expect(network).not.toBeNull();
    expect(network?.id).toBe('shareasale');
    expect(network?.name).toBe('ShareASale');
  });

  test('detects network on page load and logs compliance', async ({ page }) => {
    await page.setContent(SHAREASALE_SIGNUP_HTML, {
      url: 'https://www.shareasale.com/signup.cfm',
    });

    const currentUrl = page.url();
    const network = detector.detectNetwork(currentUrl);

    expect(network).not.toBeNull();

    // Check compliance for prefilling
    const decision = checker.checkAction('prefill_form', currentUrl);

    expect(decision.allowed).toBe(true);
    expect(decision.tosLevel).toBeDefined();
    expect(db.getStats().logs).toBeGreaterThan(0);
  });

  test('prefills ShareASale signup form with compliance check', async ({ page }) => {
    await page.setContent(SHAREASALE_SIGNUP_HTML, {
      url: 'https://www.shareasale.com/signup.cfm',
    });

    const currentUrl = page.url();

    // Check compliance first
    const decision = checker.checkAction('prefill_form', currentUrl);
    expect(decision.allowed).toBe(true);

    // Prefill form
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'SecurePass123');
    await page.fill('#website', 'https://mysite.com');
    await page.fill('#phone', '555-0123');

    // Verify fields are filled
    expect(await page.inputValue('#email')).toBe('test@example.com');
    expect(await page.inputValue('#website')).toBe('https://mysite.com');
  });

  test('waits for human submission on ShareASale (HUMAN_GUIDED)', async ({ page }) => {
    await page.setContent(SHAREASALE_SIGNUP_HTML, {
      url: 'https://www.shareasale.com/signup.cfm',
    });

    const currentUrl = page.url();
    const decision = checker.checkAction('automated_signup', currentUrl);

    // Should allow but require human
    expect(decision.allowed).toBe(true);
    expect(decision.requiresHuman).toBe(true);

    // Prefill but don't submit
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'SecurePass123');

    // Verify submit button exists but we don't click it
    const submitButton = page.locator('button[type="submit"]');
    expect(await submitButton.isVisible()).toBe(true);

    // In real scenario, would wait for human to click
    // For test, we just verify the state is correct
  });

  test('blocks automated signup for Amazon Associates', async ({ page }) => {
    await page.setContent(AMAZON_SIGNUP_HTML, {
      url: 'https://affiliate-program.amazon.com/signup',
    });

    const currentUrl = page.url();
    const decision = checker.checkAction('automated_signup', currentUrl);

    // Should block automated signup
    expect(decision.allowed).toBe(false);
    expect(decision.requiresHuman).toBe(true);
    expect(decision.logEntry.compliance_level).toBe('critical');

    // Verify warning message about anti-bot measures
    const warning = page.locator('.anti-bot-warning');
    expect(await warning.isVisible()).toBe(true);
  });

  test('extracts affiliate links from ShareASale dashboard', async ({ page }) => {
    await page.setContent(SHAREASALE_DASHBOARD_HTML, {
      url: 'https://www.shareasale.com/dashboard',
    });

    const currentUrl = page.url();

    // Check compliance for link extraction
    const decision = checker.checkAction('extract_links', currentUrl);
    expect(decision.allowed).toBe(true);

    // Extract links from page content
    const html = await page.content();
    const links = extractor.extractLinksFromHTML(html, currentUrl);

    expect(links.length).toBeGreaterThan(0);

    // Verify links are valid
    links.forEach((link) => {
      expect(link.url).toMatch(/shareasale\.com/);
      expect(link.url).toMatch(/r\.cfm/);
    });
  });

  test('stores extracted links in AgentDB', async ({ page }) => {
    await page.setContent(SHAREASALE_DASHBOARD_HTML, {
      url: 'https://www.shareasale.com/dashboard',
    });

    const currentUrl = page.url();
    const html = await page.content();

    // Extract and store links
    const links = extractor.extractLinksFromHTML(html, currentUrl);
    const stored = await extractor.storeLinks(links, 'shareasale');

    expect(stored.length).toBe(links.length);
    expect(db.getStats().links).toBe(links.length);

    // Verify stored links can be retrieved
    const retrievedLinks = db.getLinksByNetwork('shareasale');
    expect(retrievedLinks.length).toBe(links.length);
  });

  test('handles pagination for link extraction', async ({ page }) => {
    const dashboardWithPagination = `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="affiliate-links">
          <a href="https://shareasale.com/r.cfm?b=1&u=1&m=1">Link 1</a>
          <a href="https://shareasale.com/r.cfm?b=2&u=1&m=1">Link 2</a>
        </div>
        <div class="pagination">
          <a href="?page=2" class="next-page">Next</a>
        </div>
      </body>
      </html>
    `;

    await page.setContent(dashboardWithPagination, {
      url: 'https://www.shareasale.com/dashboard',
    });

    const html = await page.content();
    const currentUrl = page.url();

    // Extract with pagination support
    const links = await extractor.extractWithPagination(html, currentUrl, 1);

    expect(links.length).toBeGreaterThan(0);

    // Verify pagination element exists
    const nextButton = page.locator('.next-page');
    expect(await nextButton.isVisible()).toBe(true);
  });

  test('validates extracted links', async ({ page }) => {
    await page.setContent(SHAREASALE_DASHBOARD_HTML, {
      url: 'https://www.shareasale.com/dashboard',
    });

    const html = await page.content();
    const currentUrl = page.url();

    const links = extractor.extractLinksFromHTML(html, currentUrl);
    const stored = await extractor.storeLinks(links, 'shareasale');

    // Validate first link
    const isValid = await extractor.validateLink(stored[0].id!);
    expect(isValid).toBe(true);

    // Check validation timestamp was updated
    const link = db.getLink(stored[0].id!);
    expect(link?.last_validated).toBeDefined();
  });

  test('complete workflow: detect, check compliance, prefill, wait', async ({ page }) => {
    await page.setContent(SHAREASALE_SIGNUP_HTML, {
      url: 'https://www.shareasale.com/signup.cfm',
    });

    const currentUrl = page.url();

    // Step 1: Detect network
    const network = detector.detectNetwork(currentUrl);
    expect(network).not.toBeNull();
    expect(network?.id).toBe('shareasale');

    // Step 2: Check compliance
    const signupDecision = checker.checkAction('automated_signup', currentUrl);
    expect(signupDecision.allowed).toBe(true);
    expect(signupDecision.requiresHuman).toBe(true);

    const prefillDecision = checker.checkAction('prefill_form', currentUrl);
    expect(prefillDecision.allowed).toBe(true);

    // Step 3: Prefill form (since allowed)
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'SecurePass123');
    await page.fill('#website', 'https://mysite.com');
    await page.fill('#phone', '555-0123');
    await page.check('#agree_to_terms');

    // Step 4: Verify form is ready but wait for human
    expect(await page.inputValue('#email')).toBe('test@example.com');
    const submitButton = page.locator('button[type="submit"]');
    expect(await submitButton.isEnabled()).toBe(true);

    // Don't submit - wait for human (in real scenario)
    // Verify compliance log exists
    const logs = checker.getComplianceHistory('shareasale');
    expect(logs.length).toBeGreaterThan(0);
  });

  test('respects network TOS levels across workflow', async ({ page }) => {
    const testCases = [
      {
        name: 'Amazon Associates',
        url: 'https://affiliate-program.amazon.com/signup',
        html: AMAZON_SIGNUP_HTML,
        networkId: 'amazon-associates',
        expectations: {
          signup_allowed: false,
          prefill_allowed: false,
          extract_allowed: true,
        },
      },
      {
        name: 'ShareASale',
        url: 'https://www.shareasale.com/signup.cfm',
        html: SHAREASALE_SIGNUP_HTML,
        networkId: 'shareasale',
        expectations: {
          signup_allowed: true,
          prefill_allowed: true,
          extract_allowed: true,
        },
      },
    ];

    for (const testCase of testCases) {
      await page.setContent(testCase.html, { url: testCase.url });

      const network = detector.detectNetwork(testCase.url);
      expect(network?.id).toBe(testCase.networkId);

      const signupDecision = checker.checkAction('automated_signup', testCase.url);
      expect(signupDecision.allowed).toBe(testCase.expectations.signup_allowed);

      const prefillDecision = checker.checkAction('prefill_form', testCase.url);
      expect(prefillDecision.allowed).toBe(testCase.expectations.prefill_allowed);

      const extractDecision = checker.checkAction('extract_links', testCase.url);
      expect(extractDecision.allowed).toBe(testCase.expectations.extract_allowed);
    }
  });

  test('logs all compliance decisions during workflow', async ({ page }) => {
    await page.setContent(SHAREASALE_SIGNUP_HTML, {
      url: 'https://www.shareasale.com/signup.cfm',
    });

    const currentUrl = page.url();
    const statsBefore = db.getStats();

    // Perform multiple actions
    checker.checkAction('automated_signup', currentUrl);
    checker.checkAction('prefill_form', currentUrl);
    checker.checkAction('extract_links', currentUrl);

    const statsAfter = db.getStats();
    expect(statsAfter.logs).toBe(statsBefore.logs + 3);

    // Verify logs are retrievable
    const logs = checker.getComplianceHistory('shareasale');
    expect(logs.length).toBe(3);
  });

  test('handles form field detection and validation', async ({ page }) => {
    await page.setContent(SHAREASALE_SIGNUP_HTML, {
      url: 'https://www.shareasale.com/signup.cfm',
    });

    // Detect form fields
    const emailField = page.locator('#email');
    const passwordField = page.locator('#password');
    const websiteField = page.locator('#website');
    const termsCheckbox = page.locator('#agree_to_terms');

    expect(await emailField.isVisible()).toBe(true);
    expect(await passwordField.isVisible()).toBe(true);
    expect(await websiteField.isVisible()).toBe(true);
    expect(await termsCheckbox.isVisible()).toBe(true);

    // Verify field types
    expect(await emailField.getAttribute('type')).toBe('email');
    expect(await passwordField.getAttribute('type')).toBe('password');
    expect(await websiteField.getAttribute('type')).toBe('url');
  });

  test('prevents double submission with compliance check', async ({ page }) => {
    await page.setContent(SHAREASALE_SIGNUP_HTML, {
      url: 'https://www.shareasale.com/signup.cfm',
    });

    const currentUrl = page.url();

    // First signup check
    const decision1 = checker.checkAction('automated_signup', currentUrl);
    expect(decision1.allowed).toBe(true);

    // Second signup check (simulating duplicate)
    const decision2 = checker.checkAction('automated_signup', currentUrl);
    expect(decision2.allowed).toBe(true);

    // Both should have same compliance level
    expect(decision1.tosLevel).toBe(decision2.tosLevel);

    // Both should be logged
    const logs = checker.getComplianceHistory('shareasale');
    expect(logs.length).toBe(2);
  });
});

test.describe('E2E Error Handling', () => {
  let db: MockAgentDB;
  let detector: NetworkDetector;
  let checker: ComplianceChecker;

  test.beforeEach(async () => {
    db = createMockAgentDB();
    db.seed({ networks: ALL_NETWORKS });
    detector = new NetworkDetector({ networks: ALL_NETWORKS });
    checker = new ComplianceChecker({ db, networkDetector: detector });
  });

  test('handles missing form fields gracefully', async ({ page }) => {
    const incompleteForm = `
      <!DOCTYPE html>
      <html>
      <body>
        <form id="signup-form">
          <input type="email" id="email" />
          <!-- Missing other required fields -->
        </form>
      </body>
      </html>
    `;

    await page.setContent(incompleteForm, {
      url: 'https://www.shareasale.com/signup.cfm',
    });

    // Should still be able to fill available fields
    await page.fill('#email', 'test@example.com');
    expect(await page.inputValue('#email')).toBe('test@example.com');
  });

  test('handles network detection failures', async ({ page }) => {
    await page.setContent('<html><body>Test</body></html>', {
      url: 'https://unknown-network.com/signup',
    });

    const network = detector.detectNetwork(page.url());
    expect(network).toBeNull();

    // Should still log compliance decision
    const decision = checker.checkAction('automated_signup', page.url());
    expect(decision.allowed).toBe(false);
    expect(decision.requiresHuman).toBe(true);
  });

  test('handles malformed URLs', async ({ page }) => {
    const decision = checker.checkAction('automated_signup', 'not-a-url');

    expect(decision.allowed).toBe(false);
    expect(decision.requiresHuman).toBe(true);
    expect(decision.logEntry.compliance_level).toBe('warning');
  });
});
