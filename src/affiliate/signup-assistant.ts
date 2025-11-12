/**
 * Signup Assistant - Human-in-Loop Affiliate Network Signup
 *
 * COMPLIANCE REQUIREMENTS (CRITICAL):
 * - NEVER fully automate signup (human MUST submit)
 * - CAN automate data preparation
 * - CAN pre-fill forms
 * - MUST have human approval for submission
 * - ALL actions require explicit human consent
 *
 * This module provides visual guidance and data pre-filling while ensuring
 * humans remain in control of the signup process.
 */

import type {
  FormField,
  // SignupWorkflow,
  // TOSLevel,
  // ComplianceLog,
  InsertComplianceLog
} from '../database/affiliate-types';
import { createComplianceLog, isSensitiveField } from '../database/affiliate-types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * User data structure for form pre-filling
 */
export interface UserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  taxId?: string;
  // Passwords should NOT be stored in UserData - fetched from vault only
  [key: string]: string | undefined;
}

/**
 * Detected signup form structure
 */
export interface SignupForm {
  fields: FormField[];
  submitButton: HTMLElement | null;
  networkId: string;
  formElement: HTMLFormElement | null;
  detectedAt: number;
}

/**
 * Visual guidance step
 */
export interface GuidanceStep {
  type: 'highlight' | 'checklist' | 'instruction' | 'permission' | 'warning';
  message: string;
  targetElement?: HTMLElement;
  fieldName?: string;
  completed: boolean;
}

/**
 * Permission request for user approval
 */
export interface PermissionRequest {
  action: string;
  description: string;
  risks: string[];
  approved: boolean;
  timestamp: number;
}

/**
 * Signup session tracking
 */
export interface SignupSession {
  networkId: string;
  startedAt: number;
  steps: GuidanceStep[];
  fieldsCompleted: Set<string>;
  humanSubmitted: boolean;
  completedAt?: number;
  permissions: PermissionRequest[];
}

// ============================================================================
// SignupAssistant Class
// ============================================================================

/**
 * SignupAssistant - Provides human-guided signup assistance
 *
 * This class helps users fill out affiliate network signup forms while
 * maintaining strict compliance with automation restrictions. All actions
 * require explicit human approval and submission is never automated.
 */
export class SignupAssistant {
  private session: SignupSession | null = null;
  private visualElements: Map<string, HTMLElement> = new Map();
  private complianceLogs: InsertComplianceLog[] = [];

  // AgentDB client for tracking (injected via constructor)
  private agentDB: any = null;

  // Password vault for secure credential access (injected via constructor)
  // private passwordVault: any = null;

  constructor(agentDB?: any, passwordVault?: any) {
    this.agentDB = agentDB;
    // this.passwordVault = passwordVault;
    // Store passwordVault reference for future use
    if (passwordVault) {
      // Reserved for future password vault integration
    }
  }

  // ==========================================================================
  // Form Detection
  // ==========================================================================

  /**
   * Detect signup form structure on the current page
   *
   * Analyzes the DOM to identify form fields and submit buttons.
   * Does NOT modify the page or fill any fields.
   *
   * @param networkId - Identifier for the affiliate network
   * @returns Detected signup form structure or null if not found
   */
  public async detectSignupForm(networkId: string): Promise<SignupForm | null> {
    this.logCompliance('detect_form', 'info', {
      networkId,
      action: 'Detecting signup form structure',
      automated: false,
    }, networkId);

    // Find all forms on the page
    const forms = Array.from(document.querySelectorAll('form'));

    if (forms.length === 0) {
      console.warn('[SignupAssistant] No forms found on page');
      return null;
    }

    // Find the most likely signup form (heuristic-based)
    let signupForm: HTMLFormElement | null = null;

    for (const form of forms) {
      const formText = form.textContent?.toLowerCase() || '';
      const formAction = form.action?.toLowerCase() || '';

      // Look for signup/register keywords
      if (
        formText.includes('sign up') ||
        formText.includes('register') ||
        formText.includes('create account') ||
        formAction.includes('signup') ||
        formAction.includes('register')
      ) {
        signupForm = form;
        break;
      }
    }

    // Fallback to first form if no signup form detected
    if (!signupForm && forms.length > 0) {
      signupForm = forms[0];
    }

    if (!signupForm) {
      return null;
    }

    // Detect form fields
    const fields = this.detectFormFields(signupForm);

    // Find submit button
    const submitButton = this.findSubmitButton(signupForm);

    const detectedForm: SignupForm = {
      fields,
      submitButton,
      networkId,
      formElement: signupForm,
      detectedAt: Date.now(),
    };

    console.log(`[SignupAssistant] Detected form with ${fields.length} fields`);

    return detectedForm;
  }

