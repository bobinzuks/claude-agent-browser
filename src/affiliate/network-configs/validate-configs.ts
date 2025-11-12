/**
 * Configuration Validation Script
 *
 * Validates all network configurations for completeness and correctness.
 * Run this to ensure all configs follow the proper structure.
 */

import {
  ALL_NETWORKS,
  NETWORK_CONFIGS,
  getNetworkConfig,
  getAPIEnabledNetworks,
  getNetworksByAutomationLevel,
  getNetworksByTOSLevel,
  // findNetworkByDomain,
} from './index';
import { TOSLevel } from '../../database/affiliate-types';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a single network configuration
 */
function validateNetworkConfig(networkId: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const config = getNetworkConfig(networkId);

  if (!config) {
    result.valid = false;
    result.errors.push(`Network config not found: ${networkId}`);
    return result;
  }

  // Validate required fields
  if (!config.id) {
    result.errors.push('Missing id');
  }
  if (!config.name) {
    result.errors.push('Missing name');
  }
  if (!config.domain) {
    result.errors.push('Missing domain');
  }
  if (config.tosLevel === undefined || config.tosLevel === null) {
    result.errors.push('Missing tosLevel');
  }

  // Validate TOS level
  if (config.tosLevel < 0 || config.tosLevel > 3) {
    result.errors.push(`Invalid tosLevel: ${config.tosLevel} (must be 0-3)`);
  }

  // Validate signup config
  if (!config.signup) {
    result.errors.push('Missing signup configuration');
  } else {
    if (!config.signup.url) {
      result.errors.push('Missing signup.url');
    }
    if (!config.signup.automationLevel) {
      result.errors.push('Missing signup.automationLevel');
    }
    if (!config.signup.requiredFields || config.signup.requiredFields.length === 0) {
      result.warnings.push('No required fields specified');
    }
    if (!config.signup.sensitiveFields || config.signup.sensitiveFields.length === 0) {
      result.warnings.push('No sensitive fields specified');
    }

    // Validate automation level matches TOS level
    if (config.tosLevel === TOSLevel.FULLY_MANUAL && config.signup.automationLevel !== 'manual-only') {
      result.errors.push('TOS level is FULLY_MANUAL but automationLevel is not manual-only');
    }
    if (config.tosLevel === TOSLevel.FULLY_AUTOMATED && config.signup.automationLevel === 'manual-only') {
      result.errors.push('TOS level is FULLY_AUTOMATED but automationLevel is manual-only');
    }
  }

  // Validate link extraction config
  if (!config.linkExtraction) {
    result.errors.push('Missing linkExtraction configuration');
  } else {
    if (!config.linkExtraction.extractionStrategy) {
      result.errors.push('Missing linkExtraction.extractionStrategy');
    }

    // If strategy is API, check if API is available
    if (config.linkExtraction.extractionStrategy === 'api' && !config.api.available) {
      result.errors.push('Extraction strategy is api but API is not available');
    }
  }

  // Validate API config
  if (!config.api) {
    result.errors.push('Missing API configuration');
  } else {
    if (config.api.available) {
      if (!config.api.baseUrl) {
        result.errors.push('API is available but baseUrl is missing');
      }
      if (!config.api.authMethod) {
        result.errors.push('API is available but authMethod is missing');
      }
      if (!config.api.docsUrl) {
        result.warnings.push('API is available but docsUrl is missing');
      }
    } else {
      // API not available
      if (config.api.baseUrl) {
        result.warnings.push('API not available but baseUrl is specified');
      }
    }
  }

  // Check for metadata
  if (!config.metadata) {
    result.warnings.push('No metadata provided');
  } else {
    if (!config.metadata.minimumPayout) {
      result.warnings.push('No minimum payout specified');
    }
    if (!config.metadata.paymentMethods || config.metadata.paymentMethods.length === 0) {
      result.warnings.push('No payment methods specified');
    }
    if (!config.metadata.approvalTime) {
      result.warnings.push('No approval time specified');
    }
  }

  // Set valid flag based on errors
  result.valid = result.errors.length === 0;

  return result;
}

/**
 * Validate all network configurations
 */
export function validateAllConfigs(): void {
  console.log('='.repeat(80));
  console.log('NETWORK CONFIGURATION VALIDATION');
  console.log('='.repeat(80));
  console.log('');

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const networkId of Object.keys(NETWORK_CONFIGS)) {
    const result = validateNetworkConfig(networkId);
    const config = NETWORK_CONFIGS[networkId];

    console.log(`\n${config.name} (${networkId})`);
    console.log('-'.repeat(80));
    console.log(`TOS Level: ${config.tosLevel} (${getTOSLevelName(config.tosLevel)})`);
    console.log(`Automation: ${config.signup.automationLevel}`);
    console.log(`API: ${config.api.available ? 'Yes' : 'No'}`);
    console.log(`Extraction: ${config.linkExtraction.extractionStrategy}`);

    if (result.errors.length > 0) {
      console.log('\nERRORS:');
      result.errors.forEach(error => console.log(`  ❌ ${error}`));
      totalErrors += result.errors.length;
    }

    if (result.warnings.length > 0) {
      console.log('\nWARNINGS:');
      result.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
      totalWarnings += result.warnings.length;
    }

    if (result.valid && result.warnings.length === 0) {
      console.log('✅ Valid');
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total networks: ${ALL_NETWORKS.length}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`Total warnings: ${totalWarnings}`);
  console.log('');

  // Statistics
  console.log('Network Statistics:');
  console.log(`  - Fully automated: ${getNetworksByAutomationLevel('fully-automated').length}`);
  console.log(`  - Human-in-loop: ${getNetworksByAutomationLevel('human-in-loop').length}`);
  console.log(`  - Manual only: ${getNetworksByAutomationLevel('manual-only').length}`);
  console.log('');
  console.log(`  - TOS Level 0 (Fully Automated): ${getNetworksByTOSLevel(TOSLevel.FULLY_AUTOMATED).length}`);
  console.log(`  - TOS Level 1 (Human Guided): ${getNetworksByTOSLevel(TOSLevel.HUMAN_GUIDED).length}`);
  console.log(`  - TOS Level 2 (Manual Verification): ${getNetworksByTOSLevel(TOSLevel.MANUAL_VERIFICATION).length}`);
  console.log(`  - TOS Level 3 (Fully Manual): ${getNetworksByTOSLevel(TOSLevel.FULLY_MANUAL).length}`);
  console.log('');
  console.log(`  - API enabled: ${getAPIEnabledNetworks().length}`);
  console.log(`  - No API: ${ALL_NETWORKS.filter(n => !n.api.available).length}`);
  console.log('');

  if (totalErrors > 0) {
    console.log('❌ VALIDATION FAILED');
    process.exit(1);
  } else {
    console.log('✅ ALL CONFIGURATIONS VALID');
  }
}

/**
 * Get TOS level name
 */
function getTOSLevelName(level: TOSLevel): string {
  switch (level) {
    case TOSLevel.FULLY_AUTOMATED:
      return 'Fully Automated';
    case TOSLevel.HUMAN_GUIDED:
      return 'Human Guided';
    case TOSLevel.MANUAL_VERIFICATION:
      return 'Manual Verification';
    case TOSLevel.FULLY_MANUAL:
      return 'Fully Manual';
    default:
      return 'Unknown';
  }
}

// Run validation if executed directly
if (require.main === module) {
  validateAllConfigs();
}
