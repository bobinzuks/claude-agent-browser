# Affiliate Network Detection Module

Intelligent affiliate network detection with ToS-aware automation policies.

## Features

- **Network Detection**: Automatically identify affiliate networks from URLs
- **ToS Classification**: 4-level compliance system (0-3)
- **Risk Assessment**: Automatic risk level calculation
- **API Metadata**: Information about API availability and endpoints
- **Pattern Matching**: Support for wildcard domains and alternate URLs
- **Zero Dependencies**: Pure TypeScript implementation

## Quick Start

```typescript
import { NetworkDetector, detectNetwork, getToSLevel } from './network-detector';

// Create detector instance
const detector = new NetworkDetector();

// Detect network from URL
const network = detector.detectNetwork('https://account.shareasale.com/login');
console.log(network?.name); // "ShareASale"
console.log(network?.tosLevel); // 1

// Check ToS level for any domain
const level = getToSLevel('http://localhost:3000'); // 0 (safe)
const level2 = getToSLevel('https://affiliate-program.amazon.com'); // 2 (restricted)

// Get network configuration
const config = detector.getNetworkConfig('partnerstack');
console.log(config?.automationPermitted); // true
console.log(config?.riskLevel); // "low"
```

## ToS Levels

### Level 0: Safe Domains (Full Auto)
- **Domains**: `localhost`, `127.0.0.1`, `*.local`, private IPs
- **Automation**: Fully permitted, immediate
- **Risk**: Low
- **Use Case**: Development and testing

### Level 1: Generic Sites (Auto-Promotes)
- **Networks**: ShareASale, CJ, Impact, Rakuten, ClickBank, PartnerStack, Reditus
- **Automation**: Permitted with human-in-loop workflow
- **Risk**: Low to Medium
- **Behavior**: Auto-promotes with confidence (after learning)

### Level 2: Social/E-commerce (Always Human-Guided)
- **Networks**: Amazon Associates, Teachable
- **Automation**: Not permitted (explicit ToS prohibition)
- **Risk**: High
- **Behavior**: Human-guided only, never fully automates

### Level 3: Financial/Government (Never Automates)
- **Domains**: Banking, payment processors, government sites
- **Automation**: Never
- **Risk**: Extreme
- **Behavior**: Observation only

## Supported Networks

### Automation-Friendly (Low Risk)

#### PartnerStack
```typescript
{
  id: 'partnerstack',
  tosLevel: 1,
  apiAvailable: true,
  automationNotes: 'EXPLICITLY SUPPORTS automation via auto-accept links',
  riskLevel: 'low'
}
```

#### Reditus
```typescript
{
  id: 'reditus',
  tosLevel: 1,
  apiAvailable: true,
  automationNotes: 'AUTO-ACCEPT LINKS feature. Designed for automation.',
  riskLevel: 'low'
}
```

### Standard Networks (Medium Risk)

#### ShareASale
```typescript
{
  id: 'shareasale',
  domain: 'shareasale.com',
  tosLevel: 1,
  apiAvailable: true,
  automationNotes: 'API for reporting/transactions only. No public signup API.'
}
```

#### CJ Affiliate
```typescript
{
  id: 'cj-affiliate',
  domain: 'cj.com',
  tosLevel: 1,
  apiAvailable: true,
  automationNotes: 'Personal Access Tokens for reporting/analytics.'
}
```

#### Impact.com
```typescript
{
  id: 'impact',
  domain: 'impact.com',
  alternateDomains: ['impact.radius.com'],
  tosLevel: 1,
  apiAvailable: true
}
```

#### Rakuten Advertising
```typescript
{
  id: 'rakuten',
  domain: 'rakutenadvertising.com',
  alternateDomains: ['linkshare.com', 'linksynergy.com'],
  tosLevel: 1,
  apiAvailable: true
}
```

#### ClickBank
```typescript
{
  id: 'clickbank',
  domain: 'clickbank.com',
  tosLevel: 1,
  apiAvailable: false,
  automationNotes: 'Manual approval process.'
}
```

