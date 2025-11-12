/**
 * Network Configurations Index
 *
 * Central export point for all affiliate network configurations.
 * Import network configs individually or get all configs as a map.
 */

export * from './types';

// Individual network configs
export { ShareASaleConfig } from './shareasale';
export { CJAffiliateConfig } from './cj-affiliate';
export { ImpactConfig } from './impact';
export { RakutenConfig } from './rakuten';
export { ClickBankConfig } from './clickbank';
export { PartnerStackConfig } from './partnerstack';
export { AmazonAssociatesConfig } from './amazon-associates';

import { ShareASaleConfig } from './shareasale';
import { CJAffiliateConfig } from './cj-affiliate';
import { ImpactConfig } from './impact';
import { RakutenConfig } from './rakuten';
import { ClickBankConfig } from './clickbank';
import { PartnerStackConfig } from './partnerstack';
import { AmazonAssociatesConfig } from './amazon-associates';

import type { NetworkConfig } from './types';

/**
 * Map of all network configurations keyed by network ID
 */
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  'shareasale': ShareASaleConfig,
  'cj-affiliate': CJAffiliateConfig,
  'impact': ImpactConfig,
  'rakuten': RakutenConfig,
  'clickbank': ClickBankConfig,
  'partnerstack': PartnerStackConfig,
  'amazon-associates': AmazonAssociatesConfig,
};

/**
 * Array of all network configurations
 */
export const ALL_NETWORKS: NetworkConfig[] = Object.values(NETWORK_CONFIGS);

/**
 * Get network configuration by ID
 */
export function getNetworkConfig(networkId: string): NetworkConfig | undefined {
  return NETWORK_CONFIGS[networkId];
}

/**
 * Get all networks by TOS level
 */
export function getNetworksByTOSLevel(tosLevel: number): NetworkConfig[] {
  return ALL_NETWORKS.filter(network => network.tosLevel === tosLevel);
}

/**
 * Get networks that support API access
 */
export function getAPIEnabledNetworks(): NetworkConfig[] {
  return ALL_NETWORKS.filter(network => network.api.available);
}

/**
 * Get networks by automation level
 */
export function getNetworksByAutomationLevel(level: 'fully-automated' | 'human-in-loop' | 'manual-only'): NetworkConfig[] {
  return ALL_NETWORKS.filter(network => network.signup.automationLevel === level);
}

/**
 * Validate network ID
 */
export function isValidNetworkId(networkId: string): boolean {
  return networkId in NETWORK_CONFIGS;
}

/**
 * Get network domains (for URL matching)
 */
export function getNetworkDomains(): string[] {
  return ALL_NETWORKS.map(network => network.domain);
}

/**
 * Find network by domain
 */
export function findNetworkByDomain(domain: string): NetworkConfig | undefined {
  return ALL_NETWORKS.find(network =>
    domain.includes(network.domain) || network.domain.includes(domain)
  );
}
