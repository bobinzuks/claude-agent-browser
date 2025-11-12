/**
 * PartnerStack Network Configuration
 *
 * PartnerStack is a SaaS partnership platform with excellent API support
 * and automation-friendly policies. Designed for B2B SaaS partnerships.
 */

import { TOSLevel } from '../../database/affiliate-types';
import type { NetworkConfig } from './types';

export const PartnerStackConfig: NetworkConfig = {
  id: 'partnerstack',
  name: 'PartnerStack',
  domain: 'partnerstack.com',
  tosLevel: TOSLevel.FULLY_AUTOMATED,

  signup: {
    url: 'https://app.partnerstack.com/signup',
    automationLevel: 'fully-automated',
    formSelectors: {
      email: '#email',
      firstName: '#first-name',
      lastName: '#last-name',
      company: '#company-name',
      website: '#website',
      password: '#password',
      agreeTerms: '#terms-checkbox',
    },
    requiredFields: [
      'email',
      'firstName',
      'lastName',
      'password',
      'agreeTerms',
    ],
    sensitiveFields: ['password'],
    verificationSteps: [
      {
        type: 'email',
        required: true,
        automated: true,
        description: 'Email verification via link',
      },
    ],
    notes: 'Modern, automation-friendly signup. API-first platform designed for programmatic access.',
  },

  linkExtraction: {
    dashboardUrl: 'https://app.partnerstack.com/dashboard',
    productCatalogUrl: 'https://app.partnerstack.com/partners',
    extractionStrategy: 'api',
    linkGeneratorSelector: '#link-builder',
    linkSelector: '.partner-link',
    productNameSelector: '.program-name',
    commissionSelector: '.commission-info',
    notes: 'Full API access available. Designed for automation and integration.',
  },

  api: {
    available: true,
    baseUrl: 'https://api.partnerstack.com/v1',
    authMethod: 'api-key',
    docsUrl: 'https://docs.partnerstack.com/',
    endpoints: {
      links: '/partnerships/links',
      merchants: '/partnerships',
      products: '/programs',
      stats: '/partnerships/metrics',
    },
    rateLimit: {
      requestsPerMinute: 120,
      requestsPerHour: 7200,
      requestsPerDay: 172800,
    },
  },

  metadata: {
    minimumPayout: 0,
    paymentMethods: ['Direct Deposit', 'PayPal', 'Wire Transfer', 'Crypto'],
    approvalTime: 'Instant',
    cookieDuration: '90 days',
    commission: '10-30% recurring (SaaS typical)',
    productCategories: [
      'SaaS',
      'B2B Software',
      'Developer Tools',
      'Marketing Tools',
      'Sales Software',
      'Productivity Tools',
      'Cloud Services',
    ],
    notes: [
      'API-first, automation-friendly platform',
      'Designed for B2B SaaS partnerships',
      'Recurring commission model common',
      'Excellent API documentation',
      'Real-time tracking and reporting',
      'Webhook support for automated workflows',
      'No minimum payout threshold',
      'Flexible payment options including crypto',
      'Popular with tech/SaaS companies',
      'Built for programmatic partner management',
    ],
  },
};
