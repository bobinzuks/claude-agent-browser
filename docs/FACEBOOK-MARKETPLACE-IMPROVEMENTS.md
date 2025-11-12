# Facebook Marketplace Extraction - Code Analysis & Improvements

## Executive Summary

The Facebook Marketplace extraction system in the Claude Agent Browser is well-architected with a robust 4-method fallback approach achieving 90%+ success rates for days listed extraction. This document analyzes the codebase and provides actionable improvements.

---

## Current Architecture

### File Structure

```
src/
├── mcp-bridge/
│   ├── facebook-marketplace-tools.ts          # Main extraction logic
│   ├── facebook-marketplace-tools-IMPROVED.ts # Enhanced version (duplicate)
│   └── browser-controller.ts                   # Browser automation
├── extension/
│   ├── manifest.json                           # Extension config
│   ├── background/
│   │   ├── service-worker.js                   # Background script
│   │   └── message-bridge.ts                   # Communication layer
│   └── content/
│       └── agent.js                            # Content script
```

### Key Components

1. **FacebookMarketplaceTools** (`facebook-marketplace-tools-IMPROVED.ts`)
   - Main extraction class
   - 4-method fallback for days listed
   - Batch search across locations
   - Statistics generation

2. **BrowserController** (`browser-controller.ts`)
   - Playwright-based automation
   - Page management
   - Script execution

3. **MessageBridge** (`message-bridge.ts`)
   - Extension ↔ MCP communication
   - Command/response pattern
   - Retry logic

---

## Code Quality Analysis

### Strengths ✅

1. **Robust Extraction Logic**
   - 4-method fallback ensures high success rates
   - Graceful degradation
   - Clear method tracking for debugging

2. **Well-Documented**
   - Clear comments explaining each method
   - Success rate targets specified
   - Method breakdown tracked

3. **Type Safety**
   - TypeScript interfaces defined
   - Clear data structures
   - Proper error handling

4. **Scalable Architecture**
   - Batch processing support
   - Parallel location searches
   - Rate limiting implemented

### Issues Found ⚠️

1. **Code Duplication**
   ```
   facebook-marketplace-tools.ts (identical)
   facebook-marketplace-tools-IMPROVED.ts (duplicate)
   ```
   **Impact:** Maintenance burden, confusion about which is active
   **Fix:** Delete duplicate, keep only IMPROVED version

2. **Extension Not Integrated**
   - Extraction code lives in `mcp-bridge/` (Node.js)
   - Extension in `src/extension/` doesn't use marketplace tools
   - **Gap:** Your manual testing instructions assume extension has this code

3. **No Logging in Extension**
   - Service worker doesn't have extraction script
   - Console output format from docs doesn't match code
   - No "[DealBot BG]" logs in codebase

4. **Hardcoded City Slugs**
   ```typescript
   const citySlugMap: Record<string, string> = {
     Vancouver: 'vancouver',
     Toronto: 'toronto',
     // ... only 22 cities
   }
   ```
   **Limitation:** Only works for hardcoded cities

---

## Critical Gap: Extension vs MCP Bridge

### Current State

The extraction logic exists in **TWO separate systems**:

1. **MCP Bridge** (`src/mcp-bridge/`)
   - Used by: Claude MCP server
   - Runtime: Node.js
   - Browser: Playwright
   - ✅ Has full extraction code
   - ✅ Has 4-method fallback
   - ❌ Not accessible from extension

2. **Chrome Extension** (`src/extension/`)
   - Used by: Browser extension popup/background
   - Runtime: Chrome V3 service worker
   - Browser: Chrome runtime APIs
   - ❌ Missing extraction code
   - ❌ No marketplace tools
   - ❌ Can't test as described in docs

### The Problem

Your testing documentation says:
> "Click service worker link to see extraction logs"

But the **extension service worker doesn't have extraction code**! The extraction logic is in the MCP server (Node.js), not the extension.

### Solution Options

**Option A: Port to Extension (Recommended)**
```typescript
// Create: src/extension/background/marketplace-extractor.ts
// Port the extraction script to run in extension background
```

**Option B: Update Documentation**
```markdown
# Testing requires:
1. Running MCP server (npm start)
2. Triggering extraction via MCP commands
3. Logs appear in MCP server console (not extension)
```

