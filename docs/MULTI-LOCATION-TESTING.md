# Multi-Location Search - Automated Testing Guide

## Overview

This guide covers automated testing for the DealBot extension's multi-location search feature, which opens multiple Facebook Marketplace tabs in parallel to find the best deals across different cities.

---

## Quick Start

### Option 1: One-Line Test

```bash
# Test using extension test page (easiest)
./tests/run-multi-location-test.sh test-page

# Test using real Facebook Marketplace
./tests/run-multi-location-test.sh facebook

# Run full test suite
./tests/run-multi-location-test.sh full
```

### Option 2: Direct TypeScript

```bash
# Build project first
npm run build

# Run test
npx ts-node tests/multi-location-automated-test.ts test-page

# Or with mode
npx ts-node tests/multi-location-automated-test.ts facebook
npx ts-node tests/multi-location-automated-test.ts full
```

---

## Test Modes

### Mode 1: Test Page (Recommended)

**What it does:**
- Opens `chrome-extension://[id]/test-multi-location.html`
- Clicks "Test Multi-Location Search" button
- Monitors tab automation
- Validates results

**Advantages:**
- Fast (no Facebook login needed)
- Reliable (controlled environment)
- Easy debugging

**Usage:**
```bash
./tests/run-multi-location-test.sh test-page
```

**Expected Output:**
```
🚀 Setting up browser with DealBot extension...
✅ Extension loaded: abc123def456

🧪 TESTING VIA TEST PAGE
📄 Opening test page: chrome-extension://abc123def456/test-multi-location.html
🔘 Clicking "Test Multi-Location Search" button...
⏳ Waiting for multi-location search to complete...

📊 [DealBot BG] Opening search tab for Seattle, WA...
📊 [DealBot BG] Tab 123 created for Seattle, WA
📊 [DealBot BG] Opening search tab for Portland, OR...
📊 [DealBot BG] Tab 124 created for Portland, OR
📊 [DealBot BG] Opening search tab for San Francisco, CA...
📊 [DealBot BG] Tab 125 created for San Francisco, CA
📊 [Extraction] Found 25 marketplace item links
📊 [Extraction] Successfully extracted 10 listings
📊 [DealBot BG] ✅ Extracted 10 listings from Seattle, WA
📊 [DealBot BG] 🗑️ Closed tab 123 for Seattle, WA
...

✅ Search completed!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 MULTI-LOCATION TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Product Query: "test-page"
📍 Locations Searched: 3
✅ Successful: 3
❌ Failed: 0
📦 Total Listings: 30
⏱️  Total Duration: 12.45s
💰 Average Price: $825.50

📈 PERFORMANCE METRICS:
  ⏱️  Avg Time/Location: 4.15s
  🔀 Parallel Tabs: 3
  ⚡ Efficiency: 2.17x

📍 LOCATION BREAKDOWN:

  ✅ Seattle, WA           | 10 listings | Avg: $799.99
  ✅ Portland, OR          |  8 listings | Avg: $850.00
  ✅ San Francisco, CA     | 12 listings | Avg: $899.99

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ TEST PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 Results saved to: test-results/multi-location-test-2025-11-02.json
```

---

### Mode 2: Facebook Marketplace (Real-World)

**What it does:**
- Navigates to Facebook Marketplace
- Searches for product (e.g., "laptop")
- Clicks on listing
- Finds "Research This Deal" button
- Triggers multi-location search
- Validates real extraction

**Advantages:**
- Tests real-world scenario
- Validates content script injection
- Tests against live Facebook DOM

**Disadvantages:**
- Requires Facebook login
- Slower (page loads, network)
- Facebook DOM may change

**Usage:**
```bash
./tests/run-multi-location-test.sh facebook
```

**Interactive Steps:**
1. Script launches Chrome with extension
2. Opens Facebook Marketplace
3. **[MANUAL]** Login if prompted (60s timeout)
4. Script searches for product
5. Clicks first listing
6. Looks for "Research This Deal" button
7. Triggers multi-location search
8. Monitors and validates results

---

### Mode 3: Full Test Suite

Runs both test-page and Facebook tests sequentially.

