# Capabilities Preservation Map

**Purpose**: Ensure ZERO feature regressions during TypeScript fixes
**Status**: Reference Document - DO NOT MODIFY THESE FEATURES

---

## 🎯 Core Capabilities (MUST PRESERVE)

### 1. MCP Server Integration ✅
**Files**: `src/mcp-bridge/index.ts`, `src/mcp-bridge/mcp-server.ts`

**Features**:
- Stdio communication with Claude Code
- Tool registration and request routing
- Error handling and logging
- Page lifecycle management

**Test Command**:
```bash
node dist/mcp-bridge/index.js
# Should start without errors and wait for stdin
```

**Verification**:
- [ ] Server starts successfully
- [ ] Responds to ping requests
- [ ] Tools are discoverable
- [ ] Handles errors gracefully

---

### 2. Browser Automation Core ✅
**Files**: `src/mcp-bridge/browser-controller.ts`

**Features**:
- Playwright browser launch
- Multi-page session management
- Navigation and wait helpers
- Script execution in page context
- Screenshot capture

**Test Command**:
```bash
npx tsx -e "
import { BrowserController } from './src/mcp-bridge/browser-controller.ts';
const ctrl = new BrowserController();
await ctrl.initialize();
await ctrl.navigate('https://example.com');
await ctrl.screenshot('/tmp/test.png');
console.log('✅ Core automation works');
"
```

**Verification**:
- [ ] Browser launches
- [ ] Navigation works
- [ ] Can execute scripts
- [ ] Screenshots are captured
- [ ] Multiple pages can coexist

---

### 3. Facebook Marketplace (DealBot) ✅
**Files**: `src/mcp-bridge/facebook-marketplace-tools.ts`

**Features**:
- 90%+ extraction success rate (improved from 70-80%)
- 20-field data extraction (including days listed, location, seller info)
- Multi-location batch search (5 concurrent)
- Rate limiting and error recovery
- Multiple extraction methods (6 strategies)

**Test Command**:
```bash
npm run test:marketplace
# OR
npm run test:20-fields
```

**Verification**:
- [ ] Can search single location
- [ ] Batch search works (5 concurrent)
- [ ] Days listed extraction: 90%+ success
- [ ] All 20 fields extracted correctly
- [ ] Rate limiting prevents bans
- [ ] Error recovery works

**Critical Data Fields**:
1. listingId
2. title
3. price
4. currency
5. daysListed ⭐ (most important - 90%+ accuracy)
6. ageText
7. listingLocation
8. sellerName
9. url
10. imageUrl
11. extractionMethod
12. description
13. category
14. condition
15. shippingAvailable
16. meetupLocation
17. postedDate
18. views
19. saves
20. latitude/longitude

---

### 4. Affiliate Network Automation ✅
**Files**: `src/affiliate/*`, `src/mcp-bridge/affiliate-commands.ts`

**Features**:
- 11 affiliate networks supported
- ToS compliance checking (4 safety levels)
- Network detection from URL
- Link extraction with filtering
- Signup assistance (human-in-the-loop)
- Deep link generation
- Compliance logging

**Test Command**:
```bash
npx tsx -e "
import { AffiliateNetworkDetector } from './src/affiliate/network-detector.ts';
const detector = new AffiliateNetworkDetector();
const result = detector.detect('https://www.shareasale.com');
console.log(result); // Should identify ShareASale
"
```

**Verification**:
- [ ] Network detection works for all 11 networks
- [ ] ToS levels correctly assigned
- [ ] Link extraction filters work
- [ ] Signup assistance doesn't auto-submit
- [ ] Compliance logs are created
- [ ] No automation on FINANCIAL_GOV level

**Supported Networks**:
1. ShareASale (GENERIC_SITE)
2. Commission Junction/CJ (GENERIC_SITE)
3. Rakuten Advertising (GENERIC_SITE)
4. Impact (GENERIC_SITE)
5. Amazon Associates (SOCIAL_ECOMMERCE) ⚠️
6. ClickBank (GENERIC_SITE)
7. Awin (GENERIC_SITE)
8. PartnerStack (GENERIC_SITE)
9. Rewardful (GENERIC_SITE)
10. Refersion (GENERIC_SITE)
11. Pepperjam/Ascend (GENERIC_SITE)

