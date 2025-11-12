# SignupAssistant - Human-in-Loop Affiliate Network Signup

Complete, compliance-focused signup assistance for affiliate networks with strict human-in-loop requirements.

## Table of Contents

- [Overview](#overview)
- [Compliance Requirements](#compliance-requirements)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Testing](#testing)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Overview

The SignupAssistant provides human-guided assistance for affiliate network signups while maintaining strict compliance with automation restrictions. It helps users fill out forms efficiently while ensuring all critical actions require explicit human approval.

### What It Does

- Detects signup forms on affiliate network pages
- Pre-fills non-sensitive fields with user data (with permission)
- Highlights sensitive fields that require manual entry
- Provides visual guidance throughout the process
- Waits for human to review and submit (never automated)
- Tracks completion for analytics and learning

### What It NEVER Does

- Automatically submit forms (human MUST click submit)
- Auto-fill passwords or payment information
- Take actions without explicit human approval
- Bypass security measures or CAPTCHAs

## Compliance Requirements

### CRITICAL RULES (NEVER VIOLATE)

1. **Human Submission Only**
   - Form submission is NEVER automated
   - Human must physically click the submit button
   - System only observes and records submission

2. **No Automatic Sensitive Data Entry**
   - Passwords: Manual entry only
   - Payment info: Manual entry only
   - SSN/Tax ID: Manual entry only
   - Security questions: Manual entry only

3. **Explicit Permission for All Actions**
   - Every action requires human approval
   - Permission dialogs before pre-filling
   - Clear explanation of what will happen

4. **Complete Audit Trail**
   - All actions logged with timestamps
   - Permission approvals/denials recorded
   - Human submission events tracked

## Features

### Form Detection

```typescript
// Automatically detects signup forms
const form = await assistant.detectSignupForm('network-id');

// Returns:
// - Field list with types and requirements
// - Submit button reference (for visual guidance only)
// - Form structure metadata
```

### Permission System

```typescript
// Request permission before any action
const approved = await assistant.requestPermission(
  'Pre-fill Form Fields',
  'Fill form fields with your saved data',
  ['Form fields will be filled', 'Review before submitting']
);

if (approved) {
  // Proceed with action
}
```

### Smart Pre-filling

```typescript
// Pre-fills only non-sensitive fields
await assistant.prefillForm(form, userData);

// Automatically skips:
// - Password fields
// - Credit card fields
// - SSN/Tax ID fields
// - Any field marked as sensitive
```

### Visual Guidance

```typescript
// Show step-by-step guidance
await assistant.showGuidance('Detecting form...');
await assistant.showGuidance('Pre-filling fields...');

// Display field checklist
assistant.showFieldChecklist(form);
```

### Human Submission Tracking

```typescript
// Wait for human to submit (NEVER automates)
const submitted = await assistant.waitForHumanSubmit();

if (submitted) {
  // Record completion
  await assistant.recordSignupComplete('network-id');
}
```

## Installation

### As a Module

```bash
npm install @your-org/signup-assistant
```

```typescript
import { SignupAssistant, completeSignupWorkflow } from '@your-org/signup-assistant';
```

### As a Browser Extension

1. Copy `signup-assistant.ts` to your extension's content scripts
2. Include in your manifest.json:

```json
{
  "content_scripts": [
    {
      "matches": ["https://affiliate-network.com/*"],
      "js": ["signup-assistant.js"]
    }
  ]
}
```

### Standalone (Browser Console)

```javascript
// Paste into browser console
const assistant = new SignupAssistant();
await completeSignupWorkflow('network-id', userData);
```

## Quick Start

### Basic Usage

```typescript
import { completeSignupWorkflow } from './signup-assistant';

const userData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  company: 'Tech Corp',
  website: 'https://techcorp.com'
};

// Complete workflow
const success = await completeSignupWorkflow('shareasale', userData);
```

### With AgentDB Tracking

```typescript
import { SignupAssistant } from './signup-assistant';
import { AgentDBClient } from '../training/agentdb-client';

const agentDB = new AgentDBClient('./agentdb', 384);
const assistant = new SignupAssistant(agentDB);

assistant.startSession('cj-affiliate');

const form = await assistant.detectSignupForm('cj-affiliate');
await assistant.prefillForm(form, userData);
await assistant.waitForHumanSubmit();
await assistant.recordSignupComplete('cj-affiliate');

agentDB.save();
assistant.endSession();
```

### With Password Vault

```typescript
import { PasswordVault } from '../extension/lib/password-vault';

const vault = new PasswordVault('master-password');
const password = vault.generatePassword(16);

vault.store('network-id', userData.email, password);

const assistant = new SignupAssistant(undefined, vault);
// Assistant can access vault for secure credential management
```

## API Reference

### SignupAssistant Class

#### Constructor

```typescript
constructor(agentDB?: any, passwordVault?: any)
```

#### Methods

##### detectSignupForm

```typescript
async detectSignupForm(networkId: string): Promise<SignupForm | null>
```

Detects the signup form on the current page.

**Parameters:**
- `networkId` - Identifier for the affiliate network

**Returns:**
- `SignupForm` - Detected form structure
- `null` - If no form found

**Example:**
```typescript
const form = await assistant.detectSignupForm('shareasale');
if (form) {
  console.log(`Found ${form.fields.length} fields`);
}
```

##### requestPermission

```typescript
async requestPermission(
  action: string,
  description: string,
  risks?: string[]
): Promise<boolean>
```

Request human approval before taking action.

**Parameters:**
- `action` - Name of the action
- `description` - Human-readable description
- `risks` - List of potential risks (optional)

**Returns:**
- `boolean` - true if approved, false if denied

**Example:**
```typescript
const approved = await assistant.requestPermission(
  'Pre-fill Form',
  'Fill form fields with your data',
  ['Data will be entered into form']
);
```

##### prefillForm

```typescript
async prefillForm(form: SignupForm, userData: UserData): Promise<void>
```

Pre-fill form fields with user data (requires permission).

**Parameters:**
- `form` - Detected signup form
- `userData` - User data for pre-filling

**Example:**
```typescript
await assistant.prefillForm(form, {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
});
```

##### showGuidance

```typescript
async showGuidance(step: string): Promise<void>
```

Display visual guidance to the user.

**Parameters:**
- `step` - Guidance message to display

**Example:**
```typescript
await assistant.showGuidance('Please review all fields');
```

##### showFieldChecklist

```typescript
showFieldChecklist(form: SignupForm): void
```

Display a checklist of required fields.

**Parameters:**
- `form` - Signup form

##### waitForHumanSubmit

```typescript
async waitForHumanSubmit(): Promise<boolean>
```

Wait for human to submit the form (NEVER automates).

**Returns:**
- `boolean` - true if human submitted, false on timeout

**Example:**
```typescript
const submitted = await assistant.waitForHumanSubmit();
if (submitted) {
  console.log('Human submitted form!');
}
```

##### recordSignupComplete

```typescript
async recordSignupComplete(networkId: string): Promise<void>
```

Record signup completion in AgentDB.

**Parameters:**
- `networkId` - Affiliate network identifier

##### startSession

```typescript
startSession(networkId: string): void
```

Start a new signup session.

##### endSession

```typescript
endSession(): void
```

End the current session and cleanup.

##### getSession

```typescript
getSession(): SignupSession | null
```

Get the current session.

##### getComplianceLogs

```typescript
getComplianceLogs(): InsertComplianceLog[]
```

Get all compliance logs.

##### cleanup

```typescript
cleanup(): void
```

Remove all visual elements and cleanup.

### Types

#### UserData

```typescript
interface UserData {
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
  [key: string]: string | undefined;
}
```

#### SignupForm

```typescript
interface SignupForm {
  fields: FormField[];
  submitButton: HTMLElement | null;
  networkId: string;
  formElement: HTMLFormElement | null;
  detectedAt: number;
}
```

#### FormField

```typescript
interface FormField {
  name: string;
  type: FormFieldType;
  label?: string;
  required: boolean;
  pattern?: string;
  placeholder?: string;
  options?: string[];
  default_value?: string;
  sensitive?: boolean;
  autocomplete?: string;
  validation_rules?: ValidationRule[];
}
```

#### SignupSession

```typescript
interface SignupSession {
  networkId: string;
  startedAt: number;
  steps: GuidanceStep[];
  fieldsCompleted: Set<string>;
  humanSubmitted: boolean;
  completedAt?: number;
  permissions: PermissionRequest[];
}
```

### Convenience Functions

#### completeSignupWorkflow

```typescript
async completeSignupWorkflow(
  networkId: string,
  userData: UserData,
  agentDB?: any,
  passwordVault?: any
): Promise<boolean>
```

Complete signup workflow with full compliance.

**Parameters:**
- `networkId` - Affiliate network identifier
- `userData` - User data for pre-filling
- `agentDB` - Optional AgentDB client
- `passwordVault` - Optional password vault

**Returns:**
- `boolean` - true if successful, false otherwise

**Example:**
```typescript
const success = await completeSignupWorkflow(
  'shareasale',
  userData,
  agentDB,
  vault
);
```

#### createSignupAssistant

```typescript
function createSignupAssistant(agentDB?: any, passwordVault?: any): SignupAssistant
```

Create a new SignupAssistant instance.

## Examples

See [signup-assistant-example.ts](./signup-assistant-example.ts) for comprehensive examples including:

1. Basic signup flow
2. Signup with AgentDB tracking
3. Signup with password vault
4. Complete workflow (all-in-one)
5. Multiple network signups
6. Browser extension integration
7. Compliance audit
8. Error recovery

## Testing

### Run Tests

```bash
npm test src/affiliate/signup-assistant.test.ts
```

### Test Coverage

The test suite includes:

- Form detection tests
- Permission system tests (COMPLIANCE CRITICAL)
- Pre-filling tests
- Human submission tests (COMPLIANCE CRITICAL)
- Session management tests
- Compliance logging tests
- Visual guidance tests
- Integration tests
- Error handling tests
- **Compliance verification tests**

### Compliance Verification

Critical compliance tests ensure:

1. Form submission is NEVER automated
2. Sensitive fields are NEVER auto-filled
3. All actions require human approval
4. All actions are logged

Run compliance tests specifically:

```bash
npm test -- --testNamePattern="COMPLIANCE VERIFICATION"
```

## Security

### Data Protection

1. **No Plaintext Passwords**
   - Passwords are never stored in UserData
   - Use PasswordVault for secure storage
   - Encryption with AES-256-GCM

2. **Sensitive Field Detection**
   - Automatic detection of sensitive fields
   - Pattern matching for security fields
   - Manual override for custom cases

3. **Permission System**
   - All actions require explicit approval
   - Clear risk communication
   - Audit trail of all permissions

### Best Practices

```typescript
// DO: Use password vault
const vault = new PasswordVault('master-password');
const password = vault.generatePassword(16);
vault.store('network', email, password);

// DON'T: Store passwords in UserData
const userData = {
  email: 'user@example.com',
  password: 'insecure123' // NEVER DO THIS
};

// DO: Request permission before actions
const approved = await assistant.requestPermission(...);
if (approved) {
  await assistant.prefillForm(...);
}

// DON'T: Skip permission checks
await assistant.prefillForm(...); // Missing permission check
```

## Troubleshooting

### Form Not Detected

**Problem:** `detectSignupForm()` returns null

**Solutions:**
1. Ensure you're on the signup page
2. Wait for page to fully load
3. Check if form is in iframe
4. Verify form has standard HTML elements

```typescript
// Wait for page load
await new Promise(resolve => setTimeout(resolve, 2000));
const form = await assistant.detectSignupForm('network-id');
```

### Fields Not Pre-filling

**Problem:** Fields remain empty after `prefillForm()`

**Solutions:**
1. Check if permission was granted
2. Verify field names match UserData keys
3. Ensure fields are not marked sensitive
4. Check browser console for errors

```typescript
// Debug: Log detected fields
const form = await assistant.detectSignupForm('network-id');
console.log('Fields:', form?.fields.map(f => f.name));

// Debug: Check if permission granted
const approved = await assistant.requestPermission(...);
console.log('Permission granted:', approved);
```

### Permission Dialog Not Appearing

**Problem:** Permission dialog doesn't show

**Solutions:**
1. Check if popup blockers are active
2. Verify z-index of dialog is high enough
3. Check browser console for errors
4. Ensure DOM is ready

```typescript
// Increase z-index if needed
const dialog = document.getElementById('signup-permission-dialog');
if (dialog) {
  dialog.style.zIndex = '999999';
}
```

### Submit Not Detected

**Problem:** `waitForHumanSubmit()` times out

**Solutions:**
1. Ensure you're clicking the actual submit button
2. Check if form uses custom submit handling
3. Verify form element is correctly detected
4. Increase timeout if needed

```typescript
// Custom timeout (default 5 minutes)
const submitted = await assistant.waitForHumanSubmit();
// Note: Timeout is hardcoded, modify source if needed
```

### Cleanup Issues

**Problem:** Visual elements remain after session

**Solutions:**
1. Always call `assistant.cleanup()` or `endSession()`
2. Use try/finally to ensure cleanup
3. Check for multiple instances

```typescript
try {
  await completeSignupWorkflow(...);
} finally {
  assistant.cleanup();
}
```

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please ensure:

1. All tests pass (especially compliance tests)
2. New features include tests
3. Documentation is updated
4. Code follows existing style
5. Compliance requirements are maintained

## Support

For issues or questions:

- GitHub Issues: [link]
- Documentation: [link]
- Examples: See `signup-assistant-example.ts`

---

**REMEMBER:** This tool assists humans, never replaces them. All critical actions require human approval and submission.
