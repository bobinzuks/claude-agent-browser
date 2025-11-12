/**
 * Affiliate Automation Commands - MCP Bridge Integration
 *
 * Provides MCP tools for affiliate network automation with compliance-aware operations.
 * Integrates with Affiliate-Networks-that-Bundle extension core modules.
 *
 * Features:
 * - Network detection and classification
 * - Link extraction and generation
 * - Signup assistance with human-in-the-loop
 * - ToS compliance checking
 * - Network status monitoring
 *
 * @module affiliate-commands
 * @version 1.0.0
 */

import { BrowserController } from './browser-controller.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * ToS Compliance Levels (from extension)
 */
export enum ToSLevel {
  SAFE_DOMAIN = 0,      // localhost, development
  GENERIC_SITE = 1,     // Auto-promotes with confidence
  SOCIAL_ECOMMERCE = 2, // Always human-guided
  FINANCIAL_GOV = 3,    // Never automates
}

/**
 * Compliance level for automation actions
 */
export enum ComplianceLevel {
  FULL_AUTO = 'full-auto',           // Silent execution
  ASSISTED_AUTO = 'assisted-auto',   // Auto with notifications
  HUMAN_GUIDED = 'human-guided',     // Visual guidance + permission
  HUMAN_ONLY = 'human-only',         // No automation
}

/**
 * Network detection result
 */
export interface NetworkDetectionResult {
  networkId: string;
  name: string;
  tosLevel: ToSLevel;
  canAutomate: boolean;
  confidence: number;
  matchedPattern?: string;
}

/**
 * Affiliate link data
 */
export interface AffiliateLink {
  url: string;
  productName?: string;
  price?: number;
  currency?: string;
  merchantId?: string;
  commission?: string;
  extractedAt: number;
}

/**
 * Link extraction options
 */
export interface LinkExtractionOptions {
  maxLinks?: number;
  filterByProduct?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * User data for signup assistance
 */
export interface UserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  website?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  taxInfo?: {
    ein?: string;
    ssn?: string;
  };
}

/**
 * Signup assistance result
 */
export interface SignupAssistanceResult {
  status: 'form_detected' | 'prefilled' | 'awaiting_human' | 'completed' | 'error';
  nextStep: string;
  formFields?: Array<{
    name: string;
    type: string;
    required: boolean;
    prefilled: boolean;
  }>;
  requiresHumanAction: boolean;
  sensitiveFields?: string[];
}

/**
 * Compliance check result
 */
export interface ComplianceCheckResult {
  allowed: boolean;
  level: ComplianceLevel;
  reason: string;
  requiresHuman: boolean;
  recommendations?: string[];
}

/**
 * Network status information
 */
export interface NetworkStatus {
  id: string;
  name: string;
  signupStatus: 'not_started' | 'in_progress' | 'pending_approval' | 'approved' | 'rejected';
  linkCount: number;
  lastActivity?: number;
  accountId?: string;
  apiKey?: string;
}

/**
 * Deep link generation result
 */
export interface DeepLinkResult {
  affiliateUrl: string;
  originalUrl: string;
  networkId: string;
  commission?: string;
  trackingId?: string;
  expiresAt?: number;
}

// ============================================================================
// Network Database
// ============================================================================

/**
 * Known affiliate networks with ToS levels
 */
