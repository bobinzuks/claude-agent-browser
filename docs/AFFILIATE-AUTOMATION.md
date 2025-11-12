# Affiliate Automation MCP Tools

Complete guide to using the Affiliate Automation commands through the MCP bridge.

## Overview

The Affiliate Automation tools provide compliance-aware automation for affiliate network operations. These tools integrate with the Affiliate-Networks-that-Bundle extension's ToS detection system to ensure safe and compliant automation.

## Features

- **Network Detection**: Automatically identify affiliate networks from URLs
- **Link Extraction**: Extract affiliate links with filtering options
- **Signup Assistance**: Auto-fill forms with human-in-the-loop for sensitive data
- **Compliance Checking**: Verify actions against ToS policies
- **Network Monitoring**: Track signup status and activity
- **Deep Link Generation**: Create affiliate tracking URLs

## Available Tools

### 1. affiliate_detect_network

Detects which affiliate network a URL belongs to and provides ToS compliance information.

**Parameters:**
- `url` (string, required): URL to analyze

**Returns:**
```typescript
{
  networkId: string;        // "shareASale", "cj", "impact", etc.
  name: string;             // Human-readable name
  tosLevel: number;         // 0=Safe, 1=Generic, 2=Social, 3=Financial
  canAutomate: boolean;     // Whether automation is allowed
  confidence: number;       // Detection confidence (0-1)
  matchedPattern?: string;  // Pattern that matched
}
```

**Example:**
```javascript
const result = await executeTool('affiliate_detect_network', {
  url: 'https://shareasale.com/join/merchant-signup'
});

// Result:
// {
//   networkId: "shareASale",
//   name: "ShareASale",
//   tosLevel: 1,
//   canAutomate: true,
//   confidence: 1.0,
//   matchedPattern: "shareasale.com"
// }
```

---

### 2. affiliate_extract_links

Extracts affiliate links from the current page with optional filtering.

**Parameters:**
- `pageId` (string, optional): Page ID to extract from
- `maxLinks` (number, optional): Maximum links to extract (default: 50)
- `filterByProduct` (string, optional): Filter by product name
- `minPrice` (number, optional): Minimum price filter
- `maxPrice` (number, optional): Maximum price filter

**Returns:**
```typescript
{
  links: Array<{
    url: string;
    productName?: string;
    price?: number;
    currency?: string;
    merchantId?: string;
    commission?: string;
    extractedAt: number;
  }>;
  count: number;
}
```

**Example:**
```javascript
// Extract high-value product links
const result = await executeTool('affiliate_extract_links', {
  maxLinks: 20,
  filterByProduct: 'laptop',
  minPrice: 500
});

// Result:
// {
//   links: [
//     {
//       url: "https://shareasale.com/r.cfm?...",
//       productName: "Dell XPS 15 Laptop",
//       price: 1299.99,
//       currency: "USD",
//       merchantId: "12345",
//       commission: "5%"
//     }
//   ],
//   count: 15
// }
```

---

### 3. affiliate_assist_signup

Assists with affiliate network signup by auto-filling non-sensitive fields.

**Parameters:**
- `networkId` (string, required): Network ID (e.g., "shareASale", "cj")
- `userData` (object, required): User information
  - `email` (string, optional)
  - `firstName` (string, optional)
  - `lastName` (string, optional)
  - `company` (string, optional)
  - `website` (string, optional)
  - `phone` (string, optional)
  - `address` (object, optional)
    - `street`, `city`, `state`, `zip`, `country`
- `pageId` (string, optional): Page ID

**Returns:**
```typescript
{
  status: 'form_detected' | 'prefilled' | 'awaiting_human' | 'completed' | 'error';
  nextStep: string;
  formFields?: Array<{
    name: string;
    type: string;
    required: boolean;
    prefilled: boolean;
  }>;
  requiresHumanAction: boolean;
  sensitiveFields?: string[];
}
```

**Example:**
```javascript
const result = await executeTool('affiliate_assist_signup', {
  networkId: 'shareASale',
  userData: {
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    company: 'Example Corp',
    website: 'https://example.com',
    address: {
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'USA'
    }
  }
});

// Result:
// {
//   status: "awaiting_human",
//   nextStep: "Please manually fill sensitive fields: tax_id, ssn",
//   requiresHumanAction: true,
//   sensitiveFields: ["tax_id", "ssn"],
//   formFields: [...]
// }
```

---

### 4. affiliate_check_compliance

Checks if an automation action is compliant with the network's ToS.

**Parameters:**
- `action` (string, required): Action to check (e.g., "auto_signup", "extract_links", "auto_submit")
- `networkId` (string, required): Network ID
- `url` (string, optional): Additional context URL

