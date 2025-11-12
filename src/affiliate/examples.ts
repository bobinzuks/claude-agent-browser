/**
 * Affiliate Network Detector - Usage Examples
 *
 * Demonstrates real-world integration scenarios
 */

import {
  NetworkDetector,
  // detectNetwork,
  // getToSLevel,
  // getAllNetworks,
  type AffiliateNetwork,
  type NetworkConfig,
} from './network-detector';

// ============================================================================
// EXAMPLE 1: Browser Extension Content Script
// ============================================================================

/**
 * Detects affiliate networks on the current page and applies appropriate automation mode
 */
export function browserExtensionExample() {
  const detector = new NetworkDetector();
  const currentUrl = window.location.href;

  console.log('=== Browser Extension Example ===');
  console.log(`Current URL: ${currentUrl}`);

  // Detect if current page is an affiliate network
  const network = detector.detectNetwork(currentUrl);

  if (network) {
    const config = detector.getNetworkConfig(network.id);

    console.log(`✓ Detected: ${network.name}`);
    console.log(`  ToS Level: ${network.tosLevel}`);
    console.log(`  Risk Level: ${config?.riskLevel}`);
    console.log(`  Automation Permitted: ${config?.automationPermitted}`);
    console.log(`  Max Mode: ${config?.maxAutomationMode}`);

    // Apply automation policy
    switch (config?.maxAutomationMode) {
      case 'full-auto':
        console.log('  → Enabling full automation');
        break;
      case 'assisted-auto':
        console.log('  → Enabling assisted automation');
        break;
      case 'human-guided':
        console.log('  → Enabling human-guided mode only');
        break;
      case 'none':
        console.log('  → Automation disabled - manual mode only');
        break;
    }

    return {
      network,
      config,
      shouldAutomate: config?.automationPermitted ?? false,
    };
  } else {
    // Not a known affiliate network - check ToS level
    const tosLevel = detector.getToSLevel(currentUrl);

    console.log('  Unknown network');
    console.log(`  ToS Level: ${tosLevel}`);

    return {
      network: null,
      tosLevel,
      shouldAutomate: tosLevel <= 1,
    };
  }
}

// ============================================================================
// EXAMPLE 2: Affiliate Dashboard - List Networks
// ============================================================================

/**
 * Generates dashboard data for all supported networks
 */
export function dashboardListExample() {
  const detector = new NetworkDetector();

  console.log('\n=== Affiliate Dashboard Example ===');

  const networks = detector.listSupportedNetworks();

  const dashboardData = networks.map(network => {
    const config = detector.getNetworkConfig(network.id);

    return {
      id: network.id,
      name: network.name,
      domain: network.domain,
      tosLevel: network.tosLevel,
      riskLevel: config?.riskLevel,
      apiAvailable: network.apiAvailable ? 'Yes' : 'No',
      automationStatus: config?.automationPermitted ? 'Permitted' : 'Restricted',
      signupUrl: network.signupUrl,
    };
  });

  console.table(dashboardData);

  return dashboardData;
}

// ============================================================================
// EXAMPLE 3: Filter Automation-Friendly Networks
// ============================================================================

/**
 * Gets only networks that explicitly support automation
 */
export function filterAutomationFriendlyExample() {
  const detector = new NetworkDetector();

  console.log('\n=== Automation-Friendly Networks ===');

  // Get low-risk networks
  const lowRisk = detector.getNetworksByRiskLevel('low');

  console.log(`Found ${lowRisk.length} automation-friendly networks:\n`);

  lowRisk.forEach(network => {
    const config = detector.getNetworkConfig(network.id);

    console.log(`${network.name} (${network.domain})`);
    console.log(`  Risk: ${config?.riskLevel}`);
    console.log(`  API: ${network.apiAvailable ? 'Available' : 'Not available'}`);
    console.log(`  Notes: ${network.automationNotes}`);
    console.log('');
  });

  return lowRisk;
}

