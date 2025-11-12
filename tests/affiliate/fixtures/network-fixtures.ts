/**
 * Network Fixtures for Affiliate Tests
 * Mock data for affiliate networks
 */

import {
  AffiliateNetwork,
  AffiliateLink,
  SignupWorkflow,
  ComplianceLog,
  TOSLevel,
  FormField,
} from '../../../src/database/affiliate-types';

// ============================================================================
// Network Fixtures
// ============================================================================

export const SHAREASALE_NETWORK: AffiliateNetwork = {
  id: 'shareasale',
  name: 'ShareASale',
  domain: 'shareasale.com',
  tos_level: TOSLevel.HUMAN_GUIDED,
  api_available: true,
  signup_url: 'https://www.shareasale.com/signup.cfm',
  dashboard_url: 'https://www.shareasale.com/a-overview.cfm',
  signup_status: 'completed',
  signup_date: Date.now() - 86400000, // 1 day ago
  last_accessed: Date.now(),
  metadata: {
    notes: 'Popular affiliate network with good API support',
    requirements: ['Valid website', 'Tax information', 'Payment details'],
    api_docs_url: 'https://www.shareasale.com/api/',
    contact_email: 'support@shareasale.com',
    minimum_payout: 50,
    payment_methods: ['Direct Deposit', 'Check', 'Payoneer'],
    approval_time: '1-3 business days',
  },
  created_at: Date.now() - 172800000, // 2 days ago
  updated_at: Date.now(),
};

export const CJ_AFFILIATE_NETWORK: AffiliateNetwork = {
  id: 'cj-affiliate',
  name: 'CJ Affiliate',
  domain: 'cj.com',
  tos_level: TOSLevel.MANUAL_VERIFICATION,
  api_available: true,
  signup_url: 'https://signup.cj.com/',
  dashboard_url: 'https://members.cj.com/',
  signup_status: 'pending',
  metadata: {
    notes: 'Formerly Commission Junction, requires manual verification',
    requirements: ['Business website', 'Tax ID', 'Phone verification'],
    api_docs_url: 'https://developers.cj.com/',
    minimum_payout: 50,
    payment_methods: ['Direct Deposit', 'Payoneer'],
    approval_time: '3-5 business days',
  },
  created_at: Date.now() - 86400000,
  updated_at: Date.now() - 3600000,
};

export const AMAZON_ASSOCIATES_NETWORK: AffiliateNetwork = {
  id: 'amazon-associates',
  name: 'Amazon Associates',
  domain: 'affiliate-program.amazon.com',
  tos_level: TOSLevel.FULLY_MANUAL,
  api_available: true,
  signup_url: 'https://affiliate-program.amazon.com/signup',
  dashboard_url: 'https://affiliate-program.amazon.com/home',
  signup_status: 'in_progress',
  metadata: {
    notes: 'Strict TOS, requires human verification, prohibits automated signup',
    requirements: ['Active website/app', 'Content review', 'First 3 sales within 180 days'],
    api_docs_url: 'https://webservices.amazon.com/paapi5/documentation/',
    minimum_payout: 10,
    payment_methods: ['Direct Deposit', 'Amazon Gift Card', 'Check'],
    approval_time: 'Conditional - need 3 sales first',
  },
  created_at: Date.now() - 43200000,
  updated_at: Date.now() - 7200000,
};

export const CLICKBANK_NETWORK: AffiliateNetwork = {
  id: 'clickbank',
  name: 'ClickBank',
  domain: 'clickbank.com',
  tos_level: TOSLevel.FULLY_AUTOMATED,
  api_available: true,
  signup_url: 'https://accounts.clickbank.com/signup/',
  dashboard_url: 'https://accounts.clickbank.com/',
  signup_status: 'completed',
  signup_date: Date.now() - 259200000, // 3 days ago
  last_accessed: Date.now() - 7200000,
  metadata: {
    notes: 'Fully automated signup allowed, good API documentation',
    requirements: ['Email', 'Address', 'Payment information'],
    api_docs_url: 'https://api.clickbank.com/',
    minimum_payout: 10,
    payment_methods: ['Direct Deposit', 'Check', 'Wire Transfer', 'Payoneer'],
    approval_time: 'Instant',
  },
  created_at: Date.now() - 345600000,
  updated_at: Date.now() - 7200000,
};

export const UNKNOWN_NETWORK: AffiliateNetwork = {
  id: 'test-network-xyz',
  name: 'Test Network XYZ',
  domain: 'test-network.example.com',
  tos_level: TOSLevel.HUMAN_GUIDED,
  api_available: false,
  signup_url: 'https://test-network.example.com/signup',
  created_at: Date.now(),
  updated_at: Date.now(),
};

export const ALL_NETWORKS: AffiliateNetwork[] = [
  SHAREASALE_NETWORK,
  CJ_AFFILIATE_NETWORK,
  AMAZON_ASSOCIATES_NETWORK,
  CLICKBANK_NETWORK,
];

// ============================================================================
// Link Fixtures
// ============================================================================

