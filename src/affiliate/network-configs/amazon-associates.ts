/**
 * Amazon Associates Network Configuration
 *
 * Amazon Associates is the largest affiliate program globally.
 * CRITICAL: Amazon has STRICT anti-automation policies. Any automation
 * of signup, login, or link generation violates TOS and will result in
 * immediate account termination and potential legal action.
 *
 * THIS NETWORK MUST ONLY BE OPERATED MANUALLY.
 */

import { TOSLevel } from '../../database/affiliate-types';
import type { NetworkConfig } from './types';

export const AmazonAssociatesConfig: NetworkConfig = {
  id: 'amazon-associates',
  name: 'Amazon Associates',
  domain: 'amazon.com',
  tosLevel: TOSLevel.FULLY_MANUAL,

  signup: {
    url: 'https://affiliate-program.amazon.com/',
    automationLevel: 'manual-only',
    // NO FORM SELECTORS - MANUAL ONLY
    formSelectors: {},
    requiredFields: [
      'email',
      'password',
      'name',
      'address',
      'phone',
      'website',
      'websiteDescription',
      'taxId',
      'paymentMethod',
    ],
    sensitiveFields: ['password', 'taxId', 'paymentMethod'],
    verificationSteps: [
      {
        type: 'email',
        required: true,
        automated: false,
        description: 'Email verification required',
      },
      {
        type: 'phone',
        required: true,
        automated: false,
        description: 'Phone verification via SMS or call',
      },
      {
        type: 'manual-review',
        required: true,
        automated: false,
        description: 'Application review after first sales',
      },
      {
        type: 'id-verification',
        required: false,
        automated: false,
        description: 'May require government ID verification',
      },
    ],
    notes: `
      ⚠️ CRITICAL WARNING ⚠️

      NEVER AUTOMATE AMAZON ASSOCIATES SIGNUP OR OPERATIONS.

      Amazon's Terms of Service EXPLICITLY PROHIBIT:
      - Automated signup
      - Automated login
      - Automated link generation
      - Screen scraping
      - Use of bots or automated tools
      - API access without explicit written permission

      Violation results in:
      - Immediate account termination
      - Forfeiture of all unpaid commissions
      - Potential legal action
      - Permanent ban from Amazon Associates

      All operations MUST be performed manually through official web interface.
    `,
  },

  linkExtraction: {
    dashboardUrl: 'https://affiliate-program.amazon.com/home',
    productCatalogUrl: 'https://affiliate-program.amazon.com/home/tools/product-links',
    extractionStrategy: 'manual-copy',
    // NO SELECTORS - MANUAL ONLY
    notes: `
      ⚠️ MANUAL OPERATION ONLY ⚠️

      Link generation MUST be done through:
      1. SiteStripe toolbar (when logged in and browsing Amazon)
      2. Product Linking tools in Associates dashboard
      3. Amazon Native Shopping Ads

      DO NOT scrape or automate link extraction.
      DO NOT use browser automation tools.

      Links must be manually generated and copied.
    `,
  },

  api: {
    available: false,
    baseUrl: null,
    authMethod: null,
    docsUrl: 'https://webservices.amazon.com/paapi5/documentation/',
    endpoints: {},
  },

  metadata: {
    minimumPayout: 10,
    paymentMethods: ['Direct Deposit', 'Amazon Gift Card', 'Check'],
    approvalTime: 'Conditional approval initially, full approval after 3 sales in 180 days',
    cookieDuration: '24 hours',
    commission: '1-10% (category dependent)',
    productCategories: [
      'Electronics',
      'Fashion',
      'Home & Kitchen',
      'Books',
      'Toys & Games',
      'Sports & Outdoors',
      'Health & Personal Care',
      'Everything on Amazon',
    ],
    notes: [
      '⚠️ STRICT ANTI-AUTOMATION POLICIES - MANUAL OPERATION ONLY',
      'Largest affiliate program globally',
      'Very short cookie duration (24 hours)',
      'Low commission rates (1-10%)',
      'High conversion rates due to brand trust',
      'Income reporting required for US affiliates',
      'Must maintain sales quota for continued participation',
      'Account review after 180 days if no sales',
      'Strict compliance monitoring',
      'Auto-termination for policy violations',
      'Must properly disclose affiliate relationship',
      'Link shorteners require approval',
      'Social media usage has specific rules',
    ],
  },
};