// ============================================================================
// EXAMPLE 4: Risk Assessment for URL
// ============================================================================

/**
 * Comprehensive risk assessment for automating a specific URL
 */
export function riskAssessmentExample(url: string) {
  const detector = new NetworkDetector();

  console.log('\n=== Risk Assessment ===');
  console.log(`URL: ${url}\n`);

  const network = detector.detectNetwork(url);

  if (!network) {
    const tosLevel = detector.getToSLevel(url);

    const assessment = {
      isKnownNetwork: false,
      url,
      tosLevel,
      riskLevel: tosLevel === 0 ? 'low' : tosLevel === 1 ? 'medium' : 'high',
      recommendation:
        tosLevel === 0
          ? 'Safe domain - full automation permitted'
          : tosLevel === 1
            ? 'Unknown network - use human-in-loop workflow'
            : 'Restricted domain - manual mode only',
      safeForAutomation: tosLevel <= 1,
    };

    console.log(JSON.stringify(assessment, null, 2));
    return assessment;
  }

  const config = detector.getNetworkConfig(network.id);

  const assessment = {
    isKnownNetwork: true,
    networkName: network.name,
    networkId: network.id,
    url,
    tosLevel: network.tosLevel,
    riskLevel: config?.riskLevel,
    automationPermitted: config?.automationPermitted,
    maxAutomationMode: config?.maxAutomationMode,
    recommendedApproach: config?.recommendedApproach,
    apiAvailable: network.apiAvailable,
    automationNotes: network.automationNotes,
    safeForAutomation: config?.automationPermitted ?? false,
  };

  console.log(JSON.stringify(assessment, null, 2));
  return assessment;
}

// ============================================================================
// EXAMPLE 5: Signup URL Generator
// ============================================================================

/**
 * Generates signup information for networks
 */
export function signupUrlGeneratorExample(networkId: string) {
  const detector = new NetworkDetector();

  console.log('\n=== Signup URL Generator ===');

  const config = detector.getNetworkConfig(networkId);

  if (!config) {
    console.log(`Network "${networkId}" not found`);
    return null;
  }

  const { network } = config;

  const signupInfo = {
    networkName: network.name,
    networkId: network.id,
    signupUrl: network.signupUrl,
    dashboardUrl: network.dashboardUrl,
    apiAvailable: network.apiAvailable,
    automationPermitted: config.automationPermitted,
    riskLevel: config.riskLevel,
    recommendedApproach: config.recommendedApproach,
    instructions: generateSignupInstructions(network, config),
  };

  console.log(JSON.stringify(signupInfo, null, 2));
  return signupInfo;
}

/**
 * Generates human-readable signup instructions
 */
function generateSignupInstructions(
  network: AffiliateNetwork,
  config: NetworkConfig
): string[] {
  const instructions: string[] = [];

  instructions.push(`1. Visit signup page: ${network.signupUrl}`);

  if (config.automationPermitted) {
    if (config.riskLevel === 'low') {
      instructions.push('2. Use automated signup flow (explicitly supported)');
      instructions.push('3. Configure auto-accept links if available');
    } else {
      instructions.push('2. Use human-in-loop workflow:');
      instructions.push('   - Prepare data automatically');
      instructions.push('   - Human reviews and submits');
      instructions.push('   - Automate post-signup tasks');
    }
  } else {
    instructions.push('2. MANUAL SIGNUP ONLY:');
    instructions.push('   - Do NOT use automation tools');
    instructions.push('   - Complete all steps manually');
    instructions.push('   - Human verification required');
    instructions.push(
      `   - Reason: ${network.automationNotes || 'ToS prohibits automation'}`
    );
  }

  if (network.apiAvailable) {
    instructions.push('4. After approval:');
    instructions.push('   - Obtain API credentials');
    instructions.push(`   - Access dashboard: ${network.dashboardUrl}`);
    instructions.push('   - Configure automated reporting');
  }

  return instructions;
}

