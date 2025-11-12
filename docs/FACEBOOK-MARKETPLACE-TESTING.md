# Facebook Marketplace Extension Testing Guide

## Overview

This guide walks you through testing the Facebook Marketplace data extraction functionality in the Claude Agent Browser extension. The extension extracts listing data including prices, titles, days listed, locations, and seller information using a 4-method fallback approach for 90%+ success rates.

---

## Prerequisites

- Chrome browser with extension loaded
- Logged into Facebook account
- Facebook Marketplace access
- Extension installed at `chrome://extensions/`

---

## Part 1: Opening the Service Worker Console

The service worker console is where you'll see all extraction logs and debugging information.

### Steps:

1. **Open new browser tab**

2. **Navigate to extensions page**
   ```
   chrome://extensions/
   ```

3. **Locate the extension**
   - Scroll to find: **Claude Agent Browser**
   - Should show enabled toggle

4. **Find the service worker link**
   - Look in the extension card
   - Under the description text
   - Next to "Errors" button
   - Blue clickable text: `service worker`

5. **Click service worker**
   - Opens DevTools window (background script console)
   - **Keep this window open during testing**

### Troubleshooting

**Can't find service worker link?**

1. Click reload icon (⟳) on extension card
2. Wait 2 seconds
3. Service worker link should appear
4. If still missing, check:
   - Extension is enabled
   - No errors showing in extension card
   - Try disabling/re-enabling extension

---

## Part 2: Running the Extraction Test

### Steps:

1. **Switch to Facebook Marketplace tab**
   - If not open: `https://www.facebook.com/marketplace`
   - Or search for any product (e.g., "laptop")

2. **Click on any listing**
   - Opens listing detail page

3. **Trigger extraction** (method depends on implementation)
   - Option A: Click extension icon → "Extract Data"
   - Option B: Right-click → "Research This Deal"
   - Option C: Automatic extraction on page load

4. **Switch to Service Worker console window**
   - Should start filling with logs immediately

### Expected Console Output:

