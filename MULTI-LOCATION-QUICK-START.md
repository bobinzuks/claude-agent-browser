# Multi-Location Testing - Quick Start ⚡

## One-Line Commands

### Test via Extension Test Page (Easiest)
```bash
npm run test:multi-location
```

### Test via Facebook Marketplace (Real-World)
```bash
npm run test:multi-location:facebook
```

### Run Full Test Suite
```bash
npm run test:multi-location:full
```

### Monitor Console Live
```bash
npm run test:monitor
```

### Analyze Results
```bash
npm run test:analyze
```

### Generate HTML Report
```bash
npm run test:report
```

---

## What Each Test Does

### 🧪 `npm run test:multi-location`
- Opens extension test page
- Clicks "Test Multi-Location Search"
- Monitors tab automation
- Validates results
- **Time:** ~15 seconds
- **Requires:** Extension loaded in Chrome

### 🌐 `npm run test:multi-location:facebook`
- Opens Facebook Marketplace
- Searches for product
- Clicks "Research This Deal" button
- Triggers multi-location search
- **Time:** ~30 seconds
- **Requires:** Facebook login

### 🎯 `npm run test:multi-location:full`
- Runs both test-page and Facebook tests
- **Time:** ~45 seconds
- **Requires:** Extension + Facebook login

### 📡 `npm run test:monitor`
- Monitors extension console in real-time
- Use with manual testing
- **Usage:** Run in separate terminal

### 📊 `npm run test:analyze`
- Compares multiple test results
- Shows trends and statistics
- **Requires:** Previous test results

### 📄 `npm run test:report`
- Generates interactive HTML report
- Opens in browser automatically
- **Requires:** Previous test results

---

## First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Build project
npm run build

# 3. Load extension in Chrome
# - Open chrome://extensions/
# - Enable "Developer mode"
# - Click "Load unpacked"
# - Select: dist/ folder

# 4. Run first test
npm run test:multi-location
```

---

## Expected Output

```
🚀 DealBot Multi-Location Test Runner
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Testing via Test Page (Option A)

🚀 Setting up browser with DealBot extension...
✅ Extension loaded: abc123def456

📊 [DealBot BG] Opening search tab for Seattle, WA...
📊 [DealBot BG] Opening search tab for Portland, OR...
📊 [DealBot BG] Opening search tab for San Francisco, CA...
📊 [Extraction] Successfully extracted 10 listings
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

📍 LOCATION BREAKDOWN:

  ✅ Seattle, WA           | 10 listings | Avg: $799.99
  ✅ Portland, OR          |  8 listings | Avg: $850.00
  ✅ San Francisco, CA     | 12 listings | Avg: $899.99

✅ TEST PASSED

💾 Results saved to: test-results/multi-location-test-2025-11-02.json
```

---

## Success Criteria

✅ **PASS** if:
- 80%+ locations successful
- Total listings > 0
- Duration < 30 seconds

❌ **FAIL** if:
- Less than 80% locations work
- No listings extracted
- Takes > 30 seconds

---

## Common Issues

### ❌ "Extension ID not found"
```bash
# Fix: Rebuild and reload extension
npm run build
# Then reload in chrome://extensions/
```

### ❌ "Test page not found"
```bash
# Fix: Build extension
npm run build:extension
```

### ❌ "No tabs opening"
```bash
# Fix: Check extension permissions in manifest.json
# Should have: "tabs", "scripting", "activeTab"
```

### ❌ "Login required" (Facebook test)
```bash
# Fix: Login to Facebook manually before test
# Or use test-page mode instead:
npm run test:multi-location
```

---

## File Locations

### Scripts
- `tests/multi-location-automated-test.ts` - Main test
- `tests/run-multi-location-test.sh` - Runner
- `tests/console-monitor.ts` - Monitor
- `tests/extraction-analysis.ts` - Analysis

### Results
- `test-results/multi-location-test-*.json` - Test results
- `test-results/console-logs.json` - Console logs
- `test-results/report.html` - HTML report

### Documentation
- `docs/MULTI-LOCATION-TESTING.md` - Full guide
- `MULTI-LOCATION-QUICK-START.md` - This file

---

## Advanced Usage

### Test Different Products (Facebook mode)
```bash
# Edit tests/multi-location-automated-test.ts
# Line ~350: Change productQuery
await test.testViaFacebookMarketplace('MacBook Pro');
```

### Add More Locations
```bash
# Edit tests/multi-location-automated-test.ts
# Lines ~30-35: Add cities
private readonly testLocations: Location[] = [
  { city: 'Seattle', state: 'WA' },
  { city: 'Portland', state: 'OR' },
  { city: 'San Francisco', state: 'CA' },
  { city: 'Los Angeles', state: 'CA' },  // Add
  { city: 'San Diego', state: 'CA' },    // Add
];
```

### Increase Timeout
```bash
# Edit tests/multi-location-automated-test.ts
# Line ~280: Change timeout
await this.waitForSearchCompletion(page, logs, 120000); // 2 min
```

---

## Performance Tuning

### Current Settings
- **Locations:** 3 (Seattle, Portland, SF)
- **Parallel tabs:** 3
- **Timeout:** 60 seconds
- **Target time:** < 30 seconds

### To Optimize
1. Reduce listings per location (faster)
2. Increase parallel tabs (faster but more resources)
3. Add caching (avoid re-extraction)
4. Optimize extraction script

---

## CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/test.yml
- name: Run multi-location tests
  run: npm run test:multi-location
```

### Pre-commit Hook
```bash
# .git/hooks/pre-push
#!/bin/bash
npm run test:multi-location || exit 1
```

---

## Monitoring Workflow

**Terminal 1:** Start monitor
```bash
npm run test:monitor
```

**Terminal 2:** Run test
```bash
npm run test:multi-location:facebook
```

**Result:** See all logs in Terminal 1 in real-time

---

## Compare Multiple Runs

```bash
# Run 5 tests
for i in {1..5}; do
  npm run test:multi-location
  sleep 5
done

# Analyze
npm run test:analyze

# Generate report
npm run test:report
```

---

## Getting Help

### Documentation
```bash
# Full guide
open docs/MULTI-LOCATION-TESTING.md

# Facebook Marketplace testing
open docs/FACEBOOK-MARKETPLACE-TESTING.md

# Improvements
open docs/FACEBOOK-MARKETPLACE-IMPROVEMENTS.md
```

### Commands
```bash
# Show all test commands
npm run | grep test

# Help for runner script
./tests/run-multi-location-test.sh help
```

### Debugging
```bash
# 1. Monitor console
npm run test:monitor

# 2. Check extension console
# chrome://extensions/ → DealBot → "service worker"

# 3. Check test results
cat test-results/multi-location-test-*.json | jq
```

---

## Quick Checklist

Before running tests:
- [ ] npm install
- [ ] npm run build
- [ ] Extension loaded in Chrome
- [ ] Extension enabled
- [ ] (Optional) Logged into Facebook

To verify working:
- [ ] npm run test:multi-location passes
- [ ] 3 tabs open and close automatically
- [ ] Results show 30+ listings
- [ ] Duration < 30 seconds
- [ ] No errors in console

---

## Next Steps

1. ✅ Run first test: `npm run test:multi-location`
2. ✅ Check results in terminal
3. ✅ View JSON: `cat test-results/multi-location-test-*.json`
4. ✅ Run Facebook test: `npm run test:multi-location:facebook`
5. ✅ Analyze: `npm run test:analyze`
6. ✅ Report: `npm run test:report`

---

**That's it! You're ready to test! 🚀**

For detailed docs: `docs/MULTI-LOCATION-TESTING.md`
