/**
 * Visual Guidance System for Human-in-Loop Workflows
 * Provides visual cues and guidance for human interaction during signup processes
 */

/**
 * Checklist Item Interface
 */
export interface ChecklistItem {
  label: string;
  completed: boolean;
  isSensitive: boolean;
}

/**
 * Arrow Guide Options
 */
interface ArrowOptions {
  position?: 'top' | 'right' | 'bottom' | 'left';
  color?: string;
  size?: number;
  offset?: number;
}

/**
 * Permission Dialog Options
 */
interface PermissionOptions {
  confirmText?: string;
  cancelText?: string;
  timeout?: number;
}

/**
 * Base class for visual components with Shadow DOM isolation
 */
abstract class ShadowComponent {
  protected shadowHost: HTMLDivElement;
  protected shadowRoot: ShadowRoot;
  protected container: HTMLDivElement;

  constructor(hostId: string) {
    // Create shadow host
    this.shadowHost = document.createElement('div');
    this.shadowHost.id = hostId;
    this.shadowHost.style.cssText = 'all: initial; position: fixed; z-index: 999999;';

    // Attach shadow DOM
    this.shadowRoot = this.shadowHost.attachShadow({ mode: 'open' });

    // Create container
    this.container = document.createElement('div');
    this.shadowRoot.appendChild(this.container);

    // Inject styles
    this.injectStyles();
  }

  protected abstract injectStyles(): void;

  protected mount(): void {
    if (!document.body.contains(this.shadowHost)) {
      document.body.appendChild(this.shadowHost);
    }
  }

  protected unmount(): void {
    if (document.body.contains(this.shadowHost)) {
      document.body.removeChild(this.shadowHost);
    }
  }

  public destroy(): void {
    this.unmount();
  }
}

/**
 * Arrow Guide Component
 * Points to the next action element with animated arrow
 */
export class ArrowGuide extends ShadowComponent {
  private arrow: HTMLDivElement | null = null;
  private message: HTMLDivElement | null = null;
  private animationFrameId: number | null = null;

  constructor() {
    super('visual-guide-arrow');
  }

  protected injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .arrow-container {
        position: absolute;
        pointer-events: none;
        z-index: 999999;
        animation: slideIn 0.3s ease-out;
      }

      .arrow {
        width: 0;
        height: 0;
        border-style: solid;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        animation: pulse 2s ease-in-out infinite;
      }

      .arrow-top {
        border-width: 0 20px 30px 20px;
        border-color: transparent transparent var(--arrow-color) transparent;
      }

      .arrow-right {
        border-width: 20px 0 20px 30px;
        border-color: transparent transparent transparent var(--arrow-color);
      }

      .arrow-bottom {
        border-width: 30px 20px 0 20px;
        border-color: var(--arrow-color) transparent transparent transparent;
      }

      .arrow-left {
        border-width: 20px 30px 20px 0;
        border-color: transparent var(--arrow-color) transparent transparent;
      }

      .message {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 250px;
        line-height: 1.4;
        animation: slideIn 0.3s ease-out;
        margin: 10px;
      }