### Restricted Networks (High Risk)

#### Amazon Associates
```typescript
{
  id: 'amazon-associates',
  domain: 'affiliate-program.amazon.com',
  tosLevel: 2,
  apiAvailable: true,
  automationNotes: 'EXPLICITLY PROHIBITS bots/automated software. EXTREME RISK.',
  riskLevel: 'high'
}
```

#### Teachable
```typescript
{
  id: 'teachable',
  domain: 'teachable.com',
  tosLevel: 2,
  apiAvailable: false,
  automationNotes: 'STRICTLY PROHIBITS automated scripts/bots. Threatens legal action.',
  riskLevel: 'high'
}
```

## API Reference

### NetworkDetector Class

#### detectNetwork(url: string): AffiliateNetwork | null
Detects affiliate network from URL.

```typescript
const network = detector.detectNetwork('https://app.impact.com/');
if (network) {
  console.log(`Detected: ${network.name}`);
  console.log(`ToS Level: ${network.tosLevel}`);
  console.log(`API Available: ${network.apiAvailable}`);
}
```

#### getNetworkConfig(networkId: string): NetworkConfig | null
Gets full configuration including automation policies.

```typescript
const config = detector.getNetworkConfig('shareasale');
console.log(config?.automationPermitted); // true
console.log(config?.maxAutomationMode); // 'full-auto'
console.log(config?.recommendedApproach); // 'Human-in-loop workflow...'
console.log(config?.riskLevel); // 'medium'
```

#### listSupportedNetworks(tosLevel?: ToSLevel): AffiliateNetwork[]
Lists all supported networks, optionally filtered by ToS level.

```typescript
// Get all networks
const all = detector.listSupportedNetworks();

// Get only automation-friendly networks
const safe = detector.listSupportedNetworks(1);

// Get restricted networks
const restricted = detector.listSupportedNetworks(2);
```

#### isAffiliateNetwork(url: string): boolean
Quick check if URL is a supported affiliate network.

```typescript
if (detector.isAffiliateNetwork('https://shareasale.com')) {
  console.log('This is an affiliate network!');
}
```

#### getToSLevel(url: string): ToSLevel
Gets ToS compliance level for any domain.

```typescript
const level = detector.getToSLevel('http://localhost:3000'); // 0
const level2 = detector.getToSLevel('https://docs.myapp.com'); // 1
const level3 = detector.getToSLevel('https://github.com'); // 2
```

#### getNetworksByApiAvailability(hasApi: boolean): AffiliateNetwork[]
Filter networks by API availability.

```typescript
const withApi = detector.getNetworksByApiAvailability(true);
const withoutApi = detector.getNetworksByApiAvailability(false);
```

#### getNetworksByRiskLevel(riskLevel): AffiliateNetwork[]
Filter networks by risk level.

```typescript
const lowRisk = detector.getNetworksByRiskLevel('low');
const highRisk = detector.getNetworksByRiskLevel('high');
```

#### searchNetworks(query: string): AffiliateNetwork[]
Search networks by name, domain, or ID.

```typescript
const results = detector.searchNetworks('Amazon');
const results2 = detector.searchNetworks('impact.com');
```

### Helper Functions

```typescript
import {
  isAffiliateNetwork,
  detectNetwork,
  getToSLevel,
  getAllNetworks
} from './network-detector';

// Quick checks
const isAffiliate = isAffiliateNetwork('https://shareasale.com'); // true
const network = detectNetwork('https://cj.com'); // AffiliateNetwork
const level = getToSLevel('http://localhost:3000'); // 0
const all = getAllNetworks(); // AffiliateNetwork[]
```

## Usage Examples

### Example 1: Basic Network Detection

```typescript
import { NetworkDetector } from './network-detector';

const detector = new NetworkDetector();

// User visits URL
const url = 'https://account.shareasale.com/login';

// Detect network
const network = detector.detectNetwork(url);

if (network) {
  console.log(`Network: ${network.name}`);
  console.log(`ToS Level: ${network.tosLevel}`);
  console.log(`Signup: ${network.signupUrl}`);
  console.log(`Dashboard: ${network.dashboardUrl}`);
}
```

