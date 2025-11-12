/**
 * Selector Generator - Creates stable, unique CSS selectors for elements
 *
 * Priority order:
 * 1. ID (if stable and unique)
 * 2. Name attribute
 * 3. Data attributes (data-testid, data-id, etc.)
 * 4. Stable class combinations
 * 5. Semantic tag + attributes
 * 6. Position-based (last resort)
 */

export interface SelectorOptions {
  /**
   * Maximum selector length
   */
  maxLength?: number;

  /**
   * Whether to include nth-child as last resort
   */
  includeNthChild?: boolean;

  /**
   * Preferred data attributes to use
   */
  preferredDataAttributes?: string[];
}

const DEFAULT_OPTIONS: Required<SelectorOptions> = {
  maxLength: 200,
  includeNthChild: true,
  preferredDataAttributes: [
    'data-testid',
    'data-test',
    'data-id',
    'data-cy',
    'data-automation-id',
    'data-tracking-id'
  ]
};

/**
 * Patterns to identify unstable selectors
 */
const UNSTABLE_PATTERNS = {
  // Dynamic IDs with timestamps or random numbers
  dynamicId: /\d{10,}|[a-f0-9]{8,}|uid|uuid|temp|tmp/i,

  // CSS framework classes that change frequently
  frameworkClasses: /^(css-|jsx-|sc-|makeStyles|MuiBox|jss\d+)/,

  // Dynamic state classes
  stateClasses: /^(is-|has-|active-|selected-|hover-|focus-)/,

  // Utility classes that are too generic
  genericClasses: /^(container|wrapper|content|item|box|div|span|text|btn)$/i
};

/**
 * Generate a stable CSS selector for an element
 */
export function generateSelector(
  element: HTMLElement,
  options: SelectorOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Try strategies in order of preference
  const strategies = [
    tryIdSelector,
    tryNameSelector,
    tryDataAttributeSelector,
    tryAriaLabelSelector,
    tryStableClassSelector,
    trySemanticSelector,
    tryPositionalSelector
  ];

  for (const strategy of strategies) {
    const selector = strategy(element, opts);
    if (selector && isValidSelector(selector, element)) {
      // Verify uniqueness
      if (isSelectorUnique(selector, element)) {
        return selector;
      }
    }
  }

  // Fallback: generate a path-based selector
  return generatePathSelector(element, opts);
}

/**
 * Try to use ID selector
 */
function tryIdSelector(element: HTMLElement, _opts: Required<SelectorOptions>): string | null {
  const id = element.id;
  if (!id) return null;

  // Check if ID looks stable
  if (UNSTABLE_PATTERNS.dynamicId.test(id)) {
    return null;
  }

  return `#${CSS.escape(id)}`;
}

/**
 * Try to use name attribute selector
 */
function tryNameSelector(element: HTMLElement, _opts: Required<SelectorOptions>): string | null {
  const name = element.getAttribute('name');
  if (!name) return null;

  const tagName = element.tagName.toLowerCase();
  return `${tagName}[name="${CSS.escape(name)}"]`;
}

/**
 * Try to use data attribute selector
 */
function tryDataAttributeSelector(
  element: HTMLElement,
  opts: Required<SelectorOptions>
): string | null {
  // Try preferred data attributes first
  for (const attr of opts.preferredDataAttributes) {
    const value = element.getAttribute(attr);
    if (value) {
      return `[${attr}="${CSS.escape(value)}"]`;
    }
  }

  // Try any data attribute
  const dataAttrs = Array.from(element.attributes).filter(attr =>
    attr.name.startsWith('data-') &&
    !UNSTABLE_PATTERNS.dynamicId.test(attr.value)
  );

  if (dataAttrs.length > 0) {
    const attr = dataAttrs[0];
    return `[${attr.name}="${CSS.escape(attr.value)}"]`;
  }

  return null;
}

/**
 * Try to use aria-label selector
 */