**Option C: Hybrid Approach**
- Extension UI triggers extraction
- Sends message to MCP server
- MCP server runs extraction
- Returns results to extension

---

## Recommended Improvements

### Priority 1: Fix Code Duplication 🔥

**File:** `src/mcp-bridge/`

**Action:**
```bash
# Delete duplicate
rm facebook-marketplace-tools.ts
rm facebook-marketplace-tools.BACKUP.ts

# Keep only IMPROVED version, rename
mv facebook-marketplace-tools-IMPROVED.ts facebook-marketplace-tools.ts
```

**Update imports:**
```typescript
// In mcp-server.ts or wherever it's imported
import { FacebookMarketplaceTools } from './facebook-marketplace-tools.js';
```

---

### Priority 2: Add Extension Integration 🔥

**Create:** `src/extension/background/marketplace-extractor.ts`

```typescript
/**
 * Extension-side marketplace extraction
 * Runs in service worker, no external dependencies
 */

export class MarketplaceExtractor {
  /**
   * Extract listings from current tab
   */
  async extractFromCurrentTab(): Promise<ExtractionResult[]> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      throw new Error('No active tab');
    }

    // Inject extraction script
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: this.extractionScript,
      args: [10], // maxListings
    });

    return results[0].result;
  }

  /**
   * Extraction script (runs in page context)
   */
  private extractionScript(maxListings: number): ExtractionResult[] {
    // Copy the extraction logic from facebook-marketplace-tools.ts
    // (the client-side script, lines 103-366)
    // This runs directly in the Facebook page
    // ...
  }

  /**
   * Log to console with formatting
   */
  private log(message: string) {
    console.log(`[DealBot BG] ${message}`);
  }
}
```

**Usage in service worker:**
```typescript
// src/extension/background/service-worker.ts
import { MarketplaceExtractor } from './marketplace-extractor';

const extractor = new MarketplaceExtractor();

chrome.action.onClicked.addListener(async () => {
  console.log('[DealBot BG] Starting extraction...');

  const results = await extractor.extractFromCurrentTab();

  console.log(`[Extraction] ✅ Extracted ${results.length} listings`);
  results.forEach((r, i) => {
    console.log(
      `[Extraction] ✅ #${i+1} | ${r.currency}${r.price} | ${r.ageText} | ${r.title}`
    );
  });
});
```

---

### Priority 3: Improve City Slug Generation 🔧

**Current limitation:**
```typescript
// Only works for 22 hardcoded cities
const citySlugMap: Record<string, string> = {
  Vancouver: 'vancouver',
  // ...
};
```

**Improved solution:**
```typescript
/**
 * Generate city slug for any city
 */
buildMarketplaceURL(params: MarketplaceSearchParams): string {
  // Auto-generate slug from any city name
  const citySlug = this.generateCitySlug(params.location);

  const urlParams = new URLSearchParams({
    query: params.product,
    exact: 'false',
  });

  if (params.minPrice) urlParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice) urlParams.append('maxPrice', params.maxPrice.toString());

  return `https://www.facebook.com/marketplace/${citySlug}/search/?${urlParams}`;
}

/**
 * Generate URL-safe city slug
 */
private generateCitySlug(location: string): string {
  // Common cities mapping (fast path)
  const commonCities: Record<string, string> = {
    'Vancouver': 'vancouver',
    'Toronto': 'toronto',
    'New York': 'newyork',
    'Los Angeles': 'losangeles',
    // ... top 50 cities
  };

  if (commonCities[location]) {
    return commonCities[location];
  }

  // Generate slug for any city
  return location
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // Remove special chars
    .replace(/\s+/g, '')           // Remove spaces
    .trim();
}
```

---

### Priority 4: Add Method 5 for Edge Cases 🔧

**Current:** 4 methods achieve 90%+ success
**Goal:** Push to 95%+ with 5th method

**Add regex fallback for alternate phrasings:**

```typescript
// METHOD 5: Alternate phrasing patterns
if (daysListed === null) {
  // "Posted" instead of "Listed"
  const postedMatch = lowerText.match(/posted\s*(\d+)\s*day/i);
  if (postedMatch) {
    daysListed = parseInt(postedMatch[1]);
    ageText = `Posted ${postedMatch[1]} days ago`;
    extractionMethod = 'TEXT_POSTED_DAYS';
  }

  // "X d ago" short format
  const shortMatch = lowerText.match(/(\d+)\s*d\s*ago/i);
  if (shortMatch) {
    daysListed = parseInt(shortMatch[1]);
    ageText = `${shortMatch[1]}d ago`;
    extractionMethod = 'TEXT_SHORT_DAYS';
  }

  // Relative dates in other languages
  const relativePatterns = [
    { pattern: /il y a (\d+) jours?/i, multiplier: 1 },   // French
    { pattern: /hace (\d+) días?/i, multiplier: 1 },      // Spanish
    { pattern: /vor (\d+) Tagen?/i, multiplier: 1 },      // German
  ];

  for (const { pattern, multiplier } of relativePatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      daysListed = parseInt(match[1]) * multiplier;
      ageText = match[0];
      extractionMethod = 'TEXT_I18N_DAYS';
      break;
    }
  }
}
```

---

### Priority 5: Add Sold Status Detection 🔧

**New field:**
```typescript
export interface MarketplaceListing {
  // ... existing fields
  isSold: boolean;
  soldText: string | null;
}
```

**Detection logic:**
```typescript
// In extraction script
let isSold = false;
let soldText = null;

