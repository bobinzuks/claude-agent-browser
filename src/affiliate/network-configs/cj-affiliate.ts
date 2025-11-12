/**
 * CJ Affiliate (Commission Junction) Network Configuration
 *
 * CJ Affiliate is one of the largest affiliate networks. They have an API
 * available but require approval. Automation of signup is not recommended.
 */

import { TOSLevel } from '../../database/affiliate-types';
import type { NetworkConfig } from './types';

export const CJAffiliateConfig: NetworkConfig = {
  id: 'cj-affiliate',
  name: 'CJ Affiliate',
  domain: 'cj.com',
  tosLevel: TOSLevel.MANUAL_VERIFICATION,

  signup: {
    url: 'https://www.cj.com/join',
    automationLevel: 'human-in-loop',
    formSelectors: {
      email: '#email',
      firstName: '#firstName',
      lastName: '#lastName',
      company: '#companyName',
      website: '#websiteUrl',
      websiteDescription: '#websiteDescription',
      password: '#password',
      passwordConfirm: '#confirmPassword',
      phone: '#phoneNumber',
      address: '#streetAddress',
      city: '#city',
      state: '#state',
      zip: '#postalCode',
      country: '#country',
      promotionMethod: '#promotionMethod',
      taxId: '#taxId',
      agreeTerms: '#termsCheckbox',
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
        description: 'Email verification required',
      },
      {
        type: 'phone',
        required: true,
        automated: false,
        description: 'Phone verification may be required',
      },
      {
        type: 'manual-review',
        required: true,
        automated: false,
        description: 'Application manually reviewed (1-5 business days)',
      },
    ],
    notes: 'Requires established website with substantial traffic. Strict approval process.',
  },

  linkExtraction: {
    dashboardUrl: 'https://members.cj.com/member/publisher/home',
    productCatalogUrl: 'https://members.cj.com/member/publisher/links',
    extractionStrategy: 'api',
    linkGeneratorSelector: '#link-generator',
    linkSelector: '.affiliate-link-output',
    productNameSelector: '.product-title',
    commissionSelector: '.commission-info',
    notes: 'CJ has a comprehensive API available after approval. Recommend using API over scraping.',
  },

  api: {
    available: true,
    baseUrl: 'https://advertiser-lookup.api.cj.com',
    authMethod: 'api-key',
    docsUrl: 'https://developers.cj.com/',
    endpoints: {
      links: '/v3/links',
      merchants: '/v3/advertiser-lookup',
      products: '/v3/product-catalog',
      stats: '/v3/publisher-performance',
    },
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      requestsPerDay: 50000,
    },
  },

  metadata: {
    minimumPayout: 50,
    paymentMethods: ['Direct Deposit', 'Check', 'Payoneer'],
    approvalTime: '1-5 business days',
    cookieDuration: '30-90 days (advertiser dependent)',
    commission: '1-30% (advertiser dependent)',
    productCategories: [
      'Retail',
      'Travel',
      'Finance',
      'Technology',
      'Health & Wellness',
      'Fashion',
      'Home & Garden',
    ],
    notes: [
      'One of the largest and most established affiliate networks',
      'Premium brands and merchants',
      'Requires significant traffic for approval',
      'Excellent reporting and analytics',
      'API access requires separate application',
    ],
  },
};
