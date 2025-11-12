/**
 * Rakuten Advertising Network Configuration
 *
 * Rakuten Advertising (formerly Rakuten Marketing/LinkShare) is a major
 * affiliate network with API access available.
 */

import { TOSLevel } from '../../database/affiliate-types';
import type { NetworkConfig } from './types';

export const RakutenConfig: NetworkConfig = {
  id: 'rakuten',
  name: 'Rakuten Advertising',
  domain: 'rakutenadvertising.com',
  tosLevel: TOSLevel.MANUAL_VERIFICATION,

  signup: {
    url: 'https://rakutenadvertising.com/publisher/join/',
    automationLevel: 'human-in-loop',
    formSelectors: {
      email: '#email-address',
      firstName: '#first-name',
      lastName: '#last-name',
      company: '#company',
      website: '#primary-website',
      websiteDescription: '#site-description',
      password: '#password',
      passwordConfirm: '#password-confirm',
      phone: '#phone',
      address1: '#address-line-1',
      address2: '#address-line-2',
      city: '#city',
      state: '#state',
      zip: '#postal-code',
      country: '#country',
      promotionMethod: '#promotion-method',
      taxId: '#tax-id',
      agreeTerms: '#terms-agreement',
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
      'address1',
      'city',
      'state',
      'zip',
      'country',
      'promotionMethod',
      'agreeTerms',
    ],
    sensitiveFields: ['password', 'passwordConfirm', 'taxId'],
    verificationSteps: [
      {
        type: 'email',
        required: true,
        automated: true,
        description: 'Email verification link sent',
      },
      {
        type: 'phone',
        required: false,
        automated: false,
        description: 'Phone verification may be requested',
      },
      {
        type: 'manual-review',
        required: true,
        automated: false,
        description: 'Thorough application review (2-7 business days)',
      },
    ],
    notes: 'Strict approval process. Requires established website with significant content and traffic.',
  },

  linkExtraction: {
    dashboardUrl: 'https://click.linksynergy.com/fs-bin/stat',
    productCatalogUrl: 'https://click.linksynergy.com/fs-bin/click?id={YOUR_ID}&offerid={OFFER_ID}',
    extractionStrategy: 'api',
    linkGeneratorSelector: '#link-locator',
    linkSelector: '.affiliate-link-output',
    productNameSelector: '.product-info',
    commissionSelector: '.commission-details',
    notes: 'API access available through LinkShare Web Services. Recommend using API.',
  },

  api: {
    available: true,
    baseUrl: 'https://api.rakutenmarketing.com/productsearch',
    authMethod: 'api-key',
    docsUrl: 'https://rakutenadvertising.com/product/publisher-api/',
    endpoints: {
      links: '/1.0',
      merchants: '/advertisersearch/1.0',
      products: '/1.0',
      stats: '/commissions/1.0',
    },
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 3000,
      requestsPerDay: 50000,
    },
  },

  metadata: {
    minimumPayout: 50,
    paymentMethods: ['Direct Deposit', 'Check'],
    approvalTime: '2-7 business days',
    cookieDuration: '7-90 days (advertiser dependent)',
    commission: '1-25% (advertiser dependent)',
    productCategories: [
      'Retail',
      'Travel',
      'Financial Services',
      'Automotive',
      'Technology',
      'Fashion',
      'Home & Garden',
      'Sports & Fitness',
    ],
    notes: [
      'Premium brands and merchants',
      'Strong presence in Asia-Pacific markets',
      'Requires substantial traffic for approval',
      'Good reporting and analytics tools',
      'API access requires separate token generation',
      'Cookie duration varies significantly by merchant',
    ],
  },
};