```
[DealBot BG] Opening search tab for Vancouver, BC...
[Extraction] Starting extraction for 40 marketplace items...
[Extraction] ✅ #1 | CA$800 | Used | Electronics | 4img | 🚗 👤 | Dell Latitude Laptop
[Extraction] ✅ #2 | CA$650 | Like New | Electronics | 3img | 📦 👤 | Acer Gaming Laptop
[Extraction] ✅ #3 | CA$1200 | New | Electronics | 5img | 🚗 👤 | MacBook Pro 2019
...
[Extraction] 📊 EXTRACTION SUMMARY
[Extraction] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Extraction] 📦 Total listings processed: 30/40 (75%)
[Extraction] 🏷️  Condition extracted: 27/30 (90%)
[Extraction] 📅 Days listed extracted: 28/30 (93%)
[Extraction] 📍 Location extracted: 25/30 (83%)
[Extraction] 👤 Seller info extracted: 22/30 (73%)
[Extraction] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Log Format Explained:

Each listing log shows:
```
✅ #[index] | [price] | [condition] | [category] | [img count] | [icons] | [title]
```

Icons:
- `🚗` = Pickup available
- `📦` = Shipping available
- `👤` = Seller verified
- `⭐` = Top seller

---

## Part 3: Analyzing Extraction Success Rates

### What to Look For:

1. **Overall Success Rate**
   - Should be 75%+ for total listings
   - Listed at bottom of extraction summary

2. **Days Listed Success**
   - Target: 90%+ (was 70-80% before improvements)
   - Uses 4-method fallback:
     - Method 1: "listed" keyword text parsing (75%)
     - Method 2: Standalone span elements (15%)
     - Method 3: `<time>` datetime attributes (10%)
     - Method 4: Aria-label attributes (5%)

3. **Extraction Method Breakdown**
   ```
   [Extraction] 📊 Extraction Methods Used:
   [Extraction] TEXT_LISTED_DAYS: 18 (60%)
   [Extraction] SPAN_DAYS: 5 (17%)
   [Extraction] TIME_DATETIME: 3 (10%)
   [Extraction] ARIA_LABEL_DAYS: 2 (7%)
   [Extraction] NONE: 2 (7%)
   ```

4. **Data Quality Metrics**
   - Price extraction: ~95% (required field)
   - Title extraction: ~95% (required field)
   - Location: ~80-85%
   - Seller info: ~70-75%
   - Images: ~90%

### Common Issues:

**Low success rates (<70%)**
- Facebook changed DOM structure
- Region-specific HTML differences
- Need to update extraction patterns

**High "NONE" method count**
- New Facebook UI not covered
- Check console for "[Extraction Error]" logs
- May need 5th fallback method

---

## Part 4: Testing Different Scenarios

### Test Case 1: Fresh Listings (Today)

1. Search for hot items: "iPhone", "PS5", "GPU"
2. Filter by "Listed today"
3. Run extraction
4. **Expected:** Most should show "Today" or "X hours ago"

### Test Case 2: Older Listings (Weeks/Months)

1. Search generic items: "furniture", "bicycle"
2. Scroll down to older listings
3. Run extraction
4. **Expected:** Should extract "X weeks ago", "X months ago"

### Test Case 3: Different Locations

1. Change Marketplace location (top of page)
2. Try different cities: Vancouver, Toronto, Seattle
3. Run extraction for each
4. **Expected:** Location field should match search location

### Test Case 4: Various Categories

Test across categories:
- Electronics (laptops, phones)
- Vehicles (cars, bikes)
- Home & Garden (furniture)
- Clothing & Accessories

**Expected:** All should extract with similar success rates

### Test Case 5: Price Ranges

1. Test low prices: <$50
2. Test mid prices: $100-$500
3. Test high prices: >$1000
4. **Expected:** Currency properly detected (CA$ vs US$)

---

## Part 5: Advanced Console Testing

### Inspecting Individual Listings

In the service worker console, you can run manual extraction:

```javascript
// Get first 10 listing links
const links = document.querySelectorAll('a[href*="/marketplace/item/"]');
console.log('Found links:', links.length);

// Test extraction on single listing
const link = links[0];
console.log('Testing:', link.href);
console.log('Full text:', link.textContent);
console.log('Title spans:', link.querySelectorAll('span[dir="auto"]'));
```

### Debugging Extraction Methods

Check which method succeeded for specific listing:

```javascript
// Run extraction and log methods
const listings = extractMarketplaceListings(10);
listings.forEach(l => {
  console.log(`${l.title}: ${l.extractionMethod} -> ${l.daysListed} days`);
});
```

### Testing Regex Patterns

Verify pattern matching:

```javascript
const testText = "Listed 3 days ago";
const dayMatch = testText.match(/listed\s*(\d+)\s*day/i);
console.log('Day match:', dayMatch); // Should show: ["listed 3 day", "3"]
```

---

## Part 6: Success Metrics & Reporting

### Record These Metrics:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Overall extraction rate | 75% | ___ % | ✅ / ❌ |
| Days listed success | 90% | ___ % | ✅ / ❌ |
| Price extraction | 95% | ___ % | ✅ / ❌ |
| Title extraction | 95% | ___ % | ✅ / ❌ |
| Location extraction | 80% | ___ % | ✅ / ❌ |
| Seller info | 70% | ___ % | ✅ / ❌ |

### Sample Test Report:

```
TEST RUN: 2025-10-31 15:30
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Search: "laptop" in Vancouver, BC
Total listings: 40
Extracted: 32 (80%)

EXTRACTION METHODS:
✅ TEXT_LISTED_DAYS: 20 (62%)
✅ SPAN_DAYS: 6 (19%)
✅ TIME_DATETIME: 4 (12%)
✅ ARIA_LABEL: 2 (6%)
❌ NONE: 0 (0%)

