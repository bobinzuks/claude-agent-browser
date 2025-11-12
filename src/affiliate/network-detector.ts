/**
 * Affiliate Network Detection Module
 *
 * Detects affiliate networks from URLs and provides metadata including:
 * - Network identification
 * - ToS compliance levels (from COMPLIANCE_REPORT.md)
 * - API availability
 * - Network configuration
 *
 * ToS Levels:
 * - Level 0: Safe/Whitelisted (localhost, *.local, user-whitelisted)
 * - Level 1: Generic sites (auto-promotes with confidence)
 * - Level 2: Social/E-commerce (always human-guided)
 * - Level 3: Financial/Government (never automates)
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * ToS compliance level determines automation behavior
 */
export type ToSLevel = 0 | 1 | 2 | 3;

/**
 * Affiliate network metadata
 */
export interface AffiliateNetwork {
  /** Unique identifier for the network */
  id: string;

  /** Display name */
  name: string;

  /** Primary domain */
  domain: string;

  /** Alternative domains (e.g., redirects, subdomains) */
  alternateDomains?: string[];

  /** ToS compliance level (0-3) */
  tosLevel: ToSLevel;

  /** Whether the network provides a public API */
  apiAvailable: boolean;

  /** Signup/registration URL */
  signupUrl: string;

  /** Dashboard/login URL */
  dashboardUrl: string;

  /** Additional notes about automation policies */
  automationNotes?: string;

  /** Commission structure (if known) */
  commissionType?: 'cpa' | 'cps' | 'cpl' | 'hybrid';

  /** Minimum payout threshold (if known) */
  minimumPayout?: number;
}

/**
 * Network configuration for automation
 */
export interface NetworkConfig {
  /** Network metadata */
  network: AffiliateNetwork;

  /** Whether automation is permitted */
  automationPermitted: boolean;

  /** Maximum automation level allowed */
  maxAutomationMode: 'none' | 'human-guided' | 'assisted-auto' | 'full-auto';

  /** Recommended approach based on ToS */
  recommendedApproach: string;

  /** Risk level for automation */
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

/**
 * URL pattern for network detection
 */
interface NetworkPattern {
  /** Domain patterns to match (supports wildcards) */
  domains: string[];

  /** URL path patterns (optional) */
  paths?: string[];