---

### 5. Chrome Extension ✅
**Files**: `src/extension/*`

**Features**:
- Content scripts for DOM manipulation
- Background service worker for messaging
- API key collection
- Email account automation
- Password vault
- Visual guidance overlays

**Test Command**:
```bash
# Load unpacked extension in Chrome
# Navigate to chrome://extensions
# Enable Developer mode
# Load unpacked: ./dist/extension
```

**Verification**:
- [ ] Extension loads without errors
- [ ] Content scripts inject
- [ ] Background worker responds
- [ ] API collection works
- [ ] Visual overlays appear
- [ ] Message bridge functional

---

### 6. Multi-Agent Coordination ✅
**Files**: `src/orchestration/agent-coordinator.ts`

**Features**:
- Agent registration with capabilities
- Task distribution and load balancing
- Shared knowledge base
- Performance tracking
- Automatic failover
- Real-time metrics

**Test Command**:
```bash
npx tsx src/orchestration/agent-coordinator.ts
```

**Verification**:
- [ ] Agents can register
- [ ] Tasks are distributed
- [ ] Knowledge sharing works
- [ ] Metrics are tracked
- [ ] Failover on agent death
- [ ] Load balancing is fair

---

### 7. Database Persistence ✅
**Files**: `src/database/sqlite-backend.ts`, `src/database/affiliate-db.ts`

**Features**:
- Test execution tracking
- Pattern learning storage
- Affiliate data persistence
- Compliance audit trail
- Export/import capabilities

**Test Command**:
```bash
npx tsx -e "
import { SQLiteBackend } from './src/database/sqlite-backend.ts';
const db = new SQLiteBackend('./test.db');
db.initialize();
const stats = db.getStats();
console.log('✅ Database works', stats);
"
```

**Verification**:
- [ ] Database initializes
- [ ] Tables are created
- [ ] CRUD operations work
- [ ] Migrations run successfully
- [ ] Export/import functions
- [ ] No data corruption

---

### 8. Pattern Learning (AgentDB) ✅
**Files**: `src/training/agentdb-client.ts`

**Features**:
- HNSW vector similarity search
- Pattern storage and retrieval
- Confidence scoring
- Success rate tracking

**Test Command**:
```bash
npm run test -- agentdb-client.test.ts
```

**Verification**:
- [ ] Vector index creates
- [ ] Similarity search works
- [ ] Patterns are stored
- [ ] Confidence scores calculated
- [ ] Top-K retrieval accurate

---

### 9. Phone Verification ✅
**Files**: `src/extension/lib/phone-verification-handler.ts`, `src/extension/lib/sms-providers/twilio-provider.ts`

**Features**:
- Twilio SMS integration
- Phone number verification
- Code extraction from SMS
- Multiple provider support

**Test Command**:
```bash
npm run test:phone-verification
```

**Verification**:
- [ ] Twilio credentials load
- [ ] SMS can be sent
- [ ] Code is received
- [ ] Auto-fill works
- [ ] Multiple numbers supported

---

### 10. Click Factory (NEW - Being Integrated) ⏸️
**Files**: `src/automation/click-factory/*`

**Features** (once working):
- 4-in-1 split-screen automation
- SPA framework detection
- Self-healing selectors
- Shadow DOM piercing
- Iframe X-Frame-Options bypass
- Gamification system

**Test Command** (after fixes):
```bash
export DISPLAY=:1
npx tsx src/automation/click-factory/turbo-queue.ts
```

**Verification** (post-integration):
- [ ] Turbo queue launches
- [ ] 4 tabs load in parallel
- [ ] SPA detection works
- [ ] Forms auto-fill
- [ ] Gamification tracks progress
- [ ] Tabs auto-close

---

## 🧪 Test Suite Preservation

### Unit Tests
**Files**: `src/tests/unit/*.test.ts`

**Coverage**:
- MCP server tools
- Browser controller methods
- Database operations
- Message bridge
- DOM manipulator
- Affiliate network detector

