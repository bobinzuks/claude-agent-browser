/**
 * Tests for Network Detector Module
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  NetworkDetector,
  networkDetector,
  isAffiliateNetwork,
  detectNetwork,
  getToSLevel,
  getAllNetworks,
} from './network-detector';

describe('NetworkDetector', () => {
  let detector: NetworkDetector;

  beforeEach(() => {
    detector = new NetworkDetector();
  });

  // =========================================================================
  // NETWORK DETECTION TESTS
  // =========================================================================

  describe('detectNetwork()', () => {
    it('should detect ShareASale network', () => {
      const network = detector.detectNetwork('https://account.shareasale.com/login');
      expect(network).not.toBeNull();
      expect(network?.id).toBe('shareasale');
      expect(network?.name).toBe('ShareASale');
      expect(network?.tosLevel).toBe(1);
    });

    it('should detect CJ Affiliate network', () => {
      const network = detector.detectNetwork('https://members.cj.com/');
      expect(network).not.toBeNull();
      expect(network?.id).toBe('cj-affiliate');
      expect(network?.name).toContain('CJ Affiliate');
    });

    it('should detect Impact.com network', () => {
      const urls = [
        'https://app.impact.com/dashboard',
        'https://impact.com/',
        'https://impact.radius.com/login',
      ];

      urls.forEach(url => {
        const network = detector.detectNetwork(url);
        expect(network?.id).toBe('impact');
      });
    });

    it('should detect Rakuten with multiple domains', () => {
      const urls = [
        'https://rakutenadvertising.com/',
        'https://linkshare.com/',
        'https://cli.linksynergy.com/',
      ];

      urls.forEach(url => {
        const network = detector.detectNetwork(url);
        expect(network?.id).toBe('rakuten');
      });
    });

    it('should detect ClickBank network', () => {
      const network = detector.detectNetwork('https://accounts.clickbank.com/');
      expect(network?.id).toBe('clickbank');
      expect(network?.apiAvailable).toBe(false);
    });

    it('should detect PartnerStack network', () => {
      const network = detector.detectNetwork('https://app.partnerstack.com/');
      expect(network?.id).toBe('partnerstack');
      expect(network?.apiAvailable).toBe(true);
    });

    it('should detect Reditus network', () => {
      const network = detector.detectNetwork('https://app.reditus.com/');
      expect(network?.id).toBe('reditus');
    });

    it('should detect Amazon Associates network', () => {
      const urls = [
        'https://affiliate-program.amazon.com/',
        'https://associates.amazon.com/',
      ];

      urls.forEach(url => {
        const network = detector.detectNetwork(url);
        expect(network?.id).toBe('amazon-associates');
        expect(network?.tosLevel).toBe(2);
      });
    });

    it('should detect Teachable affiliate program', () => {
      const network = detector.detectNetwork('https://teachable.com/partners');
      expect(network?.id).toBe('teachable');
      expect(network?.tosLevel).toBe(2);
    });

    it('should return null for non-affiliate URLs', () => {
      const urls = [
        'https://google.com',
        'https://github.com',
        'https://stackoverflow.com',
      ];

      urls.forEach(url => {
        const network = detector.detectNetwork(url);
        expect(network).toBeNull();
      });
    });

    it('should handle invalid URLs gracefully', () => {
      const network = detector.detectNetwork('not-a-url');
      expect(network).toBeNull();
    });
  });

  // =========================================================================
  // NETWORK CONFIGURATION TESTS
  // =========================================================================

  describe('getNetworkConfig()', () => {
    it('should get config for ShareASale', () => {
      const config = detector.getNetworkConfig('shareasale');
      expect(config).not.toBeNull();
      expect(config?.network.id).toBe('shareasale');
      expect(config?.automationPermitted).toBe(true);
      expect(config?.maxAutomationMode).toBe('full-auto');
      expect(config?.riskLevel).toBe('medium');
    });

    it('should get config for PartnerStack (low risk)', () => {
      const config = detector.getNetworkConfig('partnerstack');
      expect(config?.riskLevel).toBe('low');
      expect(config?.automationPermitted).toBe(true);
    });

    it('should get config for Reditus (low risk)', () => {
      const config = detector.getNetworkConfig('reditus');
      expect(config?.riskLevel).toBe('low');
      expect(config?.automationPermitted).toBe(true);
    });

    it('should get config for Amazon Associates (high risk)', () => {
      const config = detector.getNetworkConfig('amazon-associates');
      expect(config?.riskLevel).toBe('high');
      expect(config?.automationPermitted).toBe(false);
      expect(config?.maxAutomationMode).toBe('human-guided');
    });

    it('should get config for Teachable (high risk)', () => {
      const config = detector.getNetworkConfig('teachable');
      expect(config?.riskLevel).toBe('high');
      expect(config?.automationPermitted).toBe(false);
    });

    it('should return null for unknown network ID', () => {
      const config = detector.getNetworkConfig('unknown-network');
      expect(config).toBeNull();
    });
  });

  // =========================================================================
  // ToS LEVEL DETECTION TESTS
  // =========================================================================

  describe('getToSLevel()', () => {
    it('should detect Level 0 for localhost', () => {
      const urls = [
        'http://localhost:3000',
        'http://127.0.0.1:8080',
        'http://localhost',
      ];

      urls.forEach(url => {
        const level = detector.getToSLevel(url);
        expect(level).toBe(0);
      });
    });

    it('should detect Level 0 for .local domains', () => {
      const level = detector.getToSLevel('http://my-app.local');
      expect(level).toBe(0);
    });

    it('should detect Level 0 for private IP ranges', () => {
      const urls = [
        'http://192.168.1.100',
        'http://10.0.0.1',
      ];

      urls.forEach(url => {
        const level = detector.getToSLevel(url);
        expect(level).toBe(0);
      });
    });

    it('should detect Level 1 for generic affiliate networks', () => {
      const urls = [
        'https://shareasale.com',
        'https://cj.com',
        'https://impact.com',
        'https://clickbank.com',
      ];

      urls.forEach(url => {
        const level = detector.getToSLevel(url);
        expect(level).toBe(1);
      });
    });

    it('should detect Level 2 for social/ecommerce networks', () => {
      const urls = [
        'https://affiliate-program.amazon.com',
        'https://teachable.com',
      ];

      urls.forEach(url => {
        const level = detector.getToSLevel(url);
        expect(level).toBe(2);
      });
    });

    it('should default to Level 1 for unknown domains', () => {
      const level = detector.getToSLevel('https://unknown-site.com');
      expect(level).toBe(1);
    });
  });

  // =========================================================================
  // LISTING AND FILTERING TESTS
  // =========================================================================

  describe('listSupportedNetworks()', () => {
    it('should list all networks', () => {
      const networks = detector.listSupportedNetworks();
      expect(networks.length).toBeGreaterThan(0);
      expect(networks.length).toBe(9); // Total count as of implementation
    });

    it('should filter by ToS level 1', () => {
      const networks = detector.listSupportedNetworks(1);
      expect(networks.length).toBeGreaterThan(0);
      networks.forEach(network => {
        expect(network.tosLevel).toBe(1);
      });
    });

    it('should filter by ToS level 2', () => {
      const networks = detector.listSupportedNetworks(2);
      expect(networks.length).toBe(2); // Amazon Associates, Teachable
      networks.forEach(network => {
        expect(network.tosLevel).toBe(2);
      });
    });

    it('should return empty array for ToS level 3', () => {
      const networks = detector.listSupportedNetworks(3);
      expect(networks.length).toBe(0);
    });
  });

  describe('getNetworksByApiAvailability()', () => {
    it('should get networks with API', () => {
      const networks = detector.getNetworksByApiAvailability(true);
      expect(networks.length).toBeGreaterThan(0);
      networks.forEach(network => {
        expect(network.apiAvailable).toBe(true);
      });
    });

    it('should get networks without API', () => {
      const networks = detector.getNetworksByApiAvailability(false);
      expect(networks.length).toBeGreaterThan(0);
      networks.forEach(network => {
        expect(network.apiAvailable).toBe(false);
      });
    });
  });

  describe('getNetworksByRiskLevel()', () => {
    it('should get low risk networks', () => {
      const networks = detector.getNetworksByRiskLevel('low');
      expect(networks.length).toBe(2); // PartnerStack, Reditus
      expect(networks.map(n => n.id)).toContain('partnerstack');
      expect(networks.map(n => n.id)).toContain('reditus');
    });

    it('should get medium risk networks', () => {
      const networks = detector.getNetworksByRiskLevel('medium');
      expect(networks.length).toBeGreaterThan(0);
    });

    it('should get high risk networks', () => {
      const networks = detector.getNetworksByRiskLevel('high');
      expect(networks.length).toBe(2); // Amazon, Teachable
    });
  });

  describe('searchNetworks()', () => {
    it('should search by name', () => {
      const results = detector.searchNetworks('ShareASale');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('shareasale');
    });

    it('should search by domain', () => {
      const results = detector.searchNetworks('impact.com');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('impact');
    });

    it('should search case-insensitively', () => {
      const results = detector.searchNetworks('AMAZON');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('amazon-associates');
    });

    it('should return empty array for no matches', () => {
      const results = detector.searchNetworks('nonexistent-network');
      expect(results.length).toBe(0);
    });

    it('should find partial matches', () => {
      const results = detector.searchNetworks('stack');
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('partnerstack');
    });
  });

  // =========================================================================
  // UTILITY FUNCTION TESTS
  // =========================================================================

  describe('isAffiliateNetwork()', () => {
    it('should return true for affiliate networks', () => {
      expect(detector.isAffiliateNetwork('https://shareasale.com')).toBe(true);
      expect(detector.isAffiliateNetwork('https://cj.com')).toBe(true);
    });

    it('should return false for non-affiliate networks', () => {
      expect(detector.isAffiliateNetwork('https://google.com')).toBe(false);
      expect(detector.isAffiliateNetwork('https://github.com')).toBe(false);
    });
  });

  // =========================================================================
  // SINGLETON AND HELPER EXPORTS TESTS
  // =========================================================================

  describe('Singleton and helper exports', () => {
    it('should export singleton instance', () => {
      expect(networkDetector).toBeInstanceOf(NetworkDetector);
    });

    it('should work with isAffiliateNetwork helper', () => {
      expect(isAffiliateNetwork('https://shareasale.com')).toBe(true);
      expect(isAffiliateNetwork('https://google.com')).toBe(false);
    });

    it('should work with detectNetwork helper', () => {
      const network = detectNetwork('https://cj.com');
      expect(network?.id).toBe('cj-affiliate');
    });

    it('should work with getToSLevel helper', () => {
      expect(getToSLevel('http://localhost:3000')).toBe(0);
      expect(getToSLevel('https://shareasale.com')).toBe(1);
      expect(getToSLevel('https://affiliate-program.amazon.com')).toBe(2);
    });

    it('should work with getAllNetworks helper', () => {
      const networks = getAllNetworks();
      expect(networks.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // INTEGRATION TESTS
  // =========================================================================

  describe('Integration scenarios', () => {
    it('should handle complete workflow for ShareASale', () => {
      const url = 'https://account.shareasale.com/dashboard';

      // Detect network
      const network = detector.detectNetwork(url);
      expect(network).not.toBeNull();

      // Get config
      const config = detector.getNetworkConfig(network!.id);
      expect(config).not.toBeNull();
      expect(config?.automationPermitted).toBe(true);

      // Check ToS level
      const level = detector.getToSLevel(url);
      expect(level).toBe(1);
    });

    it('should handle complete workflow for Amazon Associates', () => {
      const url = 'https://affiliate-program.amazon.com/signup';

      // Detect network
      const network = detector.detectNetwork(url);
      expect(network).not.toBeNull();
      expect(network?.id).toBe('amazon-associates');

      // Get config
      const config = detector.getNetworkConfig(network!.id);
      expect(config?.automationPermitted).toBe(false);
      expect(config?.maxAutomationMode).toBe('human-guided');
      expect(config?.riskLevel).toBe('high');

      // Check ToS level
      const level = detector.getToSLevel(url);
      expect(level).toBe(2);
    });

    it('should handle localhost development scenario', () => {
      const url = 'http://localhost:3000/affiliate-dashboard';

      // Should not detect as affiliate network
      const network = detector.detectNetwork(url);
      expect(network).toBeNull();

      // But should detect as Level 0 (safe)
      const level = detector.getToSLevel(url);
      expect(level).toBe(0);
    });
  });

  // =========================================================================
  // DATA INTEGRITY TESTS
  // =========================================================================

  describe('Data integrity', () => {
    it('should have valid network metadata', () => {
      const networks = detector.listSupportedNetworks();

      networks.forEach(network => {
        // Required fields
        expect(network.id).toBeTruthy();
        expect(network.name).toBeTruthy();
        expect(network.domain).toBeTruthy();
        expect(network.signupUrl).toBeTruthy();
        expect(network.dashboardUrl).toBeTruthy();

        // ToS level must be 0-3
        expect(network.tosLevel).toBeGreaterThanOrEqual(0);
        expect(network.tosLevel).toBeLessThanOrEqual(3);

        // API available must be boolean
        expect(typeof network.apiAvailable).toBe('boolean');

        // URLs must be valid
        expect(() => new URL(network.signupUrl)).not.toThrow();
        expect(() => new URL(network.dashboardUrl)).not.toThrow();
      });
    });

    it('should have unique network IDs', () => {
      const networks = detector.listSupportedNetworks();
      const ids = networks.map(n => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique domains', () => {
      const networks = detector.listSupportedNetworks();
      const domains = networks.map(n => n.domain);
      const uniqueDomains = new Set(domains);
      expect(uniqueDomains.size).toBe(domains.length);
    });
  });

  // =========================================================================
  // COMPLIANCE TESTS
  // =========================================================================

  describe('ToS compliance mapping', () => {
    it('should mark explicitly prohibited networks as Level 2+', () => {
      const prohibited = ['amazon-associates', 'teachable'];

      prohibited.forEach(id => {
        const config = detector.getNetworkConfig(id);
        expect(config?.network.tosLevel).toBeGreaterThanOrEqual(2);
        expect(config?.automationPermitted).toBe(false);
      });
    });

    it('should mark automation-friendly networks as low risk', () => {
      const friendly = ['partnerstack', 'reditus'];

      friendly.forEach(id => {
        const config = detector.getNetworkConfig(id);
        expect(config?.riskLevel).toBe('low');
        expect(config?.automationPermitted).toBe(true);
      });
    });

    it('should have automation notes for all networks', () => {
      const networks = detector.listSupportedNetworks();

      networks.forEach(network => {
        expect(network.automationNotes).toBeTruthy();
        expect(typeof network.automationNotes).toBe('string');
      });
    });
  });
});