```bash
./tests/run-multi-location-test.sh full
```

**Use cases:**
- Pre-deployment validation
- Comprehensive testing
- Regression testing
- CI/CD pipelines

---

## Test Configuration

### Default Settings

**Locations tested:**
```typescript
const testLocations = [
  { city: 'Seattle', state: 'WA' },
  { city: 'Portland', state: 'OR' },
  { city: 'San Francisco', state: 'CA' },
];
```

**Timeouts:**
- Search completion: 60 seconds
- Tab load: 5 seconds per location
- Login (Facebook mode): 60 seconds

**Success criteria:**
- ✅ 80%+ locations successful
- ✅ Total listings > 0
- ✅ Duration < 30 seconds

### Customizing

Edit `tests/multi-location-automated-test.ts`:

```typescript
// Add more locations
private readonly testLocations: Location[] = [
  { city: 'Seattle', state: 'WA' },
  { city: 'Portland', state: 'OR' },
  { city: 'San Francisco', state: 'CA' },
  { city: 'Los Angeles', state: 'CA' },  // Add
  { city: 'San Diego', state: 'CA' },    // Add
  // ... up to 10 locations
];

// Change product query (Facebook mode)
await test.testViaFacebookMarketplace('MacBook Pro');

// Adjust timeouts
await this.waitForSearchCompletion(page, logs, 120000); // 2 minutes
```

---

## Understanding Test Output

### Console Logs

**Extension logs:**
```
[DealBot BG] Opening search tab for Seattle, WA...
[DealBot BG] Tab 123 created for Seattle, WA
[DealBot BG] Tab 123 loaded successfully
[DealBot BG] Injecting extraction script into tab 123...
```

**Extraction logs:**
```
[Extraction] Found 25 marketplace item links
[Extraction] ✅ #1 | $800 | Used | Electronics | 4img | Dell Laptop
[Extraction] ✅ #2 | $650 | Like New | Acer Laptop
[Extraction] Successfully extracted 10 listings
```

**Tab management logs:**
```
[TabManager] Created tab 123 for Seattle, WA
[TabManager] Tab 123 ready for extraction
[TabManager] Closed tab 123 after extraction
```

### Test Results JSON

**Location:** `test-results/multi-location-test-[timestamp].json`

```json
{
  "timestamp": 1698876543210,
  "productQuery": "laptop",
  "locationsSearched": 3,
  "totalListings": 30,
  "successfulLocations": 3,
  "failedLocations": 0,
  "totalDuration": 12450,
  "averagePriceAcrossLocations": 825.50,
  "bestDeal": {
    "location": "Seattle, WA",
    "price": 799.99,
    "title": "Dell XPS 15"
  },
  "results": [
    {
      "location": "Seattle, WA",
      "listingsFound": 25,
      "extractedListings": 10,
      "bestPrice": 799.99,
      "averagePrice": 850.00,
      "priceRange": { "min": 799.99, "max": 1299.99 },
      "extractionTime": 4200,
      "success": true
    },
    // ... more locations
  ],
  "performanceMetrics": {
    "avgTimePerLocation": 4150,
    "tabsOpenedSimultaneously": 3,
    "parallelEfficiency": 2.17
  }
}
```

---

## Performance Metrics Explained

### 1. Average Time per Location

```
avgTimePerLocation = totalDuration / locationsSearched
```

**Target:** < 5 seconds per location

**What it measures:**
- Tab creation time
- Page load time
- Extraction execution time
- Tab cleanup time

**If too high:**
- Check network speed
- Reduce listings extracted per location
- Optimize extraction script

### 2. Parallel Efficiency

```
parallelEfficiency = (idealSequentialTime) / actualParallelTime

Where:
  idealSequentialTime = 3s × locationsSearched
  actualParallelTime = totalDuration
```

**Target:** > 1.0x (means faster than sequential)

**Example:**
- 3 locations × 3s ideal = 9s ideal
- Actual time = 4.5s
- Efficiency = 9 / 4.5 = 2.0x

**Interpretation:**
- 1.0x = Same speed as sequential
- 2.0x = Twice as fast (perfect for 3 parallel tabs)
- 3.0x = Three times as fast (perfect for 3 parallel tabs)

