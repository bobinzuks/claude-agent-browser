/**
 * SignupAssistant Test Suite
 *
 * Tests for human-in-loop signup assistance with compliance verification
 */

import { SignupAssistant, createSignupAssistant } from './signup-assistant';
import type { UserData, SignupForm } from './signup-assistant';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock DOM environment
const mockDocument = () => {
  const forms = new Map<string, HTMLFormElement>();

  // Create a mock form with various field types
  const createMockForm = (formId: string): HTMLFormElement => {
    const form = document.createElement('form');
    form.id = formId;
    form.action = '/signup';

    // Add various input fields
    const fields = [
      { name: 'firstName', type: 'text', label: 'First Name', required: true },
      { name: 'lastName', type: 'text', label: 'Last Name', required: true },
      { name: 'email', type: 'email', label: 'Email Address', required: true },
      { name: 'password', type: 'password', label: 'Password', required: true },
      { name: 'phone', type: 'tel', label: 'Phone Number', required: false },
      { name: 'company', type: 'text', label: 'Company', required: false },
      { name: 'website', type: 'url', label: 'Website', required: false },
    ];

    fields.forEach(fieldDef => {
      const input = document.createElement('input');
      input.name = fieldDef.name;
      input.type = fieldDef.type;
      input.id = fieldDef.name;
      if (fieldDef.required) {
        input.required = true;
      }

      const label = document.createElement('label');
      label.htmlFor = fieldDef.name;
      label.textContent = fieldDef.label;

      form.appendChild(label);
      form.appendChild(input);
    });

    // Add submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Sign Up';
    form.appendChild(submitBtn);

    document.body.appendChild(form);
    forms.set(formId, form);

    return form;
  };

  return { createMockForm, forms };
};

// Mock AgentDB
class MockAgentDB {
  private logs: any[] = [];
  private networks: Map<string, any> = new Map();

  async logCompliance(log: any): Promise<void> {
    this.logs.push(log);
  }

  async updateNetwork(networkId: string, updates: any): Promise<void> {
    const existing = this.networks.get(networkId) || {};
    this.networks.set(networkId, { ...existing, ...updates });
  }

  getLogs(): any[] {
    return [...this.logs];
  }