  /**
   * Detect individual form fields
   */
  private detectFormFields(form: HTMLFormElement): FormField[] {
    const fields: FormField[] = [];

    // Find all input, select, and textarea elements
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach((element) => {
      const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

      // Skip hidden inputs and submit buttons
      if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') {
        return;
      }

      const field: FormField = {
        name: input.name || input.id || `unnamed_${fields.length}`,
        type: this.normalizeFieldType(input.type),
        label: this.extractFieldLabel(input),
        required: input.hasAttribute('required'),
        placeholder: input.getAttribute('placeholder') || undefined,
        autocomplete: input.getAttribute('autocomplete') || undefined,
        sensitive: false, // Will be set below
      };

      // Check if field is sensitive (password, credit card, etc.)
      field.sensitive = isSensitiveField(field);

      fields.push(field);
    });

    return fields;
  }

  /**
   * Normalize field type to standard FormFieldType
   */
  private normalizeFieldType(type: string): FormField['type'] {
    const typeMap: Record<string, FormField['type']> = {
      'text': 'text',
      'email': 'email',
      'password': 'password',
      'tel': 'tel',
      'url': 'url',
      'number': 'number',
      'select-one': 'select',
      'select-multiple': 'select',
      'radio': 'radio',
      'checkbox': 'checkbox',
      'textarea': 'textarea',
      'date': 'date',
      'file': 'file',
    };

    return typeMap[type] || 'text';
  }

  /**
   * Extract human-readable label for a form field
   */
  private extractFieldLabel(input: Element): string | undefined {
    // Check for associated label element
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label?.textContent) {
        return label.textContent.trim();
      }
    }

    // Check for parent label
    const parentLabel = input.closest('label');
    if (parentLabel?.textContent) {
      return parentLabel.textContent.trim();
    }

    // Check for aria-label
    const ariaLabel = input.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel.trim();
    }

    // Check for placeholder as fallback
    const placeholder = input.getAttribute('placeholder');
    if (placeholder) {
      return placeholder.trim();
    }

    return undefined;
  }

  /**
   * Find the submit button in the form
   */
  private findSubmitButton(form: HTMLFormElement): HTMLElement | null {
    // Look for submit button
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitButton) {
      return submitButton as HTMLElement;
    }

    // Look for button without type (defaults to submit)
    const buttons = form.querySelectorAll('button');
    for (const button of buttons) {
      const text = button.textContent?.toLowerCase() || '';
      if (text.includes('sign up') || text.includes('register') || text.includes('submit')) {
        return button;
      }
    }

    // Fallback to first button
    if (buttons.length > 0) {
      return buttons[0] as HTMLElement;
    }

    return null;
  }

  // ==========================================================================
  // Human Approval & Permission System
  // ==========================================================================

  /**
   * Request permission from human before taking any action
   *
   * COMPLIANCE: This ensures no automated actions occur without explicit
   * human consent. The user must click "Approve" before proceeding.
   *
   * @param action - Action name
   * @param description - Human-readable description
   * @param risks - List of potential risks
   * @returns Promise that resolves to true if approved, false otherwise
   */
  public async requestPermission(
    action: string,
    description: string,
    risks: string[] = []
  ): Promise<boolean> {
    this.logCompliance('request_permission', 'info', {
      action,
      description,
      risks,
    });

    // Create permission dialog
    const dialog = this.createPermissionDialog(action, description, risks);
    document.body.appendChild(dialog);

    // Wait for user response
    const approved = await this.waitForPermissionResponse(dialog);

    // Log the decision
    const permission: PermissionRequest = {
      action,
      description,
      risks,
      approved,
      timestamp: Date.now(),
    };

    if (this.session) {
      this.session.permissions.push(permission);
    }

    this.logCompliance(
      approved ? 'permission_granted' : 'permission_denied',
      approved ? 'info' : 'warning',
      { action, description },
      this.session?.networkId
    );

    return approved;
  }

  /**
   * Create permission dialog UI
   */
  private createPermissionDialog(
    action: string,
    description: string,
    risks: string[]
  ): HTMLElement {
    const dialog = document.createElement('div');
    dialog.id = 'signup-permission-dialog';
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Permission Required';
    title.style.cssText = 'margin: 0 0 16px 0; font-size: 20px; color: #333;';

    const actionLabel = document.createElement('div');
    actionLabel.innerHTML = `<strong>Action:</strong> ${this.escapeHtml(action)}`;
    actionLabel.style.cssText = 'margin-bottom: 12px; color: #555;';

    const descLabel = document.createElement('div');
    descLabel.innerHTML = `<strong>Description:</strong> ${this.escapeHtml(description)}`;
    descLabel.style.cssText = 'margin-bottom: 12px; color: #555;';

    dialog.appendChild(title);
    dialog.appendChild(actionLabel);
    dialog.appendChild(descLabel);

    // Add risks if present
    if (risks.length > 0) {
      const risksLabel = document.createElement('div');
      risksLabel.innerHTML = '<strong>Potential Risks:</strong>';
      risksLabel.style.cssText = 'margin-bottom: 8px; color: #d63031;';
      dialog.appendChild(risksLabel);

      const risksList = document.createElement('ul');
      risksList.style.cssText = 'margin: 0 0 16px 0; padding-left: 24px; color: #555;';
      risks.forEach(risk => {
        const li = document.createElement('li');
        li.textContent = risk;
        risksList.appendChild(li);
      });
      dialog.appendChild(risksList);
    }

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;';

    const denyButton = document.createElement('button');
    denyButton.textContent = 'Deny';
    denyButton.className = 'permission-deny';
    denyButton.style.cssText = `
      padding: 10px 20px;
      background: #dfe6e9;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    `;

    const approveButton = document.createElement('button');
    approveButton.textContent = 'Approve';
    approveButton.className = 'permission-approve';
    approveButton.style.cssText = `
      padding: 10px 20px;
      background: #00b894;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    `;

    buttonContainer.appendChild(denyButton);
    buttonContainer.appendChild(approveButton);
    dialog.appendChild(buttonContainer);

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'signup-permission-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    `;
    dialog.appendChild(backdrop);

    return dialog;
  }

  /**
   * Wait for user to approve or deny permission
   */
  private waitForPermissionResponse(dialog: HTMLElement): Promise<boolean> {
    return new Promise((resolve) => {
      const approveButton = dialog.querySelector('.permission-approve');
      const denyButton = dialog.querySelector('.permission-deny');

      const cleanup = () => {
        dialog.remove();
        const backdrop = document.getElementById('signup-permission-backdrop');
        if (backdrop) backdrop.remove();
      };

      approveButton?.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      denyButton?.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });
    });
  }

  // ==========================================================================
  // Form Pre-filling (Human Approved Only)
  // ==========================================================================

  /**
   * Pre-fill form fields with user data
   *
   * COMPLIANCE: This function only fills NON-SENSITIVE fields and only after
   * explicit human approval. Sensitive fields (passwords, payment info) are
   * highlighted for manual entry.
   *
   * @param form - Detected signup form
   * @param userData - User data for pre-filling
   * @returns Promise that resolves when pre-filling is complete
   */
  public async prefillForm(form: SignupForm, userData: UserData): Promise<void> {
    // Request permission first (COMPLIANCE CRITICAL)
    const approved = await this.requestPermission(
      'Pre-fill Form Fields',
      `Pre-fill ${form.fields.length} form fields with your saved data. Sensitive fields will NOT be filled automatically.`,
      [
        'Form fields will be filled with your personal information',
        'You should review all fields before submitting',
        'Passwords must be entered manually',
      ]
    );

    if (!approved) {
      console.log('[SignupAssistant] User denied pre-fill permission');
      this.logCompliance('prefill_denied', 'warning', {
        networkId: form.networkId,
        reason: 'User denied permission',
      }, form.networkId);
      return;
    }

    this.logCompliance('prefill_form', 'info', {
      networkId: form.networkId,
      fieldCount: form.fields.length,
      humanApproved: true,
    }, form.networkId);

    // Pre-fill each non-sensitive field
    let filledCount = 0;
    let skippedCount = 0;

    for (const field of form.fields) {
      if (field.sensitive) {
        // COMPLIANCE: NEVER auto-fill sensitive fields
        console.log(`[SignupAssistant] Skipping sensitive field: ${field.name}`);
        skippedCount++;
        continue;
      }

      const value = this.matchUserDataToField(field, userData);
      if (value) {
        const filled = await this.fillField(form.formElement!, field, value);
        if (filled) {
          filledCount++;
        }
      }
    }

    console.log(`[SignupAssistant] Pre-filled ${filledCount} fields, skipped ${skippedCount} sensitive fields`);
  }

  /**
   * Match user data to form field
   */
  private matchUserDataToField(field: FormField, userData: UserData): string | null {
    // Direct name match
    if (userData[field.name]) {
      return userData[field.name]!;
    }

    // Label-based matching
    const label = field.label?.toLowerCase() || '';
    const name = field.name.toLowerCase();

    // Common field mappings
    const mappings: Record<string, string[]> = {
      firstName: ['firstname', 'first_name', 'fname', 'given name'],
      lastName: ['lastname', 'last_name', 'lname', 'surname', 'family name'],
      email: ['email', 'e-mail', 'email address'],
      phone: ['phone', 'telephone', 'mobile', 'phone number'],
      company: ['company', 'business', 'organization'],
      website: ['website', 'site', 'url', 'web address'],
      address: ['address', 'street', 'address line'],
      city: ['city', 'town'],
      state: ['state', 'province', 'region'],
      zipCode: ['zip', 'zipcode', 'postal', 'postcode'],
      country: ['country', 'nation'],
      taxId: ['tax', 'ein', 'ssn', 'vat'],
    };

    for (const [dataKey, patterns] of Object.entries(mappings)) {
      for (const pattern of patterns) {
        if (name.includes(pattern) || label.includes(pattern)) {
          return userData[dataKey] || null;
        }
      }
    }

    return null;
  }

  /**
   * Fill a single form field
   */
  private async fillField(
    form: HTMLFormElement,
    field: FormField,
    value: string
  ): Promise<boolean> {
    try {
      // Find the input element
      const selector = field.name ? `[name="${field.name}"]` : `#${field.name}`;
      const input = form.querySelector(selector) as HTMLInputElement;

      if (!input) {
        console.warn(`[SignupAssistant] Could not find input for field: ${field.name}`);
        return false;
      }

      // Set the value
      input.value = value;

      // Trigger change events (some forms require this)
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      // Visual feedback: briefly highlight the field
      this.highlightField(input, 500);

      return true;
    } catch (error) {
      console.error(`[SignupAssistant] Error filling field ${field.name}:`, error);
      return false;
    }
  }

  /**
   * Briefly highlight a field to show it was filled
   */
  private highlightField(element: HTMLElement, duration: number = 500): void {
    const originalBorder = element.style.border;
    const originalBackground = element.style.backgroundColor;

    element.style.border = '2px solid #00b894';
    element.style.backgroundColor = '#e8f8f5';

    setTimeout(() => {
      element.style.border = originalBorder;
      element.style.backgroundColor = originalBackground;
    }, duration);
  }

  // ==========================================================================
  // Visual Guidance
  // ==========================================================================

  /**
   * Show visual guidance to the user
   *
   * @param step - Guidance step to display
   */
  public async showGuidance(step: string): Promise<void> {
    console.log(`[SignupAssistant] Guidance: ${step}`);

    // Create or update guidance panel
    let panel = document.getElementById('signup-guidance-panel');
    if (!panel) {
      panel = this.createGuidancePanel();
      document.body.appendChild(panel);
    }

    // Add step to panel
    const stepElement = document.createElement('div');
    stepElement.className = 'guidance-step';
    stepElement.textContent = `✓ ${step}`;
    stepElement.style.cssText = `
      padding: 8px 12px;
      margin-bottom: 8px;
      background: #e8f8f5;
      border-left: 3px solid #00b894;
      border-radius: 4px;
      font-size: 14px;
      color: #2d3436;
    `;

    panel.appendChild(stepElement);

    // Auto-scroll to latest step
    panel.scrollTop = panel.scrollHeight;
  }

  /**
   * Create guidance panel UI
   */
  private createGuidancePanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'signup-guidance-panel';
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      max-height: 500px;
      overflow-y: auto;
      background: white;
      border: 2px solid #00b894;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9998;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Signup Assistant';
    title.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 18px;
      color: #00b894;
      border-bottom: 2px solid #00b894;
      padding-bottom: 8px;
    `;

    panel.appendChild(title);

    return panel;
  }

  /**
   * Show checklist of required fields
   */
  public showFieldChecklist(form: SignupForm): void {
    const panel = document.getElementById('signup-guidance-panel');
    if (!panel) {
      return;
    }

    const checklist = document.createElement('div');
    checklist.className = 'field-checklist';
    checklist.style.cssText = 'margin-top: 16px; padding-top: 16px; border-top: 1px solid #dfe6e9;';

    const checklistTitle = document.createElement('div');
    checklistTitle.textContent = 'Required Fields:';
    checklistTitle.style.cssText = 'font-weight: 600; margin-bottom: 8px; color: #2d3436;';
    checklist.appendChild(checklistTitle);

    const requiredFields = form.fields.filter(f => f.required);
    requiredFields.forEach(field => {
      const item = document.createElement('div');
      item.style.cssText = 'padding: 4px 0; font-size: 13px; color: #636e72;';
      item.innerHTML = field.sensitive
        ? `☐ ${this.escapeHtml(field.label || field.name)} <span style="color: #d63031;">(manual)</span>`
        : `☐ ${this.escapeHtml(field.label || field.name)}`;
      checklist.appendChild(item);
    });

    panel.appendChild(checklist);
  }

  // ==========================================================================
  // Human Submission (COMPLIANCE CRITICAL)
  // ==========================================================================

  /**
   * Wait for human to submit the form
   *
   * COMPLIANCE CRITICAL: This function NEVER clicks the submit button.
   * It only observes and waits for the HUMAN to click submit.
   *
   * @returns Promise that resolves to true when human submits, false on timeout
   */
  public async waitForHumanSubmit(): Promise<boolean> {
    console.log('[SignupAssistant] Waiting for HUMAN to submit form...');

    this.logCompliance('wait_human_submit', 'info', {
      message: 'Waiting for human submission - NOT automating',
    }, this.session?.networkId);

    // Show instruction to user
    await this.showGuidance('Please review all fields and click Submit when ready');

    // Wait for form submission event
    return new Promise((resolve) => {
      const forms = document.querySelectorAll('form');
      const timeout = setTimeout(() => {
        console.log('[SignupAssistant] Timeout waiting for human submission');
        resolve(false);
      }, 300000); // 5 minute timeout

      const submitHandler = (_event: Event) => {
        console.log('[SignupAssistant] Human submitted form!');
        clearTimeout(timeout);

        // Log the human submission
        this.logCompliance('human_submitted', 'info', {
          message: 'Form submitted by HUMAN (not automated)',
          timestamp: Date.now(),
        }, this.session?.networkId);

        if (this.session) {
          this.session.humanSubmitted = true;
        }

        // Cleanup
        forms.forEach(form => {
          form.removeEventListener('submit', submitHandler);
        });

        resolve(true);
      };

      // Listen for submit on all forms
      forms.forEach(form => {
        form.addEventListener('submit', submitHandler);
      });
    });
  }

  // ==========================================================================
  // Completion Tracking
  // ==========================================================================

  /**
   * Record signup completion in AgentDB
   *
   * @param networkId - Affiliate network identifier
   * @returns Promise that resolves when tracking is complete
   */
  public async recordSignupComplete(networkId: string): Promise<void> {
    if (!this.session) {
      console.warn('[SignupAssistant] No active session to record');
      return;
    }

    this.session.completedAt = Date.now();

    const logEntry = createComplianceLog(
      'signup_complete',
      'info',
      {
        networkId,
        humanSubmitted: this.session.humanSubmitted,
        startedAt: this.session.startedAt,
        completedAt: this.session.completedAt,
        duration: this.session.completedAt - this.session.startedAt,
        fieldsCompleted: Array.from(this.session.fieldsCompleted),
        permissions: this.session.permissions,
      },
      networkId
    );

    this.complianceLogs.push(logEntry);

    // Save to AgentDB if available
    if (this.agentDB) {
      try {
        // Store in compliance logs table
        await this.agentDB.logCompliance(logEntry);

        // Update network signup status
        await this.agentDB.updateNetwork(networkId, {
          signup_status: 'completed',
          signup_date: Date.now(),
          updated_at: Date.now(),
        });

        console.log('[SignupAssistant] Signup completion recorded in AgentDB');
      } catch (error) {
        console.error('[SignupAssistant] Error recording to AgentDB:', error);
      }
    }

    await this.showGuidance('Signup process complete! 🎉');
  }

  /**
   * Start a new signup session
   */
  public startSession(networkId: string): void {
    this.session = {
      networkId,
      startedAt: Date.now(),
      steps: [],
      fieldsCompleted: new Set(),
      humanSubmitted: false,
      permissions: [],
    };

    this.logCompliance('session_start', 'info', {
      networkId,
      timestamp: Date.now(),
    }, networkId);
  }

  /**
   * End the current session
   */
  public endSession(): void {
    if (this.session) {
      this.logCompliance('session_end', 'info', {
        networkId: this.session.networkId,
        duration: Date.now() - this.session.startedAt,
      }, this.session.networkId);
    }

    this.session = null;
    this.cleanup();
  }

  /**
   * Get current session
   */
  public getSession(): SignupSession | null {
    return this.session;
  }

  /**
   * Get compliance logs
   */
  public getComplianceLogs(): InsertComplianceLog[] {
    return [...this.complianceLogs];
  }

  // ==========================================================================
  // Compliance Logging
  // ==========================================================================

  /**
   * Log compliance-sensitive action
   */
  private logCompliance(
    action: string,
    level: 'info' | 'warning' | 'critical',
    details?: any,
    networkId?: string
  ): void {
    const log = createComplianceLog(action, level, details, networkId);
    this.complianceLogs.push(log);

    const prefix = `[SignupAssistant][${level.toUpperCase()}]`;
    console.log(`${prefix} ${action}`, details);
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  /**
   * Clean up visual elements and event listeners
   */
  public cleanup(): void {
    // Remove guidance panel
    const panel = document.getElementById('signup-guidance-panel');
    if (panel) {
      panel.remove();
    }

    // Remove permission dialogs
    const dialog = document.getElementById('signup-permission-dialog');
    if (dialog) {
      dialog.remove();
    }

    const backdrop = document.getElementById('signup-permission-backdrop');
    if (backdrop) {
      backdrop.remove();
    }

    // Clear visual elements
    this.visualElements.clear();

    console.log('[SignupAssistant] Cleanup complete');
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a new SignupAssistant instance
 */
export function createSignupAssistant(agentDB?: any, passwordVault?: any): SignupAssistant {
  return new SignupAssistant(agentDB, passwordVault);
}

/**
 * Complete signup workflow with full compliance
 *
 * This is the main entry point for the human-in-loop signup process.
 *
 * @param networkId - Affiliate network identifier
 * @param userData - User data for pre-filling
 * @param agentDB - Optional AgentDB client for tracking
 * @param passwordVault - Optional password vault for credentials
 */
export async function completeSignupWorkflow(
  networkId: string,
  userData: UserData,
  agentDB?: any,
  passwordVault?: any
): Promise<boolean> {
  const assistant = createSignupAssistant(agentDB, passwordVault);

  try {
    // Start session
    assistant.startSession(networkId);
    await assistant.showGuidance('Starting signup assistance...');

    // Detect form
    await assistant.showGuidance('Detecting signup form...');
    const form = await assistant.detectSignupForm(networkId);

    if (!form) {
      await assistant.showGuidance('Error: Could not detect signup form');
      return false;
    }

    await assistant.showGuidance(`Found form with ${form.fields.length} fields`);

    // Show checklist
    assistant.showFieldChecklist(form);

    // Pre-fill form (with permission)
    await assistant.showGuidance('Ready to pre-fill form fields...');
    await assistant.prefillForm(form, userData);
    await assistant.showGuidance('Form pre-filled successfully');

    // Wait for human submission (COMPLIANCE CRITICAL)
    await assistant.showGuidance('Waiting for you to review and submit...');
    const submitted = await assistant.waitForHumanSubmit();

    if (submitted) {
      // Record completion
      await assistant.recordSignupComplete(networkId);
      return true;
    } else {
      await assistant.showGuidance('Signup timeout or cancelled');
      return false;
    }
  } catch (error) {
    console.error('[SignupAssistant] Error in workflow:', error);
    await assistant.showGuidance(`Error: ${error}`);
    return false;
  } finally {
    // Cleanup
    setTimeout(() => {
      assistant.endSession();
    }, 3000); // Keep guidance visible for 3 seconds
  }
}