function tryAriaLabelSelector(
  element: HTMLElement,
  _opts: Required<SelectorOptions>
): string | null {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    const tagName = element.tagName.toLowerCase();
    return `${tagName}[aria-label="${CSS.escape(ariaLabel)}"]`;
  }

  return null;
}

/**
 * Try to use stable class combinations
 */
function tryStableClassSelector(
  element: HTMLElement,
  _opts: Required<SelectorOptions>
): string | null {
  const classes = Array.from(element.classList).filter(isStableClass);

  if (classes.length === 0) return null;

  const tagName = element.tagName.toLowerCase();

  // Try single class first
  if (classes.length === 1) {
    return `${tagName}.${CSS.escape(classes[0])}`;
  }

  // Try combination of first 2-3 stable classes
  const classCombo = classes.slice(0, 3).map(c => `.${CSS.escape(c)}`).join('');
  return `${tagName}${classCombo}`;
}

/**
 * Try to use semantic selector with attributes
 */
function trySemanticSelector(
  element: HTMLElement,
  _opts: Required<SelectorOptions>
): string | null {
  const tagName = element.tagName.toLowerCase();

  // For form elements, use type attribute
  if (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) {
    const type = element.type;
    if (type) {
      // Add additional attributes for specificity
      const additionalAttrs: string[] = [];

      const placeholder = element.getAttribute('placeholder');
      if (placeholder && !UNSTABLE_PATTERNS.dynamicId.test(placeholder)) {
        additionalAttrs.push(`[placeholder="${CSS.escape(placeholder)}"]`);
      }

      const value = element.getAttribute('value');
      if (value && value.length < 50 && !UNSTABLE_PATTERNS.dynamicId.test(value)) {
        additionalAttrs.push(`[value="${CSS.escape(value)}"]`);
      }

      if (additionalAttrs.length > 0) {
        return `${tagName}[type="${type}"]${additionalAttrs.join('')}`;
      }

      return `${tagName}[type="${type}"]`;
    }
  }

  // For links, use href or text content
  if (element instanceof HTMLAnchorElement) {
    const href = element.getAttribute('href');
    if (href && !href.startsWith('javascript:') && href.length < 100) {
      return `a[href="${CSS.escape(href)}"]`;
    }

    const text = element.textContent?.trim();
    if (text && text.length < 50 && text.length > 0) {
      return `a:contains("${text}")`;
    }
  }

  // For buttons, use text content
  if (element instanceof HTMLButtonElement) {
    const text = element.textContent?.trim();
    if (text && text.length < 50 && text.length > 0) {
      // Note: :contains is not standard CSS, need to use alternative
      return `button[type="${element.type}"]`;
    }
  }

  return null;
}

/**
 * Try to use positional selector (last resort)
 */
function tryPositionalSelector(
  element: HTMLElement,
  opts: Required<SelectorOptions>
): string | null {
  if (!opts.includeNthChild) return null;

  const parent = element.parentElement;
  if (!parent) return null;

  const siblings = Array.from(parent.children).filter(
    child => child.tagName === element.tagName
  );

  const index = siblings.indexOf(element);
  if (index === -1) return null;

  const tagName = element.tagName.toLowerCase();
  const parentSelector = parent.id
    ? `#${CSS.escape(parent.id)}`
    : parent.tagName.toLowerCase();

  return `${parentSelector} > ${tagName}:nth-child(${index + 1})`;
}

/**
 * Generate a path-based selector from root to element
 */
