/**
 * Impact.com Network Configuration
 *
 * Impact.com (formerly Impact Radius) is a modern partnership automation platform
 * with comprehensive API support and developer-friendly approach.
 */

import { TOSLevel } from '../../database/affiliate-types';
import type { NetworkConfig } from './types';

export const ImpactConfig: NetworkConfig = {
  id: 'impact',
  name: 'Impact.com',
  domain: 'impact.com',
  tosLevel: TOSLevel.HUMAN_GUIDED,

  signup: {
    url: 'https://impact.com/partners/signup/',
    automationLevel: 'human-in-loop',
    formSelectors: {
      email: '#email',
      firstName: '#first-name',
      lastName: '#last-name',
      company: '#company-name',
      website: '#website-url',
      websiteDescription: '#website-description',
      password: '#password',
      passwordConfirm: '#confirm-password',
      phone: '#phone-number',
      address: '#street-address',
      city: '#city',
      state: '#state-province',
      zip: '#postal-code',
      country: '#country',
      promotionMethod: '#promotion-methods',
      agreeTerms: '#agree-to-terms',
    },
    requiredFields: [
      'email',
      'firstName',
      'lastName',
      'website',
      'websiteDescription',
      'password',
      'passwordConfirm',
      'phone',
      'address',
      'city',
      'zip',
      'country',
      'promotionMethod',
      'agreeTerms',
    ],
    sensitiveFields: ['password', 'passwordConfirm'],
    verificationSteps: [
      {
        type: 'email',
        required: true,
        automated: true,
        description: 'Email verification required',
      },
      {
        type: 'manual-review',
        required: true,
        automated: false,
        description: 'Application reviewed (typically 1-2 business days)',
      },
    ],
    notes: 'Modern platform with streamlined signup. Requires legitimate website with content.',
  },

  linkExtraction: {
    dashboardUrl: 'https://app.impact.com/secure/mediapartner/home/home.ihtml',
    productCatalogUrl: 'https://app.impact.com/secure/mediapartner/advertiser/advertiserList.ihtml',
    extractionStrategy: 'api',
    linkGeneratorSelector: '#link-builder',
    linkSelector: '.generated-link',
    productNameSelector: '.product-name',
    commissionSelector: '.commission-rate',
    notes: 'Comprehensive API available. Preferred method for link extraction.',
  },

  api: {
    available: true,
    baseUrl: 'https://api.impact.com',
    authMethod: 'api-key',
    docsUrl: 'https://developer.impact.com/',
    endpoints: {
      links: '/Mediapartners/{AccountSID}/Campaigns/{CampaignId}/Actions/generate-tracking-link',
      merchants: '/Mediapartners/{AccountSID}/Campaigns',
      products: '/Mediapartners/{AccountSID}/Catalogs',
      stats: '/Mediapartners/{AccountSID}/Reports',
    },
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 5000,
      requestsPerDay: 100000,
    },
  },

  metadata: {
    minimumPayout: 10,
    paymentMethods: ['Direct Deposit', 'PayPal', 'Payoneer', 'Wire Transfer'],
    approvalTime: '1-2 business days',
    cookieDuration: '30-120 days (advertiser dependent)',
    commission: '1-50% (advertiser dependent)',
    productCategories: [
      'SaaS & Technology',
      'E-commerce',
      'Finance',
      'Travel',
      'Fashion',
      'Home & Garden',
      'Health & Wellness',
      'Education',
    ],
    notes: [
      'Modern, developer-friendly platform',
      'Excellent API documentation and support',
      'Real-time tracking and reporting',
      'Flexible payout options',
      'Lower minimum payout compared to competitors',
      'Popular with SaaS and tech companies',
    ],
  },
};