const AFFILIATE_NETWORKS = {
  'shareASale': {
    name: 'ShareASale',
    domains: ['shareasale.com', 'shareasale-analytics.com'],
    tosLevel: ToSLevel.GENERIC_SITE,
    canAutomate: true,
    apiAvailable: true,
    requiresApproval: true,
  },
  'cj': {
    name: 'Commission Junction (CJ)',
    domains: ['cj.com', 'emjcd.com'],
    tosLevel: ToSLevel.GENERIC_SITE,
    canAutomate: true,
    apiAvailable: true,
    requiresApproval: true,
  },
  'rakuten': {
    name: 'Rakuten Advertising',
    domains: ['rakutenmarketing.com', 'rakuten.com'],
    tosLevel: ToSLevel.GENERIC_SITE,
    canAutomate: true,
    apiAvailable: true,
    requiresApproval: true,
  },
  'impact': {
    name: 'Impact',
    domains: ['impact.com', 'impactradius.com'],
    tosLevel: ToSLevel.GENERIC_SITE,
    canAutomate: true,
    apiAvailable: true,
    requiresApproval: true,
  },
  'amazon_associates': {
    name: 'Amazon Associates',
    domains: ['affiliate-program.amazon.com', 'associates.amazon.com'],
    tosLevel: ToSLevel.SOCIAL_ECOMMERCE,
    canAutomate: false, // Amazon has strict ToS
    apiAvailable: true,
    requiresApproval: true,
  },
  'clickbank': {
    name: 'ClickBank',
    domains: ['clickbank.com', 'accounts.clickbank.com'],
    tosLevel: ToSLevel.GENERIC_SITE,
    canAutomate: true,
    apiAvailable: true,
    requiresApproval: false,
  },
  'awin': {
    name: 'Awin',
    domains: ['awin.com', 'awin1.com'],
    tosLevel: ToSLevel.GENERIC_SITE,
    canAutomate: true,
    apiAvailable: true,
    requiresApproval: true,
  },
  'partnerstack': {
    name: 'PartnerStack',
    domains: ['partnerstack.com', 'growsumo.com'],
    tosLevel: ToSLevel.GENERIC_SITE,
    canAutomate: true,
    apiAvailable: true,
    requiresApproval: false,
  },
  'rewardful': {
    name: 'Rewardful',
    domains: ['rewardful.com'],
    tosLevel: ToSLevel.GENERIC_SITE,
    canAutomate: true,
    apiAvailable: true,
    requiresApproval: false,
  },
  'refersion': {
    name: 'Refersion',
    domains: ['refersion.com'],
    tosLevel: ToSLevel.GENERIC_SITE,
    canAutomate: true,
    apiAvailable: true,
    requiresApproval: false,
  },
  'pepperjam': {
    name: 'Pepperjam (Ascend)',
    domains: ['pepperjam.com', 'pepperjamnetwork.com'],
    tosLevel: ToSLevel.GENERIC_SITE,
    canAutomate: true,
    apiAvailable: true,
    requiresApproval: true,
  },
} as const;

// ============================================================================
// Affiliate Automation Tools Class
// ============================================================================

export class AffiliateAutomationTools {
  constructor(private browserController: BrowserController) {}

