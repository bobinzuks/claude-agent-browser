import { Page, CDPSession, BrowserContext } from 'playwright';

/**
 * Accessibility Automation Engine
 *
 * Uses Chrome DevTools Protocol Accessibility domain for undetectable automation.
 *
 * Strategy:
 * 1. Query elements via CDP Accessibility (semantic, role-based)
 * 2. Convert backendNodeId to Playwright selector
 * 3. Click via Playwright native API (avoids detectable Input.dispatchMouseEvent)
 *
 * Benefits:
 * - Works on any IP (datacenter, residential, Tor)
 * - Mirrors screen reader behavior (legitimate use case)
 * - Less detectable than standard automation
 * - Semantic element selection more robust than CSS selectors
 *
 * Detection Mitigation:
 * - Uses Accessibility.enable (less monitored than Runtime.enable)
 * - Disables accessibility after queries (reduces performance signature)
 * - Avoids Input.dispatchMouseEvent (has fake screenX/screenY detection)
 * - Uses Playwright native clicks (real mouse events)
 */

export interface AXNode {
  nodeId: string;
  ignored: boolean;
  role?: { value: string };
  name?: { value: string };
  description?: { value: string };
  value?: { value: string };
  backendDOMNodeId?: number;
  frameId?: string;
  childIds?: string[];
  parentId?: string;
  properties?: Array<{
    name: string;
    value: { value: any };
  }>;
}

export interface AccessibilityQueryOptions {
  /** Accessible name to search for (e.g., "Sign in", "Submit") */
  accessibleName?: string;

  /** Role to search for (e.g., "button", "textbox", "link") */
  role?: string;

  /** Search within specific DOM node (optional) */
  nodeId?: number;

  /** Include ignored nodes in results (default: false) */
  includeIgnored?: boolean;
}

export interface AccessibilityElementInfo {
  /** Accessibility tree node */
  axNode: AXNode;

  /** Playwright selector (best effort) */
  selector: string;

  /** CDP object ID (for advanced operations) */
  objectId?: string;
}

/**
 * Accessibility Automation Engine
 *
 * Core automation layer using CDP Accessibility API for stealth.
 */