Output:
```
Network: ShareASale
ToS Level: 1
Signup: https://account.shareasale.com/newsignup.cfm
Dashboard: https://account.shareasale.com/
```

### Example 2: Automation Decision

```typescript
function shouldAutomate(url: string): boolean {
  const detector = new NetworkDetector();
  const network = detector.detectNetwork(url);

  if (!network) {
    // Unknown network - check ToS level
    const level = detector.getToSLevel(url);
    return level <= 1; // Allow for localhost and generic sites
  }

  // Get config
  const config = detector.getNetworkConfig(network.id);
  return config?.automationPermitted ?? false;
}

// Usage
console.log(shouldAutomate('http://localhost:3000')); // true
console.log(shouldAutomate('https://shareasale.com')); // true
console.log(shouldAutomate('https://affiliate-program.amazon.com')); // false
```

### Example 3: Risk Assessment

```typescript
function assessAutomationRisk(url: string) {
  const detector = new NetworkDetector();
  const network = detector.detectNetwork(url);

  if (!network) {
    return {
      isKnownNetwork: false,
      tosLevel: detector.getToSLevel(url),
      recommendation: 'Unknown network - proceed with caution'
    };
  }

  const config = detector.getNetworkConfig(network.id);

  return {
    isKnownNetwork: true,
    networkName: network.name,
    tosLevel: network.tosLevel,
    riskLevel: config?.riskLevel,
    automationPermitted: config?.automationPermitted,
    recommendation: config?.recommendedApproach
  };
}

// Usage
const assessment = assessAutomationRisk('https://app.partnerstack.com');
console.log(JSON.stringify(assessment, null, 2));
```

Output:
```json
{
  "isKnownNetwork": true,
  "networkName": "PartnerStack",
  "tosLevel": 1,
  "riskLevel": "low",
  "automationPermitted": true,
  "recommendation": "Human-in-loop workflow recommended. Auto-promotes with confidence."
}
```

### Example 4: Dashboard Display

```typescript
function getNetworkDashboardData() {
  const detector = new NetworkDetector();
  const networks = detector.listSupportedNetworks();

  return networks.map(network => {
    const config = detector.getNetworkConfig(network.id);

    return {
      id: network.id,
      name: network.name,
      domain: network.domain,
      tosLevel: network.tosLevel,
      riskLevel: config?.riskLevel,
      apiAvailable: network.apiAvailable,
      automationStatus: config?.automationPermitted ? 'Permitted' : 'Restricted',
      signupUrl: network.signupUrl
    };
  });
}

// Display in UI
const data = getNetworkDashboardData();
console.table(data);
```

### Example 5: Filtering by Criteria

```typescript
const detector = new NetworkDetector();

// Get automation-friendly networks only
const automationFriendly = detector
  .getNetworksByRiskLevel('low')
  .map(n => ({
    name: n.name,
    domain: n.domain,
    notes: n.automationNotes
  }));

console.log('Automation-Friendly Networks:');
console.table(automationFriendly);

// Get networks with API
const withApi = detector
  .getNetworksByApiAvailability(true)
  .map(n => ({
    name: n.name,
    api: 'Available',
    dashboard: n.dashboardUrl
  }));

console.log('Networks with API:');
console.table(withApi);
```

### Example 6: Browser Extension Integration

```typescript
// Content script detecting current page
function analyzeCurrentPage() {
  const detector = new NetworkDetector();
  const currentUrl = window.location.href;

  const network = detector.detectNetwork(currentUrl);

  if (network) {
    // Known affiliate network
    const config = detector.getNetworkConfig(network.id);

    // Send to background script
    chrome.runtime.sendMessage({
      type: 'AFFILIATE_NETWORK_DETECTED',
      network: network,
      config: config,
      url: currentUrl
    });

    // Show user notification
    if (!config?.automationPermitted) {
      showWarning(
        `${network.name} prohibits automation. ` +
        `Risk Level: ${config?.riskLevel}. ` +
        `Recommendation: ${config?.recommendedApproach}`
      );
    }
  }
}

// Run on page load
analyzeCurrentPage();
```

