/**
 * Affiliate Network Detection Module
 *
 * Entry point for all affiliate network detection functionality.
 *
 * @example
 * ```typescript
 * import { NetworkDetector, detectNetwork, getToSLevel } from '@/affiliate';
 *
 * const detector = new NetworkDetector();
 * const network = detector.detectNetwork('https://shareasale.com');
 * ```
 */

// Export main class
export { NetworkDetector } from './network-detector';

// Export singleton instance
export { networkDetector } from './network-detector';

// Export helper functions
export {
  isAffiliateNetwork,
  detectNetwork,
  getToSLevel,
  getAllNetworks,
} from './network-detector';

// Export types
export type {
  AffiliateNetwork,
  NetworkConfig,
  ToSLevel,
} from './network-detector';

// Export examples (optional - for documentation)
export * as examples from './examples';
