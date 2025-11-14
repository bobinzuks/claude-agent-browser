/**
 * 🛡️ Advanced Stealth Engine - Phase 4
 * Social Media Anti-Detection & Fingerprint Evasion
 * Based on deep research into 2025 anti-detect techniques
 */

import { BrowserContext, Page } from 'playwright';
import { AgentDBClient } from '../training/agentdb-client.js';

export interface StealthConfig {
  enableCanvasNoising?: boolean;
  enableWebGLSpoofing?: boolean;
  enableAudioFingerprint?: boolean;
  enableNavigatorSpoofing?: boolean;
  enableBehavioralSimulation?: boolean;
  userAgent?: string;
  viewport?: { width: number; height: number };
  timezone?: string;
  locale?: string;
  proxyServer?: string;
}

export interface BehavioralPattern {
  mouseMovements: boolean;
  typingDelays: boolean;
  scrollPatterns: boolean;
  clickDelays: boolean;
  dwellTime: boolean;
}

/**
 * Advanced Stealth Engine for Social Media Automation
 */
export class AdvancedStealthEngine {
  private db: AgentDBClient;
  private config: StealthConfig;
  private canvasNoiseSeed: number;  // Session-persistent seed
  private audioNoiseSeed: number;   // Session-persistent seed

  constructor(dbPath: string, config: StealthConfig = {}) {
    this.db = new AgentDBClient(dbPath, 384);
    this.config = {
      enableCanvasNoising: config.enableCanvasNoising ?? true,
      enableWebGLSpoofing: config.enableWebGLSpoofing ?? true,
      enableAudioFingerprint: config.enableAudioFingerprint ?? true,
      enableNavigatorSpoofing: config.enableNavigatorSpoofing ?? true,
      enableBehavioralSimulation: config.enableBehavioralSimulation ?? true,
      ...config,
    };

    // Generate session-persistent seeds for fingerprint consistency
    this.canvasNoiseSeed = Math.random() * 0.0001;
    this.audioNoiseSeed = Math.random() * 0.001;
  }

  /**
   * Apply stealth to browser context
   */
  async applyStealthToContext(context: BrowserContext): Promise<void> {
    // Add init scripts before any pages are created
    await context.addInitScript(this.getStealthScript());

    console.log('✅ Stealth mode applied to browser context');
  }

  /**
   * Apply stealth to existing page
   */
  async applyStealthToPage(page: Page): Promise<void> {
    await page.addInitScript(this.getStealthScript());

    console.log('✅ Stealth mode applied to page');
  }

  /**
   * Generate comprehensive stealth script
   */
  private getStealthScript(): string {
    const scripts: string[] = [];

    if (this.config.enableNavigatorSpoofing) {
      scripts.push(this.getNavigatorSpoofingScript());
    }

    if (this.config.enableCanvasNoising) {
      scripts.push(this.getCanvasNoisingScript());
    }

    if (this.config.enableWebGLSpoofing) {
      scripts.push(this.getWebGLSpoofingScript());
    }

    if (this.config.enableAudioFingerprint) {
      scripts.push(this.getAudioFingerprintScript());
    }

    // Always add WebRTC leak protection (critical for Twitter)
    scripts.push(this.getWebRTCBlockingScript());

    return scripts.join('\n\n');
  }

  /**
   * Navigator property spoofing
   */
  private getNavigatorSpoofingScript(): string {
    return `
      // Navigator property spoofing
      (function() {
        const originalNavigator = navigator;

        // Chrome runtime injection (detected by anti-bot systems)
        if (!window.chrome) {
          window.chrome = {
            runtime: {
              sendMessage: () => {},
              connect: () => {},
            },
          };
        }

        // Override webdriver flag (delete vs set to false)
        try {
          delete Object.getPrototypeOf(navigator).webdriver;
        } catch {
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
          });
        }

        // Override permissions query (Playwright/Selenium detection)
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );

        // Plugin array spoofing (headless detection)
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            {
              name: 'Chrome PDF Plugin',
              description: 'Portable Document Format',
              filename: 'internal-pdf-viewer',
            },
            {
              name: 'Chrome PDF Viewer',
              description: 'Portable Document Format',
              filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
            },
            {
              name: 'Native Client',
              description: 'Native Client Executable',
              filename: 'internal-nacl-plugin',
            },
          ],
        });

        // Language spoofing
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });

        // Hardware concurrency randomization
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => 4 + Math.floor(Math.random() * 4), // 4-8 cores
        });

        // Device memory randomization
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => [4, 8, 16][Math.floor(Math.random() * 3)],
        });

        console.log('🛡️ Navigator spoofing active');
      })();
    `;
  }

