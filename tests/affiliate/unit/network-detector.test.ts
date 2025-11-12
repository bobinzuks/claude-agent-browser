/**
 * NetworkDetector Unit Tests
 * Tests for affiliate network detection from URLs
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { NetworkDetector } from '../mocks/affiliate-modules';
import { TOSLevel } from '../../../src/database/affiliate-types';
import {
  ALL_NETWORKS,
  SHAREASALE_NETWORK,
  CJ_AFFILIATE_NETWORK,
  AMAZON_ASSOCIATES_NETWORK,
  CLICKBANK_NETWORK,
  NETWORK_URL_TESTS,
} from '../fixtures/network-fixtures';

describe('NetworkDetector', () => {
  let detector: NetworkDetector;

  beforeEach(() => {
    detector = new NetworkDetector({
      networks: ALL_NETWORKS,
    });
  });

  describe('detectNetwork', () => {
    test('detects ShareASale from URL', () => {
      const network = detector.detectNetwork('https://www.shareasale.com/a-overview.cfm');
      expect(network).not.toBeNull();
      expect(network?.id).toBe('shareasale');
      expect(network?.name).toBe('ShareASale');
    });

    test('detects ShareASale from signup URL', () => {
      const network = detector.detectNetwork('https://shareasale.com/signup.cfm');
      expect(network).not.toBeNull();
      expect(network?.id).toBe('shareasale');
    });

    test('detects CJ Affiliate from URL', () => {
      const network = detector.detectNetwork('https://members.cj.com/member/dashboard');
      expect(network).not.toBeNull();
      expect(network?.id).toBe('cj-affiliate');
      expect(network?.name).toBe('CJ Affiliate');
    });

    test('detects CJ Affiliate from signup URL', () => {
      const network = detector.detectNetwork('https://signup.cj.com/');
      expect(network).not.toBeNull();
      expect(network?.id).toBe('cj-affiliate');
    });

    test('detects Amazon Associates from URL', () => {
      const network = detector.detectNetwork(
        'https://affiliate-program.amazon.com/home'
      );
      expect(network).not.toBeNull();
      expect(network?.id).toBe('amazon-associates');
      expect(network?.name).toBe('Amazon Associates');
    });

    test('detects ClickBank from URL', () => {
      const network = detector.detectNetwork('https://accounts.clickbank.com/');
      expect(network).not.toBeNull();
      expect(network?.id).toBe('clickbank');
      expect(network?.name).toBe('ClickBank');
    });

    test('returns null for unknown network', () => {
      const network = detector.detectNetwork('https://www.unknown-network.com');
      expect(network).toBeNull();
    });

    test('returns null for generic domain', () => {
      const network = detector.detectNetwork('https://example.com');
      expect(network).toBeNull();
    });

    test('handles URLs with www prefix', () => {
      const network = detector.detectNetwork('https://www.shareasale.com/dashboard');
      expect(network).not.toBeNull();
      expect(network?.id).toBe('shareasale');
    });

    test('handles URLs without www prefix', () => {
      const network = detector.detectNetwork('https://cj.com/signup');
      expect(network).not.toBeNull();
      expect(network?.id).toBe('cj-affiliate');
    });

    test('handles URLs with query parameters', () => {
      const network = detector.detectNetwork(
        'https://shareasale.com/r.cfm?b=123&u=456&m=789'
      );
      expect(network).not.toBeNull();
      expect(network?.id).toBe('shareasale');
    });

    test('handles URLs with hash fragments', () => {
      const network = detector.detectNetwork('https://members.cj.com/#/dashboard');
      expect(network).not.toBeNull();
      expect(network?.id).toBe('cj-affiliate');
    });

    test('handles invalid URLs gracefully', () => {
      const network = detector.detectNetwork('not-a-valid-url');
      expect(network).toBeNull();
    });

    test('handles empty string', () => {
      const network = detector.detectNetwork('');
      expect(network).toBeNull();
    });

    test('processes all test cases correctly', () => {
      NETWORK_URL_TESTS.forEach(({ url, expected }) => {
        const network = detector.detectNetwork(url);
        if (expected === null) {
          expect(network).toBeNull();
        } else {
          expect(network).not.toBeNull();
          expect(network?.id).toBe(expected);
        }
      });
    });
  });

  describe('getTOSLevel', () => {
    test('returns correct TOS level for ShareASale', () => {
      const level = detector.getTOSLevel('https://www.shareasale.com/dashboard');
      expect(level).toBe(TOSLevel.HUMAN_GUIDED);
    });

    test('returns correct TOS level for CJ Affiliate', () => {
      const level = detector.getTOSLevel('https://members.cj.com/');
      expect(level).toBe(TOSLevel.MANUAL_VERIFICATION);
    });

    test('returns correct TOS level for Amazon Associates', () => {
      const level = detector.getTOSLevel('https://affiliate-program.amazon.com/');
      expect(level).toBe(TOSLevel.FULLY_MANUAL);
    });

    test('returns correct TOS level for ClickBank', () => {
      const level = detector.getTOSLevel('https://clickbank.com/');
      expect(level).toBe(TOSLevel.FULLY_AUTOMATED);
    });

    test('returns null for unknown network', () => {
      const level = detector.getTOSLevel('https://unknown.com');
      expect(level).toBeNull();
    });
  });

  describe('isAutomationAllowed', () => {
    test('allows automation for FULLY_AUTOMATED network', () => {
      const allowed = detector.isAutomationAllowed('https://clickbank.com/');
      expect(allowed).toBe(true);
    });

    test('allows automation for HUMAN_GUIDED network', () => {
      const allowed = detector.isAutomationAllowed('https://www.shareasale.com/');
      expect(allowed).toBe(true);
    });

    test('blocks automation for MANUAL_VERIFICATION network', () => {
      const allowed = detector.isAutomationAllowed('https://members.cj.com/');
      expect(allowed).toBe(false);
    });

    test('blocks automation for FULLY_MANUAL network', () => {
      const allowed = detector.isAutomationAllowed(
        'https://affiliate-program.amazon.com/'
      );
      expect(allowed).toBe(false);
    });

    test('blocks automation for unknown network', () => {
      const allowed = detector.isAutomationAllowed('https://unknown.com');
      expect(allowed).toBe(false);
    });
  });

  describe('requiresHumanVerification', () => {
    test('does not require human for FULLY_AUTOMATED', () => {
      const required = detector.requiresHumanVerification('https://clickbank.com/');
      expect(required).toBe(false);
    });

    test('does not require human for HUMAN_GUIDED', () => {
      const required = detector.requiresHumanVerification('https://shareasale.com/');
      expect(required).toBe(false);
    });

    test('requires human for MANUAL_VERIFICATION', () => {
      const required = detector.requiresHumanVerification('https://members.cj.com/');
      expect(required).toBe(true);
    });

    test('requires human for FULLY_MANUAL', () => {
      const required = detector.requiresHumanVerification(
        'https://affiliate-program.amazon.com/'
      );
      expect(required).toBe(true);
    });

    test('requires human for unknown network', () => {
      const required = detector.requiresHumanVerification('https://unknown.com');
      expect(required).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('handles subdomain variations', () => {
      const network1 = detector.detectNetwork('https://members.cj.com/');
      const network2 = detector.detectNetwork('https://signup.cj.com/');
      expect(network1?.id).toBe('cj-affiliate');
      expect(network2?.id).toBe('cj-affiliate');
      expect(network1?.id).toBe(network2?.id);
    });

    test('handles trailing slashes', () => {
      const network1 = detector.detectNetwork('https://shareasale.com');
      const network2 = detector.detectNetwork('https://shareasale.com/');
      expect(network1?.id).toBe(network2?.id);
    });

    test('handles case sensitivity', () => {
      const network1 = detector.detectNetwork('https://ShareASale.com/');
      const network2 = detector.detectNetwork('https://SHAREASALE.COM/');
      // URLs are case-insensitive for hostnames
      expect(network1?.id).toBe('shareasale');
      expect(network2?.id).toBe('shareasale');
    });

    test('handles HTTP vs HTTPS', () => {
      const network1 = detector.detectNetwork('http://shareasale.com/');
      const network2 = detector.detectNetwork('https://shareasale.com/');
      expect(network1?.id).toBe(network2?.id);
    });
  });

  describe('network metadata', () => {
    test('returns complete network information', () => {
      const network = detector.detectNetwork('https://www.shareasale.com/');
      expect(network).not.toBeNull();
      expect(network?.id).toBe('shareasale');
      expect(network?.name).toBe('ShareASale');
      expect(network?.domain).toBe('shareasale.com');
      expect(network?.api_available).toBe(true);
      expect(network?.signup_url).toBeDefined();
      expect(network?.dashboard_url).toBeDefined();
    });

    test('includes metadata for networks', () => {
      const network = detector.detectNetwork('https://www.shareasale.com/');
      expect(network?.metadata).toBeDefined();
      expect(network?.metadata?.api_docs_url).toBeDefined();
      expect(network?.metadata?.minimum_payout).toBe(50);
      expect(network?.metadata?.payment_methods).toContain('Direct Deposit');
    });
  });

  describe('performance', () => {
    test('handles multiple detections efficiently', () => {
      const urls = [
        'https://shareasale.com/',
        'https://cj.com/',
        'https://clickbank.com/',
        'https://affiliate-program.amazon.com/',
      ];

      const start = Date.now();
      urls.forEach((url) => detector.detectNetwork(url));
      const end = Date.now();

      // Should complete in less than 10ms
      expect(end - start).toBeLessThan(10);
    });

    test('handles many unknown URLs efficiently', () => {
      const urls = Array.from(
        { length: 100 },
        (_, i) => `https://unknown-${i}.com`
      );

      const start = Date.now();
      urls.forEach((url) => detector.detectNetwork(url));
      const end = Date.now();

      // Should complete in less than 50ms
      expect(end - start).toBeLessThan(50);
    });
  });
});
