/**
 * Test Utilities and Helpers
 * Common utilities for affiliate automation tests
 */

import { Page } from '@playwright/test';
import { MockAgentDB } from '../mocks/mock-agentdb';
import {
  AffiliateNetwork,
  AffiliateLink,
  SignupWorkflow,
  FormField,
  TOSLevel,
} from '../../../src/database/affiliate-types';

// ============================================================================
// Database Helpers
// ============================================================================

/**
 * Seeds database with test data
 */
export async function seedTestDatabase(
  db: MockAgentDB,
  options: {
    networks?: AffiliateNetwork[];
    links?: AffiliateLink[];
    workflows?: SignupWorkflow[];
  }
): Promise<void> {
  db.seed(options);
}

/**
 * Clears all data from mock database
 */
export function clearDatabase(db: MockAgentDB): void {
  db.clear();
}

/**
 * Gets database statistics
 */
export function getDatabaseStats(db: MockAgentDB) {
  return db.getStats();
}

// ============================================================================
// Network Test Helpers
// ============================================================================

/**
 * Creates a test network
 */
export function createTestNetwork(overrides?: Partial<AffiliateNetwork>): AffiliateNetwork {
  const now = Date.now();
  return {
    id: 'test-network',
    name: 'Test Network',
    domain: 'test-network.com',
    tos_level: TOSLevel.HUMAN_GUIDED,
    api_available: false,
    signup_url: 'https://test-network.com/signup',
    dashboard_url: 'https://test-network.com/dashboard',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Creates a test link
 */
export function createTestLink(
  networkId: string,
  overrides?: Partial<AffiliateLink>
): AffiliateLink {
  const now = Date.now();
  return {
    id: Math.floor(Math.random() * 10000),
    network_id: networkId,
    url: `https://${networkId}.com/affiliate?ref=test`,
    product_name: 'Test Product',
    commission: '20%',
    extracted_at: now,
    is_active: true,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Creates test form fields
 */
export function createTestFormFields(): FormField[] {
  return [
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      required: true,
      autocomplete: 'email',
    },
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      required: true,
      sensitive: true,
    },
    {
      name: 'website',
      type: 'url',
      label: 'Website',
      required: true,
    },
  ];
}

// ============================================================================
// Page Helpers (Playwright)
// ============================================================================

/**
 * Waits for network detection to complete
 */
export async function waitForNetworkDetection(page: Page, timeout: number = 3000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Fills form with test data
 */
export async function fillSignupForm(
  page: Page,
  data: {
    email?: string;
    password?: string;
    website?: string;
    phone?: string;
  }
): Promise<void> {
  if (data.email) {
    const emailField = page.locator('input[type="email"], input#email, input[name="email"]');
    if (await emailField.isVisible()) {
      await emailField.fill(data.email);
    }
  }

  if (data.password) {
    const passwordField = page.locator(
      'input[type="password"], input#password, input[name="password"]'
    );
    if (await passwordField.isVisible()) {
      await passwordField.fill(data.password);
    }
  }

  if (data.website) {
    const websiteField = page.locator(
      'input[type="url"], input#website, input[name="website"]'
    );
    if (await websiteField.isVisible()) {
      await websiteField.fill(data.website);
    }
  }

  if (data.phone) {
    const phoneField = page.locator('input[type="tel"], input#phone, input[name="phone"]');
    if (await phoneField.isVisible()) {
      await phoneField.fill(data.phone);
    }
  }
}

/**
 * Extracts all links from page
 */
export async function extractAllLinks(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    return links.map((link) => link.href).filter((href) => href);
  });
}

/**
 * Checks if form is valid and ready for submission
 */
export async function isFormValid(page: Page, formSelector: string = 'form'): Promise<boolean> {
  return await page.evaluate((selector) => {
    const form = document.querySelector(selector) as HTMLFormElement;
    if (!form) return false;
    return form.checkValidity();
  }, formSelector);
}

/**
 * Gets form validation errors
 */
export async function getFormErrors(page: Page, formSelector: string = 'form'): Promise<string[]> {
  return await page.evaluate((selector) => {
    const form = document.querySelector(selector) as HTMLFormElement;
    if (!form) return [];

    const errors: string[] = [];
    const elements = form.elements;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLInputElement;
      if (element.validationMessage) {
        errors.push(`${element.name}: ${element.validationMessage}`);
      }
    }

    return errors;
  }, formSelector);
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Asserts network was detected correctly
 */
export function assertNetworkDetected(
  network: AffiliateNetwork | null,
  expectedId: string,
  expectedName: string
): void {
  if (!network) {
    throw new Error(`Network not detected, expected ${expectedId}`);
  }

  if (network.id !== expectedId) {
    throw new Error(`Expected network ID ${expectedId}, got ${network.id}`);
  }

  if (network.name !== expectedName) {
    throw new Error(`Expected network name ${expectedName}, got ${network.name}`);
  }
}

/**
 * Asserts compliance decision
 */
export function assertComplianceDecision(
  decision: {
    allowed: boolean;
    requiresHuman: boolean;
    tosLevel: TOSLevel;
  },
  expected: {
    allowed: boolean;
    requiresHuman: boolean;
    tosLevel: TOSLevel;
  }
): void {
  if (decision.allowed !== expected.allowed) {
    throw new Error(
      `Expected allowed=${expected.allowed}, got allowed=${decision.allowed}`
    );
  }

  if (decision.requiresHuman !== expected.requiresHuman) {
    throw new Error(
      `Expected requiresHuman=${expected.requiresHuman}, got requiresHuman=${decision.requiresHuman}`
    );
  }

  if (decision.tosLevel !== expected.tosLevel) {
    throw new Error(
      `Expected tosLevel=${expected.tosLevel}, got tosLevel=${decision.tosLevel}`
    );
  }
}

// ============================================================================
// Mock Response Helpers
// ============================================================================

/**
 * Creates mock HTTP response for network requests
 */
export function createMockResponse(status: number, body: any): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Mocks network API responses
 */
export async function mockNetworkAPI(
  page: Page,
  responses: Record<string, { status: number; body: any }>
): Promise<void> {
  await page.route('**/*', (route) => {
    const url = route.request().url();

    for (const [pattern, response] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        route.fulfill({
          status: response.status,
          contentType: 'application/json',
          body: JSON.stringify(response.body),
        });
        return;
      }
    }

    route.continue();
  });
}

