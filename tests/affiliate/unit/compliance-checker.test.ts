/**
 * ComplianceChecker Unit Tests
 * Tests for TOS compliance enforcement
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ComplianceChecker, NetworkDetector } from '../mocks/affiliate-modules';
import { createMockAgentDB, MockAgentDB } from '../mocks/mock-agentdb';
import { TOSLevel } from '../../../src/database/affiliate-types';
import {
  ALL_NETWORKS,
  SHAREASALE_NETWORK,
  AMAZON_ASSOCIATES_NETWORK,
  CLICKBANK_NETWORK,
  CJ_AFFILIATE_NETWORK,
} from '../fixtures/network-fixtures';

describe('ComplianceChecker', () => {
  let db: MockAgentDB;
  let detector: NetworkDetector;
  let checker: ComplianceChecker;

  beforeEach(() => {
    db = createMockAgentDB();
    db.seed({ networks: ALL_NETWORKS });

    detector = new NetworkDetector({ networks: ALL_NETWORKS });
    checker = new ComplianceChecker({ db, networkDetector: detector });
  });

  describe('checkAction - automated_signup', () => {
    test('blocks automated signup for Amazon Associates (FULLY_MANUAL)', () => {
      const decision = checker.checkAction(
        'automated_signup',
        'https://affiliate-program.amazon.com/signup'
      );

      expect(decision.allowed).toBe(false);
      expect(decision.requiresHuman).toBe(true);
      expect(decision.tosLevel).toBe(TOSLevel.FULLY_MANUAL);
      expect(decision.message).toContain('Amazon Associates');
      expect(decision.message).toContain('prohibits');
      expect(decision.logEntry.compliance_level).toBe('critical');
    });

    test('allows automated signup for ClickBank (FULLY_AUTOMATED)', () => {
      const decision = checker.checkAction(
        'automated_signup',
        'https://clickbank.com/signup'
      );

      expect(decision.allowed).toBe(true);
      expect(decision.requiresHuman).toBe(false);
      expect(decision.tosLevel).toBe(TOSLevel.FULLY_AUTOMATED);
      expect(decision.message).toContain('allowed');
      expect(decision.logEntry.compliance_level).toBe('info');
    });

    test('allows with human guidance for ShareASale (HUMAN_GUIDED)', () => {
      const decision = checker.checkAction(
        'automated_signup',
        'https://shareasale.com/signup'
      );

      expect(decision.allowed).toBe(true);
      expect(decision.requiresHuman).toBe(true); // Human guidance required
      expect(decision.tosLevel).toBe(TOSLevel.HUMAN_GUIDED);
      expect(decision.message).toContain('allowed');
      expect(decision.logEntry.compliance_level).toBe('info');
    });

    test('requires verification for CJ Affiliate (MANUAL_VERIFICATION)', () => {
      const decision = checker.checkAction(
        'automated_signup',
        'https://signup.cj.com/'
      );

      expect(decision.allowed).toBe(true);
      expect(decision.requiresHuman).toBe(true);
      expect(decision.tosLevel).toBe(TOSLevel.MANUAL_VERIFICATION);
      expect(decision.message).toContain('verification');
      expect(decision.logEntry.compliance_level).toBe('warning');
    });

    test('blocks signup for unknown network', () => {
      const decision = checker.checkAction(
        'automated_signup',
        'https://unknown-network.com/'
      );

      expect(decision.allowed).toBe(false);
      expect(decision.requiresHuman).toBe(true);
      expect(decision.tosLevel).toBe(TOSLevel.FULLY_MANUAL);
      expect(decision.message).toContain('Unknown network');
      expect(decision.logEntry.compliance_level).toBe('warning');
    });
  });

  describe('checkAction - extract_links', () => {
    test('allows link extraction for ShareASale', () => {
      const decision = checker.checkAction(
        'extract_links',
        'https://shareasale.com/dashboard'
      );

      expect(decision.allowed).toBe(true);
      expect(decision.requiresHuman).toBe(false);
      expect(decision.message).toContain('Link extraction allowed');
      expect(decision.logEntry.action).toBe('extract_affiliate_links');
      expect(decision.logEntry.compliance_level).toBe('info');
    });

    test('allows link extraction even for Amazon (FULLY_MANUAL)', () => {
      const decision = checker.checkAction(
        'extract_links',
        'https://affiliate-program.amazon.com/dashboard'
      );

      expect(decision.allowed).toBe(true);
      expect(decision.requiresHuman).toBe(false);
      expect(decision.message).toContain('Link extraction allowed');
    });

    test('allows link extraction for all TOS levels', () => {
      const urls = [
        'https://clickbank.com/dashboard', // FULLY_AUTOMATED
        'https://shareasale.com/dashboard', // HUMAN_GUIDED
        'https://members.cj.com/dashboard', // MANUAL_VERIFICATION
        'https://affiliate-program.amazon.com/dashboard', // FULLY_MANUAL
      ];

      urls.forEach((url) => {
        const decision = checker.checkAction('extract_links', url);
        expect(decision.allowed).toBe(true);
        expect(decision.requiresHuman).toBe(false);
      });
    });
  });

  describe('checkAction - prefill_form', () => {
    test('blocks form prefill for Amazon (FULLY_MANUAL)', () => {
      const decision = checker.checkAction(
        'prefill_form',
        'https://affiliate-program.amazon.com/signup'
      );

      expect(decision.allowed).toBe(false);
      expect(decision.requiresHuman).toBe(true);
      expect(decision.tosLevel).toBe(TOSLevel.FULLY_MANUAL);
      expect(decision.message).toContain('not allowed');
      expect(decision.logEntry.compliance_level).toBe('warning');
    });

    test('allows form prefill for ShareASale (HUMAN_GUIDED)', () => {
      const decision = checker.checkAction(
        'prefill_form',
        'https://shareasale.com/signup'
      );

      expect(decision.allowed).toBe(true);
      expect(decision.requiresHuman).toBe(false);
      expect(decision.message).toContain('allowed');
      expect(decision.logEntry.compliance_level).toBe('info');
    });

    test('allows form prefill for ClickBank (FULLY_AUTOMATED)', () => {
      const decision = checker.checkAction(
        'prefill_form',
        'https://clickbank.com/signup'
      );

      expect(decision.allowed).toBe(true);
      expect(decision.requiresHuman).toBe(false);
      expect(decision.message).toContain('allowed');
    });

    test('allows form prefill for CJ (MANUAL_VERIFICATION)', () => {
      const decision = checker.checkAction('prefill_form', 'https://signup.cj.com/');

      expect(decision.allowed).toBe(true);
      expect(decision.requiresHuman).toBe(false);
      expect(decision.message).toContain('allowed');
    });
  });

  describe('checkAction - generic actions', () => {
    test('allows generic actions by default', () => {
      const decision = checker.checkAction(
        'view_dashboard',
        'https://shareasale.com/dashboard'
      );

      expect(decision.allowed).toBe(true);
      expect(decision.requiresHuman).toBe(false);
      expect(decision.logEntry.action).toBe('view_dashboard');
      expect(decision.logEntry.compliance_level).toBe('info');
    });

    test('handles custom action types', () => {
      const actions = ['update_profile', 'view_reports', 'download_data'];

      actions.forEach((action) => {
        const decision = checker.checkAction(
          action,
          'https://shareasale.com/dashboard'
        );
        expect(decision.allowed).toBe(true);
        expect(decision.logEntry.action).toBe(action);
      });
    });
  });

  describe('logDecision', () => {
    test('logs allowed decisions', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const decision = checker.checkAction(
        'extract_links',
        'https://shareasale.com/dashboard'
      );
      checker.logDecision(decision);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Compliance]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ALLOWED'));

      consoleSpy.mockRestore();
    });

    test('logs blocked decisions', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const decision = checker.checkAction(
        'automated_signup',
        'https://affiliate-program.amazon.com/signup'
      );
      checker.logDecision(decision);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Compliance]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('BLOCKED'));

      consoleSpy.mockRestore();
    });
  });

  describe('getComplianceHistory', () => {
    test('retrieves compliance logs for network', () => {
      // Generate some compliance checks
      checker.checkAction('extract_links', 'https://shareasale.com/dashboard');
      checker.checkAction('prefill_form', 'https://shareasale.com/signup');
      checker.checkAction('extract_links', 'https://shareasale.com/dashboard');

      const history = checker.getComplianceHistory('shareasale');

      expect(history.length).toBe(3);
      expect(history[0].network_id).toBe('shareasale');
    });

    test('respects limit parameter', () => {
      // Generate multiple checks
      for (let i = 0; i < 15; i++) {
        checker.checkAction('extract_links', 'https://shareasale.com/dashboard');
      }

      const history = checker.getComplianceHistory('shareasale', 5);

      expect(history.length).toBe(5);
    });

    test('returns empty array for network with no history', () => {
      const history = checker.getComplianceHistory('nonexistent-network');
      expect(history).toEqual([]);
    });

    test('orders logs by timestamp (newest first)', () => {
      checker.checkAction('extract_links', 'https://shareasale.com/dashboard');
      // Small delay to ensure different timestamps
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      checker.checkAction('prefill_form', 'https://shareasale.com/signup');

      const history = checker.getComplianceHistory('shareasale');

      expect(history.length).toBe(2);
      expect(history[0].timestamp).toBeGreaterThanOrEqual(history[1].timestamp);
    });
  });

  describe('getCriticalViolations', () => {
    test('retrieves only critical compliance logs', () => {
      // Generate mixed compliance levels
      checker.checkAction('extract_links', 'https://shareasale.com/dashboard'); // info
      checker.checkAction(
        'automated_signup',
        'https://affiliate-program.amazon.com/signup'
      ); // critical
      checker.checkAction('prefill_form', 'https://shareasale.com/signup'); // info
      checker.checkAction(
        'automated_signup',
        'https://affiliate-program.amazon.com/signup'
      ); // critical

      const critical = checker.getCriticalViolations();

      expect(critical.length).toBe(2);
      critical.forEach((log) => {
        expect(log.compliance_level).toBe('critical');
      });
    });

    test('returns empty array when no critical violations', () => {
      checker.checkAction('extract_links', 'https://shareasale.com/dashboard');
      checker.checkAction('prefill_form', 'https://shareasale.com/signup');

      const critical = checker.getCriticalViolations();
      expect(critical).toEqual([]);
    });
  });

  describe('database integration', () => {
    test('stores compliance logs in database', () => {
      const statsBefore = db.getStats();
      expect(statsBefore.logs).toBe(0);

      checker.checkAction('extract_links', 'https://shareasale.com/dashboard');

      const statsAfter = db.getStats();
      expect(statsAfter.logs).toBe(1);
    });

    test('logs include correct network references', () => {
      checker.checkAction('extract_links', 'https://shareasale.com/dashboard');

      const logs = db.getComplianceLogsByNetwork('shareasale');
      expect(logs.length).toBe(1);
      expect(logs[0].network_id).toBe('shareasale');
      expect(logs[0].action).toBe('extract_affiliate_links');
    });

    test('logs include action details', () => {
      const decision = checker.checkAction(
        'automated_signup',
        'https://affiliate-program.amazon.com/signup'
      );

      expect(decision.logEntry.details).toBeDefined();
      expect(decision.logEntry.details?.action_details).toContain('Amazon Associates');
      expect(decision.logEntry.details?.context).toBeDefined();
    });

    test('logs have accurate timestamps', () => {
      const before = Date.now();
      const decision = checker.checkAction(
        'extract_links',
        'https://shareasale.com/dashboard'
      );
      const after = Date.now();

      expect(decision.logEntry.timestamp).toBeGreaterThanOrEqual(before);
      expect(decision.logEntry.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('edge cases and error handling', () => {
    test('handles invalid URLs gracefully', () => {
      const decision = checker.checkAction('extract_links', 'not-a-valid-url');

      expect(decision.allowed).toBe(false);
      expect(decision.requiresHuman).toBe(true);
      expect(decision.message).toContain('Unknown network');
    });

    test('handles empty action string', () => {
      const decision = checker.checkAction('', 'https://shareasale.com/dashboard');

      expect(decision.allowed).toBe(true); // Default allow for unknown actions
      expect(decision.logEntry.action).toBe('');
    });

    test('handles URL with missing protocol', () => {
      const decision = checker.checkAction('extract_links', 'shareasale.com/dashboard');

      // Should fail to parse URL
      expect(decision.allowed).toBe(false);
      expect(decision.requiresHuman).toBe(true);
    });

    test('maintains consistency across multiple checks', () => {
      const url = 'https://affiliate-program.amazon.com/signup';

      const decision1 = checker.checkAction('automated_signup', url);
      const decision2 = checker.checkAction('automated_signup', url);

      expect(decision1.allowed).toBe(decision2.allowed);
      expect(decision1.tosLevel).toBe(decision2.tosLevel);
      expect(decision1.requiresHuman).toBe(decision2.requiresHuman);
    });
  });

  describe('TOS level enforcement matrix', () => {
    test('enforces correct permissions for each TOS level', () => {
      const testMatrix = [
        {
          network: 'ClickBank',
          url: 'https://clickbank.com/',
          tosLevel: TOSLevel.FULLY_AUTOMATED,
          expectations: {
            automated_signup: { allowed: true, requiresHuman: false },
            prefill_form: { allowed: true, requiresHuman: false },
            extract_links: { allowed: true, requiresHuman: false },
          },
        },
        {
          network: 'ShareASale',
          url: 'https://shareasale.com/',
          tosLevel: TOSLevel.HUMAN_GUIDED,
          expectations: {
            automated_signup: { allowed: true, requiresHuman: true },
            prefill_form: { allowed: true, requiresHuman: false },
            extract_links: { allowed: true, requiresHuman: false },
          },
        },
        {
          network: 'CJ Affiliate',
          url: 'https://members.cj.com/',
          tosLevel: TOSLevel.MANUAL_VERIFICATION,
          expectations: {
            automated_signup: { allowed: true, requiresHuman: true },
            prefill_form: { allowed: true, requiresHuman: false },
            extract_links: { allowed: true, requiresHuman: false },
          },
        },
        {
          network: 'Amazon Associates',
          url: 'https://affiliate-program.amazon.com/',
          tosLevel: TOSLevel.FULLY_MANUAL,
          expectations: {
            automated_signup: { allowed: false, requiresHuman: true },
            prefill_form: { allowed: false, requiresHuman: true },
            extract_links: { allowed: true, requiresHuman: false },
          },
        },
      ];

      testMatrix.forEach(({ network, url, tosLevel, expectations }) => {
        Object.entries(expectations).forEach(([action, expected]) => {
          const decision = checker.checkAction(action, url);
          expect(decision.tosLevel).toBe(tosLevel);
          expect(decision.allowed).toBe(expected.allowed);
          expect(decision.requiresHuman).toBe(expected.requiresHuman);
        });
      });
    });
  });

  describe('performance', () => {
    test('handles multiple compliance checks efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        checker.checkAction('extract_links', 'https://shareasale.com/dashboard');
      }

      const end = Date.now();

      expect(end - start).toBeLessThan(100); // Should be very fast
    });

    test('database logging does not significantly impact performance', () => {
      const start = Date.now();

      for (let i = 0; i < 50; i++) {
        checker.checkAction('extract_links', 'https://shareasale.com/dashboard');
      }

      const end = Date.now();

      expect(db.getStats().logs).toBe(50);
      expect(end - start).toBeLessThan(100);
    });
  });
});