  getNetwork(networkId: string): any {
    return this.networks.get(networkId);
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('SignupAssistant', () => {
  let assistant: SignupAssistant;
  let mockDB: MockAgentDB;
  let mockDOM: ReturnType<typeof mockDocument>;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    mockDOM = mockDocument();

    // Setup assistant
    mockDB = new MockAgentDB();
    assistant = new SignupAssistant(mockDB);
  });

  afterEach(() => {
    assistant.cleanup();
    document.body.innerHTML = '';
  });

  // ==========================================================================
  // Form Detection Tests
  // ==========================================================================

  describe('Form Detection', () => {
    test('should detect signup form with fields', async () => {
      mockDOM.createMockForm('signup-form');

      const detected = await assistant.detectSignupForm('test-network');

      expect(detected).not.toBeNull();
      expect(detected?.fields).toHaveLength(7);
      expect(detected?.submitButton).not.toBeNull();
      expect(detected?.networkId).toBe('test-network');
    });

    test('should identify required fields correctly', async () => {
      mockDOM.createMockForm('signup-form');

      const detected = await assistant.detectSignupForm('test-network');

      const requiredFields = detected?.fields.filter(f => f.required);
      expect(requiredFields).toHaveLength(4); // firstName, lastName, email, password
    });

    test('should mark password fields as sensitive', async () => {
      mockDOM.createMockForm('signup-form');

      const detected = await assistant.detectSignupForm('test-network');

      const passwordField = detected?.fields.find(f => f.type === 'password');
      expect(passwordField?.sensitive).toBe(true);
    });

    test('should return null when no form exists', async () => {
      // No form in DOM
      const detected = await assistant.detectSignupForm('test-network');

      expect(detected).toBeNull();
    });

    test('should extract field labels correctly', async () => {
      mockDOM.createMockForm('signup-form');

      const detected = await assistant.detectSignupForm('test-network');

      const emailField = detected?.fields.find(f => f.name === 'email');
      expect(emailField?.label).toBe('Email Address');
    });
  });

  // ==========================================================================
  // Permission System Tests (COMPLIANCE CRITICAL)
  // ==========================================================================

  describe('Permission System (COMPLIANCE)', () => {
    test('should require permission before pre-filling', async () => {
      mockDOM.createMockForm('signup-form');
      const form = await assistant.detectSignupForm('test-network');

      const userData: UserData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      // Mock auto-deny permission
      const originalRequestPermission = assistant.requestPermission;
      assistant.requestPermission = jest.fn().mockResolvedValue(false);

      await assistant.prefillForm(form!, userData);

      // Should have requested permission
      expect(assistant.requestPermission).toHaveBeenCalled();

      // Restore
      assistant.requestPermission = originalRequestPermission;
    });

    test('should log permission requests', async () => {
      assistant.startSession('test-network');

      // Mock auto-approve
      const originalRequestPermission = assistant.requestPermission;
      assistant.requestPermission = jest.fn().mockResolvedValue(true);

      await assistant.requestPermission(
        'Test Action',
        'Test description',
        ['Risk 1', 'Risk 2']
      );

      const logs = assistant.getComplianceLogs();
      expect(logs.some(log => log.action === 'request_permission')).toBe(true);

      assistant.requestPermission = originalRequestPermission;
    });

    test('should track permissions in session', async () => {
      assistant.startSession('test-network');

      const originalRequestPermission = assistant.requestPermission;
      assistant.requestPermission = jest.fn().mockResolvedValue(true);

      await assistant.requestPermission('Test Action', 'Description');

      const session = assistant.getSession();
      expect(session?.permissions).toHaveLength(1);
      expect(session?.permissions[0].approved).toBe(true);

      assistant.requestPermission = originalRequestPermission;
    });
  });

  // ==========================================================================
  // Form Pre-filling Tests
  // ==========================================================================

  describe('Form Pre-filling', () => {
    test('should NOT auto-fill sensitive fields', async () => {
      mockDOM.createMockForm('signup-form');
      const form = await assistant.detectSignupForm('test-network');

      const userData: UserData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      // Mock auto-approve permission
      const originalRequestPermission = assistant.requestPermission;
      assistant.requestPermission = jest.fn().mockResolvedValue(true);

      await assistant.prefillForm(form!, userData);

      // Check that password field was NOT filled
      const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
      expect(passwordInput.value).toBe('');

      assistant.requestPermission = originalRequestPermission;
    });

    test('should fill non-sensitive fields', async () => {
      mockDOM.createMockForm('signup-form');
      const form = await assistant.detectSignupForm('test-network');

      const userData: UserData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      // Mock auto-approve permission
      const originalRequestPermission = assistant.requestPermission;
      assistant.requestPermission = jest.fn().mockResolvedValue(true);

      await assistant.prefillForm(form!, userData);

      // Check that non-sensitive fields were filled
      const firstNameInput = document.querySelector('input[name="firstName"]') as HTMLInputElement;
      const lastNameInput = document.querySelector('input[name="lastName"]') as HTMLInputElement;
      const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;

      expect(firstNameInput.value).toBe('John');
      expect(lastNameInput.value).toBe('Doe');
      expect(emailInput.value).toBe('john@example.com');

      assistant.requestPermission = originalRequestPermission;
    });

    test('should match user data to fields intelligently', async () => {
      mockDOM.createMockForm('signup-form');
      const form = await assistant.detectSignupForm('test-network');

      const userData: UserData = {
        firstName: 'Jane',
        company: 'Acme Corp',
      };

      const originalRequestPermission = assistant.requestPermission;
      assistant.requestPermission = jest.fn().mockResolvedValue(true);

      await assistant.prefillForm(form!, userData);

      const firstNameInput = document.querySelector('input[name="firstName"]') as HTMLInputElement;
      const companyInput = document.querySelector('input[name="company"]') as HTMLInputElement;

      expect(firstNameInput.value).toBe('Jane');
      expect(companyInput.value).toBe('Acme Corp');

      assistant.requestPermission = originalRequestPermission;
    });
  });

  // ==========================================================================
  // Human Submission Tests (COMPLIANCE CRITICAL)
  // ==========================================================================

  describe('Human Submission (COMPLIANCE CRITICAL)', () => {
    test('should NEVER click submit button automatically', async () => {
      mockDOM.createMockForm('signup-form');
      const form = await assistant.detectSignupForm('test-network');

      const submitButton = form?.submitButton as HTMLButtonElement;
      const clickSpy = jest.spyOn(submitButton, 'click');

      // Start waiting for human submit (but don't actually wait)
      assistant.waitForHumanSubmit().catch(() => {});

      // Verify click was NEVER called
      expect(clickSpy).not.toHaveBeenCalled();

      clickSpy.mockRestore();
    });

    test('should detect when human submits form', async () => {
      mockDOM.createMockForm('signup-form');
      assistant.startSession('test-network');

      // Start waiting for submission
      const submitPromise = assistant.waitForHumanSubmit();

      // Simulate human clicking submit
      setTimeout(() => {
        const form = document.querySelector('form');
        const submitEvent = new Event('submit', { bubbles: true });
        form?.dispatchEvent(submitEvent);
      }, 100);

      const result = await submitPromise;

      expect(result).toBe(true);
      expect(assistant.getSession()?.humanSubmitted).toBe(true);
    });

    test('should log human submission to compliance logs', async () => {
      mockDOM.createMockForm('signup-form');
      assistant.startSession('test-network');

      const submitPromise = assistant.waitForHumanSubmit();

      // Simulate human submission
      setTimeout(() => {
        const form = document.querySelector('form');
        form?.dispatchEvent(new Event('submit', { bubbles: true }));
      }, 100);

      await submitPromise;

      const logs = assistant.getComplianceLogs();
      expect(logs.some(log => log.action === 'human_submitted')).toBe(true);
    });
  });

  // ==========================================================================
  // Session Management Tests
  // ==========================================================================

  describe('Session Management', () => {
    test('should start session with correct data', () => {
      assistant.startSession('test-network');

      const session = assistant.getSession();

      expect(session).not.toBeNull();
      expect(session?.networkId).toBe('test-network');
      expect(session?.humanSubmitted).toBe(false);
      expect(session?.permissions).toEqual([]);
    });

    test('should end session and cleanup', () => {
      assistant.startSession('test-network');
      expect(assistant.getSession()).not.toBeNull();

      assistant.endSession();
      expect(assistant.getSession()).toBeNull();
    });

    test('should track session duration', async () => {
      assistant.startSession('test-network');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));

      await assistant.recordSignupComplete('test-network');

      const session = assistant.getSession();
      const duration = (session?.completedAt || 0) - session!.startedAt;

      expect(duration).toBeGreaterThanOrEqual(50);
    });
  });

  // ==========================================================================
  // Compliance Logging Tests
  // ==========================================================================

  describe('Compliance Logging', () => {
    test('should log all compliance-sensitive actions', async () => {
      mockDOM.createMockForm('signup-form');
      assistant.startSession('test-network');

      await assistant.detectSignupForm('test-network');

      const logs = assistant.getComplianceLogs();

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some(log => log.action === 'detect_form')).toBe(true);
    });

    test('should include network ID in logs', async () => {
      assistant.startSession('test-network');

      const logs = assistant.getComplianceLogs();
      const sessionLog = logs.find(log => log.action === 'session_start');

      expect(sessionLog?.network_id).toBe('test-network');
    });

    test('should save logs to AgentDB', async () => {
      assistant.startSession('test-network');
      await assistant.recordSignupComplete('test-network');

      const dbLogs = mockDB.getLogs();
      expect(dbLogs.length).toBeGreaterThan(0);
    });

    test('should update network status in AgentDB', async () => {
      assistant.startSession('test-network');
      await assistant.recordSignupComplete('test-network');

      const network = mockDB.getNetwork('test-network');
      expect(network.signup_status).toBe('completed');
      expect(network.signup_date).toBeDefined();
    });
  });

  // ==========================================================================
  // Visual Guidance Tests
  // ==========================================================================

  describe('Visual Guidance', () => {
    test('should create guidance panel', async () => {
      await assistant.showGuidance('Test step');

      const panel = document.getElementById('signup-guidance-panel');
      expect(panel).not.toBeNull();
    });

    test('should add steps to guidance panel', async () => {
      await assistant.showGuidance('Step 1');
      await assistant.showGuidance('Step 2');

      const panel = document.getElementById('signup-guidance-panel');
      const steps = panel?.querySelectorAll('.guidance-step');

      expect(steps?.length).toBe(2);
    });

    test('should show field checklist', async () => {
      mockDOM.createMockForm('signup-form');
      const form = await assistant.detectSignupForm('test-network');

      await assistant.showGuidance('Starting...');
      assistant.showFieldChecklist(form!);

      const panel = document.getElementById('signup-guidance-panel');
      const checklist = panel?.querySelector('.field-checklist');

      expect(checklist).not.toBeNull();
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('Complete Workflow Integration', () => {
    test('should execute full signup workflow with compliance', async () => {
      mockDOM.createMockForm('signup-form');

      const userData: UserData = {
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        company: 'Tech Corp',
      };

      // Mock permissions and submission
      const originalRequestPermission = assistant.requestPermission;
      assistant.requestPermission = jest.fn().mockResolvedValue(true);

      assistant.startSession('test-network');

      // Detect form
      const form = await assistant.detectSignupForm('test-network');
      expect(form).not.toBeNull();

      // Pre-fill form
      await assistant.prefillForm(form!, userData);

      // Check non-sensitive fields filled
      const firstNameInput = document.querySelector('input[name="firstName"]') as HTMLInputElement;
      expect(firstNameInput.value).toBe('Alice');

      // Check sensitive fields NOT filled
      const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
      expect(passwordInput.value).toBe('');

      // Verify compliance logs
      const logs = assistant.getComplianceLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some(log => log.action === 'detect_form')).toBe(true);
      expect(logs.some(log => log.action === 'prefill_form')).toBe(true);

      assistant.requestPermission = originalRequestPermission;
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    test('should handle missing form gracefully', async () => {
      const detected = await assistant.detectSignupForm('test-network');
      expect(detected).toBeNull();

      // Should not throw
      const logs = assistant.getComplianceLogs();
      expect(logs).toBeDefined();
    });

    test('should handle missing user data', async () => {
      mockDOM.createMockForm('signup-form');
      const form = await assistant.detectSignupForm('test-network');

      const originalRequestPermission = assistant.requestPermission;
      assistant.requestPermission = jest.fn().mockResolvedValue(true);

      // Empty user data
      await assistant.prefillForm(form!, {});

      // Should not throw
      const logs = assistant.getComplianceLogs();
      expect(logs).toBeDefined();

      assistant.requestPermission = originalRequestPermission;
    });

    test('should cleanup on error', () => {
      assistant.startSession('test-network');

      // Force cleanup
      assistant.cleanup();

      const panel = document.getElementById('signup-guidance-panel');
      expect(panel).toBeNull();
    });
  });
});

// ============================================================================
// Compliance Verification Tests
// ============================================================================

describe('COMPLIANCE VERIFICATION', () => {
  test('CRITICAL: Never automate form submission', async () => {
    const assistant = createSignupAssistant();
    const mockForm = document.createElement('form');
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    mockForm.appendChild(submitBtn);
    document.body.appendChild(mockForm);

    const clickSpy = jest.spyOn(submitBtn, 'click');

    // This should ONLY wait, never click
    assistant.waitForHumanSubmit().catch(() => {});

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(clickSpy).not.toHaveBeenCalled();

    clickSpy.mockRestore();
    assistant.cleanup();
  });

  test('CRITICAL: Never fill sensitive fields automatically', async () => {
    const assistant = createSignupAssistant();

    const form = document.createElement('form');
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.name = 'password';
    form.appendChild(passwordInput);
    document.body.appendChild(form);

    const detectedForm = await assistant.detectSignupForm('test');

    const originalRequestPermission = assistant.requestPermission;
    assistant.requestPermission = jest.fn().mockResolvedValue(true);

    await assistant.prefillForm(detectedForm!, {});

    // Password should remain empty
    expect(passwordInput.value).toBe('');

    assistant.requestPermission = originalRequestPermission;
    assistant.cleanup();
  });

  test('CRITICAL: All actions require human approval', async () => {
    const assistant = createSignupAssistant();

    const form = document.createElement('form');
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'test';
    form.appendChild(input);
    document.body.appendChild(form);

    const detectedForm = await assistant.detectSignupForm('test');

    // Deny permission
    const originalRequestPermission = assistant.requestPermission;
    assistant.requestPermission = jest.fn().mockResolvedValue(false);

    await assistant.prefillForm(detectedForm!, { test: 'value' });

    // Permission was requested
    expect(assistant.requestPermission).toHaveBeenCalled();

    // Field should NOT be filled (permission denied)
    expect(input.value).toBe('');

    assistant.requestPermission = originalRequestPermission;
    assistant.cleanup();
  });

  test('CRITICAL: Log all compliance-sensitive actions', async () => {
    const assistant = createSignupAssistant();
    assistant.startSession('test');

    const logs = assistant.getComplianceLogs();

    // Should have logged session start
    expect(logs.some(log => log.action === 'session_start')).toBe(true);
    expect(logs.every(log => log.timestamp)).toBe(true);

    assistant.cleanup();
  });
});
