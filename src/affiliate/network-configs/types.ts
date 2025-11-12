/**
 * Network Configuration Types
 *
 * Defines automation profiles for affiliate networks including
 * signup automation, link extraction, and API integration details.
 */

import type { TOSLevel } from '../../database/affiliate-types';

/**
 * Automation level for signup processes
 */
export type AutomationLevel =
  | 'fully-automated'  // Can be fully automated (API or approved automation)
  | 'human-in-loop'    // Automation with human oversight/approval
  | 'manual-only';     // Must be done manually (anti-bot, strict TOS)

/**
 * Link extraction strategy
 */
export type ExtractionStrategy =
  | 'api'              // Use official API
  | 'dom'              // DOM scraping
  | 'csv-export'       // CSV/file export
  | 'manual-copy';     // Manual copy-paste required

/**
 * API authentication methods
 */
export type AuthMethod =
  | 'api-key'
  | 'oauth2'
  | 'basic-auth'
  | 'token'
  | null;

/**
 * Form selectors for signup automation
 */
export interface FormSelectors {
  [fieldName: string]: string; // CSS selector for each form field
}

/**
 * Signup configuration
 */
export interface SignupConfig {
  url: string;
  automationLevel: AutomationLevel;
  formSelectors?: FormSelectors;
  requiredFields: string[];
  sensitiveFields: string[];
  verificationSteps?: VerificationStep[];
  notes?: string;
}

/**
 * Verification step (email, phone, etc.)
 */
export interface VerificationStep {
  type: 'email' | 'phone' | 'captcha' | 'manual-review' | 'id-verification';
  required: boolean;
  automated: boolean;
  selector?: string;
  description?: string;
}

/**
 * Link extraction configuration
 */
export interface LinkExtractionConfig {
  dashboardUrl?: string;
  linkGeneratorSelector?: string;
  productCatalogUrl?: string;
  extractionStrategy: ExtractionStrategy;
  paginationSelector?: string;
  linkSelector?: string;
  productNameSelector?: string;
  commissionSelector?: string;
  notes?: string;
}

/**
 * API configuration
 */
export interface ApiConfig {
  available: boolean;
  baseUrl: string | null;
  authMethod: AuthMethod;
  docsUrl?: string;
  endpoints?: {
    links?: string;
    merchants?: string;
    products?: string;
    stats?: string;
  };
  rateLimit?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  };
}

/**
 * Complete network configuration
 */
export interface NetworkConfig {
  id: string;
  name: string;
  domain: string;
  tosLevel: TOSLevel;

  signup: SignupConfig;
  linkExtraction: LinkExtractionConfig;
  api: ApiConfig;

  metadata?: {
    minimumPayout?: number;
    paymentMethods?: string[];
    approvalTime?: string;
    cookieDuration?: string;
    commission?: string;
    productCategories?: string[];
    notes?: string[];
  };
}