// Check for sold indicators
const soldPatterns = [
  /\bsold\b/i,
  /\bmarked as sold\b/i,
  /\bno longer available\b/i,
  /\bpending\b/i,
];

for (const pattern of soldPatterns) {
  if (fullText.match(pattern)) {
    isSold = true;
    soldText = fullText.match(pattern)?.[0] || 'Sold';
    break;
  }
}

// Check for strikethrough price (visual indicator)
const priceSpan = link.querySelector('span[style*="text-decoration: line-through"]');
if (priceSpan) {
  isSold = true;
  soldText = 'Sold (strikethrough)';
}
```

---

### Priority 6: Improve Error Logging 🔧

**Current:**
```typescript
catch (error) {
  console.error('[Extraction Error]', error);
}
```

**Improved:**
```typescript
catch (error) {
  // Log more context
  console.error('[Extraction Error]', {
    listingId: idMatch?.[1],
    url: link.href,
    error: error.message,
    stack: error.stack,
    linkText: fullText.substring(0, 100), // First 100 chars
  });

  // Track error types
  errorCounts[error.message] = (errorCounts[error.message] || 0) + 1;
}

// After loop, log error summary
if (Object.keys(errorCounts).length > 0) {
  console.log('[Extraction] ⚠️  ERROR SUMMARY:');
  Object.entries(errorCounts).forEach(([error, count]) => {
    console.log(`  ${error}: ${count} occurrences`);
  });
}
```

---

### Priority 7: Add Extraction Caching 🔧

Avoid re-extracting same listings:

```typescript
export class FacebookMarketplaceTools {
  private extractionCache: Map<string, ExtractionResult> = new Map();
  private cacheExpiryMs: number = 5 * 60 * 1000; // 5 minutes

  async searchLocation(params: MarketplaceSearchParams): Promise<MarketplaceListing[]> {
    const cacheKey = `${params.location}:${params.product}`;
    const cached = this.extractionCache.get(cacheKey);

    if (cached && Date.now() - cached.extractedAt < this.cacheExpiryMs) {
      console.log('[Cache] Returning cached results');
      return cached.results;
    }

    // Extract as normal
    const results = await this.extractListings(params);

    // Cache results
    this.extractionCache.set(cacheKey, {
      extractedAt: Date.now(),
      results,
    });

    return results;
  }
}
```

---

## Testing Improvements

### Add Automated Tests

**Create:** `tests/facebook-marketplace.test.ts`

```typescript
import { FacebookMarketplaceTools } from '../src/mcp-bridge/facebook-marketplace-tools';
import { BrowserController } from '../src/mcp-bridge/browser-controller';