// ============================================================================
// EXAMPLE 6: Network Search
// ============================================================================

/**
 * Search networks by various criteria
 */
export function searchExample(query: string) {
  const detector = new NetworkDetector();

  console.log('\n=== Network Search ===');
  console.log(`Query: "${query}"\n`);

  const results = detector.searchNetworks(query);

  if (results.length === 0) {
    console.log('No networks found');
    return [];
  }

  console.log(`Found ${results.length} network(s):\n`);

  results.forEach(network => {
    const config = detector.getNetworkConfig(network.id);

    console.log(`${network.name}`);
    console.log(`  ID: ${network.id}`);
    console.log(`  Domain: ${network.domain}`);
    console.log(`  ToS Level: ${network.tosLevel}`);
    console.log(`  Risk: ${config?.riskLevel}`);
    console.log(`  Automation: ${config?.automationPermitted ? 'Permitted' : 'Restricted'}`);
    console.log('');
  });

  return results;
}

// ============================================================================
// EXAMPLE 7: Batch URL Analysis
// ============================================================================

/**
 * Analyzes multiple URLs in batch
 */
export function batchAnalysisExample(urls: string[]) {
  const detector = new NetworkDetector();

  console.log('\n=== Batch URL Analysis ===');
  console.log(`Analyzing ${urls.length} URLs...\n`);

  const results = urls.map(url => {
    const network = detector.detectNetwork(url);
    const tosLevel = detector.getToSLevel(url);

    if (network) {
      const config = detector.getNetworkConfig(network.id);

      return {
        url,
        isAffiliateNetwork: true,
        networkName: network.name,
        tosLevel,
        riskLevel: config?.riskLevel,
        automationPermitted: config?.automationPermitted,
      };
    }

    return {
      url,
      isAffiliateNetwork: false,
      tosLevel,
      automationPermitted: tosLevel <= 1,
    };
  });

  console.table(results);
  return results;
}

// ============================================================================
// EXAMPLE 8: Compliance Report Generator
// ============================================================================

/**
 * Generates compliance report for all networks
 */
export function complianceReportExample() {
  const detector = new NetworkDetector();

  console.log('\n=== Compliance Report ===\n');

  const report = {
    timestamp: new Date().toISOString(),
    totalNetworks: 0,
    byToSLevel: {
      level0: 0,
      level1: 0,
      level2: 0,
      level3: 0,
    },
    byRiskLevel: {
      low: 0,
      medium: 0,
      high: 0,
      extreme: 0,
    },
    automationPermitted: 0,
    automationRestricted: 0,
    withApi: 0,
    withoutApi: 0,
    networks: [] as any[],
  };

  const networks = detector.listSupportedNetworks();
  report.totalNetworks = networks.length;

  networks.forEach(network => {
    const config = detector.getNetworkConfig(network.id);

    // Count by ToS level
    switch (network.tosLevel) {
      case 0:
        report.byToSLevel.level0++;
        break;
      case 1:
        report.byToSLevel.level1++;
        break;
      case 2:
        report.byToSLevel.level2++;
        break;
      case 3:
        report.byToSLevel.level3++;
        break;
    }

    // Count by risk level
    switch (config?.riskLevel) {
      case 'low':
        report.byRiskLevel.low++;
        break;
      case 'medium':
        report.byRiskLevel.medium++;
        break;
      case 'high':
        report.byRiskLevel.high++;
        break;
      case 'extreme':
        report.byRiskLevel.extreme++;
        break;
    }

    // Count automation status
    if (config?.automationPermitted) {
      report.automationPermitted++;
    } else {
      report.automationRestricted++;
    }

    // Count API availability
    if (network.apiAvailable) {
      report.withApi++;
    } else {
      report.withoutApi++;
    }

    // Add to networks list
    report.networks.push({
      id: network.id,
      name: network.name,
      tosLevel: network.tosLevel,
      riskLevel: config?.riskLevel,
      automationPermitted: config?.automationPermitted,
      apiAvailable: network.apiAvailable,
    });
  });

  console.log('Summary:');
  console.log(`  Total Networks: ${report.totalNetworks}`);
  console.log('\nBy ToS Level:');
  console.log(`  Level 0 (Safe): ${report.byToSLevel.level0}`);
  console.log(`  Level 1 (Generic): ${report.byToSLevel.level1}`);
  console.log(`  Level 2 (Social): ${report.byToSLevel.level2}`);
  console.log(`  Level 3 (Financial): ${report.byToSLevel.level3}`);
  console.log('\nBy Risk Level:');
  console.log(`  Low: ${report.byRiskLevel.low}`);
  console.log(`  Medium: ${report.byRiskLevel.medium}`);
  console.log(`  High: ${report.byRiskLevel.high}`);
  console.log(`  Extreme: ${report.byRiskLevel.extreme}`);
  console.log('\nAutomation Status:');
  console.log(`  Permitted: ${report.automationPermitted}`);
  console.log(`  Restricted: ${report.automationRestricted}`);
  console.log('\nAPI Availability:');
  console.log(`  With API: ${report.withApi}`);
  console.log(`  Without API: ${report.withoutApi}`);

  return report;
}

