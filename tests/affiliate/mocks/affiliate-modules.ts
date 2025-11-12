/**
 * Affiliate Automation Modules
 * Core implementation for network detection, link extraction, and compliance
 */

import {
  AffiliateNetwork,
  AffiliateLink,
  TOSLevel,
  ComplianceLog,
  createComplianceLog,
  InsertAffiliateLink,
} from '../../../src/database/affiliate-types';
import { MockAgentDB } from './mock-agentdb';

// ============================================================================
// Network Detector
// ============================================================================

export interface NetworkDetectorConfig {
  networks: AffiliateNetwork[];
}

/**
 * Detects affiliate network from URL
 */
export class NetworkDetector {
  private networkMap: Map<string, AffiliateNetwork> = new Map();

  constructor(private config: NetworkDetectorConfig) {
    // Build domain lookup map
    config.networks.forEach((network) => {
      this.networkMap.set(network.domain, network);
      // Also map common domain variations
      const baseDomain = network.domain.replace(/^www\./, '');
      this.networkMap.set(baseDomain, network);
    });
  }

  /**
   * Detects network from URL
   */
  detectNetwork(url: string): AffiliateNetwork | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Direct match
      if (this.networkMap.has(hostname)) {
        return this.networkMap.get(hostname)!;
      }

      // Try without www
      const withoutWww = hostname.replace(/^www\./, '');
      if (this.networkMap.has(withoutWww)) {
        return this.networkMap.get(withoutWww)!;
      }