      .message::before {
        content: '👉 ';
        margin-right: 4px;
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  /**
   * Show arrow pointing to an element
   */
  public showArrow(
    element: HTMLElement,
    messageText: string,
    options: ArrowOptions = {}
  ): void {
    const {
      position = 'top',
      color = '#667eea',
      // size = 30,
      offset = 20
    } = options;

    // Clean up existing arrow
    this.hideArrow();

    // Get element position
    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Create arrow container
    this.arrow = document.createElement('div');
    this.arrow.className = 'arrow-container';
    this.arrow.style.setProperty('--arrow-color', color);

    // Create arrow element
    const arrowElement = document.createElement('div');
    arrowElement.className = `arrow arrow-${position}`;

    // Create message element
    this.message = document.createElement('div');
    this.message.className = 'message';
    this.message.textContent = messageText;

    // Position arrow and message based on direction
    let arrowLeft = 0;
    let arrowTop = 0;

    switch (position) {
      case 'top':
        arrowLeft = rect.left + rect.width / 2 - 20 + scrollX;
        arrowTop = rect.top - offset - 30 + scrollY;
        this.message.style.cssText = `
          position: absolute;
          left: ${rect.left + rect.width / 2 - 125 + scrollX}px;
          top: ${rect.top - offset - 80 + scrollY}px;
        `;
        break;
      case 'right':
        arrowLeft = rect.right + offset + scrollX;
        arrowTop = rect.top + rect.height / 2 - 20 + scrollY;
        this.message.style.cssText = `
          position: absolute;
          left: ${rect.right + offset + 40 + scrollX}px;
          top: ${rect.top + rect.height / 2 - 25 + scrollY}px;
        `;
        break;
      case 'bottom':
        arrowLeft = rect.left + rect.width / 2 - 20 + scrollX;
        arrowTop = rect.bottom + offset + scrollY;
        this.message.style.cssText = `
          position: absolute;
          left: ${rect.left + rect.width / 2 - 125 + scrollX}px;
          top: ${rect.bottom + offset + 40 + scrollY}px;
        `;
        break;
      case 'left':
        arrowLeft = rect.left - offset - 30 + scrollX;
        arrowTop = rect.top + rect.height / 2 - 20 + scrollY;
        this.message.style.cssText = `
          position: absolute;
          left: ${rect.left - offset - 280 + scrollX}px;
          top: ${rect.top + rect.height / 2 - 25 + scrollY}px;
        `;
        break;
    }

    this.arrow.style.left = `${arrowLeft}px`;
    this.arrow.style.top = `${arrowTop}px`;

    // Append elements
    this.arrow.appendChild(arrowElement);
    this.container.appendChild(this.arrow);
    this.container.appendChild(this.message);

    // Mount to DOM
    this.mount();

    // Start pulse animation
    this.animatePulse();

    // Highlight the target element
    this.highlightElement(element);
  }

  /**
   * Hide arrow
   */
  public hideArrow(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.arrow) {
      this.arrow.remove();
      this.arrow = null;
    }

    if (this.message) {
      this.message.remove();
      this.message = null;
    }

    this.removeHighlight();
  }