### Example 7: CLI Tool

```typescript
#!/usr/bin/env node
import { NetworkDetector } from './network-detector';

const detector = new NetworkDetector();
const url = process.argv[2];

if (!url) {
  console.error('Usage: check-network <url>');
  process.exit(1);
}

const network = detector.detectNetwork(url);

if (network) {
  const config = detector.getNetworkConfig(network.id);

  console.log(`Network: ${network.name}`);
  console.log(`Domain: ${network.domain}`);
  console.log(`ToS Level: ${network.tosLevel}`);
  console.log(`Risk Level: ${config?.riskLevel}`);
  console.log(`Automation Permitted: ${config?.automationPermitted}`);
  console.log(`Max Automation Mode: ${config?.maxAutomationMode}`);
  console.log(`\nRecommendation:`);
  console.log(config?.recommendedApproach);
  console.log(`\nNotes:`);
  console.log(network.automationNotes);
} else {
  const tosLevel = detector.getToSLevel(url);
  console.log('Unknown affiliate network');
  console.log(`ToS Level: ${tosLevel}`);
  console.log(`Safe for automation: ${tosLevel <= 1}`);
}
```

Usage:
```bash
$ ./check-network.ts https://shareasale.com
Network: ShareASale
Domain: shareasale.com
ToS Level: 1
Risk Level: medium
Automation Permitted: true
Max Automation Mode: full-auto

Recommendation:
Human-in-loop workflow recommended. Auto-promotes with confidence.

Notes:
API for reporting/transactions only. No public signup API. Manual approval recommended.
```

## Testing

```bash
# Run tests
npm test network-detector.test.ts

# Run with coverage
npm test -- --coverage network-detector.test.ts
```

## TypeScript Types

```typescript
// ToS compliance level
type ToSLevel = 0 | 1 | 2 | 3;

// Affiliate network metadata
interface AffiliateNetwork {
  id: string;
  name: string;
  domain: string;
  alternateDomains?: string[];
  tosLevel: ToSLevel;
  apiAvailable: boolean;
  signupUrl: string;
  dashboardUrl: string;
  automationNotes?: string;
  commissionType?: 'cpa' | 'cps' | 'cpl' | 'hybrid';
  minimumPayout?: number;
}

// Network configuration
interface NetworkConfig {
  network: AffiliateNetwork;
  automationPermitted: boolean;
  maxAutomationMode: 'none' | 'human-guided' | 'assisted-auto' | 'full-auto';
  recommendedApproach: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}
```

## Compliance Notes

This module is based on the **COMPLIANCE_REPORT.md** analysis (November 2025) and follows these principles:

1. **Explicit Prohibition Detection**: Networks with explicit ToS prohibitions (Amazon, Teachable) are marked as high risk
2. **API Availability**: Tracks whether networks provide official automation APIs
3. **Risk-Based Classification**: Assigns risk levels based on ToS analysis
4. **Conservative Defaults**: Unknown domains default to Level 1 (requires human-in-loop)
5. **Safe Development**: Localhost and private IPs always Level 0 (safe for automation)

## References

- **COMPLIANCE_REPORT.md**: Complete ToS analysis and legal compliance
- **APP-INTEGRATION-GUIDE.md**: Integration guide and ToS level system
- **Networks Database**: Based on 2025 affiliate network research

## License

MIT

## Contributing

To add a new network:

1. Add network metadata to `AFFILIATE_NETWORKS` array
2. Add domain patterns to `NETWORK_PATTERNS`
3. Assign appropriate ToS level based on analysis
4. Add automation notes from ToS review
5. Add tests for the new network
6. Update this README

## Questions?

See:
- COMPLIANCE_REPORT.md for legal/ToS details
- APP-INTEGRATION-GUIDE.md for integration examples
- network-detector.test.ts for usage examples
