/**
 * AgentDB Affiliate Network Type Definitions
 *
 * TypeScript interfaces matching the affiliate schema tables.
 * These types extend AgentDB for affiliate network data management.
 */

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * TOS Compliance Levels
 * Defines the level of automation allowed by network's terms of service
 */
export enum TOSLevel {
  /** Fully automated signup allowed (explicit API or documented automation support) */
  FULLY_AUTOMATED = 0,
  /** Human-guided automation allowed (standard forms, no restrictions) */
  HUMAN_GUIDED = 1,
  /** Manual verification required (email verification, phone verification, etc.) */
  MANUAL_VERIFICATION = 2,
  /** Fully manual process only (anti-bot measures, complex verification) */
  FULLY_MANUAL = 3,
}

/**
 * Signup status tracking
 */
export type SignupStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

/**
 * Compliance levels for logging
 */
export type ComplianceLevel = 'info' | 'warning' | 'critical';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Affiliate Network
 * Represents an affiliate network with signup and compliance metadata
 */
export interface AffiliateNetwork {
  id: string;
  name: string;
  domain: string;
  tos_level: TOSLevel;
  api_available: boolean;
  signup_url?: string;
  dashboard_url?: string;
  signup_status?: SignupStatus;
  signup_date?: number; // Unix timestamp in milliseconds
  last_accessed?: number; // Unix timestamp in milliseconds
  metadata?: AffiliateNetworkMetadata;
  created_at: number;
  updated_at: number;
}

/**
 * Extended metadata for affiliate networks (stored as JSON)
 */
export interface AffiliateNetworkMetadata {
  notes?: string;
  requirements?: string[];
  api_docs_url?: string;
  contact_email?: string;
  minimum_payout?: number;
  payment_methods?: string[];
  approval_time?: string;
  [key: string]: any; // Allow additional custom fields
}

/**
 * Affiliate Link
 * Represents a tracked affiliate link with validation status
 */
export interface AffiliateLink {
  id?: number; // Auto-increment primary key
  network_id: string;
  url: string;
  product_id?: string;
  product_name?: string;
  commission?: string;
  extracted_at: number; // Unix timestamp in milliseconds
  last_validated?: number; // Unix timestamp in milliseconds
  is_active: boolean;
  metadata?: AffiliateLinkMetadata;
  created_at: number;
  updated_at: number;
}

/**
 * Extended metadata for affiliate links (stored as JSON)
 */
export interface AffiliateLinkMetadata {
  category?: string;
  tags?: string[];
  conversion_rate?: number;
  click_count?: number;
  revenue?: number;
  deep_link?: boolean;
  custom_tracking_id?: string;
  [key: string]: any; // Allow additional custom fields
}

/**
 * Signup Workflow
 * Learned patterns for affiliate network signup processes
 */
export interface SignupWorkflow {
  id?: number; // Auto-increment primary key
  network_id: string;
  form_fields: FormField[];
  success_count: number;
  last_used?: number; // Unix timestamp in milliseconds
  confidence_score: number; // 0.0 to 1.0
  workflow_hash?: string; // SHA-256 hash for deduplication
  created_at: number;
  updated_at: number;
}

/**
 * Form Field Definition
 * Describes a single form field in a signup workflow
 */
export interface FormField {
  name: string;
  type: FormFieldType;
  label?: string;
  required: boolean;
  pattern?: string; // Regex pattern for validation
  placeholder?: string;
  options?: string[]; // For select/radio/checkbox fields
  default_value?: string;
  sensitive?: boolean; // Marks fields that should not store values
  autocomplete?: string; // HTML autocomplete attribute
  validation_rules?: ValidationRule[];
}

/**
 * Form field types
 */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'tel'
  | 'url'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'date'
  | 'file';

/**
 * Validation rules for form fields
 */
export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom';
  value: string | number;
  message?: string;
}

/**
 * Compliance Log
 * Tracks compliance-sensitive actions for audit purposes
 */