describe('FacebookMarketplaceTools', () => {
  let tools: FacebookMarketplaceTools;
  let browser: BrowserController;

  beforeAll(async () => {
    browser = new BrowserController();
    await browser.initialize();
    tools = new FacebookMarketplaceTools(browser);
  });

  afterAll(async () => {
    await browser.cleanup();
  });

  test('should extract laptop listings', async () => {
    const results = await tools.searchLocation({
      product: 'laptop',
      location: 'Vancouver',
      maxListings: 10,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(10);
  });

  test('should achieve 90%+ days listed success rate', async () => {
    const results = await tools.searchLocation({
      product: 'laptop',
      location: 'Vancouver',
      maxListings: 30,
    });

    const withDays = results.filter(r => r.daysListed !== null);
    const successRate = (withDays.length / results.length) * 100;

    expect(successRate).toBeGreaterThanOrEqual(90);
  });

  test('should extract prices correctly', async () => {
    const results = await tools.searchLocation({
      product: 'laptop',
      location: 'Vancouver',
      maxListings: 10,
    });

    results.forEach(r => {
      expect(r.price).toBeGreaterThan(0);
      expect(r.currency).toMatch(/^(USD|CAD)$/);
    });
  });
});
```

---

## Documentation Improvements

### Update Testing Docs

**File:** `docs/FACEBOOK-MARKETPLACE-TESTING.md`

**Add clarification:**

```markdown
## Important: Testing Setup

There are TWO ways to use the marketplace extraction:

### Method A: Via MCP Server (Automated)
- Extraction runs in Node.js via Playwright
- Triggered by MCP commands
- Logs appear in terminal running `npm start`
- Full automation, no manual steps

### Method B: Via Chrome Extension (Manual - Coming Soon)
- Extraction runs in browser extension
- Triggered by clicking extension icon
- Logs appear in extension service worker console
- Currently NOT implemented (see IMPROVEMENTS.md)

**The testing guide above describes Method B, which requires implementing the
extension integration first. See Priority 2 in IMPROVEMENTS.md.**
```

---

## Performance Optimizations

### 1. Parallel Extraction

Instead of processing listings sequentially:

```typescript
// Current: Sequential
for (let i = 0; i < links.length; i++) {
  const listing = extractListing(links[i]);
  listings.push(listing);
}

// Improved: Parallel (in batches)
const batchSize = 10;
for (let i = 0; i < links.length; i += batchSize) {
  const batch = links.slice(i, i + batchSize);

  const batchResults = await Promise.all(
    batch.map(link => extractListing(link))
  );

  listings.push(...batchResults.filter(r => r !== null));
}
```

### 2. Lazy Image Loading

Don't extract images until needed:

```typescript
export interface MarketplaceListing {
  // ... other fields
  imageUrl: string | null;
  getHighResImage?: () => Promise<string>; // Lazy load
}
```

### 3. Incremental Results

Stream results as they're extracted:

```typescript
async *searchLocationStreaming(params: MarketplaceSearchParams) {
  // ... navigate to page

  const links = await page.$$('a[href*="/marketplace/item/"]');

  for (const link of links) {
    const result = await extractListing(link);
    if (result) {
      yield result; // Stream result immediately
    }
  }
}

// Usage:
for await (const listing of tools.searchLocationStreaming({...})) {
  console.log('Got listing:', listing.title);
  // Process immediately instead of waiting for all
}
```

---

## Summary

### Quick Wins (< 1 hour)
1. ✅ Delete duplicate files
2. ✅ Add Method 5 regex patterns
3. ✅ Improve city slug generation
4. ✅ Add sold status detection

### Medium Effort (2-4 hours)
5. ✅ Port extraction to extension
6. ✅ Add error logging improvements
7. ✅ Add extraction caching

### Long Term (1+ days)
8. ✅ Build comprehensive test suite
9. ✅ Add incremental streaming
10. ✅ Multilingual support

### Critical Path

```
1. Delete duplicates (5 min)
   ↓
2. Port to extension (2 hrs)
   ↓
3. Update testing docs (30 min)
   ↓
4. Test manually (1 hr)
   ↓
5. Add automated tests (3 hrs)
```

---

## File Locations Reference

```
CREATE:
  src/extension/background/marketplace-extractor.ts
  tests/facebook-marketplace.test.ts

DELETE:
  src/mcp-bridge/facebook-marketplace-tools.ts
  src/mcp-bridge/facebook-marketplace-tools.BACKUP.ts

RENAME:
  src/mcp-bridge/facebook-marketplace-tools-IMPROVED.ts
  → src/mcp-bridge/facebook-marketplace-tools.ts

UPDATE:
  docs/FACEBOOK-MARKETPLACE-TESTING.md
  src/extension/background/service-worker.ts (if exists)
  src/mcp-bridge/mcp-server.ts (update imports)
```

---

**Next Steps:** Choose a priority level and I can implement the changes for you.