### 3. Tabs Opened Simultaneously

**Current:** 3 (hardcoded in extension)

**Why 3?**
- Balance between speed and browser performance
- Avoids overwhelming Facebook servers
- Prevents rate limiting

**Could increase to:**
- 5 tabs = Faster but more resource-intensive
- 10 tabs = Max before likely rate limiting

---

## Troubleshooting

### Issue: Extension ID not found

**Error:**
```
Could not find extension ID. Is the extension loaded?
```

**Causes:**
- Extension not installed
- Extension disabled
- Wrong extension path

**Fix:**
```bash
# 1. Check extension path
ls -la dist/

# 2. Rebuild extension
npm run build:extension

# 3. Manually load in Chrome
# chrome://extensions/ → Load unpacked → Select dist/

# 4. Verify in script
# The script should detect "DealBot" or "Claude Agent Browser"
```

---

### Issue: Test page not found

**Error:**
```
Test page not found. Make sure test-multi-location.html exists
```

**Fix:**
```bash
# 1. Check if file exists
ls dist/test-multi-location.html

# 2. If missing, create it
cp extension/test-multi-location.html dist/

# 3. Or create from template (see below)
```

**Create test page:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Multi-Location Test</title>
</head>
<body>
  <h1>Multi-Location Search Test</h1>
  <button id="testBtn">🚀 Test Multi-Location Search</button>
  <div id="results"></div>

  <script src="background/multi-location-search.js"></script>
  <script>
    document.getElementById('testBtn').addEventListener('click', async () => {
      const results = await chrome.runtime.sendMessage({
        action: 'multiLocationSearch',
        product: 'laptop',
        locations: ['Seattle', 'Portland', 'San Francisco']
      });

      document.getElementById('results').innerHTML = JSON.stringify(results, null, 2);
    });
  </script>
</body>
</html>
```

---

### Issue: No tabs opening

**Symptoms:**
- Button clicks but nothing happens
- No console logs
- No tabs created

**Debugging:**

1. **Check permissions:**
```json
// manifest.json
{
  "permissions": [
    "tabs",
    "scripting",
    "activeTab"
  ],
  "host_permissions": [
    "https://www.facebook.com/*"
  ]
}
```

2. **Check background script:**
```bash
# Open extension service worker console
chrome://extensions/ → DealBot → "service worker"

# Look for errors
# Should see: [DealBot BG] Background script loaded
```

3. **Test tab creation manually:**
```javascript
// In service worker console
chrome.tabs.create({ url: 'https://www.facebook.com/marketplace' })
  .then(tab => console.log('Tab created:', tab.id))
  .catch(err => console.error('Error:', err));
```

---

### Issue: Tabs open but no extraction

**Symptoms:**
- Tabs open to Facebook
- No extraction logs
- Tabs close immediately

**Debugging:**

1. **Check content script injection:**
```javascript
// In background script
chrome.scripting.executeScript({
  target: { tabId: tabId },
  func: () => {
    console.log('[Test] Content script injected successfully');
    return document.querySelectorAll('a[href*="/marketplace/item/"]').length;
  }
}).then(result => console.log('Found links:', result));
```

2. **Verify Facebook loaded:**
- Add delay before extraction
- Check for login redirect
- Look for anti-bot detection

3. **Test extraction script directly:**
```javascript
// In Facebook Marketplace tab console
const links = document.querySelectorAll('a[href*="/marketplace/item/"]');
console.log('Found', links.length, 'links');
```

---

### Issue: Test times out

**Error:**
```
Search timeout after 60 seconds
```

**Causes:**
- Slow network
- Facebook not loading
- Extraction stuck
- Too many locations

**Fixes:**

1. **Increase timeout:**
```typescript
await this.waitForSearchCompletion(page, logs, 120000); // 2 minutes
```

2. **Reduce locations:**
```typescript
private readonly testLocations: Location[] = [
  { city: 'Seattle', state: 'WA' },
  { city: 'Portland', state: 'OR' },
  // Remove San Francisco temporarily
];
```

3. **Check network:**
```bash
# Test Facebook manually
curl -I https://www.facebook.com/marketplace
```

---

### Issue: Login required

**Error:**
```
Not logged in. Please login manually...
Waiting 60 seconds for manual login...
Login timeout
```

**Causes:**
- Not logged into Facebook
- Session expired
- Using fresh browser profile

**Fixes:**

1. **Login before test:**
```bash
# Manually login to Facebook first
# Then run test with same profile

