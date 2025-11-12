# Affiliate Network Configurations

This directory contains per-network automation profiles for major affiliate networks. Each configuration file defines signup requirements, link extraction strategies, API details, and automation rules.

## Directory Structure

```
network-configs/
├── types.ts                  # TypeScript type definitions
├── index.ts                  # Central export and utility functions
├── shareasale.ts            # ShareASale configuration
├── cj-affiliate.ts          # CJ Affiliate configuration
├── impact.ts                # Impact.com configuration
├── rakuten.ts               # Rakuten Advertising configuration
├── clickbank.ts             # ClickBank configuration
├── partnerstack.ts          # PartnerStack configuration
├── amazon-associates.ts     # Amazon Associates configuration
└── README.md                # This file
```

## Configuration Structure

Each network configuration includes:

### 1. Basic Information
- **id**: Unique identifier
- **name**: Display name
- **domain**: Primary domain
- **tosLevel**: Terms of Service compliance level (0-3)

### 2. Signup Configuration
- **url**: Signup page URL
- **automationLevel**: Level of automation allowed
- **formSelectors**: CSS selectors for form fields
- **requiredFields**: List of required field names
- **sensitiveFields**: Fields that should never be stored
- **verificationSteps**: Email, phone, or manual review steps

### 3. Link Extraction Configuration
- **dashboardUrl**: Affiliate dashboard URL
- **productCatalogUrl**: Product/merchant catalog URL
- **extractionStrategy**: How to extract links (api/dom/csv/manual)
- **selectors**: CSS selectors for link extraction
- **notes**: Important notes about link extraction

### 4. API Configuration
- **available**: Whether an API is available
- **baseUrl**: API base URL
- **authMethod**: Authentication method (api-key, oauth2, etc.)
- **docsUrl**: API documentation URL
- **endpoints**: Available API endpoints
- **rateLimit**: API rate limits

### 5. Metadata
- Payment information (minimums, methods)
- Approval times
- Cookie durations
- Commission rates
- Product categories
- Additional notes

## TOS Levels

```typescript
enum TOSLevel {
  FULLY_AUTOMATED = 0,     // API or documented automation support
  HUMAN_GUIDED = 1,        // Standard forms, no restrictions
  MANUAL_VERIFICATION = 2, // Email/phone verification required
  FULLY_MANUAL = 3,        // Anti-bot measures, NO automation
}
```

## Automation Levels

```typescript
type AutomationLevel =
  | 'fully-automated'  // Can be fully automated
  | 'human-in-loop'    // Automation with human oversight
  | 'manual-only';     // Must be done manually
```

## Extraction Strategies

```typescript
type ExtractionStrategy =
  | 'api'           // Use official API (preferred)
  | 'dom'           // DOM scraping
  | 'csv-export'    // Export CSV/file
  | 'manual-copy';  // Manual copy-paste only
```

## Usage Examples

### Import all configurations

```typescript
import { NETWORK_CONFIGS, ALL_NETWORKS } from './network-configs';
```

### Get specific network config

```typescript
import { getNetworkConfig } from './network-configs';

const config = getNetworkConfig('shareasale');
console.log(config.signup.url);
```

### Get API-enabled networks

```typescript
import { getAPIEnabledNetworks } from './network-configs';

const apiNetworks = getAPIEnabledNetworks();
// Returns: Impact, CJ, Rakuten, ClickBank, PartnerStack
```

### Get networks by automation level

```typescript
import { getNetworksByAutomationLevel } from './network-configs';

const fullyAutomated = getNetworksByAutomationLevel('fully-automated');
// Returns: PartnerStack

const manualOnly = getNetworksByAutomationLevel('manual-only');
// Returns: Amazon Associates
```

### Find network by domain

```typescript
import { findNetworkByDomain } from './network-configs';

const network = findNetworkByDomain('shareasale.com');
console.log(network.name); // "ShareASale"
```

## Network Summaries

### ShareASale
- **TOS Level**: Human-guided (1)
- **API**: No
- **Automation**: Human-in-loop
- **Extraction**: DOM scraping
- **Notes**: One of oldest networks. No API for general affiliates.

### CJ Affiliate
- **TOS Level**: Manual verification (2)
- **API**: Yes
- **Automation**: Human-in-loop
- **Extraction**: API (preferred)
- **Notes**: Large network with premium brands. API available.

### Impact.com
- **TOS Level**: Human-guided (1)
- **API**: Yes
- **Automation**: Human-in-loop
- **Extraction**: API (preferred)
- **Notes**: Modern platform. Developer-friendly. Excellent API.

### Rakuten Advertising
- **TOS Level**: Manual verification (2)
- **API**: Yes
- **Automation**: Human-in-loop
- **Extraction**: API (preferred)
- **Notes**: Major network. Strict approval. Good API.

### ClickBank
- **TOS Level**: Human-guided (1)
- **API**: Yes
- **Automation**: Human-in-loop
- **Extraction**: DOM or API
- **Notes**: Digital products. Instant approval. High commissions.

### PartnerStack
- **TOS Level**: Fully automated (0)
- **API**: Yes (excellent)
- **Automation**: Fully-automated
- **Extraction**: API (preferred)
- **Notes**: SaaS-focused. API-first. Automation-friendly.

### Amazon Associates
- **TOS Level**: Fully manual (3)
- **API**: No (for link generation)
- **Automation**: MANUAL ONLY
- **Extraction**: Manual copy only
- **Notes**: ⚠️ STRICT ANTI-AUTOMATION. Never automate.

## Critical Warnings

### Amazon Associates
**NEVER AUTOMATE AMAZON ASSOCIATES IN ANY WAY**

Amazon has strict anti-automation policies. Any automation of signup, login, or link generation violates their Terms of Service and will result in:
- Immediate account termination
- Forfeiture of all unpaid commissions
- Potential legal action
- Permanent ban

All Amazon operations must be performed manually through the official web interface.

## Adding New Networks

To add a new network configuration:

1. Create a new file: `{network-id}.ts`
2. Follow the structure in existing configs
3. Include all required fields
4. Add proper DOM selectors if automation is allowed
5. Document any special requirements or restrictions
6. Export the config in `index.ts`
7. Update this README with network summary

## Best Practices

1. **Always check TOS before automation**
   - Review network's Terms of Service
   - Look for explicit automation prohibitions
   - When in doubt, use human-in-loop

2. **Prefer API over scraping**
   - APIs are more stable and TOS-compliant
   - Better rate limits and reliability
   - Less likely to break with UI changes

3. **Handle sensitive fields properly**
   - Never log or store passwords
   - Encrypt sensitive data at rest
   - Use secure vaults for credentials

4. **Respect rate limits**
   - Follow API rate limits strictly
   - Add delays between requests
   - Implement exponential backoff

5. **Human oversight for critical actions**
   - Review before submitting signups
   - Verify extracted links
   - Monitor for TOS changes

## Compliance

This automation system is designed with compliance in mind:

- **Transparency**: All actions are logged
- **Human oversight**: Critical actions require approval
- **Respect TOS**: Automation levels match TOS restrictions
- **Security**: Sensitive data properly handled
- **Auditing**: Full audit trail maintained

## Support

For questions or issues:
1. Review network-specific configuration file
2. Check network's official documentation
3. Consult TOS and API docs
4. Test with small-scale operations first

## License

These configurations are provided for reference and compliance purposes.
Always review and comply with each network's current Terms of Service.