      // Try domain contains match
      for (const [domain, network] of this.networkMap.entries()) {
        if (hostname.includes(domain) || domain.includes(hostname)) {
          return network;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Gets TOS level for a URL
   */
  getTOSLevel(url: string): TOSLevel | null {
    const network = this.detectNetwork(url);
    return network ? network.tos_level : null;
  }

  /**
   * Checks if automation is allowed
   */
  isAutomationAllowed(url: string): boolean {
    const tosLevel = this.getTOSLevel(url);
    if (tosLevel === null) return false;

    // Only FULLY_AUTOMATED and HUMAN_GUIDED allow automation
    return tosLevel === TOSLevel.FULLY_AUTOMATED || tosLevel === TOSLevel.HUMAN_GUIDED;
  }

  /**
   * Checks if human verification is required
   */
  requiresHumanVerification(url: string): boolean {
    const tosLevel = this.getTOSLevel(url);
    if (tosLevel === null) return true;

    return tosLevel === TOSLevel.MANUAL_VERIFICATION || tosLevel === TOSLevel.FULLY_MANUAL;
  }
}

// ============================================================================
// Link Extractor
// ============================================================================

export interface LinkExtractorConfig {
  db: MockAgentDB;
  networkDetector: NetworkDetector;
}

export interface ExtractedLinkData {
  url: string;
  productId?: string;
  productName?: string;
  commission?: string;
}

/**
 * Extracts affiliate links from pages
 */
export class LinkExtractor {
  constructor(private config: LinkExtractorConfig) {}

  /**
   * Extracts links from HTML content
   */
  extractLinksFromHTML(html: string, currentUrl: string): ExtractedLinkData[] {
    const network = this.config.networkDetector.detectNetwork(currentUrl);
    if (!network) return [];

    const links: ExtractedLinkData[] = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    const commissionRegex = /<span[^>]+class=["'][^"']*commission[^"']*["'][^>]*>([^<]+)<\/span>/gi;

    let match;
    const extractedUrls: string[] = [];

    // Extract all links
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      const text = match[2].trim();

      // Validate it's an affiliate link for this network
      if (this.isAffiliateLink(url, network)) {
        extractedUrls.push(url);
        links.push({
          url,
          productName: text || undefined,
        });
      }
    }

    // Try to extract commission rates
    const commissions: string[] = [];
    while ((match = commissionRegex.exec(html)) !== null) {
      commissions.push(match[1].trim());
    }

    // Associate commissions with links
    links.forEach((link, index) => {
      if (commissions[index]) {
        link.commission = commissions[index];
      }
    });

    return links;
  }

  /**
   * Validates if URL is an affiliate link
   */
  isAffiliateLink(url: string, network: AffiliateNetwork): boolean {
    try {
      const urlObj = new URL(url);

      // Check if domain matches network
      if (
        !urlObj.hostname.includes(network.domain) &&
        !network.domain.includes(urlObj.hostname.replace(/^www\./, ''))
      ) {
        return false;
      }

      // Check for common affiliate URL patterns
      const affiliatePatterns = [
        /[?&]aff=/i,
        /[?&]affiliate=/i,
        /[?&]ref=/i,
        /[?&]partner=/i,
        /[?&]tag=/i,
        /[?&][ub]=/i, // ShareASale style
        /[?&]m=/i, // Merchant ID
        /\/r\.cfm/i, // ShareASale redirect
      ];

      return affiliatePatterns.some((pattern) => pattern.test(url));
    } catch {
      return false;
    }
  }

  /**
   * Stores extracted links in database
   */
  async storeLinks(
    links: ExtractedLinkData[],
    networkId: string
  ): Promise<AffiliateLink[]> {
    const storedLinks: AffiliateLink[] = [];
    const now = Date.now();

    for (const linkData of links) {
      // Check if link already exists
      const existing = this.config.db.getLinkByUrl(linkData.url);

      if (existing) {
        // Update last_validated
        this.config.db.updateLink(existing.id!, {
          last_validated: now,
        });
        storedLinks.push(existing);
      } else {
        // Insert new link
        const newLink: InsertAffiliateLink = {
          network_id: networkId,
          url: linkData.url,
          product_id: linkData.productId,
          product_name: linkData.productName,
          commission: linkData.commission,
          extracted_at: now,
          is_active: true,
        };

        const stored = this.config.db.addLink(newLink);
        storedLinks.push(stored);
      }
    }

    return storedLinks;
  }

  /**
   * Validates link is still active
   */
  async validateLink(linkId: number): Promise<boolean> {
    const link = this.config.db.getLink(linkId);
    if (!link) return false;

    // In a real implementation, this would make an HTTP request
    // For testing, we just update the timestamp
    const now = Date.now();
    this.config.db.updateLink(linkId, {
      last_validated: now,
    });

    return true;
  }

  /**
   * Handles pagination for link extraction
   */
  async extractWithPagination(
    html: string,
    currentUrl: string,
    maxPages: number = 5
  ): Promise<ExtractedLinkData[]> {
    const allLinks: ExtractedLinkData[] = [];
    let currentPage = 1;

    // Extract from current page
    const pageLinks = this.extractLinksFromHTML(html, currentUrl);
    allLinks.push(...pageLinks);

    // Check for pagination (simplified for testing)
    const hasNextPage = html.includes('next-page') || html.includes('pagination');

    if (hasNextPage && currentPage < maxPages) {
      // In real implementation, would navigate to next page
      // For testing, we just simulate
      currentPage++;
    }

    return allLinks;
  }
}

// ============================================================================
// Compliance Checker
// ============================================================================

export interface ComplianceCheckerConfig {
  db: MockAgentDB;
  networkDetector: NetworkDetector;
}

export interface ComplianceDecision {
  allowed: boolean;
  requiresHuman: boolean;
  tosLevel: TOSLevel;
  message: string;
  logEntry: ComplianceLog;
}

/**
 * Enforces TOS compliance for affiliate automation
 */
export class ComplianceChecker {
  constructor(private config: ComplianceCheckerConfig) {}

  /**
   * Checks if action is compliant
   */
  checkAction(action: string, url: string): ComplianceDecision {
    const network = this.config.networkDetector.detectNetwork(url);

    if (!network) {
      const log = createComplianceLog(
        'unknown_network',
        'warning',
        {
          action_details: `Action blocked: ${action} on unknown network`,
          context: { url },
        }
      );
      const storedLog = this.config.db.addComplianceLog(log);

      return {
        allowed: false,
        requiresHuman: true,
        tosLevel: TOSLevel.FULLY_MANUAL,
        message: 'Unknown network - human verification required',
        logEntry: storedLog,
      };
    }

    const tosLevel = network.tos_level;

    // Check action against TOS level
    if (action === 'automated_signup') {
      return this.checkSignupCompliance(network);
    } else if (action === 'extract_links') {
      return this.checkLinkExtractionCompliance(network);
    } else if (action === 'prefill_form') {
      return this.checkFormPrefillCompliance(network);
    }

    // Default: allow if not restricted
    const log = createComplianceLog(
      action,
      'info',
      {
        action_details: `Action allowed: ${action}`,
        context: { network_id: network.id, tos_level: tosLevel },
      },
      network.id
    );
    const storedLog = this.config.db.addComplianceLog(log);

    return {
      allowed: true,
      requiresHuman: false,
      tosLevel,
      message: 'Action allowed',
      logEntry: storedLog,
    };
  }

  /**
   * Checks signup compliance
   */
  private checkSignupCompliance(network: AffiliateNetwork): ComplianceDecision {
    const tosLevel = network.tos_level;

    if (tosLevel === TOSLevel.FULLY_MANUAL) {
      const log = createComplianceLog(
        'block_automated_signup',
        'critical',
        {
          action_details: `Automated signup blocked for ${network.name}`,
          context: { network_id: network.id, tos_level: tosLevel },
        },
        network.id
      );
      const storedLog = this.config.db.addComplianceLog(log);

      return {
        allowed: false,
        requiresHuman: true,
        tosLevel,
        message: `${network.name} prohibits automated signup - human required`,
        logEntry: storedLog,
      };
    }

    if (tosLevel === TOSLevel.MANUAL_VERIFICATION) {
      const log = createComplianceLog(
        'signup_requires_verification',
        'warning',
        {
          action_details: `Signup requires human verification for ${network.name}`,
          context: { network_id: network.id, tos_level: tosLevel },
        },
        network.id
      );
      const storedLog = this.config.db.addComplianceLog(log);

      return {
        allowed: true,
        requiresHuman: true,
        tosLevel,
        message: `${network.name} requires manual verification steps`,
        logEntry: storedLog,
      };
    }

    // FULLY_AUTOMATED or HUMAN_GUIDED
    const log = createComplianceLog(
      'automated_signup_allowed',
      'info',
      {
        action_details: `Automated signup allowed for ${network.name}`,
        context: { network_id: network.id, tos_level: tosLevel },
      },
      network.id
    );
    const storedLog = this.config.db.addComplianceLog(log);

    return {
      allowed: true,
      requiresHuman: tosLevel === TOSLevel.HUMAN_GUIDED,
      tosLevel,
      message: 'Automated signup allowed',
      logEntry: storedLog,
    };
  }

  /**
   * Checks link extraction compliance
   */
  private checkLinkExtractionCompliance(network: AffiliateNetwork): ComplianceDecision {
    // Link extraction is generally allowed for all networks
    const log = createComplianceLog(
      'extract_affiliate_links',
      'info',
      {
        action_details: `Link extraction allowed for ${network.name}`,
        context: { network_id: network.id },
      },
      network.id
    );
    const storedLog = this.config.db.addComplianceLog(log);

    return {
      allowed: true,
      requiresHuman: false,
      tosLevel: network.tos_level,
      message: 'Link extraction allowed',
      logEntry: storedLog,
    };
  }

  /**
   * Checks form prefill compliance
   */
  private checkFormPrefillCompliance(network: AffiliateNetwork): ComplianceDecision {
    const tosLevel = network.tos_level;

    if (tosLevel === TOSLevel.FULLY_MANUAL) {
      const log = createComplianceLog(
        'block_form_prefill',
        'warning',
        {
          action_details: `Form prefill blocked for ${network.name}`,
          context: { network_id: network.id, tos_level: tosLevel },
        },
        network.id
      );
      const storedLog = this.config.db.addComplianceLog(log);

      return {
        allowed: false,
        requiresHuman: true,
        tosLevel,
        message: 'Form prefill not allowed - fully manual required',
        logEntry: storedLog,
      };
    }

    // Allowed for other TOS levels
    const log = createComplianceLog(
      'prefill_signup_form',
      'info',
      {
        action_details: `Form prefill allowed for ${network.name}`,
        context: { network_id: network.id, tos_level: tosLevel },
      },
      network.id
    );
    const storedLog = this.config.db.addComplianceLog(log);

    return {
      allowed: true,
      requiresHuman: false,
      tosLevel,
      message: 'Form prefill allowed',
      logEntry: storedLog,
    };
  }

  /**
   * Logs compliance decision
   */
  logDecision(decision: ComplianceDecision): void {
    // Already logged in the database via checkAction
    console.log(
      `[Compliance] ${decision.allowed ? 'ALLOWED' : 'BLOCKED'}: ${decision.message}`
    );
  }

  /**
   * Gets compliance history for a network
   */
  getComplianceHistory(networkId: string, limit: number = 10): ComplianceLog[] {
    return this.config.db.getComplianceLogsByNetwork(networkId, limit);
  }

  /**
   * Gets critical compliance violations
   */
  getCriticalViolations(): ComplianceLog[] {
    return this.config.db.getCriticalComplianceLogs();
  }
}