  /**
   * Canvas fingerprint noising
   */
  private getCanvasNoisingScript(): string {
    return `
      // Canvas fingerprint noising
      (function() {
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        const originalToBlob = HTMLCanvasElement.prototype.toBlob;
        const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

        // Use session-persistent noise seed (passed from constructor)
        const noiseSeed = ${this.canvasNoiseSeed};

        // Add subtle noise to canvas data
        function addNoise(data) {
          for (let i = 0; i < data.length; i += 4) {
            // Add minimal noise to RGB channels (not alpha)
            data[i] = data[i] + Math.floor(noiseSeed * 255) % 3 - 1;
            data[i + 1] = data[i + 1] + Math.floor(noiseSeed * 255) % 3 - 1;
            data[i + 2] = data[i + 2] + Math.floor(noiseSeed * 255) % 3 - 1;
          }
        }

        // Override toDataURL
        HTMLCanvasElement.prototype.toDataURL = function() {
          const context = this.getContext('2d');
          if (context) {
            const imageData = context.getImageData(0, 0, this.width, this.height);
            addNoise(imageData.data);
            context.putImageData(imageData, 0, 0);
          }
          return originalToDataURL.apply(this, arguments);
        };

        // Override getImageData
        CanvasRenderingContext2D.prototype.getImageData = function() {
          const imageData = originalGetImageData.apply(this, arguments);
          addNoise(imageData.data);
          return imageData;
        };

        console.log('🎨 Canvas noising active');
      })();
    `;
  }

  /**
   * WebGL fingerprint spoofing
   */
  private getWebGLSpoofingScript(): string {
    return `
      // WebGL fingerprint spoofing
      (function() {
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        const vendors = ['Intel Inc.', 'NVIDIA Corporation', 'AMD'];
        const renderers = [
          'Intel Iris OpenGL Engine',
          'NVIDIA GeForce GTX 1060',
          'AMD Radeon RX 580',
        ];

        const vendor = vendors[Math.floor(Math.random() * vendors.length)];
        const renderer = renderers[Math.floor(Math.random() * renderers.length)];

        WebGLRenderingContext.prototype.getParameter = function(parameter) {
          if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
            return vendor;
          }
          if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
            return renderer;
          }
          return getParameter.apply(this, arguments);
        };

        console.log(\`🎮 WebGL spoofing active: \${vendor} / \${renderer}\`);
      })();
    `;
  }

  /**
   * Audio fingerprint randomization
   */
  private getAudioFingerprintScript(): string {
    return `
      // Audio fingerprint randomization
      (function() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const originalCreateAnalyser = AudioContext.prototype.createAnalyser;
        const originalGetByteFrequencyData = AnalyserNode.prototype.getByteFrequencyData;

        // Use session-persistent noise seed (passed from constructor)
        const audioNoise = ${this.audioNoiseSeed};

        AnalyserNode.prototype.getByteFrequencyData = function(array) {
          originalGetByteFrequencyData.apply(this, arguments);

          // Add subtle noise to frequency data
          for (let i = 0; i < array.length; i++) {
            array[i] = array[i] + Math.floor(audioNoise * 255) % 3;
          }
        };

        console.log('🔊 Audio fingerprint randomization active');
      })();
    `;
  }

  /**
   * WebRTC IP leak protection
   */
  private getWebRTCBlockingScript(): string {
    return `
      // WebRTC IP leak protection
      (function() {
        // Block WebRTC IP discovery (critical for Twitter bot detection)
        const originalRTCPeerConnection = window.RTCPeerConnection ||
                                         window.webkitRTCPeerConnection ||
                                         window.mozRTCPeerConnection;

        if (!originalRTCPeerConnection) return;

        // Override RTCPeerConnection constructor
        const ProxiedRTCPeerConnection = function(...args) {
          const pc = new originalRTCPeerConnection(...args);

          // Block local IP discovery in SDP
          const originalCreateOffer = pc.createOffer.bind(pc);
          pc.createOffer = function() {
            return originalCreateOffer.apply(this, arguments).then(offer => {
              // Replace real IPs with 0.0.0.0
              offer.sdp = offer.sdp.replace(
                /c=IN IP4 (\\d+\\.\\d+\\.\\d+\\.\\d+)/g,
                'c=IN IP4 0.0.0.0'
              );
              return offer;
            });
          };

          const originalCreateAnswer = pc.createAnswer.bind(pc);
          pc.createAnswer = function() {
            return originalCreateAnswer.apply(this, arguments).then(answer => {
              // Replace real IPs with 0.0.0.0
              answer.sdp = answer.sdp.replace(
                /c=IN IP4 (\\d+\\.\\d+\\.\\d+\\.\\d+)/g,
                'c=IN IP4 0.0.0.0'
              );
              return answer;
            });
          };

          const originalSetLocalDescription = pc.setLocalDescription.bind(pc);
          pc.setLocalDescription = function(description) {
            if (description && description.sdp) {
              // Replace real IPs before setting
              description.sdp = description.sdp.replace(
                /c=IN IP4 (\\d+\\.\\d+\\.\\d+\\.\\d+)/g,
                'c=IN IP4 0.0.0.0'
              );
            }
            return originalSetLocalDescription(description);
          };

          return pc;
        };

        // Copy static methods
        ProxiedRTCPeerConnection.prototype = originalRTCPeerConnection.prototype;

        // Replace global RTCPeerConnection
        window.RTCPeerConnection = ProxiedRTCPeerConnection;
        if (window.webkitRTCPeerConnection) {
          window.webkitRTCPeerConnection = ProxiedRTCPeerConnection;
        }

        console.log('🔒 WebRTC leak protection active');
      })();
    `;
  }

