/**
 * SMS Provider Interface
 * Abstract interface for SMS receiving services (Twilio, Vonage, etc.)
 */

export interface SMSMessage {
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  sid?: string; // Message ID from provider
}

export interface VerificationCode {
  code: string;
  source: string; // Phone number or service name
  extractedAt: Date;
  confidence: number; // 0-1 confidence score
}

export interface SMSProviderConfig {
  accountSid?: string;
  authToken?: string;
  apiKey?: string;
  phoneNumber?: string;
  webhookUrl?: string;
  webhookPort?: number;
}

/**
 * Abstract SMS Provider interface
 * Implement this for different SMS services (Twilio, Vonage, MessageBird, etc.)
 */
export abstract class SMSProvider {
  protected config: SMSProviderConfig;
  protected pendingMessages: Map<string, SMSMessage[]> = new Map();

  constructor(config: SMSProviderConfig) {
    this.config = config;
  }

  /**
   * Get a phone number for receiving SMS
   * May return existing number or provision a new one
   */
  abstract getPhoneNumber(): Promise<string>;

  /**
   * Wait for SMS containing verification code
   * @param timeout - Maximum wait time in milliseconds
   * @returns Verification code or null if timeout
   */
  abstract waitForCode(timeout?: number): Promise<string | null>;

  /**
   * Start listening for incoming SMS messages
   * Should set up webhook server or polling mechanism
   */
  abstract startListening(): Promise<void>;

  /**
   * Stop listening for messages
   */
  abstract stopListening(): Promise<void>;

  /**
   * Get all received messages for a phone number
   */
  abstract getMessages(phoneNumber: string): Promise<SMSMessage[]>;

  /**
   * Extract verification code from SMS message body
   * Uses regex patterns to find 4-8 digit codes
   */
  protected extractVerificationCode(messageBody: string): VerificationCode | null {
    // Common patterns for verification codes
    const patterns = [
      /\b(\d{6})\b/,           // 6-digit code (most common)
      /\b(\d{4})\b/,           // 4-digit code
      /\b(\d{8})\b/,           // 8-digit code
      /code[:\s]+(\d{4,8})/i,  // "code: 123456"
      /is[:\s]+(\d{4,8})/i,    // "is 123456"
      /(\d{4,8})\s+is your/i,  // "123456 is your code"
    ];

    for (const pattern of patterns) {
      const match = messageBody.match(pattern);
      if (match) {
        return {
          code: match[1],
          source: 'sms',
          extractedAt: new Date(),
          confidence: pattern === patterns[0] ? 1.0 : 0.8, // 6-digit has highest confidence
        };
      }
    }

    return null;
  }

  /**
   * Check if provider is properly configured
   */
  abstract isConfigured(): boolean;
}