export interface ComplianceLog {
  id?: number; // Auto-increment primary key
  network_id?: string;
  action: string;
  compliance_level: ComplianceLevel;
  human_approved?: boolean;
  timestamp: number; // Unix timestamp in milliseconds
  details?: ComplianceLogDetails;
  created_at: number;
}

/**
 * Extended details for compliance logs (stored as JSON)
 */
export interface ComplianceLogDetails {
  action_details?: string;
  context?: Record<string, any>;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  previous_state?: any;
  new_state?: any;
  [key: string]: any; // Allow additional custom fields
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Database insert types (omit auto-generated fields)
 */
export type InsertAffiliateNetwork = Omit<AffiliateNetwork, 'created_at' | 'updated_at'>;
export type InsertAffiliateLink = Omit<AffiliateLink, 'id' | 'created_at' | 'updated_at'>;
export type InsertSignupWorkflow = Omit<SignupWorkflow, 'id' | 'created_at' | 'updated_at'>;
export type InsertComplianceLog = Omit<ComplianceLog, 'id' | 'created_at'>;

/**
 * Database update types (partial updates)
 */
export type UpdateAffiliateNetwork = Partial<Omit<AffiliateNetwork, 'id' | 'created_at'>>;
export type UpdateAffiliateLink = Partial<Omit<AffiliateLink, 'id' | 'network_id' | 'created_at'>>;
export type UpdateSignupWorkflow = Partial<Omit<SignupWorkflow, 'id' | 'network_id' | 'created_at'>>;

// ============================================================================
// Query Result Types
// ============================================================================

/**
 * Network with link count
 */
export interface NetworkWithStats extends AffiliateNetwork {
  link_count: number;
  active_link_count: number;
  total_workflow_attempts: number;
}

/**
 * Link with network details
 */
export interface LinkWithNetwork extends AffiliateLink {
  network_name: string;
  network_domain: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Determines if a form field should be treated as sensitive
 */
export function isSensitiveField(field: FormField): boolean {
  if (field.sensitive) return true;

  const sensitiveTypes: FormFieldType[] = ['password'];
  if (sensitiveTypes.includes(field.type)) return true;

  const sensitivePatterns = [
    /password/i,
    /passwd/i,
    /pwd/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /credit[_-]?card/i,
    /ssn/i,
  ];

  return sensitivePatterns.some((pattern) =>
    pattern.test(field.name) || (field.label && pattern.test(field.label))
  );
}

/**
 * Generates a deterministic hash for a signup workflow
 */
export async function generateWorkflowHash(fields: FormField[]): Promise<string> {
  const serialized = JSON.stringify(
    fields.map((f) => ({
      name: f.name,
      type: f.type,
      required: f.required,
    }))
  );

  const encoder = new TextEncoder();
  const data = encoder.encode(serialized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Validates TOS level
 */
export function isValidTOSLevel(level: number): level is TOSLevel {
  return level >= 0 && level <= 3;
}

/**
 * Gets TOS level description
 */
export function getTOSLevelDescription(level: TOSLevel): string {
  switch (level) {
    case TOSLevel.FULLY_AUTOMATED:
      return 'Fully automated signup allowed (API or documented automation support)';
    case TOSLevel.HUMAN_GUIDED:
      return 'Human-guided automation allowed (standard forms, no restrictions)';
    case TOSLevel.MANUAL_VERIFICATION:
      return 'Manual verification required (email, phone, etc.)';
    case TOSLevel.FULLY_MANUAL:
      return 'Fully manual process only (anti-bot measures, complex verification)';
    default:
      return 'Unknown TOS level';
  }
}

/**
 * Creates a compliance log entry
 */
export function createComplianceLog(
  action: string,
  level: ComplianceLevel,
  details?: ComplianceLogDetails,
  networkId?: string
): InsertComplianceLog {
  return {
    network_id: networkId,
    action,
    compliance_level: level,
    timestamp: Date.now(),
    details,
  };
}

/**
 * Validates affiliate link URL
 */
export function isValidAffiliateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts domain from affiliate link
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}