function generatePathSelector(
  element: HTMLElement,
  opts: Required<SelectorOptions>
): string {
  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    // Add ID if available and stable
    if (current.id && !UNSTABLE_PATTERNS.dynamicId.test(current.id)) {
      selector = `#${CSS.escape(current.id)}`;
      path.unshift(selector);
      break;
    }

    // Add stable classes
    const stableClasses = Array.from(current.classList)
      .filter(isStableClass)
      .slice(0, 2);

    if (stableClasses.length > 0) {
      selector += stableClasses.map(c => `.${CSS.escape(c)}`).join('');
    } else if (opts.includeNthChild) {
      // Add nth-child as last resort
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          child => child.tagName === current!.tagName
        );
        const index = siblings.indexOf(current);
        if (index !== -1 && siblings.length > 1) {
          selector += `:nth-child(${index + 1})`;
        }
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

/**
 * Check if a class name is stable
 */
function isStableClass(className: string): boolean {
  if (!className) return false;

  // Filter out unstable patterns
  if (UNSTABLE_PATTERNS.frameworkClasses.test(className)) {
    return false;
  }

  if (UNSTABLE_PATTERNS.stateClasses.test(className)) {
    return false;
  }

  if (UNSTABLE_PATTERNS.genericClasses.test(className)) {
    return false;
  }

  // Filter out classes with random characters
  if (/[a-f0-9]{8,}/i.test(className)) {
    return false;
  }

  return true;
}

/**
 * Validate that a selector is syntactically correct
 */
function isValidSelector(selector: string, _element: HTMLElement): boolean {
  try {
    document.querySelector(selector);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if a selector uniquely identifies the element
 */
function isSelectorUnique(selector: string, element: HTMLElement): boolean {
  try {
    const matches = document.querySelectorAll(selector);
    return matches.length === 1 && matches[0] === element;
  } catch (e) {
    return false;
  }
}

/**
 * Get a human-readable description of the element
 */
export function getElementDescription(element: HTMLElement): string {
  // Try to get text content
  const text = element.textContent?.trim();
  if (text && text.length > 0 && text.length < 50) {
    return text;
  }

  // Try to get aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel;
  }

  // Try to get placeholder
  const placeholder = element.getAttribute('placeholder');
  if (placeholder) {
    return placeholder;
  }

  // Try to get name
  const name = element.getAttribute('name');
  if (name) {
    return name;
  }

  // Try to get id
  const id = element.id;
  if (id && !UNSTABLE_PATTERNS.dynamicId.test(id)) {
    return id;
  }

  // Try to get alt (for images)
  const alt = element.getAttribute('alt');
  if (alt) {
    return alt;
  }

  // Try to get title
  const title = element.getAttribute('title');
  if (title) {
    return title;
  }

  // Fallback to tag name
  return element.tagName.toLowerCase();
}

/**
 * Get element type classification
 */
export function getElementType(element: HTMLElement): string {
  const tagName = element.tagName.toLowerCase();

  if (element instanceof HTMLButtonElement) {
    return 'button';
  }

  if (element instanceof HTMLInputElement) {
    return element.type || 'input';
  }

  if (element instanceof HTMLSelectElement) {
    return 'select';
  }

  if (element instanceof HTMLTextAreaElement) {
    return 'textarea';
  }

  if (element instanceof HTMLAnchorElement) {
    return 'link';
  }

  if (tagName === 'form') {
    return 'form';
  }

  // Check for clickable role
  const role = element.getAttribute('role');
  if (role === 'button' || role === 'link') {
    return role;
  }

  return tagName;
}

/**
 * Verify selector still works (for validation during replay)
 */
export function verifySelectorExists(selector: string): boolean {
  try {
    const element = document.querySelector(selector);
    return element !== null;
  } catch (e) {
    return false;
  }
}

/**
 * Find element by selector with fallback strategies
 */
export function findElementBySelector(selector: string): HTMLElement | null {
  try {
    // Try exact selector first
    const element = document.querySelector(selector);
    if (element instanceof HTMLElement) {
      return element;
    }

    // Try with relaxed matching (remove nth-child)
    const relaxedSelector = selector.replace(/:nth-child\(\d+\)/g, '');
    if (relaxedSelector !== selector) {
      const relaxedElement = document.querySelector(relaxedSelector);
      if (relaxedElement instanceof HTMLElement) {
        return relaxedElement;
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}
