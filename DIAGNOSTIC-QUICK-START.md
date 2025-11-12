# DealBot Diagnostic - Quick Start

## Problem: All Fields Show 30%

If ALL fields (including Condition, Category, Brand) show exactly 30%, something is wrong.

## One-Line Solution

```bash
npm run test:diagnostic
```

---

## What It Checks

**✅ System Checks:**
1. Extension loaded?
2. Service worker active?
3. Extraction ran?
4. Data stored?
5. Logs present?
6. Modal opened?

**📊 Data Analysis:**
- Total listings stored
- Sample listing fields
- Field extraction rates
- Real data vs placeholder data

---

## Expected Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 DEALBOT DIAGNOSTIC TOOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Extension loaded
✅ Service worker: Active

🔐 Navigating to Facebook Marketplace...
✅ Logged in to Facebook

🔍 Searching for "laptop"...
📦 Opening first listing...

🔍 Looking for Research This Deal button...
✅ Found button
✅ Modal opened

📊 Checking service worker logs...
✅ Extraction logs: 25 logs found

💾 Checking stored data...
✅ Stored listings: 30

📋 Sample listing:
  Title: Dell XPS 15
  Price: $1200
  Condition: Like New
  Category: Electronics
  Brand: Dell
  Image Count: 4

📊 Field extraction rates:
  condition: 93%
  category: 90%
  brand: 63%
  sellerInfo: 83%
  imageCount: 97%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DIAGNOSTIC RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 SYSTEM CHECKS:
  ✅ extensionLoaded
  ✅ serviceWorkerActive
  ✅ extractionRan
  ✅ dataStored
  ✅ logsPresent
  ✅ modalOpened

💾 STORED DATA:
  Total listings: 30

🎯 CONCLUSION:
  ✅ Extraction appears to be working with real data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Common Issues Detected

### Issue 1: All fields at exactly 30%

**Diagnosis:**
```
🚨 ISSUES FOUND:
  1. All fields showing exactly 30% - likely using placeholder/test data

💡 RECOMMENDATIONS:
  1. Check if extraction is using mock data
  2. Verify extraction script is actually parsing DOM
```

**Conclusion:**
```
⚠️ ISSUE: All fields at 30% suggests placeholder data, not real extraction
```

**Fix:**
- Check if background script has hardcoded test data
- Verify extraction script is injected and running
- Look for `mockData` or `testData` in code

---

### Issue 2: All fields at 0%

**Diagnosis:**
```
🚨 ISSUES FOUND:
  1. All fields at 0% - extraction failing completely

💡 RECOMMENDATIONS:
  1. Check Facebook DOM structure hasn't changed
  2. Verify selectors in extraction script
```

**Conclusion:**
```
❌ ISSUE: Extraction running but all fields failing - DOM selectors may be wrong
```

**Fix:**
- Facebook may have changed their HTML
- Update selectors in extraction script
- Check F12 console for errors

---

### Issue 3: No data stored

**Diagnosis:**
```
🚨 ISSUES FOUND:
  1. Extraction did not run
  2. No data stored

💡 RECOMMENDATIONS:
  1. Check if "Research This Deal" button was clicked
  2. Verify background script is listening for messages
```

**Conclusion:**
```
❌ CRITICAL: No data being extracted or stored
```

**Fix:**
- Reload extension
- Check manifest.json permissions
- Verify message passing between content script and background

---

### Issue 4: Modal didn't open

**Diagnosis:**
```
🚨 ISSUES FOUND:
  1. Product Research modal did not open

💡 RECOMMENDATIONS:
  1. Content script may not be injecting
  2. Check content script in dist/content/
```

**Fix:**
```bash
# Rebuild
npm run build

# Check content script exists
ls dist/content/

# Reload extension
# chrome://extensions/ → Reload
```

---

## Quick Checks

### Check 1: Extension Loaded?

```bash
# Verify extension built
ls -la dist/

# Should see:
# manifest.json
# background/
# content/
```

### Check 2: Service Worker Active?

```
1. chrome://extensions/
2. Find "DealBot"
3. Look for "service worker" link
4. If missing, click reload (⟳)
```

### Check 3: Data Stored?

Run in service worker console:
```javascript
chrome.storage.local.get(['collectedListings'], (result) => {
  console.log('Total:', result.collectedListings?.length || 0);
});
```

---

## What the Diagnostic Does

**Step 1:** Loads extension
**Step 2:** Navigates to Facebook Marketplace
**Step 3:** Searches for product
**Step 4:** Clicks listing
**Step 5:** Triggers Research button
**Step 6:** Checks service worker logs
**Step 7:** Inspects stored data
**Step 8:** Analyzes field rates
**Step 9:** Determines if real data or placeholder
**Step 10:** Provides specific recommendations

---

## Manual Verification (If Diagnostic Fails)

### In Service Worker Console:

```javascript
// Check stored data
chrome.storage.local.get(['collectedListings'], (result) => {
  const listings = result.collectedListings || [];
  console.log('📦 Total Listings:', listings.length);

  if (listings.length > 0) {
    const latest = listings[listings.length - 1];
    console.log('📋 Latest Listing:', latest);
    console.log('  Condition:', latest.condition);
    console.log('  Category:', latest.category);
    console.log('  Brand:', latest.brand);
    console.log('  Image Count:', latest.imageCount);

    // Check if all fields are same value (suspicious)
    const fields = ['condition', 'category', 'brand'];
    const values = fields.map(f => latest[f]);
    const allSame = values.every(v => v === values[0]);

    if (allSame) {
      console.log('⚠️ All fields identical - likely placeholder data');
    } else {
      console.log('✅ Fields have different values - real data');
    }
  }
});
```

---

## Integration with Other Tests

```bash
# Run diagnostic first
npm run test:diagnostic

# If it finds issues, fix them

# Then run full test
npm run test:dealbot

# Compare results
npm run test:analyze
```

---

## Troubleshooting the Diagnostic

### Diagnostic itself fails?

```bash
# 1. Rebuild
npm run build

# 2. Check extension loaded
ls dist/manifest.json

# 3. Run again
npm run test:diagnostic
```

### Can't connect to service worker?

```bash
# Restart Chrome completely
# Reload extension
# Try again
```

---

## Quick Reference

```bash
# Run diagnostic
npm run test:diagnostic

# View stored data manually
# In service worker console:
chrome.storage.local.get(console.log)

# Clear stored data
chrome.storage.local.clear()

# Trigger extraction manually
# Click "Research This Deal" button on any listing
```

---

**Start here if all fields show 30%!** 🔍

This will tell you exactly what's wrong and how to fix it.
