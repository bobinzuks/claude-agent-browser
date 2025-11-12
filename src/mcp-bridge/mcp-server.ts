/**
 * MCP Server Implementation
 * Handles Model Context Protocol communication with Claude
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { EventEmitter } from 'events';
import { BrowserController } from './browser-controller.js';
import { FacebookMarketplaceTools, type BatchSearchParams } from './facebook-marketplace-tools.js';
import { AffiliateAutomationTools } from './affiliate-commands.js';

interface MCPServerConfig {
  name: string;
  version: string;
  browserConfig?: {
    headless?: boolean;
    userDataDir?: string;
    slowMo?: number;
  };
}

interface MCPRequest {
  type: string;
  id: string;
  [key: string]: unknown;
}

interface MCPResponse {
  type?: string;
  id: string;
  [key: string]: unknown;
}

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export class MCPServer extends EventEmitter {
  public readonly name: string;
  public readonly version: string;
  private server: Server;
  private transport: StdioServerTransport | null = null;
  private connected = false;
  private tools: Tool[];
  private browserController: BrowserController;
  private facebookTools: FacebookMarketplaceTools;
  private affiliateTools: AffiliateAutomationTools;

  constructor(config: MCPServerConfig) {
    super();
    this.name = config.name;
    this.version = config.version;

    // Initialize browser controller with optional config
    this.browserController = new BrowserController({
      headless: config.browserConfig?.headless ?? true,
      userDataDir: config.browserConfig?.userDataDir,
      slowMo: config.browserConfig?.slowMo,
    });

    // Initialize Facebook Marketplace tools
    this.facebookTools = new FacebookMarketplaceTools(this.browserController);

    // Initialize Affiliate Automation tools
    this.affiliateTools = new AffiliateAutomationTools(this.browserController);

    // Initialize MCP server
    this.server = new Server(
      {
        name: this.name,
        version: this.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Register default tools
    this.tools = this.registerTools();

    // Setup request handlers
    this.setupHandlers();
  }

  /**
   * Get server capabilities
   */
  public getCapabilities(): { tools: Record<string, unknown> } {
    return {
      tools: {},
    };
  }

  /**
   * Handle incoming MCP requests
   */
  public async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    switch (request.type) {
      case 'ping':
        return {
          type: 'pong',
          id: request.id,
        };

      case 'tools/list':
        return {
          id: request.id,
          tools: this.tools,
        };

      default:
        throw new Error(`Unknown request type: ${request.type}`);
    }
  }

  /**
   * Get registered tools
   */
  public getTools(): Tool[] {
    return this.tools;
  }

  /**
   * Execute a tool
   */
  public async executeTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<{ success: boolean; [key: string]: unknown }> {
    // Ensure browser is launched
    if (!this.browserController.isActive()) {
      await this.browserController.launch();
    }

    switch (name) {
      case 'navigate': {
        const result = await this.browserController.navigate(
          args.url as string,
          args.pageId as string | undefined
        );
        return result;
      }

      case 'fill_form': {
        const success = await this.browserController.fill(
          args.selector as string,
          args.value as string,
          args.pageId as string | undefined
        );
        return {
          success,
          selector: args.selector,
          value: args.value,
        };
      }

      case 'click_element': {
        const success = await this.browserController.click(
          args.selector as string,
          args.pageId as string | undefined
        );
        return {
          success,
          selector: args.selector,
        };
      }

      case 'execute_script': {
        const result = await this.browserController.executeScript(
          args.script as string,
          args.pageId as string | undefined,
          args.args as unknown[] | undefined
        );
        return {
          success: result.success,
          data: result.data,
          error: result.error,
        };
      }

      case 'screenshot': {
        const success = await this.browserController.screenshot(
          args.path as string,
          args.pageId as string | undefined
        );
        return {
          success,
          path: args.path,
        };
      }

      case 'wait_for_selector': {
        const success = await this.browserController.waitForSelector(
          args.selector as string,
          args.pageId as string | undefined,
          args.timeout as number | undefined
        );
        return {
          success,
          selector: args.selector,
        };
      }

      case 'new_page': {
        const pageId = await this.browserController.newPage();
        return {
          success: true,
          pageId,
        };
      }

      case 'close_page': {
        await this.browserController.closePage(args.pageId as string);
        return {
          success: true,
          pageId: args.pageId,
        };
      }

      case 'facebook_marketplace_batch_search': {
        const result = await this.facebookTools.batchSearch(args as unknown as BatchSearchParams);
        return result as unknown as { success: boolean; [key: string]: unknown };
      }

      // Affiliate Automation Tools
      case 'affiliate_detect_network': {
        const result = await this.affiliateTools.detectNetwork(args.url as string);
        return {
          success: true,
          ...result,
        };
      }

      case 'affiliate_extract_links': {
        const options = {
          maxLinks: args.maxLinks as number | undefined,
          filterByProduct: args.filterByProduct as string | undefined,
          minPrice: args.minPrice as number | undefined,
          maxPrice: args.maxPrice as number | undefined,
        };
        const result = await this.affiliateTools.extractLinks(
          args.pageId as string | undefined,
          options
        );
        return {
          success: true,
          ...result,
        };
      }

      case 'affiliate_assist_signup': {
        const result = await this.affiliateTools.assistSignup(
          args.networkId as string,
          args.userData as any,
          args.pageId as string | undefined
        );
        return {
          success: result.status !== 'error',
          ...result,
        };
      }

      case 'affiliate_check_compliance': {
        const result = await this.affiliateTools.checkCompliance(
          args.action as string,
          args.networkId as string,
          args.url as string | undefined
        );
        return {
          success: true,
          ...result,
        };
      }

      case 'affiliate_get_status': {
        const result = await this.affiliateTools.getNetworkStatus(
          args.networkId as string | undefined
        );
        return {
          success: true,
          ...result,
        };
      }

      case 'affiliate_generate_link': {
        const result = await this.affiliateTools.generateDeepLink(
          args.targetUrl as string,
          args.networkId as string,
          args.affiliateId as string | undefined
        );
        if (result) {
          return {
            success: true,
            ...result,
          };
        } else {
          return {
            success: false,
            error: 'Failed to generate deep link',
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Connect to stdio transport
   */
  public async connect(transportType: string): Promise<boolean> {
    if (transportType !== 'stdio') {
      throw new Error(`Unsupported transport: ${transportType}`);
    }

    this.transport = new StdioServerTransport();
    await this.server.connect(this.transport);
    this.connected = true;
    this.emit('connected');
    return true;
  }

  /**
   * Check if server is connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Close server connection
   */
  public async close(): Promise<void> {
    // Close browser first
    if (this.browserController.isActive()) {
      await this.browserController.close();
    }

    if (this.transport) {
      await this.server.close();
      this.connected = false;
      this.transport = null;
    }
  }

  /**
   * Register automation tools
   */
  private registerTools(): Tool[] {
    const tools: Tool[] = [
      {
        name: 'navigate',
        description: 'Navigate to a URL in the browser',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to navigate to',
            },
            pageId: {
              type: 'string',
              description: 'Optional page ID to navigate',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'fill_form',
        description: 'Fill a form field',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector for the form field',
            },
            value: {
              type: 'string',
              description: 'Value to fill',
            },
            pageId: {
              type: 'string',
              description: 'Optional page ID',
            },
          },
          required: ['selector', 'value'],
        },
      },
      {
        name: 'click_element',
        description: 'Click an element',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector for the element',
            },
            pageId: {
              type: 'string',
              description: 'Optional page ID',
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'execute_script',
        description: 'Execute JavaScript in the page context',
        inputSchema: {
          type: 'object',
          properties: {
            script: {
              type: 'string',
              description: 'JavaScript code to execute',
            },
            args: {
              type: 'array',
              description: 'Optional arguments to pass to the script',
            },
            pageId: {
              type: 'string',
              description: 'Optional page ID',
            },
          },
          required: ['script'],
        },
      },
      {
        name: 'screenshot',
        description: 'Take a screenshot of the current page',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to save the screenshot',
            },
            pageId: {
              type: 'string',
              description: 'Optional page ID',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'wait_for_selector',
        description: 'Wait for an element to appear',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector to wait for',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds (default: 10000)',
            },
            pageId: {
              type: 'string',
              description: 'Optional page ID',
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'new_page',
        description: 'Create a new browser page and return its ID',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'close_page',
        description: 'Close a specific browser page',
        inputSchema: {
          type: 'object',
          properties: {
            pageId: {
              type: 'string',
              description: 'Page ID to close',
            },
          },
          required: ['pageId'],
        },
      },
      {
        name: 'facebook_marketplace_batch_search',
        description:
          'Search Facebook Marketplace across multiple locations in parallel (optimized for DealBot)',
        inputSchema: {
          type: 'object',
          properties: {
            product: {
              type: 'string',
              description: 'Product name to search for',
            },
            locations: {
              type: 'array',
              description: 'List of locations to search',
              items: {
                type: 'object',
                properties: {
                  city: { type: 'string' },
                  state: { type: 'string' },
                  province: { type: 'string' },
                },
                required: ['city'],
              },
            },
            maxListingsPerLocation: {
              type: 'number',
              description: 'Maximum listings per location (default: 10)',
            },
            parallel: {
              type: 'boolean',
              description: 'Enable parallel processing (default: true)',
            },
            maxConcurrent: {
              type: 'number',
              description: 'Maximum concurrent searches (default: 5)',
            },
          },
          required: ['product', 'locations'],
        },
      },
      // Affiliate Automation Tools
      {
        name: 'affiliate_detect_network',
        description: 'Detect which affiliate network a URL belongs to and get its ToS compliance level',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to analyze for affiliate network detection',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'affiliate_extract_links',
        description: 'Extract affiliate links from the current page with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            pageId: {
              type: 'string',
              description: 'Optional page ID to extract links from',
            },
            maxLinks: {
              type: 'number',
              description: 'Maximum number of links to extract (default: 50)',
            },
            filterByProduct: {
              type: 'string',
              description: 'Optional product name filter',
            },
            minPrice: {
              type: 'number',
              description: 'Optional minimum price filter',
            },
            maxPrice: {
              type: 'number',
              description: 'Optional maximum price filter',
            },
          },
        },
      },
      {
        name: 'affiliate_assist_signup',
        description: 'Assist with affiliate network signup by auto-filling non-sensitive fields (requires human input for sensitive data)',
        inputSchema: {
          type: 'object',
          properties: {
            networkId: {
              type: 'string',
              description: 'Affiliate network ID (e.g., "shareASale", "cj", "impact")',
            },
            userData: {
              type: 'object',
              description: 'User data for form filling',
              properties: {
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                company: { type: 'string' },
                website: { type: 'string' },
                phone: { type: 'string' },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip: { type: 'string' },
                    country: { type: 'string' },
                  },
                },
              },
            },
            pageId: {
              type: 'string',
              description: 'Optional page ID',
            },
          },
          required: ['networkId', 'userData'],
        },
      },
      {
        name: 'affiliate_check_compliance',
        description: 'Check if an automation action is compliant with the network\'s ToS',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description: 'Action to check (e.g., "auto_signup", "extract_links", "auto_submit")',
            },
            networkId: {
              type: 'string',
              description: 'Affiliate network ID',
            },
            url: {
              type: 'string',
              description: 'Optional URL for additional context',
            },
          },
          required: ['action', 'networkId'],
        },
      },
      {
        name: 'affiliate_get_status',
        description: 'Get status of affiliate networks including signup progress and link counts',
        inputSchema: {
          type: 'object',
          properties: {
            networkId: {
              type: 'string',
              description: 'Optional network ID to filter results',
            },
          },
        },
      },
      {
        name: 'affiliate_generate_link',
        description: 'Generate an affiliate tracking deep link for a target URL',
        inputSchema: {
          type: 'object',
          properties: {
            targetUrl: {
              type: 'string',
              description: 'Target URL to convert to affiliate link',
            },
            networkId: {
              type: 'string',
              description: 'Affiliate network ID',
            },
            affiliateId: {
              type: 'string',
              description: 'Optional affiliate ID for tracking',
            },
          },
          required: ['targetUrl', 'networkId'],
        },
      },
    ];

    return tools;
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // Handle tool list requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools,
    }));

    // Handle tool execution requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const result = await this.executeTool(name, args || {});
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      };
    });
  }
}
