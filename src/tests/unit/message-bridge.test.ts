/**
 * BOSS 5 Tests: Message Bridge
 * Test suite for bidirectional message passing
 */

import { MessageBridge, BridgeMessage } from '../../extension/background/message-bridge';

class TestBridge extends MessageBridge {
  public sentMessages: BridgeMessage[] = [];

  protected async sendMessageToTransport(message: BridgeMessage): Promise<void> {
    this.sentMessages.push(message);
  }

  public simulateIncomingMessage(message: BridgeMessage): void {
    this.handleMessage(message);
  }
}

describe('MessageBridge', () => {
  let bridge: TestBridge;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    bridge = new TestBridge();
    // Suppress console output during tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    // Clear bridge handlers
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Handler Registration', () => {
    it('should register a message handler', () => {
      const handler = jest.fn();
      bridge.on('test-action', handler);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should unregister a message handler', () => {
      const handler = jest.fn();
      bridge.on('test-action', handler);
      bridge.off('test-action');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should call handler when matching message received', async () => {
      const handler = jest.fn().mockResolvedValue({ result: 'success' });
      bridge.on('test-action', handler);

      const message: BridgeMessage = {
        id: 'test-123',
        type: 'command',
        action: 'test-action',
        payload: { foo: 'bar' },
        timestamp: Date.now(),
      };

      await bridge.handleMessage(message);

      expect(handler).toHaveBeenCalledWith(message);
    });
  });

  describe('Command Sending', () => {
    it('should send a command message', async () => {
      const commandPromise = bridge.sendCommand('test-action', { param: 'value' });

      expect(bridge.sentMessages.length).toBe(1);
      expect(bridge.sentMessages[0].type).toBe('command');
      expect(bridge.sentMessages[0].action).toBe('test-action');
      expect(bridge.sentMessages[0].payload).toEqual({ param: 'value' });

      // Simulate response
      const response: BridgeMessage = {
        id: bridge.sentMessages[0].id,
        type: 'response',
        payload: { result: 'success' },
        timestamp: Date.now(),
      };

      await bridge.handleMessage(response);

      const result = await commandPromise;
      expect(result).toEqual({ result: 'success' });
    });

    it('should timeout if no response received', async () => {
      const commandPromise = bridge.sendCommand('test-action', {}, 100);

      await expect(commandPromise).rejects.toThrow('Command timeout');
    }, 200);

    it('should handle error responses', async () => {
      const commandPromise = bridge.sendCommand('test-action', {});

      // Simulate error response
      const errorResponse: BridgeMessage = {
        id: bridge.sentMessages[0].id,
        type: 'error',
        error: 'Test error',
        timestamp: Date.now(),
      };

      await bridge.handleMessage(errorResponse);

      await expect(commandPromise).rejects.toThrow('Test error');
    });
  });

  describe('Command Handling', () => {
    it('should handle incoming command and send response', async () => {
      const handler = jest.fn().mockResolvedValue({ result: 'success' });
      bridge.on('test-action', handler);

      const command: BridgeMessage = {
        id: 'cmd-123',
        type: 'command',
        action: 'test-action',
        payload: { foo: 'bar' },
        timestamp: Date.now(),
      };

      await bridge.handleMessage(command);

      // Check handler was called
      expect(handler).toHaveBeenCalledWith(command);

      // Check response was sent
      const responses = bridge.sentMessages.filter(m => m.type === 'response');
      expect(responses.length).toBe(1);
      expect(responses[0].id).toBe('cmd-123');
      expect(responses[0].payload).toEqual({ result: 'success' });
    });

    it('should send error if handler not found', async () => {
      const command: BridgeMessage = {
        id: 'cmd-123',
        type: 'command',
        action: 'unknown-action',
        timestamp: Date.now(),
      };

      await bridge.handleMessage(command);

      const errors = bridge.sentMessages.filter(m => m.type === 'error');
      expect(errors.length).toBe(1);
      expect(errors[0].id).toBe('cmd-123');
      expect(errors[0].error).toContain('No handler registered');
    });

    it('should send error if handler throws', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));
      bridge.on('test-action', handler);

      const command: BridgeMessage = {
        id: 'cmd-123',
        type: 'command',
        action: 'test-action',
        timestamp: Date.now(),
      };

      await bridge.handleMessage(command);

      const errors = bridge.sentMessages.filter(m => m.type === 'error');
      expect(errors.length).toBe(1);
      expect(errors[0].error).toContain('Handler error');
    });

    it('should send error if command missing action', async () => {
      const command: BridgeMessage = {
        id: 'cmd-123',
        type: 'command',
        timestamp: Date.now(),
      };

      await bridge.handleMessage(command);

      const errors = bridge.sentMessages.filter(m => m.type === 'error');
      expect(errors.length).toBe(1);
      expect(errors[0].error).toContain('Missing action');
    });
  });

  describe('Event Handling', () => {
    it('should handle event messages', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      bridge.on('event-action', handler);

      const event: BridgeMessage = {
        id: 'evt-123',
        type: 'event',
        action: 'event-action',
        payload: { data: 'test' },
        timestamp: Date.now(),
      };

      await bridge.handleMessage(event);

      expect(handler).toHaveBeenCalledWith(event);
      // Events don't send responses
      expect(bridge.sentMessages.length).toBe(0);
    });

    it('should not throw if event handler not found', async () => {
      const event: BridgeMessage = {
        id: 'evt-123',
        type: 'event',
        action: 'unknown-event',
        timestamp: Date.now(),
      };

      await expect(bridge.handleMessage(event)).resolves.not.toThrow();
    });

    it('should not throw if event handler throws', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Event error'));
      bridge.on('event-action', handler);

      const event: BridgeMessage = {
        id: 'evt-123',
        type: 'event',
        action: 'event-action',
        timestamp: Date.now(),
      };

      await expect(bridge.handleMessage(event)).resolves.not.toThrow();
    });
  });

  describe('Message Queue', () => {
    it('should queue messages and process them', async () => {
      // Send multiple commands
      bridge.sendCommand('action-1', {});
      bridge.sendCommand('action-2', {});
      bridge.sendCommand('action-3', {});

      // Allow queue to process
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(bridge.sentMessages.length).toBe(3);
      expect(bridge.getPendingCount()).toBe(3);
    });

    it('should report queue size', () => {
      expect(bridge.getQueueSize()).toBe(0);
    });

    it('should clear message queue', () => {
      bridge.clearQueue();
      expect(bridge.getQueueSize()).toBe(0);
    });
  });

  describe('Pending Commands', () => {
    it('should track pending commands', async () => {
      bridge.sendCommand('test-action', {});

      expect(bridge.getPendingCount()).toBe(1);

      // Resolve the command
      const response: BridgeMessage = {
        id: bridge.sentMessages[0].id,
        type: 'response',
        payload: {},
        timestamp: Date.now(),
      };

      await bridge.handleMessage(response);

      expect(bridge.getPendingCount()).toBe(0);
    });

    it('should clear all pending commands', async () => {
      const promise1 = bridge.sendCommand('action-1', {});
      const promise2 = bridge.sendCommand('action-2', {});

      expect(bridge.getPendingCount()).toBe(2);

      bridge.clearPending();

      expect(bridge.getPendingCount()).toBe(0);

      await expect(promise1).rejects.toThrow('Bridge cleared');
      await expect(promise2).rejects.toThrow('Bridge cleared');
    });
  });

  describe('Response Handling', () => {
    it('should ignore response for unknown command', async () => {
      const response: BridgeMessage = {
        id: 'unknown-id',
        type: 'response',
        payload: {},
        timestamp: Date.now(),
      };

      await expect(bridge.handleMessage(response)).resolves.not.toThrow();
    });

    it('should ignore error for unknown command', async () => {
      const error: BridgeMessage = {
        id: 'unknown-id',
        type: 'error',
        error: 'Test error',
        timestamp: Date.now(),
      };

      await expect(bridge.handleMessage(error)).resolves.not.toThrow();
    });
  });

  describe('Concurrent Commands', () => {
    it('should handle multiple concurrent commands', async () => {
      const handler = jest.fn().mockImplementation(async (msg: BridgeMessage) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { action: msg.action };
      });

      bridge.on('action-1', handler);
      bridge.on('action-2', handler);
      bridge.on('action-3', handler);

      // Send commands
      const promises = [
        bridge.sendCommand('action-1', {}),
        bridge.sendCommand('action-2', {}),
        bridge.sendCommand('action-3', {}),
      ];

      // Simulate responses
      await new Promise(resolve => setTimeout(resolve, 20));

      for (const msg of bridge.sentMessages) {
        if (msg.type === 'command') {
          await bridge.handleMessage({
            id: msg.id,
            type: 'response',
            payload: { action: msg.action },
            timestamp: Date.now(),
          });
        }
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
    });
  });

  describe('Shutdown', () => {
    it('should clear pending commands count', () => {
      expect(bridge.getPendingCount()).toBe(0);

      bridge.shutdown();

      expect(bridge.getPendingCount()).toBe(0);
      expect(bridge.getQueueSize()).toBe(0);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle unknown message type', async () => {
      const message: any = {
        id: 'test-123',
        type: 'unknown-type',
        timestamp: Date.now(),
      };

      await expect(bridge.handleMessage(message)).resolves.not.toThrow();
    });
  });

  describe('Message ID Generation', () => {
    it('should generate unique message IDs', () => {
      bridge.sendCommand('action-1', {}).catch(() => {}); // Ignore timeout
      bridge.sendCommand('action-2', {}).catch(() => {}); // Ignore timeout

      expect(bridge.sentMessages.length).toBe(2);
      expect(bridge.sentMessages[0].id).toBeDefined();
      expect(bridge.sentMessages[1].id).toBeDefined();
      expect(bridge.sentMessages[0].id).not.toBe(bridge.sentMessages[1].id);
    });
  });
});