  /**
   * Animate pulse effect
   */
  public animatePulse(): void {
    if (!this.arrow) return;

    let scale = 1;
    let growing = true;

    const animate = () => {
      if (!this.arrow) return;

      if (growing) {
        scale += 0.005;
        if (scale >= 1.1) growing = false;
      } else {
        scale -= 0.005;
        if (scale <= 1) growing = true;
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Highlight target element
   */
  private highlightElement(element: HTMLElement): void {
    element.style.outline = '3px solid #667eea';
    element.style.outlineOffset = '2px';
    element.style.transition = 'outline 0.3s ease';
    element.setAttribute('data-visual-guide-highlight', 'true');
  }

  /**
   * Remove highlight from element
   */
  private removeHighlight(): void {
    const highlighted = document.querySelector('[data-visual-guide-highlight="true"]');
    if (highlighted instanceof HTMLElement) {
      highlighted.style.outline = '';
      highlighted.style.outlineOffset = '';
      highlighted.removeAttribute('data-visual-guide-highlight');
    }
  }
}

/**
 * Checklist Panel Component
 * Shows signup progress with checklist items
 */
export class ChecklistPanel extends ShadowComponent {
  private items: ChecklistItem[] = [];
  private listContainer: HTMLDivElement | null = null;

  constructor() {
    super('visual-guide-checklist');
  }

  protected injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      @keyframes checkmark {
        0% { transform: scale(0) rotate(45deg); }
        50% { transform: scale(1.2) rotate(45deg); }
        100% { transform: scale(1) rotate(45deg); }
      }

      .panel {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 320px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        overflow: hidden;
        animation: slideInRight 0.4s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .panel-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .panel-header::before {
        content: '✓';
        display: inline-block;
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        text-align: center;
        line-height: 24px;
        margin-right: 10px;
      }

      .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .checklist {
        padding: 12px;
        max-height: 400px;
        overflow-y: auto;
      }

      .checklist-item {
        display: flex;
        align-items: flex-start;
        padding: 12px;
        margin-bottom: 8px;
        background: #f8f9fa;
        border-radius: 8px;
        transition: all 0.3s ease;
        position: relative;
      }

      .checklist-item.completed {
        background: #e7f5e7;
      }

      .checklist-item.sensitive {
        background: #fff3e0;
      }

      .checklist-item.sensitive.completed {
        background: #e7f5e7;
      }

      .checkbox {
        width: 20px;
        height: 20px;
        border: 2px solid #cbd5e0;
        border-radius: 4px;
        margin-right: 12px;
        flex-shrink: 0;
        position: relative;
        transition: all 0.3s ease;
      }

      .checkbox.checked {
        background: #48bb78;
        border-color: #48bb78;
      }

      .checkbox.checked::after {
        content: '';
        position: absolute;
        left: 5px;
        top: 1px;
        width: 6px;
        height: 12px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        animation: checkmark 0.3s ease;
      }

      .item-label {
        flex: 1;
        font-size: 14px;
        color: #2d3748;
        line-height: 1.5;
      }

      .item-label.completed {
        color: #718096;
        text-decoration: line-through;
      }

      .sensitive-badge {
        display: inline-block;
        background: #ff9800;
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 6px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .progress-bar {
        height: 4px;
        background: #e2e8f0;
        position: relative;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #48bb78 0%, #38a169 100%);
        transition: width 0.5s ease;
        position: relative;
        overflow: hidden;
      }

      .progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.3),
          transparent
        );
        animation: shimmer 2s infinite;
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .empty-state {
        padding: 40px 20px;
        text-align: center;
        color: #a0aec0;
        font-size: 14px;
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  /**
   * Show checklist panel
   */
  public show(items: ChecklistItem[]): void {
    this.items = items;
    this.render();
    this.mount();
  }

  /**
   * Update specific checklist item
   */
  public updateItem(index: number, completed: boolean): void {
    if (index < 0 || index >= this.items.length) return;

    this.items[index].completed = completed;
    this.render();
  }

  /**
   * Hide checklist panel
   */
  public hide(): void {
    this.unmount();
  }

  /**
   * Render checklist panel
   */
  private render(): void {
    // Clear container
    this.container.innerHTML = '';

    // Create panel
    const panel = document.createElement('div');
    panel.className = 'panel';

    // Header
    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = `
      <span>Signup Progress</span>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => this.hide();
    header.appendChild(closeBtn);

    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    const completedCount = this.items.filter(item => item.completed).length;
    const progressPercent = this.items.length > 0
      ? (completedCount / this.items.length) * 100
      : 0;
    progressFill.style.width = `${progressPercent}%`;
    progressBar.appendChild(progressFill);

    // Checklist
    this.listContainer = document.createElement('div');
    this.listContainer.className = 'checklist';

    if (this.items.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'No items in checklist';
      this.listContainer.appendChild(emptyState);
    } else {
      this.items.forEach((item, index) => {
        const itemElement = this.createChecklistItem(item, index);
        if (this.listContainer) {
          this.listContainer.appendChild(itemElement);
        }
      });
    }

    // Assemble panel
    panel.appendChild(header);
    panel.appendChild(progressBar);
    panel.appendChild(this.listContainer);

    // Add to container
    this.container.appendChild(panel);
  }

  /**
   * Create checklist item element
   */
  private createChecklistItem(item: ChecklistItem, _index: number): HTMLDivElement {
    const itemElement = document.createElement('div');
    itemElement.className = 'checklist-item';

    if (item.completed) {
      itemElement.classList.add('completed');
    }

    if (item.isSensitive) {
      itemElement.classList.add('sensitive');
    }

    // Checkbox
    const checkbox = document.createElement('div');
    checkbox.className = 'checkbox';
    if (item.completed) {
      checkbox.classList.add('checked');
    }

    // Label
    const label = document.createElement('div');
    label.className = 'item-label';
    if (item.completed) {
      label.classList.add('completed');
    }
    label.textContent = item.label;

    // Sensitive badge
    if (item.isSensitive) {
      const badge = document.createElement('span');
      badge.className = 'sensitive-badge';
      badge.textContent = 'Manual';
      label.appendChild(badge);
    }

    itemElement.appendChild(checkbox);
    itemElement.appendChild(label);

    return itemElement;
  }
}

/**
 * Permission Dialog Component
 * Requests human approval for sensitive actions
 */
export class PermissionDialog extends ShadowComponent {
  private resolveCallback: ((value: boolean) => void) | null = null;
  private timeoutId: number | null = null;

  constructor() {
    super('visual-guide-permission');
  }

  protected injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes scaleIn {
        from { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
        to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }

      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        animation: fadeIn 0.2s ease-out;
      }

      .dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 460px;
        width: 90%;
        animation: scaleIn 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .dialog-header {
        padding: 24px 24px 16px;
        border-bottom: 1px solid #e2e8f0;
      }

      .dialog-icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin-bottom: 12px;
      }

      .dialog-title {
        font-size: 20px;
        font-weight: 600;
        color: #1a202c;
        margin: 0;
      }

      .dialog-body {
        padding: 20px 24px;
      }

      .dialog-message {
        font-size: 15px;
        color: #4a5568;
        line-height: 1.6;
        margin: 0;
      }

      .dialog-footer {
        padding: 16px 24px 24px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .dialog-button {
        padding: 10px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        font-family: inherit;
      }

      .dialog-button:focus {
        outline: 2px solid #667eea;
        outline-offset: 2px;
      }

      .button-cancel {
        background: #e2e8f0;
        color: #4a5568;
      }

      .button-cancel:hover {
        background: #cbd5e0;
      }

      .button-confirm {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .button-confirm:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .timeout-indicator {
        margin-top: 12px;
        font-size: 12px;
        color: #a0aec0;
        text-align: center;
      }

      .timeout-bar {
        height: 3px;
        background: #e2e8f0;
        border-radius: 2px;
        margin-top: 6px;
        overflow: hidden;
      }

      .timeout-fill {
        height: 100%;
        background: linear-gradient(90deg, #fc8181 0%, #f56565 100%);
        transition: width 0.1s linear;
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  /**
   * Request permission from user
   */
  public async requestPermission(
    action: string,
    options: PermissionOptions = {}
  ): Promise<boolean> {
    const {
      confirmText = 'Approve',
      cancelText = 'Deny',
      timeout = 30000
    } = options;

    return new Promise((resolve) => {
      this.resolveCallback = resolve;
      this.show(action, [confirmText, cancelText], timeout);
    });
  }

  /**
   * Show permission dialog
   */
  public show(message: string, options: string[], timeout?: number): void {
    // Clear container
    this.container.innerHTML = '';

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        this.handleCancel();
      }
    };

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'dialog';

    // Header
    const header = document.createElement('div');
    header.className = 'dialog-header';
    header.innerHTML = `
      <div class="dialog-icon">🔐</div>
      <h3 class="dialog-title">Permission Required</h3>
    `;

    // Body
    const body = document.createElement('div');
    body.className = 'dialog-body';
    const messageElement = document.createElement('p');
    messageElement.className = 'dialog-message';
    messageElement.textContent = message;
    body.appendChild(messageElement);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'dialog-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'dialog-button button-cancel';
    cancelBtn.textContent = options[1] || 'Cancel';
    cancelBtn.onclick = () => this.handleCancel();

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'dialog-button button-confirm';
    confirmBtn.textContent = options[0] || 'Confirm';
    confirmBtn.onclick = () => this.handleConfirm();

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    // Timeout indicator
    if (timeout) {
      const timeoutIndicator = document.createElement('div');
      timeoutIndicator.className = 'timeout-indicator';

      const timeoutText = document.createElement('div');
      timeoutText.textContent = `Auto-deny in ${Math.round(timeout / 1000)}s`;

      const timeoutBar = document.createElement('div');
      timeoutBar.className = 'timeout-bar';
      const timeoutFill = document.createElement('div');
      timeoutFill.className = 'timeout-fill';
      timeoutFill.style.width = '100%';
      timeoutBar.appendChild(timeoutFill);

      timeoutIndicator.appendChild(timeoutText);
      timeoutIndicator.appendChild(timeoutBar);
      body.appendChild(timeoutIndicator);

      // Animate timeout
      const startTime = Date.now();
      const updateTimeout = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, timeout - elapsed);
        const percent = (remaining / timeout) * 100;

        timeoutFill.style.width = `${percent}%`;
        timeoutText.textContent = `Auto-deny in ${Math.ceil(remaining / 1000)}s`;

        if (remaining > 0 && this.resolveCallback) {
          requestAnimationFrame(updateTimeout);
        }
      };
      updateTimeout();

      // Set timeout
      this.timeoutId = window.setTimeout(() => {
        this.handleCancel();
      }, timeout);
    }

    // Assemble dialog
    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);

    // Add to container
    this.container.appendChild(overlay);

    // Mount to DOM
    this.mount();

    // Focus confirm button
    setTimeout(() => confirmBtn.focus(), 100);
  }

  /**
   * Hide permission dialog
   */
  public hide(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.unmount();
  }

  /**
   * Handle confirm action
   */
  private handleConfirm(): void {
    if (this.resolveCallback) {
      this.resolveCallback(true);
      this.resolveCallback = null;
    }
    this.hide();
  }

  /**
   * Handle cancel action
   */
  private handleCancel(): void {
    if (this.resolveCallback) {
      this.resolveCallback(false);
      this.resolveCallback = null;
    }
    this.hide();
  }
}

/**
 * Progress Indicator Component
 * Shows step-by-step progress
 */
export class ProgressIndicator extends ShadowComponent {
  private currentStep: number = 0;
  private totalSteps: number = 0;
  private stepsContainer: HTMLDivElement | null = null;

  constructor() {
    super('visual-guide-progress');
  }

  protected injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInTop {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      @keyframes stepPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      .progress-container {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        padding: 16px 24px;
        animation: slideInTop 0.4s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 999998;
      }

      .progress-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .progress-icon {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }

      .progress-title {
        font-size: 14px;
        font-weight: 600;
        color: #2d3748;
      }

      .progress-count {
        font-size: 12px;
        color: #718096;
        margin-left: auto;
      }

      .steps {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .step {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.3s ease;
        position: relative;
      }

      .step.pending {
        background: #e2e8f0;
        color: #a0aec0;
      }

      .step.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        animation: stepPulse 2s ease-in-out infinite;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
      }

      .step.completed {
        background: #48bb78;
        color: white;
      }

      .step.completed::after {
        content: '✓';
        position: absolute;
        font-size: 14px;
      }

      .step-connector {
        flex: 1;
        height: 3px;
        background: #e2e8f0;
        position: relative;
        overflow: hidden;
      }

      .step-connector.completed {
        background: #48bb78;
      }

      .step-connector.active::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          90deg,
          #e2e8f0 0%,
          #667eea 50%,
          #e2e8f0 100%
        );
        animation: slide 2s infinite;
      }

      @keyframes slide {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .completion-message {
        margin-top: 12px;
        padding: 8px 12px;
        background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
        color: white;
        border-radius: 6px;
        font-size: 13px;
        text-align: center;
        font-weight: 500;
        animation: slideInTop 0.3s ease-out;
      }

      .completion-message::before {
        content: '🎉 ';
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  /**
   * Show progress indicator
   */
  public show(current: number, total: number): void {
    this.currentStep = current;
    this.totalSteps = total;
    this.render();
    this.mount();
  }

  /**
   * Update current step
   */
  public update(current: number): void {
    this.currentStep = current;
    this.render();
  }

  /**
   * Mark as complete
   */
  public complete(): void {
    this.currentStep = this.totalSteps;
    this.render();

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hide();
    }, 3000);
  }

  /**
   * Hide progress indicator
   */
  public hide(): void {
    this.unmount();
  }

  /**
   * Render progress indicator
   */
  private render(): void {
    // Clear container
    this.container.innerHTML = '';

    // Create progress container
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';

    // Header
    const header = document.createElement('div');
    header.className = 'progress-header';
    header.innerHTML = `
      <div class="progress-icon">📋</div>
      <div class="progress-title">Signup Progress</div>
      <div class="progress-count">${this.currentStep}/${this.totalSteps}</div>
    `;

    // Steps
    this.stepsContainer = document.createElement('div');
    this.stepsContainer.className = 'steps';

    for (let i = 1; i <= this.totalSteps; i++) {
      // Step
      const step = document.createElement('div');
      step.className = 'step';

      if (i < this.currentStep) {
        step.classList.add('completed');
      } else if (i === this.currentStep) {
        step.classList.add('active');
        step.textContent = i.toString();
      } else {
        step.classList.add('pending');
        step.textContent = i.toString();
      }

      this.stepsContainer.appendChild(step);

      // Connector (except after last step)
      if (i < this.totalSteps) {
        const connector = document.createElement('div');
        connector.className = 'step-connector';

        if (i < this.currentStep) {
          connector.classList.add('completed');
        } else if (i === this.currentStep) {
          connector.classList.add('active');
        }

        this.stepsContainer.appendChild(connector);
      }
    }

    // Assemble
    progressContainer.appendChild(header);
    progressContainer.appendChild(this.stepsContainer);

    // Completion message
    if (this.currentStep === this.totalSteps) {
      const completionMessage = document.createElement('div');
      completionMessage.className = 'completion-message';
      completionMessage.textContent = 'All steps completed!';
      progressContainer.appendChild(completionMessage);
    }

    // Add to container
    this.container.appendChild(progressContainer);
  }
}

/**
 * Visual Guide Manager
 * Coordinates all visual guidance components
 */
export class VisualGuideManager {
  private arrow: ArrowGuide;
  private checklist: ChecklistPanel;
  private permission: PermissionDialog;
  private progress: ProgressIndicator;

  constructor() {
    this.arrow = new ArrowGuide();
    this.checklist = new ChecklistPanel();
    this.permission = new PermissionDialog();
    this.progress = new ProgressIndicator();
  }

  /**
   * Get arrow guide component
   */
  public getArrow(): ArrowGuide {
    return this.arrow;
  }

  /**
   * Get checklist panel component
   */
  public getChecklist(): ChecklistPanel {
    return this.checklist;
  }

  /**
   * Get permission dialog component
   */
  public getPermission(): PermissionDialog {
    return this.permission;
  }

  /**
   * Get progress indicator component
   */
  public getProgress(): ProgressIndicator {
    return this.progress;
  }

  /**
   * Destroy all components
   */
  public destroy(): void {
    this.arrow.destroy();
    this.checklist.destroy();
    this.permission.destroy();
    this.progress.destroy();
  }
}
