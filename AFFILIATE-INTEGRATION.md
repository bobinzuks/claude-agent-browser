# Affiliate Automation MCP Integration

Complete implementation of affiliate network automation commands for the MCP bridge.

## 📁 Files Created

### Core Implementation
- **`src/mcp-bridge/affiliate-commands.ts`** (791 lines)
  - Main implementation of all 6 affiliate automation tools
  - Network detection with ToS compliance
  - Link extraction and generation
  - Signup assistance with human-in-the-loop
  - Compliance checking engine
  - Network status monitoring

### Integration
- **`src/mcp-bridge/mcp-server.ts`** (modified)
  - Added `AffiliateAutomationTools` import and initialization
  - Registered 6 new MCP tool definitions
  - Added execution handlers for all affiliate commands

### Documentation
- **`docs/AFFILIATE-AUTOMATION.md`** (400+ lines)
  - Complete API reference for all 6 tools
  - Usage examples and best practices
  - Supported networks database
  - ToS compliance levels explained
  - Security considerations
  - Error handling patterns

### Testing
- **`src/mcp-bridge/test-affiliate-tools.ts`** (175 lines)
  - Test suite demonstrating all tool capabilities
  - Mock data and examples
  - Can be run standalone or imported

## 🛠️ MCP Tools Implemented

### 1. `affiliate_detect_network`
Detects affiliate network from URL and returns ToS compliance level.

**Input:** `{ url: string }`

**Output:**
```typescript
{
  networkId: string;
  name: string;
  tosLevel: number;
  canAutomate: boolean;
  confidence: number;
  matchedPattern?: string;
}
```

### 2. `affiliate_extract_links`
Extracts affiliate links from current page with optional filtering.

**Input:**
```typescript
{
  pageId?: string;
  maxLinks?: number;
  filterByProduct?: string;
  minPrice?: number;
  maxPrice?: number;
}
```

**Output:**
```typescript
{
  links: AffiliateLink[];
  count: number;
}
```

### 3. `affiliate_assist_signup`
Auto-fills signup forms with human-in-the-loop for sensitive fields.

**Input:**
```typescript
{
  networkId: string;
  userData: UserData;
  pageId?: string;
}
```

**Output:**
```typescript
{
  status: 'form_detected' | 'prefilled' | 'awaiting_human' | 'completed' | 'error';
  nextStep: string;
  formFields?: FormField[];
  requiresHumanAction: boolean;
  sensitiveFields?: string[];
}
```

### 4. `affiliate_check_compliance`
Verifies if an action is compliant with network ToS.

**Input:**
```typescript
{
  action: string;
  networkId: string;
  url?: string;
}
```

**Output:**
```typescript
{
  allowed: boolean;
  level: ComplianceLevel;
  reason: string;
  requiresHuman: boolean;
  recommendations?: string[];
}
```

### 5. `affiliate_get_status`
Returns status of affiliate networks.

**Input:** `{ networkId?: string }`

**Output:**
```typescript
{
  networks: NetworkStatus[];
}
```

### 6. `affiliate_generate_link`
Generates affiliate tracking deep links.

**Input:**
```typescript
{
  targetUrl: string;
  networkId: string;
  affiliateId?: string;
}
```

**Output:**
```typescript
{
  affiliateUrl: string;
  originalUrl: string;
  networkId: string;
  commission?: string;
  trackingId?: string;
}
```

## 🌐 Supported Networks

| Network | ID | ToS Level | Automation |
|---------|-----|-----------|------------|
| ShareASale | `shareASale` | Generic (1) | ✅ Yes |
| Commission Junction | `cj` | Generic (1) | ✅ Yes |
| Rakuten Advertising | `rakuten` | Generic (1) | ✅ Yes |
| Impact | `impact` | Generic (1) | ✅ Yes |
| Amazon Associates | `amazon_associates` | Social (2) | ❌ No |
| ClickBank | `clickbank` | Generic (1) | ✅ Yes |
| Awin | `awin` | Generic (1) | ✅ Yes |
| PartnerStack | `partnerstack` | Generic (1) | ✅ Yes |
| Rewardful | `rewardful` | Generic (1) | ✅ Yes |
| Refersion | `refersion` | Generic (1) | ✅ Yes |
| Pepperjam | `pepperjam` | Generic (1) | ✅ Yes |

## 🔒 ToS Compliance System

### Levels
- **Level 0 (Safe)**: Localhost, development - Full automation
- **Level 1 (Generic)**: Most affiliate networks - Assisted automation
- **Level 2 (Social)**: Amazon, social platforms - Human-guided only
- **Level 3 (Financial)**: Banks, government - Human-only, no automation

### Compliance Modes
- **`full-auto`**: Silent execution (Level 0)
- **`assisted-auto`**: Auto with notifications (Level 1)
- **`human-guided`**: Visual guidance + permission (Level 2)
- **`human-only`**: No automation, learning only (Level 3)

## 🎯 Integration with Extension

