/**
 * SignupAssistant Usage Examples
 *
 * Demonstrates how to use the human-in-loop signup assistant
 * for compliant affiliate network signups.
 */

import { /* SignupAssistant, */ completeSignupWorkflow, createSignupAssistant } from './signup-assistant';
import type { UserData } from './signup-assistant';
import { AgentDBClient } from '../training/agentdb-client';
import { PasswordVault } from '../extension/lib/password-vault';

// ============================================================================
// Example 1: Basic Signup Flow
// ============================================================================

/**
 * Basic signup flow with manual steps
 */
export async function basicSignupExample() {
  console.log('=== Basic Signup Example ===\n');

  // Initialize assistant
  const assistant = createSignupAssistant();

  // User data for pre-filling
  const userData: UserData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-123-4567',
    company: 'Tech Innovations Inc',
    website: 'https://techinnovations.com',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    country: 'United States',
  };

  try {
    // Step 1: Start session
    assistant.startSession('shareasale');
    await assistant.showGuidance('Starting signup for ShareASale...');

    // Step 2: Detect form
    await assistant.showGuidance('Detecting signup form...');
    const form = await assistant.detectSignupForm('shareasale');

    if (!form) {
      console.error('Could not find signup form on page');
      return;
    }

    console.log(`Found form with ${form.fields.length} fields`);

    // Step 3: Show field checklist
    assistant.showFieldChecklist(form);

    // Step 4: Pre-fill form (requires human approval)
    await assistant.showGuidance('Ready to pre-fill form fields...');
    await assistant.prefillForm(form, userData);

    // Step 5: Wait for human to review and submit
    await assistant.showGuidance('Please review all fields and click Submit');
    const submitted = await assistant.waitForHumanSubmit();

    if (submitted) {
      console.log('✓ Human submitted form successfully!');
      await assistant.recordSignupComplete('shareasale');
    } else {
      console.log('✗ Signup timeout or cancelled');
    }
  } catch (error) {
    console.error('Error during signup:', error);
  } finally {
    // Cleanup after 3 seconds
    setTimeout(() => {
      assistant.endSession();
    }, 3000);
  }
}

// ============================================================================
// Example 2: Signup with AgentDB Tracking
// ============================================================================

/**
 * Signup flow with AgentDB for tracking and learning
 */
