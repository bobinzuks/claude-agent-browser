/**
 * BOSS 5: MCP Message Bridge
 * Connects MCP Server to Chrome Extension via stdio/WebSocket
 */

import { MessageBridge, BridgeMessage } from '../extension/background/message-bridge';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export interface MCPBridgeOptions {
  maxRetries?: number;
  retryDelay?: number;
  mcpServer?: Server;
}

/**
 * MCPMessageBridge - MCP Server specific implementation
 */
export class MCPMessageBridge extends MessageBridge {
  private mcpServer: Server | null;
  private transport: StdioServerTransport | null;
  private externalMessageHandler: ((message: BridgeMessage) => void) | null;

  constructor(options: MCPBridgeOptions = {}) {
    super({
      maxRetries: options.maxRetries,
      retryDelay: options.retryDelay,
    });

    this.mcpServer = options.mcpServer || null;
    this.transport = null;
    this.externalMessageHandler = null;
  }

  /**
   * Set MCP server instance
   */
  public setMCPServer(server: Server): void {
    this.mcpServer = server;
  }

  /**
   * Set external message handler (for receiving from extension)
   */
  public setExternalMessageHandler(handler: (message: BridgeMessage) => void): void {
    this.externalMessageHandler = handler;
  }

  /**
   * Receive message from external source (Chrome extension)
   */
  public receiveExternalMessage(message: BridgeMessage): void {
    this.handleMessage(message).catch((error) => {
      console.error('Error handling external message:', error);
    });
  }

  /**
   * Send message via stdio/WebSocket to Chrome extension
   */
  protected async sendMessageToTransport(message: BridgeMessage): Promise<void> {
    // For now, we'll use a simple approach: emit to external handler
    // In production, this would send via WebSocket or native messaging
    if (this.externalMessageHandler) {
      this.externalMessageHandler(message);
    } else {
      // Log to stderr so it doesn't interfere with MCP stdio
      console.error('[MCP Bridge] Message ready for extension:', JSON.stringify(message));
    }
  }

  /**
   * Connect transport
   */
  public async connectTransport(): Promise<void> {
    this.transport = new StdioServerTransport();
    // Transport connection handled by MCP server
  }

  /**
   * Disconnect transport
   */
  public async disconnectTransport(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
  }

  /**
   * Send notification to MCP client
   */
  public async sendNotification(method: string, params?: any): Promise<void> {
    if (!this.mcpServer) {
      throw new Error('MCP server not set');
    }

    // MCP notifications are sent via the server's notification method
    // This is handled by the MCP SDK
    console.error(`[MCP Bridge] Notification: ${method}`, params);
  }

  /**
   * Shutdown bridge
   */
  public async shutdown(): Promise<void> {
    await this.disconnectTransport();
    super.shutdown();
  }
}