**Returns:**
```typescript
{
  allowed: boolean;
  level: 'full-auto' | 'assisted-auto' | 'human-guided' | 'human-only';
  reason: string;
  requiresHuman: boolean;
  recommendations?: string[];
}
```

**Example:**
```javascript
// Check if auto-signup is allowed
const result = await executeTool('affiliate_check_compliance', {
  action: 'auto_signup',
  networkId: 'amazon_associates'
});

// Result:
// {
//   allowed: false,
//   level: "human-guided",
//   reason: "Social/E-commerce level - human guidance required",
//   requiresHuman: true,
//   recommendations: [
//     "Use visual guidance for user actions",
//     "Request permission before sensitive operations"
//   ]
// }
```

---

### 5. affiliate_get_status

Returns status information for affiliate networks.

**Parameters:**
- `networkId` (string, optional): Filter by specific network

**Returns:**
```typescript
{
  networks: Array<{
    id: string;
    name: string;
    signupStatus: 'not_started' | 'in_progress' | 'pending_approval' | 'approved' | 'rejected';
    linkCount: number;
    lastActivity?: number;
    accountId?: string;
    apiKey?: string;
  }>;
}
```

**Example:**
```javascript
// Get all network statuses
const result = await executeTool('affiliate_get_status', {});

// Get specific network
const result = await executeTool('affiliate_get_status', {
  networkId: 'shareASale'
});

// Result:
// {
//   networks: [
//     {
//       id: "shareASale",
//       name: "ShareASale",
//       signupStatus: "approved",
//       linkCount: 127,
//       lastActivity: 1699564800000,
//       accountId: "12345"
//     }
//   ]
// }
```

---

### 6. affiliate_generate_link

Generates an affiliate tracking deep link for a target URL.

**Parameters:**
- `targetUrl` (string, required): URL to convert to affiliate link
- `networkId` (string, required): Network ID
- `affiliateId` (string, optional): Your affiliate ID for tracking

**Returns:**
```typescript
{
  affiliateUrl: string;
  originalUrl: string;
  networkId: string;
  commission?: string;
  trackingId?: string;
  expiresAt?: number;
}
```

**Example:**
```javascript
const result = await executeTool('affiliate_generate_link', {
  targetUrl: 'https://example.com/product/laptop',
  networkId: 'shareASale',
  affiliateId: 'MY_AFFILIATE_ID'
});

// Result:
// {
//   affiliateUrl: "https://shareasale.com/r.cfm?u=MY_AFFILIATE_ID&m=123&urllink=...",
//   originalUrl: "https://example.com/product/laptop",
//   networkId: "shareASale",
//   commission: "Varies by merchant",
//   trackingId: "mcp_1699564800000"
// }
```

## Supported Networks

The following affiliate networks are currently supported:

| Network ID | Name | ToS Level | Can Automate | API Available |
|------------|------|-----------|--------------|---------------|
| `shareASale` | ShareASale | Generic (1) | Yes | Yes |
| `cj` | Commission Junction | Generic (1) | Yes | Yes |
| `rakuten` | Rakuten Advertising | Generic (1) | Yes | Yes |
| `impact` | Impact | Generic (1) | Yes | Yes |
| `amazon_associates` | Amazon Associates | Social (2) | No | Yes |
| `clickbank` | ClickBank | Generic (1) | Yes | Yes |
| `awin` | Awin | Generic (1) | Yes | Yes |
| `partnerstack` | PartnerStack | Generic (1) | Yes | Yes |
| `rewardful` | Rewardful | Generic (1) | Yes | Yes |
| `refersion` | Refersion | Generic (1) | Yes | Yes |
| `pepperjam` | Pepperjam (Ascend) | Generic (1) | Yes | Yes |

## ToS Compliance Levels

| Level | Name | Description | Automation |
|-------|------|-------------|------------|
| 0 | Safe Domain | Localhost, development | Full Auto |
| 1 | Generic Site | Most affiliate networks | Assisted Auto |
| 2 | Social/E-commerce | Amazon, social platforms | Human-Guided |
| 3 | Financial/Government | Banks, government | Human-Only |

## Compliance Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `full-auto` | Silent execution | Development, safe domains |
| `assisted-auto` | Auto with notifications | Generic affiliate networks |
| `human-guided` | Visual guidance + permission | Social/e-commerce platforms |
| `human-only` | No automation, learning only | Financial institutions |

## Usage Patterns

### Complete Signup Workflow

