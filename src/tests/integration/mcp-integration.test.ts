/**
 * MCP Integration Tests
 * Tests MCP server with actual request handling
 */

import { MCPServer } from '../../mcp-bridge/mcp-server';

describe('MCP Integration', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer({
      name: 'test-server',
      version: '1.0.0',
    });
  });

  afterEach(async () => {
    await server.close();
  });

  // Skip stdio connection test - requires actual process
  it.skip('should handle full request/response cycle', async () => {
    // Skipped - requires actual stdio process
  });

  it('should list all available tools', () => {
    const tools = server.getTools();
    expect(tools.length).toBeGreaterThan(0);
    tools.forEach((tool) => {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
    });
  });

  it('should handle requests without connection', async () => {
    const response = await server.handleRequest({
      type: 'ping',
      id: 'test-123',
    });
    expect(response).toHaveProperty('type', 'pong');
  });
});
