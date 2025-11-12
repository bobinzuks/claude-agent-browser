#!/usr/bin/env node
/**
 * MCP Bridge Entry Point
 * Starts the MCP stdio server for Claude Code integration
 */

import { MCPServer } from './mcp-server.js';

async function main(): Promise<void> {
  const server = new MCPServer({
    name: 'claude-agent-browser',
    version: '1.0.0',
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });

  // Connect to stdio
  try {
    await server.connect('stdio');
    console.error('MCP Server started on stdio');
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
