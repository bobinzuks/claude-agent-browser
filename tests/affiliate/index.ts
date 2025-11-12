/**
 * Affiliate Test Suite Entry Point
 * Exports all test utilities, mocks, and fixtures
 */

// ============================================================================
// Mock Implementations
// ============================================================================

export {
  MockAgentDB,
  createMockAgentDB,
  createSeededMockAgentDB,
} from './mocks/mock-agentdb';

export {
  NetworkDetector,
  LinkExtractor,
  ComplianceChecker,
  type NetworkDetectorConfig,
  type LinkExtractorConfig,
  type ComplianceCheckerConfig,
  type ExtractedLinkData,
  type ComplianceDecision,
} from './mocks/affiliate-modules';

// ============================================================================
// Test Fixtures
// ============================================================================

export {
  // Network Fixtures
  SHAREASALE_NETWORK,
  CJ_AFFILIATE_NETWORK,
  AMAZON_ASSOCIATES_NETWORK,
  CLICKBANK_NETWORK,
  UNKNOWN_NETWORK,
  ALL_NETWORKS,
  // Link Fixtures
  SHAREASALE_LINKS,
  AMAZON_LINKS,
  INACTIVE_LINK,
  // Workflow Fixtures
  SHAREASALE_SIGNUP_FIELDS,
  AMAZON_SIGNUP_FIELDS,
  SHAREASALE_WORKFLOW,
  AMAZON_WORKFLOW,
  // Compliance Log Fixtures
  COMPLIANCE_LOGS,
  // Test Cases
  NETWORK_URL_TESTS,
  // Mock HTML
  SHAREASALE_DASHBOARD_HTML,
  SHAREASALE_SIGNUP_HTML,
  AMAZON_SIGNUP_HTML,
} from './fixtures/network-fixtures';

// ============================================================================
// Test Helpers
// ============================================================================

export {
  // Database Helpers
  seedTestDatabase,
  clearDatabase,
  getDatabaseStats,
  // Network Helpers
  createTestNetwork,
  createTestLink,
  createTestFormFields,
  // Page Helpers
  waitForNetworkDetection,
  fillSignupForm,
  extractAllLinks,
  isFormValid,
  getFormErrors,
  // Assertion Helpers
  assertNetworkDetected,
  assertComplianceDecision,
  // Mock Response Helpers
  createMockResponse,
  mockNetworkAPI,
  // Timing Helpers
  delay,
  retry,
  // Validation Helpers
  isValidUrl,
  isValidEmail,
  isAffiliateLinkPattern,
  // Snapshot Helpers
  createDatabaseSnapshot,
  compareDatabaseSnapshots,
  // Performance Helpers
  measureTime,
  benchmark,
} from './utils/test-helpers';

// ============================================================================
// Type Exports
// ============================================================================

export type {
  AffiliateNetwork,
  AffiliateLink,
  SignupWorkflow,
  ComplianceLog,
  FormField,
  TOSLevel,
  SignupStatus,
  ComplianceLevel,
  FormFieldType,
  NetworkWithStats,
  LinkWithNetwork,
  InsertAffiliateNetwork,
  InsertAffiliateLink,
  InsertSignupWorkflow,
  InsertComplianceLog,
} from '../../src/database/affiliate-types';

// ============================================================================
// Constants
// ============================================================================

export const TEST_CONFIG = {
  DEFAULT_TIMEOUT: 5000,
  NETWORK_DETECTION_TIMEOUT: 3000,
  FORM_FILL_DELAY: 100,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const KNOWN_NETWORKS = {
  SHAREASALE: 'shareasale',
  CJ_AFFILIATE: 'cj-affiliate',
  AMAZON_ASSOCIATES: 'amazon-associates',
  CLICKBANK: 'clickbank',
} as const;

// ============================================================================
// Test Suite Info
// ============================================================================

export const TEST_SUITE_VERSION = '1.0.0';
export const TEST_SUITE_NAME = 'Affiliate Automation Test Suite';
export const COVERAGE_TARGET = 80; // Percentage

/**
 * Get test suite information
 */
export function getTestSuiteInfo() {
  return {
    name: TEST_SUITE_NAME,
    version: TEST_SUITE_VERSION,
    coverageTarget: COVERAGE_TARGET,
    testCategories: [
      'Unit Tests',
      'Integration Tests',
      'E2E Tests',
      'Compliance Tests',
      'Performance Tests',
    ],
    modules: [
      'NetworkDetector',
      'LinkExtractor',
      'ComplianceChecker',
    ],
  };
}
