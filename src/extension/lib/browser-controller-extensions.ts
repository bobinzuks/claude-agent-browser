/**
 * Browser Controller Extensions
 * Additional high-level automation methods built on top of BrowserController
 */

import { BrowserController } from '../../mcp-bridge/browser-controller.js';
import { PhoneVerificationHandler, VerificationResult } from './phone-verification-handler.js';
import { SMSProvider } from './sms-provider.js';
import { AgentDBClient } from '../../training/agentdb-client.js';

/**
 * Extended BrowserController with phone verification capabilities
 */
export class ExtendedBrowserController extends BrowserController {
  private verificationHandler: PhoneVerificationHandler | null = null;
  private agentDB: AgentDBClient | null = null;

  /**
   * Initialize phone verification with SMS provider
   */
  setupPhoneVerification(smsProvider: SMSProvider, agentDBPath?: string): void {
    // Initialize AgentDB if path provided
    if (agentDBPath) {
      this.agentDB = new AgentDBClient(agentDBPath, 384);
    }

    // Create verification handler
    this.verificationHandler = new PhoneVerificationHandler(this, {
      smsProvider,
      agentDB: this.agentDB || undefined,
    });

    console.log('[ExtendedBrowserController] Phone verification initialized');
  }

  /**
   * Handle phone verification flow automatically
   */
  async handlePhoneVerification(phoneNumber?: string): Promise<VerificationResult> {
    if (!this.verificationHandler) {
      throw new Error('Phone verification not initialized. Call setupPhoneVerification() first.');
    }

    return this.verificationHandler.handleVerification(phoneNumber);
  }

  /**
   * Detect if current page has phone verification
   */
  async detectPhoneVerification() {
    if (!this.verificationHandler) {
      throw new Error('Phone verification not initialized. Call setupPhoneVerification() first.');
    }

    return this.verificationHandler.detectVerificationFlow();
  }

  /**
   * Get AgentDB statistics
   */
  getVerificationStats() {
    if (!this.agentDB) {
      return null;
    }

    return this.agentDB.getStatistics();
  }

  /**
   * Save AgentDB patterns
   */
  saveVerificationPatterns(): void {
    if (this.agentDB) {
      this.agentDB.save();
      console.log('[ExtendedBrowserController] Verification patterns saved');
    }
  }
}
