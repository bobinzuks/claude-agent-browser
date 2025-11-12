/**
 * BOSS 5: The Communicator - Message Bridge
 * Bidirectional communication between Chrome Extension and MCP Server
 */

export interface BridgeMessage {
  id: string;
  type: 'command' | 'response' | 'error' | 'event';
  action?: string;
  payload?: any;
  error?: string;
  timestamp: number;
}

export interface CommandRequest {
  id: string;
  action: string;
  params: Record<string, any>;
  timeout?: number;
}

export interface CommandResponse {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
}

export type MessageHandler = (message: BridgeMessage) => Promise<any>;

/**
 * MessageBridge - Routes messages between extension and MCP server
 */
export class MessageBridge {
  private handlers: Map<string, MessageHandler>;
  private pendingCommands: Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>;
  private messageQueue: BridgeMessage[];
  private isProcessing: boolean;
  private maxRetries: number;
  private retryDelay: number;

  constructor(options: {
    maxRetries?: number;
    retryDelay?: number;
  } = {}) {
    this.handlers = new Map();
    this.pendingCommands = new Map();
    this.messageQueue = [];
    this.isProcessing = false;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * Register a handler for a specific action
   */
  public on(action: string, handler: MessageHandler): void {
    this.handlers.set(action, handler);
  }

  /**
   * Unregister a handler
   */
  public off(action: string): void {
    this.handlers.delete(action);
  }

  /**
   * Send a command and wait for response
   */
  public async sendCommand(
    action: string,
    params: Record<string, any> = {},
    timeout: number = 30000
  ): Promise<any> {
    const id = this.generateId();

    const message: BridgeMessage = {
      id,
      type: 'command',
      action,
      payload: params,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      // Setup timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingCommands.delete(id);
        reject(new Error(`Command timeout: ${action}`));
      }, timeout);

      // Store pending command
      this.pendingCommands.set(id, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      // Send message
      this.enqueueMessage(message);
    });
  }

  /**
   * Handle incoming message
   */
  public async handleMessage(message: BridgeMessage): Promise<void> {
    switch (message.type) {
      case 'command':
        await this.handleCommand(message);
        break;

      case 'response':
        this.handleResponse(message);
        break;

      case 'error':
        this.handleError(message);
        break;

      case 'event':
        await this.handleEvent(message);
        break;

      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle command message
   */
  private async handleCommand(message: BridgeMessage): Promise<void> {
    const { id, action } = message;

    if (!action) {
      this.sendError(id, 'Missing action in command');
      return;
    }

    const handler = this.handlers.get(action);

    if (!handler) {
      this.sendError(id, `No handler registered for action: ${action}`);
      return;
    }

    try {
      const result = await handler(message);
      this.sendResponse(id, result);
    } catch (error) {
      this.sendError(id, String(error));
    }
  }

  /**
   * Handle response message
   */
  private handleResponse(message: BridgeMessage): void {
    const pending = this.pendingCommands.get(message.id);

    if (!pending) {
      console.warn(`No pending command for response: ${message.id}`);
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingCommands.delete(message.id);
    pending.resolve(message.payload);
  }

  /**
   * Handle error message
   */
  private handleError(message: BridgeMessage): void {
    const pending = this.pendingCommands.get(message.id);

    if (!pending) {
      console.warn(`No pending command for error: ${message.id}`);
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingCommands.delete(message.id);
    pending.reject(new Error(message.error || 'Unknown error'));
  }

  /**
   * Handle event message
   */
  private async handleEvent(message: BridgeMessage): Promise<void> {
    const { action } = message;

    if (!action) {
      console.warn('Event message missing action');
      return;
    }

    const handler = this.handlers.get(action);

    if (handler) {
      try {
        await handler(message);
      } catch (error) {
        console.error(`Event handler error for ${action}:`, error);
      }
    }
  }

  /**
   * Send response message
   */
  private sendResponse(id: string, result: any): void {
    const message: BridgeMessage = {
      id,
      type: 'response',
      payload: result,
      timestamp: Date.now(),
    };

    this.enqueueMessage(message);
  }

  /**
   * Send error message
   */
  private sendError(id: string, error: string): void {
    const message: BridgeMessage = {
      id,
      type: 'error',
      error,
      timestamp: Date.now(),
    };

    this.enqueueMessage(message);
  }

  /**
   * Enqueue message for sending
   */
  private enqueueMessage(message: BridgeMessage): void {
    this.messageQueue.push(message);
    this.processQueue();
  }

  /**
   * Process message queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        await this.sendMessageWithRetry(message);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Send message with retry logic
   */
  private async sendMessageWithRetry(
    _message: BridgeMessage,
    attempt: number = 0
  ): Promise<void> {
    try {
      await this.sendMessageToTransport(_message);
    } catch (error) {
      if (attempt < this.maxRetries) {
        console.warn(`Retry ${attempt + 1}/${this.maxRetries} for message ${_message.id}`);
        await this.delay(this.retryDelay * Math.pow(2, attempt));
        await this.sendMessageWithRetry(_message, attempt + 1);
      } else {
        console.error(`Failed to send message after ${this.maxRetries} retries:`, error);

        // If this was a command, reject it
        if (_message.type === 'command') {
          const pending = this.pendingCommands.get(_message.id);
          if (pending) {
            clearTimeout(pending.timeout);
            this.pendingCommands.delete(_message.id);
            pending.reject(new Error(`Failed to send command: ${error}`));
          }
        }
      }
    }
  }

  /**
   * Send message to transport layer (to be overridden)
   */
  protected async sendMessageToTransport(_message: BridgeMessage): Promise<void> {
    // Override this in subclasses for actual transport
    // (Chrome runtime, WebSocket, stdio, etc.)
    throw new Error('sendMessageToTransport must be implemented by subclass');
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get pending command count
   */
  public getPendingCount(): number {
    return this.pendingCommands.size;
  }

  /**
   * Get queue size
   */
  public getQueueSize(): number {
    return this.messageQueue.length;
  }

  /**
   * Clear all pending commands
   */
  public clearPending(): void {
    for (const [_id, pending] of this.pendingCommands.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Bridge cleared'));
    }
    this.pendingCommands.clear();
  }

  /**
   * Clear message queue
   */
  public clearQueue(): void {
    this.messageQueue = [];
  }

  /**
   * Shutdown bridge
   */
  public shutdown(): void {
    this.clearPending();
    this.clearQueue();
    this.handlers.clear();
  }
}