FIELD SUCCESS RATES:
✅ Price: 32/32 (100%)
✅ Title: 31/32 (97%)
✅ Days Listed: 30/32 (94%) ⭐
✅ Location: 27/32 (84%)
✅ Seller: 24/32 (75%)
✅ Images: 29/32 (91%)

STATUS: ✅ PASSING (all targets met)
```

---

## Part 7: Known Issues & Limitations

### Current Limitations:

1. **Sold listings**
   - May not extract properly
   - "Sold" status not currently captured

2. **Promoted/Featured listings**
   - Different DOM structure
   - May have lower success rate

3. **Non-English locations**
   - Date patterns may differ
   - "listed X days ago" might be in French/Spanish

4. **Mobile view**
   - Extension designed for desktop
   - Mobile Facebook has different HTML

### Workarounds:

**For sold listings:**
- Filter them out before testing
- Or add sold status detection

**For other languages:**
- Add language-specific patterns
- Use datetime attributes (more reliable)

---

## Part 8: Reporting Bugs

### When Extraction Fails:

1. **Capture console output**
   - Copy full extraction summary
   - Include any error messages

2. **Save page HTML**
   ```javascript
   // In service worker console
   copy(document.documentElement.outerHTML)
   ```

3. **Take screenshot**
   - Show the listing card
   - Highlight what failed to extract

4. **Provide details**
   - Search query used
   - Location/region
   - Browser version
   - Extension version

### Bug Report Template:

```markdown
## Extraction Failure Report

**Date:** 2025-10-31
**Search Query:** "laptop"
**Location:** Vancouver, BC
**Browser:** Chrome 120.0.6099.109
**Extension:** Claude Agent Browser v1.0.0

**Issue:**
Days listed not extracting for 15/30 listings

**Console Output:**
[Extraction] ❌ #5 | CA$800 | N/A | ... | Dell Laptop
[Extraction] extractionMethod: NONE

**Expected:**
Should extract "Listed 2 days ago"

**Actual Listing Text:**
"Dell Laptop $800 Posted 2 days ago Vancouver, BC"

**Notes:**
Pattern "Posted X days" not covered (uses "Posted" not "Listed")
```

---

## Quick Reference Card

### Opening Service Worker Console

```
1. chrome://extensions/
2. Find "Claude Agent Browser"
3. Click "service worker"
4. Keep window open
```

### Running Test

```
1. Go to Facebook Marketplace
2. Search for product
3. Click extension icon / auto-extract
4. Watch service worker console
```

### Success Criteria

```
✅ Overall: >75%
✅ Days listed: >90%
✅ Price: >95%
✅ Title: >95%
```

### Common Console Commands

```javascript
// Count listings
document.querySelectorAll('a[href*="/marketplace/item/"]').length

// Manual extraction
extractMarketplaceListings(10)

// Check pattern
"Listed 3 days ago".match(/listed\s*(\d+)\s*day/i)
```

---

## Next Steps

After completing testing:

1. ✅ Record all metrics
2. ✅ Document any failures
3. ✅ Compare against targets
4. ✅ Submit bug reports if needed
5. ✅ Suggest improvements

### Improvement Ideas:

- Add "sold" status detection
- Support multilingual date patterns
- Capture listing category automatically
- Extract product condition confidence score
- Add rate limiting / pagination handling

---

## Support

**Issues:**
- GitHub: Create issue with bug report template
- Console errors: Check for `[Extraction Error]` logs
- Rate limiting: Facebook may block rapid extraction

**Documentation:**
- Main README: `/README.md`
- API Reference: `/docs/API.md`
- Browser Controller: `/docs/BROWSER-CONTROL-COMPLETE.md`

---

**Last Updated:** 2025-10-31
**Version:** 1.0.0
**Status:** Production Ready ✅
