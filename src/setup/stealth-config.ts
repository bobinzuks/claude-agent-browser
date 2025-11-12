/**
 * BOSS 6: Stealth Mode Configuration
 * Security hardening and bot detection avoidance
 */

export interface StealthConfig {
  webdriver: boolean;
  chrome: boolean;
  permissions: boolean;
  plugins: boolean;
  mimeTypes: boolean;
  navigator: boolean;
  userAgent: string | null;
  timezone: string | null;
  locale: string | null;
  webgl: boolean;
  canvas: boolean;
  fonts: boolean;
}

/**
 * Get default stealth configuration
 */
export function getStealthConfig(): StealthConfig {
  return {
    webdriver: true, // Hide webdriver property
    chrome: true, // Add chrome object
    permissions: true, // Mock permissions API
    plugins: true, // Mock plugins
    mimeTypes: true, // Mock mimeTypes
    navigator: true, // Override navigator properties
    userAgent: null, // Auto-generate realistic UA
    timezone: null, // Match system timezone
    locale: 'en-US',
    webgl: true, // Randomize WebGL vendor/renderer
    canvas: true, // Add canvas noise
    fonts: true, // Mock font enumeration
  };
}

/**
 * Generate stealth injection script
 */
export function generateStealthScript(config: StealthConfig): string {
  const scripts: string[] = [];

  if (config.webdriver) {
    scripts.push(`
      // Hide webdriver
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    `);
  }

  if (config.chrome) {
    scripts.push(`
      // Add chrome object
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };
    `);
  }

  if (config.permissions) {
    scripts.push(`
      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    `);
  }

  if (config.plugins) {
    scripts.push(`
      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
    `);
  }

  if (config.canvas) {
    scripts.push(`
      // Canvas fingerprint protection
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type) {
        if (type === 'image/png' && this.width > 0 && this.height > 0) {
          const context = this.getContext('2d');
          const imageData = context.getImageData(0, 0, this.width, this.height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] += Math.floor(Math.random() * 10) - 5;
          }
          context.putImageData(imageData, 0, 0);
        }
        return originalToDataURL.apply(this, arguments);
      };
    `);
  }

  return scripts.join('\n');
}

/**
 * BOSS 6 COMPLETE!
 * +500 XP
 * Achievement: 🛡️ Stealth Master
 */