  /**
   * TOOL 1: Detect Affiliate Network
   * Identifies which affiliate network the current URL belongs to
   */
  async detectNetwork(url: string): Promise<NetworkDetectionResult> {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Check against known networks
      for (const [networkId, network] of Object.entries(AFFILIATE_NETWORKS)) {
        for (const domain of network.domains) {
          if (hostname.includes(domain) || hostname.endsWith(domain)) {
            return {
              networkId,
              name: network.name,
              tosLevel: network.tosLevel,
              canAutomate: network.canAutomate,
              confidence: 1.0,
              matchedPattern: domain,
            };
          }
        }
      }

      // Check for common affiliate patterns in URL
      const affiliatePatterns = [
        /affiliate/i,
        /partner/i,
        /referral/i,
        /associates/i,
        /aff_/i,
        /affid=/i,
        /ref=/i,
      ];

      for (const pattern of affiliatePatterns) {
        if (pattern.test(url)) {
          return {
            networkId: 'unknown',
            name: 'Unknown Affiliate Network',
            tosLevel: ToSLevel.GENERIC_SITE,
            canAutomate: false,
            confidence: 0.6,
            matchedPattern: pattern.source,
          };
        }
      }

      // Not an affiliate network
      return {
        networkId: 'none',
        name: 'Not an affiliate network',
        tosLevel: ToSLevel.GENERIC_SITE,
        canAutomate: false,
        confidence: 0.9,
      };
    } catch (error) {
      return {
        networkId: 'error',
        name: 'Detection failed',
        tosLevel: ToSLevel.GENERIC_SITE,
        canAutomate: false,
        confidence: 0,
      };
    }
  }

  /**
   * TOOL 2: Extract Affiliate Links
   * Extracts affiliate links from the current page
   */
  async extractLinks(
    pageId?: string,
    options: LinkExtractionOptions = {}
  ): Promise<{ links: AffiliateLink[]; count: number }> {
    const maxLinks = options.maxLinks || 50;
    const filterProduct = options.filterByProduct?.toLowerCase();

    const extractionScript = `
      (() => {
        const links = [];
        const maxLinks = ${maxLinks};
        const filterProduct = ${filterProduct ? `"${filterProduct}"` : 'null'};

        // Find all links on page
        const anchorElements = document.querySelectorAll('a[href]');

        for (let i = 0; i < anchorElements.length && links.length < maxLinks; i++) {
          const anchor = anchorElements[i];
          const href = anchor.href;

          // Check if it's an affiliate link
          const isAffiliateLink =
            href.includes('affiliate') ||
            href.includes('partner') ||
            href.includes('aff_') ||
            href.includes('affid=') ||
            href.includes('ref=') ||
            href.includes('tracking=') ||
            href.match(/\\?(id|pid|sid|cid)=/);

          if (!isAffiliateLink) continue;

          // Extract product information
          const text = anchor.textContent?.trim() || '';
          const title = anchor.title || anchor.getAttribute('aria-label') || '';

          // Try to extract price
          let price = null;
          let currency = 'USD';

          const priceMatch = text.match(/\\$([\\d,]+(?:\\.\\d{2})?)/);
          if (priceMatch) {
            price = parseFloat(priceMatch[1].replace(/,/g, ''));
          }

          // Filter by product name if specified
          if (filterProduct) {
            const productText = (text + ' ' + title).toLowerCase();
            if (!productText.includes(filterProduct)) {
              continue;
            }
          }

          // Extract merchant ID if present
          const merchantMatch = href.match(/[?&](mid|merchant_id|merchantId)=([^&]+)/);
          const merchantId = merchantMatch ? merchantMatch[2] : null;

          // Extract commission if visible
          const commissionMatch = text.match(/(\\d+)%\\s*commission/i);
          const commission = commissionMatch ? commissionMatch[1] + '%' : null;

          links.push({
            url: href,
            productName: title || text.slice(0, 100) || null,
            price,
            currency,
            merchantId,
            commission,
            extractedAt: Date.now(),
          });
        }

        return links;
      })();
    `;

    try {
      const result = await this.browserController.executeScript(
        extractionScript,
        pageId
      );

      if (result.success && Array.isArray(result.data)) {
        return {
          links: result.data as AffiliateLink[],
          count: result.data.length,
        };
      }

      return { links: [], count: 0 };
    } catch (error) {
      console.error('[AffiliateTools] Link extraction failed:', error);
      return { links: [], count: 0 };
    }
  }

  /**
   * TOOL 3: Assist with Signup
   * Helps fill out signup forms with human-in-the-loop for sensitive fields
   */
  async assistSignup(
    _networkId: string,
    userData: UserData,
    pageId?: string
  ): Promise<SignupAssistanceResult> {
    try {
      // Detect signup form
      const formDetectionScript = `
        (() => {
          const forms = document.querySelectorAll('form');
          const signupForms = [];

          for (const form of forms) {
            const formText = form.textContent?.toLowerCase() || '';
            const isSignup =
              formText.includes('sign up') ||
              formText.includes('register') ||
              formText.includes('create account') ||
              formText.includes('join') ||
              form.action.includes('signup') ||
              form.action.includes('register');

            if (isSignup) {
              const fields = [];
              const inputs = form.querySelectorAll('input, textarea, select');

              for (const input of inputs) {
                const name = input.name || input.id || '';
                const type = input.type || input.tagName.toLowerCase();
                const required = input.hasAttribute('required');
                const label = input.labels?.[0]?.textContent?.trim() ||
                             document.querySelector('label[for="' + input.id + '"]')?.textContent?.trim() ||
                             '';

                fields.push({
                  name: name,
                  type: type,
                  required: required,
                  label: label,
                  id: input.id,
                  isSensitive:
                    type === 'password' ||
                    name.toLowerCase().includes('ssn') ||
                    name.toLowerCase().includes('tax') ||
                    name.toLowerCase().includes('ein') ||
                    label.toLowerCase().includes('social security') ||
                    label.toLowerCase().includes('tax id'),
                });
              }

              signupForms.push({
                action: form.action,
                method: form.method,
                fields: fields,
              });
            }
          }

          return signupForms.length > 0 ? signupForms[0] : null;
        })();
      `;

      const formResult = await this.browserController.executeScript(
        formDetectionScript,
        pageId
      );

      if (!formResult.success || !formResult.data) {
        return {
          status: 'error',
          nextStep: 'No signup form detected on page',
          requiresHumanAction: true,
        };
      }

      const formData = formResult.data as any;
      const sensitiveFields: string[] = [];
      const prefilledFields: any[] = [];

      // Prefill non-sensitive fields
      for (const field of formData.fields) {
        if (field.isSensitive) {
          sensitiveFields.push(field.name);
          continue;
        }

        let value = null;

        // Map userData to form fields
        const fieldName = field.name.toLowerCase();
        const fieldLabel = field.label.toLowerCase();

        if (fieldName.includes('email') || fieldLabel.includes('email')) {
          value = userData.email;
        } else if (fieldName.includes('first') || fieldLabel.includes('first')) {
          value = userData.firstName;
        } else if (fieldName.includes('last') || fieldLabel.includes('last')) {
          value = userData.lastName;
        } else if (fieldName.includes('company') || fieldLabel.includes('company')) {
          value = userData.company;
        } else if (fieldName.includes('website') || fieldLabel.includes('website')) {
          value = userData.website;
        } else if (fieldName.includes('phone') || fieldLabel.includes('phone')) {
          value = userData.phone;
        } else if (fieldName.includes('city') || fieldLabel.includes('city')) {
          value = userData.address?.city;
        } else if (fieldName.includes('state') || fieldLabel.includes('state')) {
          value = userData.address?.state;
        } else if (fieldName.includes('zip') || fieldLabel.includes('zip')) {
          value = userData.address?.zip;
        } else if (fieldName.includes('country') || fieldLabel.includes('country')) {
          value = userData.address?.country;
        }

        if (value && field.id) {
          try {
            await this.browserController.fill(`#${field.id}`, value, pageId);
            prefilledFields.push({
              name: field.name,
              type: field.type,
              required: field.required,
              prefilled: true,
            });
          } catch (error) {
            console.error(`[AffiliateTools] Failed to fill field ${field.name}:`, error);
          }
        }
      }

      // Determine next step
      let status: SignupAssistanceResult['status'];
      let nextStep: string;

      if (sensitiveFields.length > 0) {
        status = 'awaiting_human';
        nextStep = `Please manually fill sensitive fields: ${sensitiveFields.join(', ')}`;
      } else if (prefilledFields.length > 0) {
        status = 'prefilled';
        nextStep = 'Review prefilled fields and submit the form';
      } else {
        status = 'form_detected';
        nextStep = 'Form detected but no fields could be automatically filled';
      }

      return {
        status,
        nextStep,
        formFields: formData.fields,
        requiresHumanAction: sensitiveFields.length > 0,
        sensitiveFields,
      };
    } catch (error) {
      console.error('[AffiliateTools] Signup assistance failed:', error);
      return {
        status: 'error',
        nextStep: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requiresHumanAction: true,
      };
    }
  }

  /**
   * TOOL 4: Check Compliance
   * Verifies if an action is allowed based on ToS level
   */
  async checkCompliance(
    action: string,
    networkId: string,
    _url?: string
  ): Promise<ComplianceCheckResult> {
    try {
      // Get network info
      const network = AFFILIATE_NETWORKS[networkId as keyof typeof AFFILIATE_NETWORKS];

      if (!network) {
        return {
          allowed: false,
          level: ComplianceLevel.HUMAN_ONLY,
          reason: 'Unknown network - manual action required',
          requiresHuman: true,
        };
      }

      // Determine compliance level based on ToS level
      let level: ComplianceLevel;
      let allowed = true;
      let reason = '';
      let requiresHuman = false;
      const recommendations: string[] = [];

      // Check ToS level
      if (network.tosLevel === ToSLevel.SOCIAL_ECOMMERCE) {
        level = ComplianceLevel.HUMAN_GUIDED;
        allowed = action !== 'auto_signup' && action !== 'auto_submit';
        reason = 'Social/E-commerce level - human guidance required';
        requiresHuman = action.includes('submit') || action.includes('signup');
        recommendations.push('Use visual guidance for user actions');
        recommendations.push('Request permission before sensitive operations');
      } else if (network.tosLevel === ToSLevel.GENERIC_SITE) {
        level = ComplianceLevel.ASSISTED_AUTO;
        allowed = network.canAutomate;
        reason = 'Generic site - assisted automation allowed';
        requiresHuman = action.includes('tax') || action.includes('payment');
        recommendations.push('Auto-fill non-sensitive fields');
        recommendations.push('Request human input for sensitive data');
      } else {
        // SAFE_DOMAIN
        level = ComplianceLevel.FULL_AUTO;
        allowed = true;
        reason = 'Safe domain - full automation allowed';
        requiresHuman = false;
        recommendations.push('Full automation enabled for development');
      }

      // Additional action-specific checks
      if (action.includes('payment') || action.includes('billing')) {
        level = ComplianceLevel.HUMAN_ONLY;
        allowed = false;
        requiresHuman = true;
        reason = 'Payment operations require manual handling';
      }

      if (action.includes('tax') || action.includes('ssn') || action.includes('ein')) {
        level = ComplianceLevel.HUMAN_ONLY;
        allowed = false;
        requiresHuman = true;
        reason = 'Sensitive tax information requires manual input';
      }

      return {
        allowed,
        level,
        reason,
        requiresHuman,
        recommendations,
      };
    } catch (error) {
      return {
        allowed: false,
        level: ComplianceLevel.HUMAN_ONLY,
        reason: `Compliance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requiresHuman: true,
      };
    }
  }

  /**
   * TOOL 5: Get Network Status
   * Returns status of affiliate networks (signup progress, link counts, etc.)
   */
  async getNetworkStatus(networkId?: string): Promise<{ networks: NetworkStatus[] }> {
    // In a real implementation, this would query a database or storage
    // For now, return mock data structure

    const allNetworks = Object.entries(AFFILIATE_NETWORKS).map(([id, network]) => ({
      id,
      name: network.name,
      signupStatus: 'not_started' as const,
      linkCount: 0,
      lastActivity: undefined,
      accountId: undefined,
      apiKey: undefined,
    }));

    if (networkId) {
      const network = allNetworks.find(n => n.id === networkId);
      return {
        networks: network ? [network] : [],
      };
    }

    return {
      networks: allNetworks,
    };
  }

  /**
   * TOOL 6: Generate Deep Link
   * Creates an affiliate tracking link for a given URL
   */
  async generateDeepLink(
    targetUrl: string,
    networkId: string,
    affiliateId?: string
  ): Promise<DeepLinkResult | null> {
    try {
      const network = AFFILIATE_NETWORKS[networkId as keyof typeof AFFILIATE_NETWORKS];

      if (!network) {
        console.error('[AffiliateTools] Unknown network:', networkId);
        return null;
      }

      // Network-specific deep link generation
      let affiliateUrl = targetUrl;
      const trackingId = `mcp_${Date.now()}`;

      switch (networkId) {
        case 'shareASale':
          // ShareASale format: https://shareasale.com/r.cfm?b=BANNER_ID&u=AFFILIATE_ID&m=MERCHANT_ID&urllink=TARGET_URL
          if (affiliateId) {
            affiliateUrl = `https://shareasale.com/r.cfm?u=${affiliateId}&m=123&urllink=${encodeURIComponent(targetUrl)}`;
          }
          break;

        case 'cj':
          // CJ format: https://www.anrdoezrs.net/click-AFFILIATE_ID-MERCHANT_ID?url=TARGET_URL
          if (affiliateId) {
            affiliateUrl = `https://www.anrdoezrs.net/click-${affiliateId}-123?url=${encodeURIComponent(targetUrl)}`;
          }
          break;

        case 'impact':
          // Impact format: https://CAMPAIGN.pxf.io/c/AFFILIATE_ID/CAMPAIGN_ID/SUB_ID?u=TARGET_URL
          if (affiliateId) {
            affiliateUrl = `https://campaign.pxf.io/c/${affiliateId}/123/${trackingId}?u=${encodeURIComponent(targetUrl)}`;
          }
          break;

        case 'amazon_associates':
          // Amazon format: https://amazon.com/dp/PRODUCT_ID?tag=ASSOCIATE_ID
          const productMatch = targetUrl.match(/\/dp\/([A-Z0-9]{10})/);
          if (productMatch && affiliateId) {
            affiliateUrl = `https://amazon.com/dp/${productMatch[1]}?tag=${affiliateId}`;
          }
          break;

        default:
          // Generic tracking parameter approach
          const separator = targetUrl.includes('?') ? '&' : '?';
          affiliateUrl = `${targetUrl}${separator}ref=${affiliateId || 'mcp'}&tracking=${trackingId}`;
      }

      return {
        affiliateUrl,
        originalUrl: targetUrl,
        networkId,
        commission: network.requiresApproval ? 'Varies by merchant' : 'Standard rate',
        trackingId,
        expiresAt: undefined, // Could add expiration logic
      };
    } catch (error) {
      console.error('[AffiliateTools] Deep link generation failed:', error);
      return null;
    }
  }

  /**
   * Get all supported networks
   */
  getSupportedNetworks(): Array<{ id: string; name: string; domains: readonly string[] }> {
    return Object.entries(AFFILIATE_NETWORKS).map(([id, network]) => ({
      id,
      name: network.name,
      domains: network.domains,
    }));
  }
}

export default AffiliateAutomationTools;