**Command**: `npm test`

**Success Criteria**:
- [ ] 80%+ tests pass
- [ ] No crashes or exceptions
- [ ] Core tests all green

---

### Integration Tests
**Files**: `src/tests/integration/*.test.ts`

**Coverage**:
- Full MCP workflow
- End-to-end browser automation
- Multi-page scenarios
- Affiliate workflows

**Command**: `npm run test:integration`

**Success Criteria**:
- [ ] All integration tests pass
- [ ] No timeout failures
- [ ] Cleanup works correctly

---

### E2E Tests
**Files**: `tests/*.ts`

**Coverage**:
- Facebook Marketplace full workflow
- Multi-location batch search
- DealBot 20-field extraction
- Affiliate signup workflows
- Auto-research scenarios

**Commands**:
```bash
npm run test:marketplace
npm run test:20-fields
npm run test:multi-location
npm run test:auto-research
```

**Success Criteria**:
- [ ] DealBot extracts 20 fields
- [ ] 90%+ days listed accuracy
- [ ] Multi-location completes
- [ ] No rate limiting issues

---

## 🔍 Manual Verification Checklist

After ANY code changes, verify these work:

### Basic Operations
- [ ] `npm install` - No errors
- [ ] `npm run build` - Compiles successfully
- [ ] `npm test` - 80%+ tests pass
- [ ] `npm start` - MCP server starts

### Core Features
- [ ] Browser automation: Can navigate and click
- [ ] Screenshots: Can capture images
- [ ] Form filling: Can fill input fields
- [ ] Script execution: Can run JavaScript

### Specialized Features
- [ ] Facebook scraping: 90%+ days listed accuracy
- [ ] Affiliate detection: All 11 networks recognized
- [ ] ToS compliance: Safety levels enforced
- [ ] Multi-agent: Tasks distribute correctly

### Extension Features
- [ ] Loads in Chrome without errors
- [ ] Content scripts inject
- [ ] Message bridge works
- [ ] API collection functions

### Data Persistence
- [ ] SQLite database initializes
- [ ] Test results are saved
- [ ] Patterns are learned
- [ ] Compliance logs created

---

## 🚨 Red Flags - Stop Immediately If You See

1. **BrowserController broken** → All automation fails
2. **MCP server won't start** → Claude can't use tools
3. **Facebook extraction < 80%** → DealBot regressed
4. **Extension won't load** → DOM features broken
5. **Database errors** → Data corruption risk
6. **Test pass rate < 70%** → Major breakage
7. **Any ToS violation** → Legal/compliance issue

---

## 📊 Capability Matrix

| Capability | Status | Test Command | Critical? |
|------------|--------|--------------|-----------|
| MCP Server | ✅ Working | `npm start` | 🔴 YES |
| Browser Automation | ✅ Working | `npm test browser-controller` | 🔴 YES |
| Facebook Scraping | ✅ Working | `npm run test:marketplace` | 🔴 YES |
| Affiliate Tools | ✅ Working | Test network detection | 🟡 Important |
| Chrome Extension | ✅ Working | Load in Chrome | 🟡 Important |
| Multi-Agent | ✅ Working | Run coordinator | 🟢 Nice-to-have |
| Phone Verification | ✅ Working | SMS test | 🟢 Nice-to-have |
| Click Factory | ⏸️ Integrating | After TS fixes | 🟡 Important |
| Pattern Learning | ✅ Working | AgentDB tests | 🟢 Nice-to-have |
| Database | ✅ Working | CRUD operations | 🔴 YES |

---

## 🎯 Success Criteria

**After all TypeScript fixes are complete**:

1. ✅ All 181 errors resolved
2. ✅ `npm run build` succeeds
3. ✅ All critical features work (🔴 marked above)
4. ✅ 80%+ test pass rate
5. ✅ Click Factory integrated and functional
6. ✅ No regressions in Facebook extraction rate
7. ✅ No affiliate compliance issues
8. ✅ MCP server responds to all tools
9. ✅ Extension loads without errors
10. ✅ Database operations intact

---

**This document is your safety checklist. Refer to it after EVERY phase of fixes!**
