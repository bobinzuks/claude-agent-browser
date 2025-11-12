/**
 * Twilio SMS Provider Implementation
 * Receives SMS messages via Twilio webhook
 */

import { SMSProvider, SMSMessage, SMSProviderConfig } from '../sms-provider.js';
import * as http from 'http';

export interface TwilioConfig extends SMSProviderConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string; // Your Twilio phone number (e.g., +15551234567)
  webhookPort?: number; // Port for webhook server (default: 3456)
  webhookPath?: string; // Webhook endpoint path (default: /sms)
}

export class TwilioProvider extends SMSProvider {
  private server: http.Server | null = null;
  private codeResolvers: Map<string, (code: string | null) => void> = new Map();
  private receivedMessages: SMSMessage[] = [];

  constructor(config: TwilioConfig) {
    super(config);

    // Validate required config
    if (!config.accountSid || !config.authToken || !config.phoneNumber) {
      throw new Error('TwilioProvider requires accountSid, authToken, and phoneNumber');
    }
  }

  async getPhoneNumber(): Promise<string> {
    return this.config.phoneNumber!;
  }

  async waitForCode(timeout: number = 60000): Promise<string | null> {
    return new Promise((resolve) => {
      const phoneNumber = this.config.phoneNumber!;
      const timeoutId = setTimeout(() => {
        this.codeResolvers.delete(phoneNumber);
        resolve(null);
      }, timeout);

      this.codeResolvers.set(phoneNumber, (code: string | null) => {
        clearTimeout(timeoutId);
        this.codeResolvers.delete(phoneNumber);
        resolve(code);
      });

      // Check if we already have a recent message with a code
      const recentMessage = this.getRecentMessageWithCode();
      if (recentMessage) {
        const extracted = this.extractVerificationCode(recentMessage.body);
        if (extracted) {
          clearTimeout(timeoutId);
          this.codeResolvers.delete(phoneNumber);
          resolve(extracted.code);
        }
      }
    });
  }

  async startListening(): Promise<void> {
    if (this.server) {
      console.log('[TwilioProvider] Webhook server already running');
      return;
    }

    const port = this.config.webhookPort || 3456;
    const path = (this.config as TwilioConfig).webhookPath || '/sms';

    this.server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === path) {
        this.handleWebhook(req, res);
      } else if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    return new Promise((resolve, reject) => {
      this.server!.listen(port, () => {
        console.log(`[TwilioProvider] Webhook server listening on http://localhost:${port}${path}`);
        console.log(`[TwilioProvider] Configure Twilio webhook URL: http://YOUR_PUBLIC_IP:${port}${path}`);
        console.log(`[TwilioProvider] For local testing, use ngrok: ngrok http ${port}`);
        resolve();
      });

      this.server!.on('error', (error) => {
        console.error('[TwilioProvider] Server error:', error);
        reject(error);
      });
    });
  }

  async stopListening(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          console.log('[TwilioProvider] Webhook server stopped');
          this.server = null;
          resolve();
        });
      });
    }
  }

  async getMessages(phoneNumber: string): Promise<SMSMessage[]> {
    return this.receivedMessages.filter(msg => msg.to === phoneNumber);
  }

  isConfigured(): boolean {
    return !!(
      this.config.accountSid &&
      this.config.authToken &&
      this.config.phoneNumber
    );
  }

  /**
   * Handle incoming Twilio webhook request
   */
  private handleWebhook(req: http.IncomingMessage, res: http.ServerResponse): void {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        // Parse Twilio webhook data (application/x-www-form-urlencoded)
        const params = new URLSearchParams(body);

        const message: SMSMessage = {
          from: params.get('From') || '',
          to: params.get('To') || '',
          body: params.get('Body') || '',
          timestamp: new Date(),
          sid: params.get('MessageSid') || undefined,
        };

        console.log('[TwilioProvider] SMS received:', {
          from: message.from,
          to: message.to,
          body: message.body.substring(0, 50) + '...',
        });

        // Store message
        this.receivedMessages.push(message);

        // Extract verification code
        const extracted = this.extractVerificationCode(message.body);
        if (extracted) {
          console.log('[TwilioProvider] Verification code detected:', extracted.code);

          // Resolve any waiting promises
          const resolver = this.codeResolvers.get(message.to);
          if (resolver) {
            resolver(extracted.code);
          }
        }

        // Respond with TwiML (required by Twilio)
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      } catch (error) {
        console.error('[TwilioProvider] Error processing webhook:', error);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });
  }

  /**
   * Get most recent message that likely contains a verification code
   */
  private getRecentMessageWithCode(): SMSMessage | null {
    const recentMessages = this.receivedMessages
      .filter(msg => {
        const age = Date.now() - msg.timestamp.getTime();
        return age < 120000; // Within last 2 minutes
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    for (const message of recentMessages) {
      const extracted = this.extractVerificationCode(message.body);
      if (extracted) {
        return message;
      }
    }

    return null;
  }
}