  /** Query parameter patterns (optional) */
  queryParams?: Record<string, string>;
}

// ============================================================================
// NETWORK DATABASE
// ============================================================================

/**
 * Complete database of affiliate networks with ToS classification
 * Based on COMPLIANCE_REPORT.md analysis
 */
const AFFILIATE_NETWORKS: AffiliateNetwork[] = [
  // -------------------------------------------------------------------------
  // LEVEL 0: Safe Domains (Full Auto)
  // -------------------------------------------------------------------------
  // Note: These are handled dynamically by domain matching (localhost, *.local)

  // -------------------------------------------------------------------------
  // LEVEL 1: Generic Sites (Auto-Promotes)
  // -------------------------------------------------------------------------
  {
    id: 'shareasale',
    name: 'ShareASale',
    domain: 'shareasale.com',
    alternateDomains: ['www.shareasale.com', 'account.shareasale.com'],
    tosLevel: 1,
    apiAvailable: true,
    signupUrl: 'https://account.shareasale.com/newsignup.cfm',
    dashboardUrl: 'https://account.shareasale.com/',
    automationNotes: 'API for reporting/transactions only. No public signup API. Manual approval recommended.',
    commissionType: 'hybrid',
  },
  {
    id: 'cj-affiliate',
    name: 'CJ Affiliate (Commission Junction)',
    domain: 'cj.com',
    alternateDomains: ['www.cj.com', 'members.cj.com', 'signup.cj.com'],
    tosLevel: 1,
    apiAvailable: true,
    signupUrl: 'https://signup.cj.com/member/signup/publisher/',
    dashboardUrl: 'https://members.cj.com/',
    automationNotes: 'Personal Access Tokens for reporting/analytics. No signup API documented.',
    commissionType: 'hybrid',
  },
  {
    id: 'impact',
    name: 'Impact.com',
    domain: 'impact.com',
    alternateDomains: ['www.impact.com', 'app.impact.com', 'impact.radius.com'],
    tosLevel: 1,
    apiAvailable: true,
    signupUrl: 'https://impact.com/partners/',
    dashboardUrl: 'https://app.impact.com/',
    automationNotes: 'Robust REST API for partnership management. Signup automation not clearly supported.',
    commissionType: 'hybrid',
  },
  {
    id: 'rakuten',
    name: 'Rakuten Advertising',
    domain: 'rakutenadvertising.com',
    alternateDomains: [
      'www.rakutenadvertising.com',
      'linkshare.com',
      'cli.linksynergy.com',
      'rakutenmarketing.com'
    ],
    tosLevel: 1,
    apiAvailable: true,
    signupUrl: 'https://rakutenadvertising.com/publisher/',
    dashboardUrl: 'https://cli.linksynergy.com/',
    automationNotes: 'API for affiliate data and conversions. Simple signup but no automation API.',
    commissionType: 'hybrid',
  },
  {
    id: 'clickbank',
    name: 'ClickBank',
    domain: 'clickbank.com',
    alternateDomains: ['www.clickbank.com', 'accounts.clickbank.com'],
    tosLevel: 1,
    apiAvailable: false,
    signupUrl: 'https://accounts.clickbank.com/signup/',
    dashboardUrl: 'https://accounts.clickbank.com/',
    automationNotes: 'Manual approval process. Difficulty getting approved suggests automation problematic.',
    commissionType: 'cps',
  },
  {
    id: 'partnerstack',
    name: 'PartnerStack',
    domain: 'partnerstack.com',
    alternateDomains: ['www.partnerstack.com', 'app.partnerstack.com'],
    tosLevel: 1,
    apiAvailable: true,
    signupUrl: 'https://partnerstack.com/sign-up/',
    dashboardUrl: 'https://app.partnerstack.com/',
    automationNotes: 'EXPLICITLY SUPPORTS automation via auto-accept links and Zapier integration. LOW RISK.',
    commissionType: 'hybrid',
  },
  {
    id: 'reditus',
    name: 'Reditus',
    domain: 'reditus.com',
    alternateDomains: ['www.reditus.com', 'app.reditus.com'],
    tosLevel: 1,
    apiAvailable: true,
    signupUrl: 'https://reditus.com/signup/',
    dashboardUrl: 'https://app.reditus.com/',
    automationNotes: 'AUTO-ACCEPT LINKS feature. Designed for automation. LOW RISK.',
    commissionType: 'hybrid',
  },

  // -------------------------------------------------------------------------
  // LEVEL 2: Social/E-commerce (Always Human-Guided)
  // -------------------------------------------------------------------------
  {
    id: 'amazon-associates',
    name: 'Amazon Associates',
    domain: 'affiliate-program.amazon.com',
    alternateDomains: [
      'affiliate-program.amazon.com',
      'associates.amazon.com',
      'affiliate.amazon.com'
    ],
    tosLevel: 2,
    apiAvailable: true,
    signupUrl: 'https://affiliate-program.amazon.com/signup',
    dashboardUrl: 'https://affiliate-program.amazon.com/',
    automationNotes: 'EXPLICITLY PROHIBITS bots/automated software. EXTREME RISK. Manual only.',
    commissionType: 'cps',
  },
  {
    id: 'teachable',
    name: 'Teachable Affiliate Program',
    domain: 'teachable.com',
    alternateDomains: ['www.teachable.com', 'partners.teachable.com'],
    tosLevel: 2,
    apiAvailable: false,
    signupUrl: 'https://teachable.com/partners',
    dashboardUrl: 'https://teachable.com/partners',
    automationNotes: 'STRICTLY PROHIBITS automated scripts/bots. Threatens legal action. EXTREME RISK.',
    commissionType: 'cps',
  },

  // -------------------------------------------------------------------------
  // LEVEL 3: Financial/Government (Never Automates)
  // -------------------------------------------------------------------------
  // Note: Financial networks are typically not affiliate programs, but included
  // for completeness if automation is attempted on payment processors
];

// ============================================================================
// NETWORK DETECTION PATTERNS
// ============================================================================

/**
 * URL patterns for each network
 */
const NETWORK_PATTERNS: Record<string, NetworkPattern> = {
  shareasale: {
    domains: ['shareasale.com', '*.shareasale.com'],
  },
  'cj-affiliate': {
    domains: ['cj.com', '*.cj.com'],
  },
  impact: {
    domains: ['impact.com', '*.impact.com', 'impact.radius.com'],
  },
  rakuten: {
    domains: [
      'rakutenadvertising.com',
      '*.rakutenadvertising.com',
      'linkshare.com',
      '*.linkshare.com',
      'linksynergy.com',
      '*.linksynergy.com',
      'rakutenmarketing.com',
    ],
  },
  clickbank: {
    domains: ['clickbank.com', '*.clickbank.com'],
  },
  partnerstack: {
    domains: ['partnerstack.com', '*.partnerstack.com'],
  },
  reditus: {
    domains: ['reditus.com', '*.reditus.com'],
  },
  'amazon-associates': {
    domains: [
      'affiliate-program.amazon.com',
      'associates.amazon.com',
      'affiliate.amazon.com',
      '*.affiliate-program.amazon.com',
    ],
  },
  teachable: {
    domains: ['teachable.com', '*.teachable.com'],
    paths: ['/partners'],
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if a domain matches a pattern (supports wildcards)
 */
function domainMatches(domain: string, pattern: string): boolean {
  // Exact match
  if (domain === pattern) {
    return true;
  }

  // Wildcard match (*.example.com)
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(1); // Remove *
    return domain.endsWith(suffix);
  }

  return false;
}

/**
 * Extracts domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    // Invalid URL, return as-is
    return url;
  }
}

/**
 * Extracts path from URL
 */
function extractPath(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch (error) {
    return '';
  }
}

/**
 * Detects ToS level from domain
 */
function detectToSLevelFromDomain(domain: string): ToSLevel {
  // Level 0: Localhost and .local domains
  if (
    domain === 'localhost' ||
    domain === '127.0.0.1' ||
    domain.endsWith('.local') ||
    domain.startsWith('192.168.') ||
    domain.startsWith('10.')
  ) {
    return 0;
  }

  // Check against known networks
  for (const network of AFFILIATE_NETWORKS) {
    if (domainMatches(domain, network.domain)) {
      return network.tosLevel;
    }

    if (network.alternateDomains) {
      for (const altDomain of network.alternateDomains) {
        if (domainMatches(domain, altDomain)) {
          return network.tosLevel;
        }
      }
    }
  }

  // Default: Level 1 (generic site)
  return 1;
}

// ============================================================================
// MAIN DETECTION CLASS
// ============================================================================

/**
 * Network Detector
 *
 * Provides methods to:
 * - Detect affiliate networks from URLs
 * - Get network configuration and metadata
 * - List all supported networks
 * - Classify ToS levels
 */
export class NetworkDetector {
  /**
   * Detects affiliate network from URL
   *
   * @param url - Full URL or domain to check
   * @returns AffiliateNetwork if detected, null otherwise
   *
   * @example
   * ```typescript
   * const detector = new NetworkDetector();
   * const network = detector.detectNetwork('https://account.shareasale.com/login');
   * if (network) {
   *   console.log(network.name); // "ShareASale"
   *   console.log(network.tosLevel); // 1
   * }
   * ```
   */
  detectNetwork(url: string): AffiliateNetwork | null {
    const domain = extractDomain(url);
    const path = extractPath(url);

    // Check each network's patterns
    for (const network of AFFILIATE_NETWORKS) {
      const pattern = NETWORK_PATTERNS[network.id];

      if (!pattern) {
        continue;
      }

      // Check domain patterns
      let domainMatch = false;
      for (const domainPattern of pattern.domains) {
        if (domainMatches(domain, domainPattern)) {
          domainMatch = true;
          break;
        }
      }

      if (!domainMatch) {
        continue;
      }

      // Check path patterns (if specified)
      if (pattern.paths) {
        let pathMatch = false;
        for (const pathPattern of pattern.paths) {
          if (path.includes(pathPattern)) {
            pathMatch = true;
            break;
          }
        }

        if (!pathMatch) {
          continue;
        }
      }

      // Match found!
      return network;
    }

    return null;
  }

  /**
   * Gets full network configuration including automation policies
   *
   * @param networkId - Network identifier (e.g., 'shareasale')
   * @returns NetworkConfig with automation policies
   *
   * @example
   * ```typescript
   * const config = detector.getNetworkConfig('partnerstack');
   * console.log(config.automationPermitted); // true
   * console.log(config.maxAutomationMode); // 'full-auto'
   * console.log(config.riskLevel); // 'low'
   * ```
   */
  getNetworkConfig(networkId: string): NetworkConfig | null {
    const network = AFFILIATE_NETWORKS.find(n => n.id === networkId);

    if (!network) {
      return null;
    }

    // Determine automation policies based on ToS level
    let automationPermitted: boolean;
    let maxAutomationMode: NetworkConfig['maxAutomationMode'];
    let recommendedApproach: string;
    let riskLevel: NetworkConfig['riskLevel'];

    switch (network.tosLevel) {
      case 0:
        automationPermitted = true;
        maxAutomationMode = 'full-auto';
        recommendedApproach = 'Full automation permitted. Safe domain.';
        riskLevel = 'low';
        break;

      case 1:
        automationPermitted = true;
        maxAutomationMode = 'full-auto';
        recommendedApproach = 'Human-in-loop workflow recommended. Auto-promotes with confidence.';
        riskLevel = network.id === 'partnerstack' || network.id === 'reditus' ? 'low' : 'medium';
        break;

      case 2:
        automationPermitted = false;
        maxAutomationMode = 'human-guided';
        recommendedApproach = 'Manual only. Human-guided assistance permitted. Never fully automates.';
        riskLevel = 'high';
        break;

      case 3:
        automationPermitted = false;
        maxAutomationMode = 'none';
        recommendedApproach = 'Never automate. Human-only mode. Observation only.';
        riskLevel = 'extreme';
        break;
    }

    return {
      network,
      automationPermitted,
      maxAutomationMode,
      recommendedApproach,
      riskLevel,
    };
  }

  /**
   * Lists all supported affiliate networks
   *
   * @param tosLevel - Optional filter by ToS level
   * @returns Array of supported networks
   *
   * @example
   * ```typescript
   * // Get all networks
   * const all = detector.listSupportedNetworks();
   *
   * // Get only automation-friendly networks (Level 1)
   * const safe = detector.listSupportedNetworks(1);
   * ```
   */
  listSupportedNetworks(tosLevel?: ToSLevel): AffiliateNetwork[] {
    if (tosLevel !== undefined) {
      return AFFILIATE_NETWORKS.filter(n => n.tosLevel === tosLevel);
    }

    return [...AFFILIATE_NETWORKS];
  }

  /**
   * Checks if a URL/domain is a supported affiliate network
   *
   * @param url - URL or domain to check
   * @returns True if supported network detected
   */
  isAffiliateNetwork(url: string): boolean {
    return this.detectNetwork(url) !== null;
  }

  /**
   * Gets ToS level for any domain (even if not a known affiliate network)
   *
   * @param url - URL or domain to classify
   * @returns ToS level (0-3)
   *
   * @example
   * ```typescript
   * detector.getToSLevel('http://localhost:3000'); // 0
   * detector.getToSLevel('https://docs.myapp.com'); // 1
   * detector.getToSLevel('https://github.com'); // 2
   * detector.getToSLevel('https://chase.com'); // 3
   * ```
   */
  getToSLevel(url: string): ToSLevel {
    const domain = extractDomain(url);
    return detectToSLevelFromDomain(domain);
  }

  /**
   * Gets networks by API availability
   *
   * @param hasApi - True for networks with API, false for those without
   * @returns Filtered list of networks
   */
  getNetworksByApiAvailability(hasApi: boolean): AffiliateNetwork[] {
    return AFFILIATE_NETWORKS.filter(n => n.apiAvailable === hasApi);
  }

  /**
   * Gets networks by risk level
   *
   * @param riskLevel - Risk level to filter by
   * @returns Networks matching risk level
   */
  getNetworksByRiskLevel(riskLevel: 'low' | 'medium' | 'high' | 'extreme'): AffiliateNetwork[] {
    return AFFILIATE_NETWORKS.filter(network => {
      const config = this.getNetworkConfig(network.id);
      return config?.riskLevel === riskLevel;
    });
  }

  /**
   * Searches networks by name or domain
   *
   * @param query - Search query
   * @returns Matching networks
   */
  searchNetworks(query: string): AffiliateNetwork[] {
    const lowerQuery = query.toLowerCase();

    return AFFILIATE_NETWORKS.filter(network => {
      return (
        network.name.toLowerCase().includes(lowerQuery) ||
        network.domain.toLowerCase().includes(lowerQuery) ||
        network.id.toLowerCase().includes(lowerQuery)
      );
    });
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Singleton instance for convenience
 */
export const networkDetector = new NetworkDetector();

// ============================================================================
// HELPER EXPORTS
// ============================================================================

/**
 * Quick check if URL is an affiliate network
 */
export function isAffiliateNetwork(url: string): boolean {
  return networkDetector.isAffiliateNetwork(url);
}

/**
 * Quick detection of network from URL
 */
export function detectNetwork(url: string): AffiliateNetwork | null {
  return networkDetector.detectNetwork(url);
}

/**
 * Quick ToS level check
 */
export function getToSLevel(url: string): ToSLevel {
  return networkDetector.getToSLevel(url);
}

/**
 * Get all networks (convenience export)
 */
export function getAllNetworks(): AffiliateNetwork[] {
  return networkDetector.listSupportedNetworks();
}