export const SHAREASALE_LINKS: AffiliateLink[] = [
  {
    id: 1,
    network_id: 'shareasale',
    url: 'https://shareasale.com/r.cfm?b=123456&u=789012&m=34567',
    product_id: '34567',
    product_name: 'Premium WordPress Theme',
    commission: '30%',
    extracted_at: Date.now() - 86400000,
    last_validated: Date.now() - 3600000,
    is_active: true,
    metadata: {
      category: 'Web Development',
      tags: ['wordpress', 'theme', 'premium'],
      conversion_rate: 0.035,
      click_count: 142,
      revenue: 487.5,
    },
    created_at: Date.now() - 86400000,
    updated_at: Date.now() - 3600000,
  },
  {
    id: 2,
    network_id: 'shareasale',
    url: 'https://shareasale.com/r.cfm?b=654321&u=789012&m=34567',
    product_id: '34568',
    product_name: 'SEO Plugin Pro',
    commission: '25%',
    extracted_at: Date.now() - 172800000,
    last_validated: Date.now() - 7200000,
    is_active: true,
    metadata: {
      category: 'Marketing',
      tags: ['seo', 'plugin', 'wordpress'],
      conversion_rate: 0.028,
      click_count: 89,
      revenue: 234.0,
    },
    created_at: Date.now() - 172800000,
    updated_at: Date.now() - 7200000,
  },
];

export const AMAZON_LINKS: AffiliateLink[] = [
  {
    id: 3,
    network_id: 'amazon-associates',
    url: 'https://www.amazon.com/dp/B08N5WRWNW?tag=myassoc-20',
    product_id: 'B08N5WRWNW',
    product_name: 'Wireless Earbuds',
    commission: '4%',
    extracted_at: Date.now() - 43200000,
    is_active: true,
    metadata: {
      category: 'Electronics',
      tags: ['audio', 'wireless', 'earbuds'],
    },
    created_at: Date.now() - 43200000,
    updated_at: Date.now() - 43200000,
  },
];

export const INACTIVE_LINK: AffiliateLink = {
  id: 99,
  network_id: 'shareasale',
  url: 'https://shareasale.com/r.cfm?b=999999&u=789012&m=99999',
  product_name: 'Discontinued Product',
  commission: '20%',
  extracted_at: Date.now() - 2592000000, // 30 days ago
  last_validated: Date.now() - 2592000000,
  is_active: false,
  metadata: {
    category: 'Deprecated',
    tags: ['discontinued'],
  },
  created_at: Date.now() - 2592000000,
  updated_at: Date.now() - 1296000000,
};

// ============================================================================
// Signup Workflow Fixtures
// ============================================================================

export const SHAREASALE_SIGNUP_FIELDS: FormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email Address',
    required: true,
    autocomplete: 'email',
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    required: true,
    sensitive: true,
    pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$',
  },
  {
    name: 'website',
    type: 'url',
    label: 'Website URL',
    required: true,
    placeholder: 'https://example.com',
  },
  {
    name: 'company_name',
    type: 'text',
    label: 'Company Name',
    required: false,
  },
  {
    name: 'phone',
    type: 'tel',
    label: 'Phone Number',
    required: true,
    autocomplete: 'tel',
  },
  {
    name: 'agree_to_terms',
    type: 'checkbox',
    label: 'I agree to the Terms of Service',
    required: true,
  },
];

export const AMAZON_SIGNUP_FIELDS: FormField[] = [
  {
    name: 'account_name',
    type: 'text',
    label: 'Account Name',
    required: true,
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    required: true,
    autocomplete: 'email',
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    required: true,
    sensitive: true,
  },
  {
    name: 'website_url',
    type: 'url',
    label: 'Primary Website URL',
    required: true,
  },
  {
    name: 'mobile_app_name',
    type: 'text',
    label: 'Mobile App Name',
    required: false,
  },
  {
    name: 'payee_name',
    type: 'text',
    label: 'Payee Name',
    required: true,
  },
  {
    name: 'address_line1',
    type: 'text',
    label: 'Address Line 1',
    required: true,
    autocomplete: 'address-line1',
  },
  {
    name: 'city',
    type: 'text',
    label: 'City',
    required: true,
    autocomplete: 'address-level2',
  },
  {
    name: 'state',
    type: 'select',
    label: 'State',
    required: true,
    options: ['CA', 'NY', 'TX', 'FL'],
  },
  {
    name: 'zip',
    type: 'text',
    label: 'ZIP Code',
    required: true,
    autocomplete: 'postal-code',
    pattern: '^\\d{5}(-\\d{4})?$',
  },
];

export const SHAREASALE_WORKFLOW: SignupWorkflow = {
  id: 1,
  network_id: 'shareasale',
  form_fields: SHAREASALE_SIGNUP_FIELDS,
  success_count: 5,
  last_used: Date.now() - 86400000,
  confidence_score: 0.95,
  workflow_hash: 'abc123def456',
  created_at: Date.now() - 604800000, // 7 days ago
  updated_at: Date.now() - 86400000,
};

