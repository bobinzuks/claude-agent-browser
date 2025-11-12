# Network Detector - Quick Reference

## Installation

```typescript
import { detectNetwork, getToSLevel, NetworkDetector } from '@/affiliate';
```

## Quick Start (30 seconds)

```typescript
// Detect network
const network = detectNetwork('https://shareasale.com');
// → { id: 'shareasale', name: 'ShareASale', tosLevel: 1, ... }

// Check ToS level
const level = getToSLevel('http://localhost:3000');
// → 0 (safe for automation)

// Get network config
const detector = new NetworkDetector();
const config = detector.getNetworkConfig('amazon-associates');
// → { automationPermitted: false, riskLevel: 'high', ... }
```

## ToS Levels (Cheat Sheet)

| Level | Type | Automation | Examples |
|-------|------|------------|----------|
| **0** | Safe | ✅ Full Auto | `localhost`, `*.local`, `192.168.*` |
| **1** | Generic | ✅ Human-in-Loop | ShareASale, CJ, Impact, Rakuten |
| **2** | Social | ❌ Manual Only | Amazon, Teachable |
| **3** | Financial | ❌ Never | Banks, Government |

## Common Use Cases

### 1. Is this safe to automate?
```typescript
const tosLevel = getToSLevel(url);
const safe = tosLevel <= 1; // true = safe, false = restricted
```

### 2. What network is this?
```typescript
const network = detectNetwork(url);
console.log(network?.name); // "ShareASale" or null
```

### 3. Get all automation-friendly networks
```typescript
const detector = new NetworkDetector();
const safe = detector.getNetworksByRiskLevel('low');
// → [PartnerStack, Reditus]
```

### 4. Risk assessment
```typescript
const config = detector.getNetworkConfig('amazon-associates');
console.log(config.riskLevel); // "high"
console.log(config.automationPermitted); // false
console.log(config.recommendedApproach); // "Manual only..."
```

### 5. Search networks
```typescript
const results = detector.searchNetworks('impact');
// → [Impact.com]
```

## Network Database

### ✅ Low Risk (Automation-Friendly)
- **PartnerStack** - Auto-accept links
- **Reditus** - Auto-accept feature

### ⚠️ Medium Risk (Human-in-Loop)
- **ShareASale** - API for reporting only
- **CJ Affiliate** - Personal Access Tokens
- **Impact.com** - REST API
- **Rakuten** - API for data
- **ClickBank** - Manual approval

### ❌ High Risk (Manual Only)
- **Amazon Associates** - EXPLICIT BAN on automation
- **Teachable** - LEGAL THREATS for automation

## API Cheatsheet

```typescript
// Detection
detectNetwork(url)              // → AffiliateNetwork | null
isAffiliateNetwork(url)         // → boolean
getToSLevel(url)                // → 0 | 1 | 2 | 3

// Config
getNetworkConfig(id)            // → NetworkConfig | null

// Lists
getAllNetworks()                // → AffiliateNetwork[]
listSupportedNetworks(level?)   // → AffiliateNetwork[]
getNetworksByRiskLevel(risk)    // → AffiliateNetwork[]
getNetworksByApiAvailability()  // → AffiliateNetwork[]

// Search
searchNetworks(query)           // → AffiliateNetwork[]
```

## Types

```typescript
type ToSLevel = 0 | 1 | 2 | 3;

interface AffiliateNetwork {
  id: string;
  name: string;
  domain: string;
  tosLevel: ToSLevel;
  apiAvailable: boolean;
  signupUrl: string;
  dashboardUrl: string;
  automationNotes?: string;
}

interface NetworkConfig {
  network: AffiliateNetwork;
  automationPermitted: boolean;
  maxAutomationMode: 'none' | 'human-guided' | 'assisted-auto' | 'full-auto';
  recommendedApproach: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}
```

## Decision Tree

```
URL received
    │
    ├─ localhost/192.168.*/*.local? → ToS Level 0 ✅ Full Auto
    │
    ├─ Known network?
    │   ├─ PartnerStack/Reditus? → Low Risk ✅ Auto-Friendly
    │   ├─ ShareASale/CJ/Impact? → Medium Risk ⚠️ Human-in-Loop
    │   ├─ Amazon/Teachable? → High Risk ❌ Manual Only
    │   └─ Unknown → ToS Level 1 ⚠️ Human-in-Loop
    │
    └─ Default → ToS Level 1 ⚠️ Human-in-Loop
```

## Examples

### Browser Extension
```typescript
// content-script.ts
const network = detectNetwork(window.location.href);
if (network && !detector.getNetworkConfig(network.id)?.automationPermitted) {
  alert('⚠️ Automation prohibited on ' + network.name);
}
```

### CLI Tool
```bash
$ check-network https://shareasale.com
Network: ShareASale
ToS Level: 1
Risk: medium
Automation: permitted
```

### Dashboard
```typescript
const networks = getAllNetworks();
console.table(networks.map(n => ({
  name: n.name,
  tosLevel: n.tosLevel,
  api: n.apiAvailable ? '✅' : '❌'
})));
```

## Files

```
/affiliate/
├── index.ts                 # Entry point
├── network-detector.ts      # Core module (652 lines)
├── network-detector.test.ts # Tests (517 lines)
├── examples.ts              # Examples (577 lines)
├── README.md                # Full docs (597 lines)
├── DELIVERABLE.md          # Summary
└── QUICK-REFERENCE.md      # This file
```

## Testing

```bash
npm test network-detector.test.ts
```

## Need More?

- **Full Docs**: See `README.md`
- **Examples**: See `examples.ts`
- **Tests**: See `network-detector.test.ts`
- **Summary**: See `DELIVERABLE.md`

---

**TL;DR**: Import, detect, check ToS level, done. 🚀