// ============================================================================
// Timing Helpers
// ============================================================================

/**
 * Waits for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async operation
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, onRetry } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (onRetry) {
        onRetry(attempt, error);
      }
      if (attempt < maxAttempts) {
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates affiliate link pattern
 */
export function isAffiliateLinkPattern(url: string): boolean {
  const affiliatePatterns = [
    /[?&]aff=/i,
    /[?&]affiliate=/i,
    /[?&]ref=/i,
    /[?&]partner=/i,
    /[?&]tag=/i,
    /[?&][ub]=/i,
    /\/r\.cfm/i,
  ];

  return affiliatePatterns.some((pattern) => pattern.test(url));
}

// ============================================================================
// Snapshot Helpers
// ============================================================================

/**
 * Creates a database snapshot for testing
 */
export function createDatabaseSnapshot(db: MockAgentDB): {
  networks: AffiliateNetwork[];
  links: AffiliateLink[];
  stats: ReturnType<typeof getDatabaseStats>;
} {
  return {
    networks: db.getAllNetworks(),
    links: db.getActiveLinks(),
    stats: getDatabaseStats(db),
  };
}

/**
 * Compares two database snapshots
 */
export function compareDatabaseSnapshots(
  before: ReturnType<typeof createDatabaseSnapshot>,
  after: ReturnType<typeof createDatabaseSnapshot>
): {
  networksAdded: number;
  linksAdded: number;
  logsAdded: number;
} {
  return {
    networksAdded: after.stats.networks - before.stats.networks,
    linksAdded: after.stats.links - before.stats.links,
    logsAdded: after.stats.logs - before.stats.logs,
  };
}

// ============================================================================
// Performance Helpers
// ============================================================================

/**
 * Measures execution time of a function
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
  const start = Date.now();
  const result = await fn();
  const time = Date.now() - start;
  return { result, time };
}

/**
 * Benchmarks an operation
 */
export async function benchmark(
  name: string,
  fn: () => Promise<void>,
  iterations: number = 10
): Promise<{ average: number; min: number; max: number; total: number }> {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const { time } = await measureTime(fn);
    times.push(time);
  }

  const total = times.reduce((sum, t) => sum + t, 0);
  const average = total / iterations;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log(`[Benchmark] ${name}:`);
  console.log(`  Average: ${average.toFixed(2)}ms`);
  console.log(`  Min: ${min}ms, Max: ${max}ms`);
  console.log(`  Total: ${total}ms (${iterations} iterations)`);

  return { average, min, max, total };
}
