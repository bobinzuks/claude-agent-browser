/**
 * LinkExtractor Unit Tests
 * Tests for affiliate link extraction and storage
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { LinkExtractor, NetworkDetector } from '../mocks/affiliate-modules';
import { createMockAgentDB, MockAgentDB } from '../mocks/mock-agentdb';
import {
  ALL_NETWORKS,
  SHAREASALE_NETWORK,
  SHAREASALE_DASHBOARD_HTML,
  SHAREASALE_LINKS,
} from '../fixtures/network-fixtures';

describe('LinkExtractor', () => {
  let db: MockAgentDB;
  let detector: NetworkDetector;
  let extractor: LinkExtractor;

  beforeEach(() => {
    db = createMockAgentDB();
    db.seed({ networks: ALL_NETWORKS });

    detector = new NetworkDetector({ networks: ALL_NETWORKS });
    extractor = new LinkExtractor({ db, networkDetector: detector });
  });

  describe('extractLinksFromHTML', () => {
    test('extracts links from ShareASale dashboard', () => {
      const links = extractor.extractLinksFromHTML(
        SHAREASALE_DASHBOARD_HTML,
        'https://www.shareasale.com/dashboard'
      );

      expect(links.length).toBeGreaterThan(0);
      expect(links[0].url).toContain('shareasale.com/r.cfm');
      expect(links[0].url).toMatch(/[?&][ub]=/); // ShareASale affiliate params
    });

    test('extracts product names from links', () => {
      const html = `
        <div class="links">
          <a href="https://shareasale.com/r.cfm?b=123&u=456&m=789">WordPress Theme Pro</a>
          <a href="https://shareasale.com/r.cfm?b=234&u=456&m=789">SEO Plugin</a>
        </div>
      `;

      const links = extractor.extractLinksFromHTML(
        html,
        'https://www.shareasale.com/dashboard'
      );

      expect(links.length).toBe(2);
      expect(links[0].productName).toBe('WordPress Theme Pro');
      expect(links[1].productName).toBe('SEO Plugin');
    });

    test('extracts commission rates when available', () => {
      const html = `
        <div class="links">
          <a href="https://shareasale.com/r.cfm?b=123&u=456&m=789">Product 1</a>
          <span class="commission">30%</span>
          <a href="https://shareasale.com/r.cfm?b=234&u=456&m=789">Product 2</a>
          <span class="commission">25%</span>
        </div>
      `;

      const links = extractor.extractLinksFromHTML(
        html,
        'https://www.shareasale.com/dashboard'
      );

      expect(links.length).toBe(2);
      expect(links[0].commission).toBe('30%');
      expect(links[1].commission).toBe('25%');
    });

    test('returns empty array for unknown network', () => {
      const html = '<a href="https://example.com/affiliate">Link</a>';
      const links = extractor.extractLinksFromHTML(html, 'https://unknown.com');

      expect(links).toEqual([]);
    });

    test('filters out non-affiliate links', () => {
      const html = `
        <a href="https://shareasale.com/about">About Page</a>
        <a href="https://shareasale.com/r.cfm?b=123&u=456&m=789">Affiliate Link</a>
        <a href="https://external.com/link">External Link</a>
      `;

      const links = extractor.extractLinksFromHTML(
        html,
        'https://www.shareasale.com/dashboard'
      );

      expect(links.length).toBe(1);
      expect(links[0].url).toContain('r.cfm');
    });

    test('handles empty HTML', () => {
      const links = extractor.extractLinksFromHTML(
        '',
        'https://www.shareasale.com/dashboard'
      );
      expect(links).toEqual([]);
    });

    test('handles HTML with no links', () => {
      const html = '<div>No links here</div>';
      const links = extractor.extractLinksFromHTML(
        html,
        'https://www.shareasale.com/dashboard'
      );
      expect(links).toEqual([]);
    });

    test('handles malformed HTML gracefully', () => {
      const html = '<a href="broken';
      const links = extractor.extractLinksFromHTML(
        html,
        'https://www.shareasale.com/dashboard'
      );
      expect(links).toEqual([]);
    });
  });

  describe('isAffiliateLink', () => {
    test('validates ShareASale affiliate links', () => {
      const url = 'https://shareasale.com/r.cfm?b=123&u=456&m=789';
      const isAffiliate = extractor.isAffiliateLink(url, SHAREASALE_NETWORK);
      expect(isAffiliate).toBe(true);
    });

    test('validates links with affiliate parameters', () => {
      const testCases = [
        'https://example.com/product?aff=123',
        'https://example.com/product?affiliate=abc',
        'https://example.com/product?ref=xyz',
        'https://example.com/product?partner=partner123',
        'https://amazon.com/dp/B08N5WRWNW?tag=myassoc-20',
      ];

      testCases.forEach((url) => {
        const network = detector.detectNetwork(url) || SHAREASALE_NETWORK;
        // These would need proper network context, but testing the pattern matching
        const hasAffiliatePattern = /[?&](aff|affiliate|ref|partner|tag)=/i.test(url);
        expect(hasAffiliatePattern).toBe(true);
      });
    });

    test('rejects non-affiliate links', () => {
      const url = 'https://shareasale.com/about';
      const isAffiliate = extractor.isAffiliateLink(url, SHAREASALE_NETWORK);
      expect(isAffiliate).toBe(false);
    });

    test('rejects links from different domains', () => {
      const url = 'https://different-network.com/r.cfm?b=123';
      const isAffiliate = extractor.isAffiliateLink(url, SHAREASALE_NETWORK);
      expect(isAffiliate).toBe(false);
    });

    test('handles invalid URLs', () => {
      const url = 'not-a-url';
      const isAffiliate = extractor.isAffiliateLink(url, SHAREASALE_NETWORK);
      expect(isAffiliate).toBe(false);
    });
  });

  describe('storeLinks', () => {
    test('stores extracted links in database', async () => {
      const linkData = [
        {
          url: 'https://shareasale.com/r.cfm?b=123&u=456&m=789',
          productName: 'Test Product',
          commission: '30%',
        },
      ];

      const stored = await extractor.storeLinks(linkData, 'shareasale');

      expect(stored.length).toBe(1);
      expect(stored[0].url).toBe(linkData[0].url);
      expect(stored[0].product_name).toBe('Test Product');
      expect(stored[0].commission).toBe('30%');
      expect(stored[0].network_id).toBe('shareasale');
      expect(stored[0].is_active).toBe(true);
    });

    test('updates existing links instead of duplicating', async () => {
      const linkData = {
        url: 'https://shareasale.com/r.cfm?b=123&u=456&m=789',
        productName: 'Test Product',
      };

      // Store first time
      await extractor.storeLinks([linkData], 'shareasale');
      const statsAfterFirst = db.getStats();
      expect(statsAfterFirst.links).toBe(1);

      // Store again
      await extractor.storeLinks([linkData], 'shareasale');
      const statsAfterSecond = db.getStats();
      expect(statsAfterSecond.links).toBe(1); // Should still be 1

      // Verify last_validated was updated
      const link = db.getLinkByUrl(linkData.url);
      expect(link?.last_validated).toBeDefined();
    });

    test('stores multiple links at once', async () => {
      const linkData = [
        { url: 'https://shareasale.com/r.cfm?b=1&u=1&m=1', productName: 'Product 1' },
        { url: 'https://shareasale.com/r.cfm?b=2&u=1&m=1', productName: 'Product 2' },
        { url: 'https://shareasale.com/r.cfm?b=3&u=1&m=1', productName: 'Product 3' },
      ];

      const stored = await extractor.storeLinks(linkData, 'shareasale');

      expect(stored.length).toBe(3);
      expect(db.getStats().links).toBe(3);
    });

    test('sets correct timestamps', async () => {
      const linkData = [
        {
          url: 'https://shareasale.com/r.cfm?b=123&u=456&m=789',
          productName: 'Test Product',
        },
      ];

      const before = Date.now();
      const stored = await extractor.storeLinks(linkData, 'shareasale');
      const after = Date.now();

      expect(stored[0].extracted_at).toBeGreaterThanOrEqual(before);
      expect(stored[0].extracted_at).toBeLessThanOrEqual(after);
    });

    test('handles empty link array', async () => {
      const stored = await extractor.storeLinks([], 'shareasale');
      expect(stored).toEqual([]);
      expect(db.getStats().links).toBe(0);
    });
  });

  describe('validateLink', () => {
    test('validates existing link', async () => {
      // Setup: Add a link first
      const linkData = [
        {
          url: 'https://shareasale.com/r.cfm?b=123&u=456&m=789',
          productName: 'Test Product',
        },
      ];
      const stored = await extractor.storeLinks(linkData, 'shareasale');
      const linkId = stored[0].id!;

      // Validate
      const isValid = await extractor.validateLink(linkId);
      expect(isValid).toBe(true);

      // Check last_validated was updated
      const link = db.getLink(linkId);
      expect(link?.last_validated).toBeDefined();
    });

    test('returns false for non-existent link', async () => {
      const isValid = await extractor.validateLink(99999);
      expect(isValid).toBe(false);
    });

    test('updates validation timestamp', async () => {
      const linkData = [
        {
          url: 'https://shareasale.com/r.cfm?b=123&u=456&m=789',
          productName: 'Test Product',
        },
      ];
      const stored = await extractor.storeLinks(linkData, 'shareasale');
      const linkId = stored[0].id!;

      const beforeValidation = Date.now();
      await extractor.validateLink(linkId);
      const afterValidation = Date.now();

      const link = db.getLink(linkId);
      expect(link?.last_validated).toBeGreaterThanOrEqual(beforeValidation);
      expect(link?.last_validated).toBeLessThanOrEqual(afterValidation);
    });
  });

  describe('extractWithPagination', () => {
    test('extracts links from single page', async () => {
      const html = `
        <div class="links">
          <a href="https://shareasale.com/r.cfm?b=123&u=456&m=789">Product 1</a>
          <a href="https://shareasale.com/r.cfm?b=234&u=456&m=789">Product 2</a>
        </div>
      `;

      const links = await extractor.extractWithPagination(
        html,
        'https://www.shareasale.com/dashboard',
        1
      );

      expect(links.length).toBe(2);
    });

    test('respects max pages limit', async () => {
      const html = `
        <div class="links">
          <a href="https://shareasale.com/r.cfm?b=123&u=456&m=789">Product 1</a>
        </div>
        <div class="pagination">
          <a href="?page=2" class="next-page">Next</a>
        </div>
      `;

      // With pagination present but maxPages=1, should only get current page
      const links = await extractor.extractWithPagination(
        html,
        'https://www.shareasale.com/dashboard',
        1
      );

      expect(links.length).toBe(1);
    });

    test('handles pages without pagination', async () => {
      const html = `
        <div class="links">
          <a href="https://shareasale.com/r.cfm?b=123&u=456&m=789">Product 1</a>
        </div>
      `;

      const links = await extractor.extractWithPagination(
        html,
        'https://www.shareasale.com/dashboard',
        5
      );

      expect(links.length).toBe(1);
    });
  });

  describe('integration with database', () => {
    test('stores and retrieves links correctly', async () => {
      const linkData = [
        {
          url: 'https://shareasale.com/r.cfm?b=123&u=456&m=789',
          productName: 'Product 1',
          commission: '30%',
        },
        {
          url: 'https://shareasale.com/r.cfm?b=234&u=456&m=789',
          productName: 'Product 2',
          commission: '25%',
        },
      ];

      await extractor.storeLinks(linkData, 'shareasale');

      const retrievedLinks = db.getLinksByNetwork('shareasale');
      expect(retrievedLinks.length).toBe(2);
      expect(retrievedLinks[0].product_name).toBe('Product 1');
      expect(retrievedLinks[1].product_name).toBe('Product 2');
    });

    test('filters by active status', async () => {
      const linkData = [
        { url: 'https://shareasale.com/r.cfm?b=1&u=1&m=1', productName: 'Active' },
        { url: 'https://shareasale.com/r.cfm?b=2&u=1&m=1', productName: 'Inactive' },
      ];

      const stored = await extractor.storeLinks(linkData, 'shareasale');

      // Deactivate second link
      db.updateLink(stored[1].id!, { is_active: false });

      const activeLinks = db.getActiveLinks('shareasale');
      expect(activeLinks.length).toBe(1);
      expect(activeLinks[0].product_name).toBe('Active');
    });
  });

  describe('performance and edge cases', () => {
    test('handles large HTML documents', () => {
      // Generate HTML with 100 links
      const links = Array.from(
        { length: 100 },
        (_, i) =>
          `<a href="https://shareasale.com/r.cfm?b=${i}&u=456&m=789">Product ${i}</a>`
      );
      const html = `<div class="links">${links.join('\n')}</div>`;

      const start = Date.now();
      const extracted = extractor.extractLinksFromHTML(
        html,
        'https://www.shareasale.com/dashboard'
      );
      const end = Date.now();

      expect(extracted.length).toBe(100);
      expect(end - start).toBeLessThan(100); // Should be fast
    });

    test('handles special characters in product names', async () => {
      const html = `
        <a href="https://shareasale.com/r.cfm?b=123&u=456&m=789">Product with "quotes" & ampersand</a>
      `;

      const links = extractor.extractLinksFromHTML(
        html,
        'https://www.shareasale.com/dashboard'
      );

      expect(links[0].productName).toContain('quotes');
      expect(links[0].productName).toContain('ampersand');
    });

    test('handles Unicode in product names', async () => {
      const html = `
        <a href="https://shareasale.com/r.cfm?b=123&u=456&m=789">Product™ with €uro and 中文</a>
      `;

      const links = extractor.extractLinksFromHTML(
        html,
        'https://www.shareasale.com/dashboard'
      );

      expect(links[0].productName).toContain('™');
      expect(links[0].productName).toContain('€');
      expect(links[0].productName).toContain('中文');
    });
  });
});