export async function signupWithAgentDB() {
  console.log('=== Signup with AgentDB Tracking ===\n');

  // Initialize AgentDB
  const _agentDB = new AgentDBClient('./agentdb', 384);

  // Initialize assistant with AgentDB
  const assistant = createSignupAssistant(_agentDB);

  const userData: UserData = {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    company: 'Digital Marketing Pro',
    website: 'https://digitalmarketingpro.com',
  };

  try {
    assistant.startSession('cj-affiliate');

    // Detect and pre-fill
    const form = await assistant.detectSignupForm('cj-affiliate');
    if (form) {
      await assistant.prefillForm(form, userData);
      const submitted = await assistant.waitForHumanSubmit();

      if (submitted) {
        // This will save to AgentDB automatically
        await assistant.recordSignupComplete('cj-affiliate');

        // AgentDB now has compliance logs and network status
        console.log('✓ Signup recorded in AgentDB');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Save AgentDB
    _agentDB.save();
    assistant.endSession();
  }
}

// ============================================================================
// Example 3: Signup with Password Vault
// ============================================================================

/**
 * Signup flow with secure password management
 */
export async function signupWithPasswordVault() {
  console.log('=== Signup with Password Vault ===\n');

  // Initialize password vault with master password
  const vault = new PasswordVault('my-secure-master-password');

  // Generate a strong password for this network
  const password = vault.generatePassword(16, {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  console.log('Generated password:', password);

  // Store credentials in vault
  vault.store(
    'rakuten-advertising',
    'john.doe@example.com',
    password,
    'Rakuten Advertising affiliate account'
  );

  // Initialize assistant with vault access
  const assistant = createSignupAssistant(undefined, vault);

  const userData: UserData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    company: 'E-commerce Solutions',
  };

  try {
    assistant.startSession('rakuten-advertising');

    const form = await assistant.detectSignupForm('rakuten-advertising');
    if (form) {
      // Pre-fill non-sensitive fields
      await assistant.prefillForm(form, userData);

      // Show guidance to manually enter password
      await assistant.showGuidance('Please manually enter the password from your vault');
      await assistant.showGuidance(`Password: ${password}`);

      const submitted = await assistant.waitForHumanSubmit();
      if (submitted) {
        await assistant.recordSignupComplete('rakuten-advertising');
        console.log('✓ Signup complete with secure password stored in vault');
      }
    }
  } finally {
    // Export vault (encrypted)
    const vaultExport = vault.exportVault();
    console.log('Vault exported (encrypted):', vaultExport.substring(0, 100) + '...');

    assistant.endSession();
  }
}

// ============================================================================
// Example 4: Complete Workflow (All-in-One)
// ============================================================================

/**
 * Complete signup workflow using the convenience function
 */
export async function completeWorkflowExample() {
  console.log('=== Complete Workflow Example ===\n');

  // Initialize dependencies
  const agentDB = new AgentDBClient('./agentdb', 384);
  const vault = new PasswordVault('master-password');

  const userData: UserData = {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.johnson@example.com',
    phone: '+1-555-987-6543',
    company: 'Affiliate Marketing Masters',
    website: 'https://affiliatemarketingmasters.com',
    address: '456 Market Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
  };

  try {
    // All-in-one workflow
    const success = await completeSignupWorkflow(
      'impact-radius',
      userData,
      agentDB,
      vault
    );

    if (success) {
      console.log('✓ Signup workflow completed successfully!');
      agentDB.save();
    } else {
      console.log('✗ Signup workflow failed or cancelled');
    }
  } catch (error) {
    console.error('Error in workflow:', error);
  }
}

// ============================================================================
// Example 5: Multiple Network Signups
// ============================================================================

/**
 * Sign up to multiple networks sequentially
 */
export async function multipleNetworkSignups() {
  console.log('=== Multiple Network Signups ===\n');

  const agentDB = new AgentDBClient('./agentdb', 384);
  const vault = new PasswordVault('master-password');

  const userData: UserData = {
    firstName: 'Bob',
    lastName: 'Williams',
    email: 'bob.williams@example.com',
    company: 'Affiliate Hub',
    website: 'https://affiliatehub.com',
  };

  const networks = [
    'shareasale',
    'cj-affiliate',
    'rakuten-advertising',
    'impact-radius',
    'awin',
  ];

  for (const networkId of networks) {
    console.log(`\n--- Signing up to ${networkId} ---`);

    try {
      const success = await completeSignupWorkflow(
        networkId,
        userData,
        agentDB,
        vault
      );

      if (success) {
        console.log(`✓ Successfully signed up to ${networkId}`);
      } else {
        console.log(`✗ Failed to sign up to ${networkId}`);
      }

      // Wait 5 seconds between signups
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Error signing up to ${networkId}:`, error);
    }
  }

  // Save all data
  agentDB.save();
  console.log('\n✓ All signups complete, data saved');
}

// ============================================================================
// Example 6: Browser Extension Integration
// ============================================================================

/**
 * How to integrate SignupAssistant in a browser extension
 */
export function browserExtensionIntegration(): void {
  console.log('=== Browser Extension Integration ===\n');

  // In content script (runs on affiliate network pages)
  if (typeof window !== 'undefined' && typeof chrome !== 'undefined') {
    // Listen for message from popup/background
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === 'start_signup') {
        const { networkId, userData } = message;

        // Create assistant (not used for workflow-based approach)
        // const _assistant = createSignupAssistant();

        // Run signup workflow
        completeSignupWorkflow(networkId, userData)
          .then(success => {
            sendResponse({ success, message: 'Signup completed' });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });

        // Return true to indicate async response
        return true;
      }
      return false;
    });

    console.log('✓ Browser extension listener registered');
  }
}

// ============================================================================
// Example 7: Compliance Audit
// ============================================================================

/**
 * Audit compliance logs after signup
 */
export async function complianceAuditExample() {
  console.log('=== Compliance Audit Example ===\n');

  const assistant = createSignupAssistant();

  const userData: UserData = {
    firstName: 'Carol',
    lastName: 'Davis',
    email: 'carol.davis@example.com',
  };

  try {
    assistant.startSession('test-network');

    // Perform signup steps...
    const form = await assistant.detectSignupForm('test-network');
    if (form) {
      await assistant.prefillForm(form, userData);
    }

    // Get compliance logs
    const logs = assistant.getComplianceLogs();

    console.log('\n=== COMPLIANCE AUDIT ===');
    console.log(`Total actions logged: ${logs.length}\n`);

    // Analyze logs
    const criticalActions = logs.filter(log => log.compliance_level === 'critical');
    const warnings = logs.filter(log => log.compliance_level === 'warning');
    const infos = logs.filter(log => log.compliance_level === 'info');

    console.log(`Critical actions: ${criticalActions.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Info logs: ${infos.length}\n`);

    // Check human approval
    const session = assistant.getSession();
    if (session) {
      console.log('=== PERMISSIONS ===');
      console.log(`Total permissions requested: ${session.permissions.length}`);
      session.permissions.forEach(perm => {
        console.log(`  - ${perm.action}: ${perm.approved ? '✓ APPROVED' : '✗ DENIED'}`);
      });

      console.log(`\nHuman submitted form: ${session.humanSubmitted ? '✓ YES' : '✗ NO'}`);
    }

    console.log('\n✓ Compliance audit complete');
  } finally {
    assistant.endSession();
  }
}

// ============================================================================
// Example 8: Error Recovery
// ============================================================================

/**
 * Handle errors and retry signup
 */
export async function errorRecoveryExample() {
  console.log('=== Error Recovery Example ===\n');

  const assistant = createSignupAssistant();

  const userData: UserData = {
    firstName: 'Dave',
    lastName: 'Miller',
    email: 'dave.miller@example.com',
  };

  const maxRetries = 3;
  let attempt = 0;
  let success = false;

  while (attempt < maxRetries && !success) {
    attempt++;
    console.log(`\nAttempt ${attempt}/${maxRetries}...`);

    try {
      assistant.startSession('network-with-issues');

      const form = await assistant.detectSignupForm('network-with-issues');

      if (!form) {
        console.log('Form not found, waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      await assistant.prefillForm(form, userData);
      const submitted = await assistant.waitForHumanSubmit();

      if (submitted) {
        await assistant.recordSignupComplete('network-with-issues');
        success = true;
        console.log('✓ Signup successful!');
      } else {
        console.log('Submission timeout, retrying...');
      }
    } catch (error) {
      console.error(`Error on attempt ${attempt}:`, error);

      if (attempt < maxRetries) {
        console.log('Retrying in 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    } finally {
      assistant.endSession();
    }
  }

  if (!success) {
    console.log('✗ All attempts failed');
  }
}

// ============================================================================
// Main Demo Runner
// ============================================================================

/**
 * Run all examples (for demo purposes)
 */
export async function runAllExamples() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  SignupAssistant Usage Examples            ║');
  console.log('║  Human-in-Loop Affiliate Network Signups   ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Note: In practice, you'd run these one at a time on actual pages

  console.log('Available examples:');
  console.log('1. basicSignupExample()');
  console.log('2. signupWithAgentDB()');
  console.log('3. signupWithPasswordVault()');
  console.log('4. completeWorkflowExample()');
  console.log('5. multipleNetworkSignups()');
  console.log('6. browserExtensionIntegration()');
  console.log('7. complianceAuditExample()');
  console.log('8. errorRecoveryExample()');

  console.log('\n');
  console.log('To run an example, call it directly:');
  console.log('  await basicSignupExample();');
  console.log('');
}

// ============================================================================
// Quick Start Helper
// ============================================================================

/**
 * Quick start - drop this into browser console
 */
export function quickStart() {
  console.log(`
╔════════════════════════════════════════════╗
║  SignupAssistant Quick Start                ║
╚════════════════════════════════════════════╝

Paste this code into your browser console on any affiliate signup page:

// Import (adjust path as needed)
import { completeSignupWorkflow } from './signup-assistant';

// Your data
const userData = {
  firstName: 'Your Name',
  lastName: 'Last Name',
  email: 'your@email.com',
  company: 'Your Company',
  website: 'https://yoursite.com'
};

// Run signup
await completeSignupWorkflow('network-name', userData);

// That's it! The assistant will:
// 1. Ask permission to pre-fill fields
// 2. Fill non-sensitive fields
// 3. Show you what to fill manually
// 4. Wait for YOU to click Submit
// 5. Record completion

IMPORTANT:
- You MUST click Submit yourself (never automated)
- Passwords MUST be entered manually
- Review all fields before submitting
  `);
}

// Export for easy console access
if (typeof window !== 'undefined') {
  (window as any).SignupAssistantExamples = {
    basicSignupExample,
    signupWithAgentDB,
    signupWithPasswordVault,
    completeWorkflowExample,
    multipleNetworkSignups,
    browserExtensionIntegration,
    complianceAuditExample,
    errorRecoveryExample,
    runAllExamples,
    quickStart,
  };
}