```javascript
// 1. Navigate to signup page
await executeTool('navigate', {
  url: 'https://shareasale.com/signup'
});

// 2. Detect network
const network = await executeTool('affiliate_detect_network', {
  url: 'https://shareasale.com/signup'
});

// 3. Check compliance
const compliance = await executeTool('affiliate_check_compliance', {
  action: 'auto_signup',
  networkId: network.networkId
});

if (compliance.allowed) {
  // 4. Assist with signup
  const signup = await executeTool('affiliate_assist_signup', {
    networkId: network.networkId,
    userData: {
      email: 'user@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      website: 'https://mysite.com'
    }
  });

  console.log('Next step:', signup.nextStep);

  if (signup.sensitiveFields?.length > 0) {
    console.log('Please manually fill:', signup.sensitiveFields);
  }
}
```

### Extract and Generate Links

```javascript
// 1. Navigate to merchant page
await executeTool('navigate', {
  url: 'https://shareasale.com/merchants'
});

// 2. Extract affiliate links
const links = await executeTool('affiliate_extract_links', {
  maxLinks: 50,
  filterByProduct: 'software',
  minPrice: 50
});

// 3. Generate deep links
for (const link of links.links) {
  const deepLink = await executeTool('affiliate_generate_link', {
    targetUrl: link.url,
    networkId: 'shareASale',
    affiliateId: 'MY_ID'
  });

  console.log('Generated:', deepLink.affiliateUrl);
}
```

### Monitor Network Status

```javascript
// Get all network statuses
const status = await executeTool('affiliate_get_status', {});

for (const network of status.networks) {
  console.log(`${network.name}: ${network.signupStatus}`);
  console.log(`  Links: ${network.linkCount}`);

  if (network.signupStatus === 'not_started') {
    console.log(`  → Consider signing up for ${network.name}`);
  }
}
```

## Best Practices

### 1. Always Check Compliance First

```javascript
// DON'T do this:
await executeTool('affiliate_assist_signup', { ... });

// DO this:
const compliance = await executeTool('affiliate_check_compliance', {
  action: 'auto_signup',
  networkId: 'amazon_associates'
});

if (compliance.allowed) {
  await executeTool('affiliate_assist_signup', { ... });
} else {
  console.log('Manual action required:', compliance.reason);
}
```

### 2. Handle Sensitive Fields Manually

Never attempt to auto-fill:
- Tax IDs (EIN, SSN)
- Payment information
- Passwords
- Security questions

The `affiliate_assist_signup` tool automatically skips these fields and flags them in `sensitiveFields`.

### 3. Use Network Detection

```javascript
// Detect before operating
const network = await executeTool('affiliate_detect_network', {
  url: currentPageUrl
});

if (network.networkId === 'none') {
  console.log('Not an affiliate network');
  return;
}

// Proceed with network-specific operations
```

### 4. Filter Link Extraction

```javascript
// Be specific with filters
const links = await executeTool('affiliate_extract_links', {
  filterByProduct: 'laptop',
  minPrice: 500,
  maxPrice: 2000,
  maxLinks: 20  // Don't extract more than needed
});
```

## Error Handling

All tools return structured results. Check the `success` field and handle errors appropriately:

```javascript
try {
  const result = await executeTool('affiliate_assist_signup', {
    networkId: 'shareASale',
    userData: { ... }
  });

  if (!result.success) {
    console.error('Signup assistance failed:', result.nextStep);
    return;
  }

  if (result.requiresHumanAction) {
    console.log('Human action needed:', result.sensitiveFields);
  }
} catch (error) {
  console.error('Tool execution failed:', error);
}
```

## Integration with Extension

These MCP tools integrate seamlessly with the Affiliate-Networks-that-Bundle Chrome extension:

1. **Network Detection**: Uses the same ToS database
2. **Compliance**: Respects the same 4-level ToS system
3. **Pattern Detection**: Can learn from user actions
4. **Privacy**: Filters sensitive data automatically

## Security Considerations

1. **Sensitive Data**: Never auto-fill tax IDs, SSNs, passwords, or payment info
2. **ToS Compliance**: Always check compliance before automation
3. **Human Verification**: Require human confirmation for:
   - Form submissions
   - Account creation
   - Payment operations
4. **Data Privacy**: User data is only used for form filling, never stored

## Limitations

1. **Network Coverage**: Only 11 networks currently supported
2. **Dynamic Forms**: Some complex forms may not be detected
3. **API Limitations**: Deep link generation requires affiliate ID
4. **Rate Limiting**: Respect network rate limits when extracting links

## Future Enhancements

- [ ] Add more affiliate networks
- [ ] Support for 2FA signup flows
- [ ] Automatic credential management
- [ ] Link performance tracking
- [ ] Commission rate monitoring
- [ ] Auto-approval notifications

## Support

For issues or feature requests, refer to the main project documentation.
