/**
 * ClickBank Network Configuration
 *
 * ClickBank is a digital product marketplace with automated signup
 * and API access. Good for digital products and info products.
 */

import { TOSLevel } from '../../database/affiliate-types';
import type { NetworkConfig } from './types';

export const ClickBankConfig: NetworkConfig = {
  id: 'clickbank',
  name: 'ClickBank',
  domain: 'clickbank.com',
  tosLevel: TOSLevel.HUMAN_GUIDED,

  signup: {
    url: 'https://accounts.clickbank.com/signup/',
    automationLevel: 'human-in-loop',
    formSelectors: {
      email: '#email',
      firstName: '#first-name',
      lastName: '#last-name',
      nickname: '#nickname',
      password: '#password',
      passwordConfirm: '#confirm-password',
      country: '#country',
      address1: '#address-1',
      address2: '#address-2',
      city: '#city',
      state: '#state',
      zip: '#zip',
      phone: '#phone',
      accountType: '#account-type',
      agreeTerms: '#terms-checkbox',
    },
    requiredFields: [
      'email',
      'firstName',
      'lastName',
      'nickname',
      'password',
      'passwordConfirm',
      'country',
      'address1',
      'city',
      'zip',
      'phone',
      'accountType',
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
        type: 'phone',
        required: false,
        automated: false,
        description: 'Phone verification may be required for payouts',
      },
    ],
    notes: 'Easy signup process. No website required. Account approved instantly.',
  },

  linkExtraction: {
    dashboardUrl: 'https://accounts.clickbank.com/marketplace.htm',
    productCatalogUrl: 'https://accounts.clickbank.com/marketplace.htm',
    extractionStrategy: 'dom',
    linkGeneratorSelector: '.hoplink-generator',
    linkSelector: '.product-hoplink',
    productNameSelector: '.product-title',
    commissionSelector: '.commission-percent',
    paginationSelector: '.pagination-link',
    notes: 'Marketplace browseable. Links generated using HopLink format. API available for automation.',
  },

  api: {
    available: true,
    baseUrl: 'https://api.clickbank.com/rest',
    authMethod: 'api-key',
    docsUrl: 'https://api.clickbank.com/rest/v1/',
    endpoints: {
      products: '/1.3/marketplace/search',
      merchants: '/1.3/vendor/{vendor}',
      stats: '/1.3/analytics/reporting',
      links: '/1.3/hoplinks',
    },
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
    },
  },

  metadata: {
    minimumPayout: 10,
    paymentMethods: ['Direct Deposit', 'Check', 'Wire Transfer', 'Payoneer'],
    approvalTime: 'Instant',
    cookieDuration: '60 days',
    commission: '50-75% (typical for digital products)',
    productCategories: [
      'E-business & E-marketing',
      'Health & Fitness',
      'Home & Garden',
      'Self-Help',
      'Spirituality',
      'Arts & Entertainment',
      'Sports',
      'Software',
    ],
    notes: [
      'Specializes in digital products and info products',
      'High commission rates (50-75% common)',
      'No website required for signup',
      'Instant account approval',
      'Simple HopLink URL format',
      'Good API for automation',
      'Weekly or biweekly payment options',
      'Popular for course creators and digital entrepreneurs',
    ],
  },
};