  /**
   * Simulate human-like mouse movement
   */
  async humanMouseMove(page: Page, fromX: number, fromY: number, toX: number, toY: number): Promise<void> {
    const steps = 20 + Math.floor(Math.random() * 10); // 20-30 steps

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      // Bezier curve for natural movement
      const x = fromX + (toX - fromX) * this.easeInOutCubic(t);
      const y = fromY + (toY - fromY) * this.easeInOutCubic(t);

      // Add subtle randomness
      const jitterX = (Math.random() - 0.5) * 2;
      const jitterY = (Math.random() - 0.5) * 2;

      await page.mouse.move(x + jitterX, y + jitterY);

      // Random delay between movements (1-5ms)
      await page.waitForTimeout(1 + Math.random() * 4);
    }
  }

  /**
   * Simulate human-like typing with delays
   */
  async humanType(page: Page, selector: string, text: string): Promise<void> {
    const element = await page.locator(selector);
    await element.click();

    for (const char of text) {
      await page.keyboard.type(char);

      // Random typing delay (50-150ms)
      const delay = 50 + Math.random() * 100;
      await page.waitForTimeout(delay);

      // Occasional longer pauses (thinking)
      if (Math.random() < 0.1) {
        await page.waitForTimeout(200 + Math.random() * 300);
      }
    }
  }

  /**
   * Simulate human-like scrolling
   */
  async humanScroll(page: Page, targetY: number): Promise<void> {
    const currentY = await page.evaluate(() => window.scrollY);
    const distance = targetY - currentY;
    const steps = 10 + Math.floor(Math.random() * 5);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const scrollY = currentY + distance * this.easeInOutCubic(t);

      await page.evaluate((y) => window.scrollTo(0, y), scrollY);

      // Random delay (50-100ms)
      await page.waitForTimeout(50 + Math.random() * 50);
    }
  }

  /**
   * Simulate human-like click with dwell time
   */
  async humanClick(page: Page, selector: string): Promise<void> {
    const element = page.locator(selector);
    const box = await element.boundingBox();

    if (!box) {
      throw new Error(`Element not found: ${selector}`);
    }

    // Random point within element
    const x = box.x + box.width * (0.3 + Math.random() * 0.4);
    const y = box.y + box.height * (0.3 + Math.random() * 0.4);

    // Move mouse to element
    await this.humanMouseMove(
      page,
      await page.evaluate(() => window.innerWidth / 2),
      await page.evaluate(() => window.innerHeight / 2),
      x,
      y
    );

    // Dwell time before click (100-300ms)
    await page.waitForTimeout(100 + Math.random() * 200);

    // Click
    await page.mouse.click(x, y);

    // Record pattern
    this.db.storeAction({
      action: 'human-click',
      selector,
      url: page.url(),
      success: true,
      timestamp: new Date().toISOString(),
      metadata: {
        dwellTime: 100 + Math.random() * 200,
        source: 'advanced-stealth-engine',
      },
    });
  }

  /**
   * Easing function for natural movement
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Generate random user agent
   */
  generateUserAgent(): string {
    const chromeVersions = ['120', '121', '122', '123', '124'];
    const windowsVersions = ['10.0', '11.0'];

    const chromeVersion = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
    const windowsVersion = windowsVersions[Math.floor(Math.random() * windowsVersions.length)];

    return `Mozilla/5.0 (Windows NT ${windowsVersion}; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36`;
  }

  /**
   * Generate random viewport
   */
  generateViewport(): { width: number; height: number } {
    const commonResolutions = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1536, height: 864 },
      { width: 1440, height: 900 },
      { width: 1280, height: 720 },
    ];

    return commonResolutions[Math.floor(Math.random() * commonResolutions.length)];
  }

  /**
   * Wait with random human-like delay
   */
  async humanWait(page: Page, minMs: number = 500, maxMs: number = 2000): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    await page.waitForTimeout(delay);
  }

  /**
   * Get stealth statistics
   */
  getStats() {
    return {
      canvasNoising: this.config.enableCanvasNoising,
      webglSpoofing: this.config.enableWebGLSpoofing,
      audioFingerprint: this.config.enableAudioFingerprint,
      navigatorSpoofing: this.config.enableNavigatorSpoofing,
      behavioralSimulation: this.config.enableBehavioralSimulation,
      userAgent: this.config.userAgent || 'random',
      viewport: this.config.viewport || 'random',
    };
  }
}