# Use persistent profile
./tests/run-multi-location-test.sh facebook
```

2. **Use pre-authenticated profile:**
```typescript
// In test script
const userDataDir = '/path/to/chrome/profile/with/facebook/login';

this.context = await chromium.launchPersistentContext(userDataDir, {
  // ...
});
```

3. **Extend login timeout:**
```typescript
await page.waitForSelector('a[href*="/marketplace/"]', {
  timeout: 120000 // 2 minutes
});
```

---

## Advanced Usage

### Running in CI/CD

```yaml
# .github/workflows/test.yml
name: Multi-Location Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Install Playwright browsers
        run: npx playwright install chromium

      - name: Build project
        run: npm run build

      - name: Run multi-location tests
        run: ./tests/run-multi-location-test.sh test-page

      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: test-results/
```

---

### Running with Docker

```dockerfile
# Dockerfile.test
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["./tests/run-multi-location-test.sh", "test-page"]
```

```bash
# Build and run
docker build -f Dockerfile.test -t dealbot-test .
docker run --rm -v $(pwd)/test-results:/app/test-results dealbot-test
```

---

### Monitoring in Real-Time

Run test in one terminal, monitor in another:

**Terminal 1:**
```bash
# Start monitor
npx ts-node tests/console-monitor.ts
```

**Terminal 2:**
```bash
# Run test (opens browser that monitor watches)
./tests/run-multi-location-test.sh facebook
```

**Result:** See all logs in real-time in Terminal 1

---

### Comparing Multiple Runs

```bash
# Run test 5 times
for i in {1..5}; do
  echo "Run $i"
  ./tests/run-multi-location-test.sh test-page
  sleep 5
done

# Analyze all results
npx ts-node tests/extraction-analysis.ts compare

# Generate HTML report
npx ts-node tests/extraction-analysis.ts html test-results/multi-location-report.html
open test-results/multi-location-report.html
```

---

## Success Checklist

Before considering the multi-location feature production-ready:

- [ ] Test page mode passes consistently
- [ ] Facebook mode passes (with manual login)
- [ ] All 3 locations extract data successfully
- [ ] Total duration < 30 seconds
- [ ] Parallel efficiency > 1.5x
- [ ] No browser crashes
- [ ] Tabs close automatically
- [ ] Results displayed correctly
- [ ] Error handling works (network issues, rate limiting)
- [ ] Works on fresh browser profile
- [ ] Works after Facebook login
- [ ] Extension doesn't interfere with normal browsing

---

## Next Steps

### Immediate Improvements
1. Add progress indicators in UI
2. Implement retry logic for failed locations
3. Add caching to avoid re-extracting same data
4. Better error messages for users

### Short-Term
5. Increase from 3 to 10 locations
6. Add location selection UI
7. Save/load search presets
8. Export results to CSV/JSON

### Long-Term
9. Integrate with MCP for headless automation
10. Add price alerts
11. Historical price tracking
12. Seller reputation analysis

---

## Support & Resources

**Files:**
- Test script: `tests/multi-location-automated-test.ts`
- Runner: `tests/run-multi-location-test.sh`
- Monitor: `tests/console-monitor.ts`
- Analysis: `tests/extraction-analysis.ts`

**Commands:**
```bash
# Quick test
./tests/run-multi-location-test.sh test-page

# Full suite
./tests/run-multi-location-test.sh full

# Debug
./tests/run-multi-location-test.sh monitor

# Analyze
./tests/run-multi-location-test.sh analyze
```

**Results:**
- JSON: `test-results/multi-location-test-*.json`
- Logs: `test-results/console-logs.json`
- HTML: `test-results/report.html`

---

**Happy testing! 🚀**