export const AMAZON_WORKFLOW: SignupWorkflow = {
  id: 2,
  network_id: 'amazon-associates',
  form_fields: AMAZON_SIGNUP_FIELDS,
  success_count: 2,
  last_used: Date.now() - 172800000,
  confidence_score: 0.75,
  workflow_hash: 'xyz789ghi012',
  created_at: Date.now() - 432000000,
  updated_at: Date.now() - 172800000,
};

// ============================================================================
// Compliance Log Fixtures
// ============================================================================

export const COMPLIANCE_LOGS: ComplianceLog[] = [
  {
    id: 1,
    network_id: 'shareasale',
    action: 'prefill_signup_form',
    compliance_level: 'info',
    human_approved: false,
    timestamp: Date.now() - 86400000,
    details: {
      action_details: 'Prefilled signup form with user credentials',
      context: { form_fields: 6, sensitive_fields: 1 },
    },
    created_at: Date.now() - 86400000,
  },
  {
    id: 2,
    network_id: 'amazon-associates',
    action: 'block_automated_signup',
    compliance_level: 'warning',
    human_approved: false,
    timestamp: Date.now() - 43200000,
    details: {
      action_details: 'Blocked automated signup due to TOS restrictions',
      context: { tos_level: TOSLevel.FULLY_MANUAL, network: 'Amazon Associates' },
    },
    created_at: Date.now() - 43200000,
  },
  {
    id: 3,
    network_id: 'shareasale',
    action: 'extract_affiliate_links',
    compliance_level: 'info',
    human_approved: false,
    timestamp: Date.now() - 7200000,
    details: {
      action_details: 'Extracted 15 affiliate links from dashboard',
      context: { link_count: 15, page: 'dashboard' },
    },
    created_at: Date.now() - 7200000,
  },
  {
    id: 4,
    network_id: 'cj-affiliate',
    action: 'request_human_verification',
    compliance_level: 'critical',
    human_approved: true,
    timestamp: Date.now() - 3600000,
    details: {
      action_details: 'Requested human to complete phone verification',
      context: { verification_type: 'phone', network: 'CJ Affiliate' },
      user_id: 'human-operator-1',
    },
    created_at: Date.now() - 3600000,
  },
];

// ============================================================================
// URL Test Cases
// ============================================================================

export const NETWORK_URL_TESTS = [
  { url: 'https://www.shareasale.com/a-overview.cfm', expected: 'shareasale' },
  { url: 'https://shareasale.com/signup.cfm', expected: 'shareasale' },
  { url: 'https://members.cj.com/member/dashboard', expected: 'cj-affiliate' },
  { url: 'https://signup.cj.com/', expected: 'cj-affiliate' },
  { url: 'https://www.cj.com/affiliates', expected: 'cj-affiliate' },
  {
    url: 'https://affiliate-program.amazon.com/home',
    expected: 'amazon-associates',
  },
  { url: 'https://affiliate-program.amazon.com/signup', expected: 'amazon-associates' },
  { url: 'https://accounts.clickbank.com/', expected: 'clickbank' },
  { url: 'https://clickbank.com/signup', expected: 'clickbank' },
  { url: 'https://www.unknown-network.com', expected: null },
  { url: 'https://example.com', expected: null },
];

// ============================================================================
// Mock HTML Pages
// ============================================================================

export const SHAREASALE_DASHBOARD_HTML = `
<!DOCTYPE html>
<html>
<head><title>ShareASale Dashboard</title></head>
<body>
  <div class="affiliate-links">
    <div class="link-item">
      <a href="https://shareasale.com/r.cfm?b=123456&u=789012&m=34567">Product Link 1</a>
      <span class="commission">30%</span>
    </div>
    <div class="link-item">
      <a href="https://shareasale.com/r.cfm?b=654321&u=789012&m=34567">Product Link 2</a>
      <span class="commission">25%</span>
    </div>
  </div>
</body>
</html>
`;

export const SHAREASALE_SIGNUP_HTML = `
<!DOCTYPE html>
<html>
<head><title>ShareASale Signup</title></head>
<body>
  <form id="signup-form" action="/signup" method="post">
    <input type="email" name="email" id="email" required />
    <input type="password" name="password" id="password" required />
    <input type="url" name="website" id="website" required />
    <input type="text" name="company_name" id="company_name" />
    <input type="tel" name="phone" id="phone" required />
    <input type="checkbox" name="agree_to_terms" id="agree_to_terms" required />
    <button type="submit">Sign Up</button>
  </form>
</body>
</html>
`;

export const AMAZON_SIGNUP_HTML = `
<!DOCTYPE html>
<html>
<head><title>Amazon Associates Signup</title></head>
<body>
  <div class="anti-bot-warning">
    This form includes anti-automation measures. Please complete manually.
  </div>
  <form id="signup-form" action="/signup" method="post">
    <input type="text" name="account_name" required />
    <input type="email" name="email" required />
    <input type="password" name="password" required />
    <input type="url" name="website_url" required />
    <div class="captcha-container">
      <div id="captcha-challenge"></div>
    </div>
    <button type="submit">Continue</button>
  </form>
</body>
</html>
`;
