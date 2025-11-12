/**
 * ShareASale Network Configuration
 *
 * ShareASale is a medium-sized affiliate network with no explicit automation
 * prohibition in TOS but no official API for general affiliates.
 */

import { TOSLevel } from '../../database/affiliate-types';
import type { NetworkConfig } from './types';

export const ShareASaleConfig: NetworkConfig = {
  id: 'shareasale',
  name: 'ShareASale',
  domain: 'shareasale.com',
  tosLevel: TOSLevel.HUMAN_GUIDED,

  signup: {
    url: 'https://www.shareasale.com/info/affiliates/',
    automationLevel: 'human-in-loop',
    formSelectors: {
      email: '#txtEmailAddress',
      firstName: '#txtFirstName',
      lastName: '#txtLastName',
      website: '#txtWebsiteUrl',
      websiteName: '#txtWebsiteName',
      websiteDescription: '#txtWebsiteDescription',
      password: '#txtPassword',
      passwordConfirm: '#txtPasswordConfirm',
      phone: '#txtPhone',
      address1: '#txtAddress1',
      address2: '#txtAddress2',
      city: '#txtCity',
      state: '#drpState',
      zip: '#txtZip',
      country: '#drpCountry',
      taxId: '#txtTaxId',
      promotionMethod: '#drpPromotionMethod',
      agreeTerms: '#chkAgree',
    },
    requiredFields: [
      'email',
      'firstName',
      'lastName',
      'website',
      'websiteName',
      'websiteDescription',
      'password',
      'passwordConfirm',
      'phone',
      'address1',
      'city',
      'state',
      'zip',
      'country',
      'taxId',
      'promotionMethod',
      'agreeTerms',
    ],
    sensitiveFields: ['password', 'passwordConfirm', 'taxId'],
    verificationSteps: [
      {
        type: 'email',
        required: true,
        automated: true,
        description: 'Email verification link sent after signup',
      },
      {
        type: 'manual-review',
        required: true,
        automated: false,
        description: 'Application reviewed by ShareASale team (typically 1-3 days)',
      },
    ],
    notes: 'Requires valid website with content. Tax ID required for US affiliates.',
  },

  linkExtraction: {
    dashboardUrl: 'https://account.shareasale.com/a-dashboard.cfm',
    productCatalogUrl: 'https://account.shareasale.com/a-merchants.cfm',
    extractionStrategy: 'dom',
    linkGeneratorSelector: '#get-links',
    linkSelector: 'a.affiliate-link',
    productNameSelector: '.product-name',
    commissionSelector: '.commission-rate',
    paginationSelector: '.pagination a',
    notes: 'Links can be extracted from merchant pages. Each merchant has own product feed.',
  },

  api: {
    available: false,
    baseUrl: null,
    authMethod: null,
    docsUrl: 'https://www.shareasale.com/info/api/',
    endpoints: {},
    rateLimit: undefined,
  },

  metadata: {
    minimumPayout: 50,
    paymentMethods: ['Check', 'Direct Deposit'],
    approvalTime: '1-3 business days',
    cookieDuration: '45-90 days (merchant dependent)',
    commission: '5-20% (merchant dependent)',
    productCategories: [
      'Fashion',
      'Home & Garden',
      'Electronics',
      'Health & Wellness',
      'Food & Beverage',
    ],
    notes: [
      'One of the oldest affiliate networks',
      'Good for niche products',
      'Merchant-specific cookie durations',
      'API access limited to enterprise partners',
    ],
  },
};
