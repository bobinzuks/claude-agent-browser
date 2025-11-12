/**
 * BOSS 5: Chrome Extension Bridge
 * Implements MessageBridge for Chrome extension runtime
 */

import { MessageBridge, BridgeMessage } from './message-bridge';

export interface ChromeBridgeOptions {
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * ChromeBridge - Chrome extension specific implementation
 */
export class ChromeBridge extends MessageBridge {
  private messageListener: ((message: any, sender: any, sendResponse: any) => void) | null;

  constructor(options: ChromeBridgeOptions = {}) {
    super({
      maxRetries: options.maxRetries,
      retryDelay: options.retryDelay,
    });

    this.messageListener = null;
    this.setupChromeListeners();
  }

  /**
   * Setup Chrome runtime message listeners
   */
  private setupChromeListeners(): void {
    // For Node.js environment (testing), don't setup Chrome listeners
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      return;
    }

    this.messageListener = (message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
      // Only handle our bridge messages
      if (message && message.type && message.id) {
        this.handleMessage(message as BridgeMessage)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            sendResponse({ success: false, error: String(error) });
          });

        // Return true to indicate async response
        return true;
      }

      return false;
    };

    chrome.runtime.onMessage.addListener(this.messageListener);
  }

  /**
   * Send message via Chrome runtime
   */
  protected async sendMessageToTransport(message: BridgeMessage): Promise<void> {
    // For Node.js environment (testing), use a mock transport
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      // Mock implementation for testing
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (_response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send message to specific tab
   */
  public async sendToTab(tabId: number, message: BridgeMessage): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.sendMessage(tabId, message, (_response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Broadcast message to all tabs
   */
  public async broadcast(message: BridgeMessage): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      return Promise.resolve();
    }

    const tabs = await chrome.tabs.query({});

    const promises = tabs.map((tab) => {
      if (tab.id) {
        return this.sendToTab(tab.id, message).catch((error) => {
          console.warn(`Failed to send to tab ${tab.id}:`, error);
        });
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
  }

  /**
   * Cleanup Chrome listeners
   */
  public shutdown(): void {
    if (this.messageListener && typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
      this.messageListener = null;
    }

    super.shutdown();
  }
}