// ============================================================================
// EXAMPLE 9: CLI Tool Simulation
// ============================================================================

/**
 * Simulates a CLI tool for checking networks
 */
export function cliToolExample(args: string[]): void {
  const detector = new NetworkDetector();

  const command = args[0];
  const param = args[1];

  switch (command) {
    case 'check':
      if (!param) {
        console.log('Usage: cli check <url>');
        return;
      }
      riskAssessmentExample(param);
      return;

    case 'list':
      const tosLevel = param ? parseInt(param) : undefined;
      if (tosLevel !== undefined && (tosLevel < 0 || tosLevel > 3)) {
        console.log('ToS level must be 0-3');
        return;
      }
      detector.listSupportedNetworks(tosLevel as any);
      return;

    case 'search':
      if (!param) {
        console.log('Usage: cli search <query>');
        return;
      }
      searchExample(param);
      return;

    case 'info':
      if (!param) {
        console.log('Usage: cli info <network-id>');
        return;
      }
      signupUrlGeneratorExample(param);
      return;

    case 'report':
      complianceReportExample();
      return;

    default:
      console.log('Available commands:');
      console.log('  check <url>       - Check if URL is affiliate network');
      console.log('  list [level]      - List networks (optionally by ToS level)');
      console.log('  search <query>    - Search networks');
      console.log('  info <id>         - Get network information');
      console.log('  report            - Generate compliance report');
      return;
  }
}

// ============================================================================
// RUN EXAMPLES (if executed directly)
// ============================================================================

if (require.main === module) {
  console.log('========================================');
  console.log('  AFFILIATE NETWORK DETECTOR EXAMPLES');
  console.log('========================================');

  // Example 1: Browser extension
  // browserExtensionExample();

  // Example 2: Dashboard list
  dashboardListExample();

  // Example 3: Automation-friendly networks
  filterAutomationFriendlyExample();

  // Example 4: Risk assessment
  riskAssessmentExample('https://account.shareasale.com/login');
  riskAssessmentExample('https://affiliate-program.amazon.com/');
  riskAssessmentExample('http://localhost:3000');

  // Example 5: Signup URL generator
  signupUrlGeneratorExample('partnerstack');
  signupUrlGeneratorExample('amazon-associates');

  // Example 6: Search
  searchExample('Amazon');
  searchExample('impact');

  // Example 7: Batch analysis
  batchAnalysisExample([
    'https://shareasale.com',
    'https://cj.com',
    'https://affiliate-program.amazon.com',
    'http://localhost:3000',
    'https://unknown-network.com',
  ]);

  // Example 8: Compliance report
  complianceReportExample();

  console.log('\n========================================');
  console.log('  EXAMPLES COMPLETE');
  console.log('========================================');
}