This MCP implementation integrates seamlessly with the Affiliate-Networks-that-Bundle Chrome extension:

1. **Shared ToS Database**: Uses the same network classifications
2. **Compliance Enforcement**: Respects the same 4-level system
3. **Privacy First**: Filters sensitive data automatically
4. **Pattern Detection**: Can leverage learned patterns from extension

## 🚀 Usage Example

```typescript
// 1. Detect network
const network = await executeTool('affiliate_detect_network', {
  url: 'https://shareasale.com/signup'
});

// 2. Check compliance
const compliance = await executeTool('affiliate_check_compliance', {
  action: 'auto_signup',
  networkId: network.networkId
});

if (compliance.allowed) {
  // 3. Navigate to signup page
  await executeTool('navigate', {
    url: 'https://shareasale.com/signup'
  });

  // 4. Assist with signup
  const result = await executeTool('affiliate_assist_signup', {
    networkId: network.networkId,
    userData: {
      email: 'user@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      website: 'https://mysite.com'
    }
  });

  console.log('Status:', result.status);
  console.log('Next step:', result.nextStep);

  if (result.sensitiveFields?.length > 0) {
    console.log('Please manually fill:', result.sensitiveFields);
  }
}
```

## 🔐 Security Features

### Sensitive Field Detection
Automatically identifies and flags sensitive fields:
- Tax IDs (EIN, SSN)
- Passwords
- Payment information
- Security questions

### Human-in-the-Loop
- Sensitive fields are never auto-filled
- User must manually input critical data
- Clear indication of required human actions

### ToS Compliance
- Respects network automation policies
- Blocks forbidden actions
- Provides compliance recommendations

## 📊 Statistics

- **Total Lines of Code**: ~1,500
- **MCP Tools**: 6
- **Supported Networks**: 11
- **ToS Levels**: 4
- **Compliance Modes**: 4
- **Type Definitions**: 15+

## 🧪 Testing

Run the test suite:

```bash
# Build the project
npm run build

# Run affiliate tools test
node dist/mcp-bridge/test-affiliate-tools.js
```

The test suite demonstrates:
- Network detection across multiple URLs
- Compliance checking for various actions
- Network status retrieval
- Deep link generation
- Mock examples for link extraction and signup assistance

## 📚 Documentation

Complete documentation available at:
- **API Reference**: `docs/AFFILIATE-AUTOMATION.md`
- **Integration Guide**: This file
- **Extension Docs**: `/media/terry/data/projects/projects/Affiliate-Networks-that-Bundle/APP-INTEGRATION-GUIDE.md`

## 🔄 Integration Points

### With Browser Controller
- Uses `executeScript` for DOM manipulation
- Uses `navigate` for page navigation
- Uses `fill` for form filling

### With Extension Core
- Shares `ToSLevel` enum
- Compatible with `tos-detector.ts`
- Aligns with `pattern-detector.ts`
- Uses same compliance logic

## 🎨 Architecture

```
affiliate-commands.ts
├── Network Detection
│   ├── URL pattern matching
│   ├── Domain checking
│   └── ToS level assignment
├── Link Extraction
│   ├── DOM querying
│   ├── Affiliate pattern detection
│   └── Product/price extraction
├── Signup Assistance
│   ├── Form detection
│   ├── Field mapping
│   ├── Sensitive field filtering
│   └── Auto-fill non-sensitive
├── Compliance Checking
│   ├── ToS level evaluation
│   ├── Action validation
│   └── Recommendation generation
├── Status Monitoring
│   └── Network state tracking
└── Deep Link Generation
    └── Network-specific URL building
```

## ✅ Features Implemented

- [x] Network detection with 11 supported networks
- [x] ToS compliance with 4-level system
- [x] Link extraction with filtering
- [x] Signup assistance with human-in-the-loop
- [x] Compliance checking
- [x] Network status monitoring
- [x] Deep link generation
- [x] Complete API documentation
- [x] Test suite with examples
- [x] TypeScript type safety
- [x] Integration with MCP server
- [x] Security best practices

## 🔮 Future Enhancements

- [ ] Add more affiliate networks (50+ total)
- [ ] API integration for real-time data
- [ ] Commission rate tracking
- [ ] Performance analytics
- [ ] Auto-approval notifications
- [ ] 2FA signup flow support
- [ ] Credential management
- [ ] Link performance tracking

## 📝 Notes

1. **Privacy**: All user data stays local, never stored permanently
2. **Compliance**: Strictly follows each network's ToS policies
3. **Security**: Sensitive fields are never auto-filled
4. **Extensibility**: Easy to add new networks and features
5. **Integration**: Works seamlessly with existing MCP tools

## 🤝 Contributing

To add a new affiliate network:

1. Add entry to `AFFILIATE_NETWORKS` in `affiliate-commands.ts`
2. Specify domains, ToS level, and automation capability
3. Add deep link generation logic if needed
4. Update documentation
5. Add test cases

## 📄 License

Same as parent project (claude-agent-browser).