export class AccessibilityAutomationEngine {
  private cdpSession: CDPSession | null = null;
  private page: Page;
  private context: BrowserContext;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
  }

  /**
   * Initialize CDP session for accessibility queries
   */
  async init(): Promise<void> {
    if (!this.cdpSession) {
      this.cdpSession = await this.context.newCDPSession(this.page);
    }
  }

  /**
   * Clean up CDP session
   */
  async close(): Promise<void> {
    if (this.cdpSession) {
      try {
        await this.cdpSession.send('Accessibility.disable');
      } catch (e) {
        // Ignore errors on cleanup
      }
      await this.cdpSession.detach();
      this.cdpSession = null;
    }
  }

  /**
   * Query accessibility tree for elements matching criteria
   *
   * @param options Query options (name, role, etc.)
   * @returns Array of matching accessibility nodes
   */
  async queryAccessibilityTree(
    options: AccessibilityQueryOptions
  ): Promise<AXNode[]> {
    if (!this.cdpSession) {
      await this.init();
    }

    // Enable accessibility domain (required for queries)
    await this.cdpSession!.send('Accessibility.enable');

    try {
      // If no nodeId specified, query entire document
      // We need to provide EITHER nodeId OR use getFullAXTree then filter
      let nodesToSearch: AXNode[];

      if (options.nodeId) {
        // Query from specific node
        const result: any = await this.cdpSession!.send('Accessibility.queryAXTree', {
          nodeId: options.nodeId,
          ...(options.accessibleName && { accessibleName: options.accessibleName }),
          ...(options.role && { role: options.role }),
        });
        nodesToSearch = (result.nodes || []) as AXNode[];
      } else {
        // Get full tree and filter (more expensive but works)
        const result: any = await this.cdpSession!.send('Accessibility.getFullAXTree');
        const allNodes = (result.nodes || []) as AXNode[];

        // Filter by accessible name and role
        nodesToSearch = allNodes.filter(node => {
          if (options.accessibleName && node.name?.value !== options.accessibleName) {
            return false;
          }
          if (options.role && node.role?.value !== options.role) {
            return false;
          }
          return true;
        });
      }

      // Filter out ignored nodes unless explicitly requested
      if (!options.includeIgnored) {
        return nodesToSearch.filter(node => !node.ignored);
      }

      return nodesToSearch;
    } finally {
      // Disable immediately to reduce performance signature
      await this.cdpSession!.send('Accessibility.disable');
    }
  }

  /**
   * Get full accessibility tree (expensive, use sparingly)
   *
   * @param depth Maximum depth to traverse (omit for full tree)
   * @returns Array of all accessibility nodes
   */
  async getFullAccessibilityTree(depth?: number): Promise<AXNode[]> {
    if (!this.cdpSession) {
      await this.init();
    }

    await this.cdpSession!.send('Accessibility.enable');

    try {
      const result: any = await this.cdpSession!.send('Accessibility.getFullAXTree', {
        ...(depth && { depth }),
      });

      return (result.nodes || []) as AXNode[];
    } finally {
      await this.cdpSession!.send('Accessibility.disable');
    }
  }

  /**
   * Convert backendNodeId to Playwright-compatible selector
   *
   * Strategy:
   * 1. Resolve backendNodeId to DOM objectId
   * 2. Get element attributes via Runtime.getProperties
   * 3. Build selector from accessible name, role, or attributes
   *
   * @param backendNodeId Backend DOM node ID from accessibility tree
   * @param axNode Accessibility node (for fallback selector construction)
   * @returns Playwright selector
   */
  async resolveSelector(
    backendNodeId: number,
    axNode: AXNode
  ): Promise<string> {
    if (!this.cdpSession) {
      await this.init();
    }

    try {
      // Resolve backendNodeId to Runtime object
      const { object }: any = await this.cdpSession!.send('DOM.resolveNode', {
        backendNodeId,
      });

      // Get element properties
      const { result: properties }: any = await this.cdpSession!.send(
        'Runtime.getProperties',
        {
          objectId: object.objectId,
          ownProperties: true,
        }
      );

      // Extract useful attributes for selector building
      const tagName = properties.find((p: any) => p.name === 'tagName')?.value?.value?.toLowerCase();
      const id = properties.find((p: any) => p.name === 'id')?.value?.value;
      const className = properties.find((p: any) => p.name === 'className')?.value?.value;

      // Build selector priority:
      // 1. ID (most specific)
      if (id) {
        return `#${id}`;
      }

      // 2. Accessible name + role (semantic, robust)
      const accessibleName = axNode.name?.value;
      const role = axNode.role?.value;

      if (accessibleName && role) {
        if (role === 'button') {
          return `button:has-text("${this.escapeText(accessibleName)}")`;
        }
        if (role === 'link') {
          return `a:has-text("${this.escapeText(accessibleName)}")`;
        }
        if (role === 'textbox') {
          return `input[aria-label="${this.escapeText(accessibleName)}"]`;
        }
      }

      // 3. ARIA label (if present)
      const ariaLabel = properties.find((p: any) => p.name === 'ariaLabel')?.value?.value;
      if (ariaLabel && tagName) {
        return `${tagName}[aria-label="${this.escapeText(ariaLabel)}"]`;
      }

      // 4. Class + accessible name
      if (className && accessibleName && tagName) {
        return `${tagName}.${className.split(' ')[0]}:has-text("${this.escapeText(accessibleName)}")`;
      }

      // 5. Fallback: tag + accessible name
      if (tagName && accessibleName) {
        return `${tagName}:has-text("${this.escapeText(accessibleName)}")`;
      }

      // 6. Last resort: tag + class
      if (tagName && className) {
        return `${tagName}.${className.split(' ')[0]}`;
      }

      // 7. Very last resort: just tag name
      return tagName || '*';
    } catch (error) {
      console.warn('Failed to resolve selector for backendNodeId', backendNodeId, error);

      // Fallback to accessibility name if available
      if (axNode.name?.value) {
        return `*:has-text("${this.escapeText(axNode.name.value)}")`;
      }

      throw new Error(`Cannot resolve selector for node: ${axNode.nodeId}`);
    }
  }

  /**
   * Find element by accessible name and role, return info for clicking
   *
   * @param accessibleName Accessible name (e.g., "Sign in")
   * @param role Role (e.g., "button", "link")
   * @returns Element info with selector for clicking
   */
  async findElement(
    accessibleName: string,
    role?: string
  ): Promise<AccessibilityElementInfo | null> {
    const nodes = await this.queryAccessibilityTree({
      accessibleName,
      role,
    });

    if (nodes.length === 0) {
      return null;
    }

    // Take first non-ignored node
    const axNode = nodes[0];

    if (!axNode.backendDOMNodeId) {
      console.warn('Node has no backendDOMNodeId:', axNode);
      return null;
    }

    // Resolve to Playwright selector
    const selector = await this.resolveSelector(axNode.backendDOMNodeId, axNode);

    return {
      axNode,
      selector,
    };
  }

  /**
   * Find and click element by accessible name and role
   *
   * Uses hybrid approach:
   * 1. Find via CDP Accessibility (semantic, robust)
   * 2. Click via Playwright (real mouse events, undetectable)
   *
   * @param accessibleName Accessible name to search for
   * @param role Role to filter by (optional)
   * @returns True if clicked successfully
   */
  async clickByAccessibleName(
    accessibleName: string,
    role?: string
  ): Promise<boolean> {
    const elementInfo = await this.findElement(accessibleName, role);

    if (!elementInfo) {
      console.warn(`Element not found: ${accessibleName} (${role || 'any role'})`);
      return false;
    }

    try {
      console.log(`🎯 Clicking element via accessibility: "${accessibleName}" using selector: ${elementInfo.selector}`);

      // Use Playwright's native click (real mouse events)
      await this.page.click(elementInfo.selector, {
        timeout: 5000,
      });

      console.log(`✅ Successfully clicked: "${accessibleName}"`);
      return true;
    } catch (error) {
      console.error(`Failed to click element "${accessibleName}":`, error);
      return false;
    }
  }

  /**
   * Find and fill textbox by accessible name
   *
   * @param accessibleName Accessible name of textbox
   * @param text Text to fill
   * @returns True if filled successfully
   */
  async fillByAccessibleName(
    accessibleName: string,
    text: string
  ): Promise<boolean> {
    const elementInfo = await this.findElement(accessibleName, 'textbox');

    if (!elementInfo) {
      console.warn(`Textbox not found: ${accessibleName}`);
      return false;
    }

    try {
      console.log(`✏️  Filling textbox via accessibility: "${accessibleName}"`);

      // Use Playwright's native fill (realistic typing)
      await this.page.fill(elementInfo.selector, text, {
        timeout: 5000,
      });

      console.log(`✅ Successfully filled: "${accessibleName}"`);
      return true;
    } catch (error) {
      console.error(`Failed to fill textbox "${accessibleName}":`, error);
      return false;
    }
  }

  /**
   * Debug: Print all interactive elements in accessibility tree
   *
   * Useful for discovering accessible names and roles on a page.
   */
  async debugPrintInteractiveElements(): Promise<void> {
    console.log('\n🔍 DEBUG: Interactive Elements in Accessibility Tree\n');
    console.log('═'.repeat(80));

    const nodes = await this.getFullAccessibilityTree();

    // Filter to interactive roles
    const interactiveRoles = ['button', 'link', 'textbox', 'searchbox', 'checkbox', 'radio', 'combobox', 'menuitem', 'tab'];

    const interactiveNodes = nodes.filter(node =>
      !node.ignored &&
      node.role?.value &&
      interactiveRoles.includes(node.role.value)
    );

    console.log(`Found ${interactiveNodes.length} interactive elements:\n`);

    for (const node of interactiveNodes) {
      const role = node.role?.value || 'unknown';
      const name = node.name?.value || '(no name)';
      const description = node.description?.value || '';

      console.log(`  📍 ${role.toUpperCase()}: "${name}"`);
      if (description) {
        console.log(`     Description: "${description}"`);
      }
      console.log('');
    }

    console.log('═'.repeat(80) + '\n');
  }

  /**
   * Escape text for use in selectors
   */
  private escapeText(text: string): string {
    return text.replace(/"/g, '\\"').replace(/\n/g, ' ').trim();
  }
}

/**
 * Create and initialize AccessibilityAutomationEngine
 *
 * @param page Playwright page
 * @param context Browser context
 * @returns Initialized engine
 */
export async function createAccessibilityEngine(
  page: Page,
  context: BrowserContext
): Promise<AccessibilityAutomationEngine> {
  const engine = new AccessibilityAutomationEngine(page, context);
  await engine.init();
  return engine;
}
