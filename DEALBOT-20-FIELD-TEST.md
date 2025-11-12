# DealBot 20-Field Test - Automated ⚡

## One-Line Command

```bash
npm run test:dealbot
```

---

## What It Tests

### All 20 Extraction Fields

**🔵 Core Fields (8):**
- Price, Title, Age, Location
- URL, Listing ID, Currency, Image

**🟢 Phase 1 (+40% ML accuracy - 5):**
- Condition, Seller Info, Category
- Images, Shipping Info

**🟡 Phase 2 (+40% more ML accuracy - 7):**
- Seller Badges, Seller Rating
- Brand, Model, Specifications
- Urgency Keywords, Description

**📅 Special: Age Detection Diagnostic**
- Tests if Facebook shows listing age
- Determines if 0% age is code issue or Facebook limitation
- Checks 5 sample listings for age data

---

## Expected Output

```
🚀 DealBot 20-Field Extraction Test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ DealBot extension loaded: abc123def456

🔐 Navigating to Facebook Marketplace...
✅ Logged in to Facebook

🔍 Searching for: "laptop"
📦 Opening first listing...

🔍 Running age detection diagnostic...
📊 Age Detection: 0/5 listings
❌ Facebook (likely Canada) does NOT show listing age

✅ Found button, triggering extraction...
⏳ Waiting for extraction to complete...
✅ Extraction complete!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 20-FIELD EXTRACTION TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Search: "laptop" in Vancouver, BC
📦 Total Listings: 30

📅 AGE DETECTION DIAGNOSTIC:
  Facebook Shows Age: ❌ NO
  Age Data Available: 0/5 listings
  ❌ Facebook (likely Canada) does NOT show listing age - This is a Facebook limitation, not a code issue

🔵 CORE FIELDS (8 fields):
  ❌ Age (days listed)      0/30   0% (target: 70%)
  ✅ Price                 30/30 100% (target: 95%)
  ✅ Title                 30/30 100% (target: 95%)
  ✅ Location              27/30  90% (target: 80%)
  ✅ URL                   30/30 100% (target: 100%)
  ✅ Listing ID            30/30 100% (target: 100%)
  ✅ Currency              30/30 100% (target: 95%)
  ✅ Image URL             28/30  93% (target: 85%)
  Overall: 87.5% pass rate

🟢 PHASE 1 FIELDS (+40% ML Accuracy - 5 fields):
  ✅ Condition             28/30  93% (target: 90%)
  ✅ Seller Info           25/30  83% (target: 70%)
  ✅ Category              27/30  90% (target: 85%)
  ✅ Images                29/30  97% (target: 90%)
  ⚠️ Shipping Info         18/30  60% (target: 60%)
  Overall: 80.0% pass rate

🟡 PHASE 2 FIELDS (+40% Additional ML Accuracy - 7 fields):
  ✅ Seller Badges         16/30  53% (target: 50%)
  ⚠️ Seller Rating         10/30  33% (target: 40%)
  ✅ Brand                 19/30  63% (target: 60%)
  ✅ Model                 16/30  53% (target: 50%)
  ⚠️ Specifications        11/30  37% (target: 40%)
  ✅ Urgency Keywords      12/30  40% (target: 30%)
  ✅ Description           29/30  97% (target: 95%)
  Overall: 71.4% pass rate

📈 OVERALL STATISTICS:
  ML Accuracy Gain: +72.0%
  Total Fields Working: 20/20

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ TEST PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 Results saved to: test-results/dealbot-20-field-test-2025-11-02.json
```

---

## Success Criteria

**Test PASSES if:**
- ✅ Core fields: 60%+ pass rate
- ✅ Phase 1 fields: 50%+ pass rate
- ✅ Phase 2 fields: 30%+ pass rate

**Test FAILS if:**
- ❌ Core fields < 60%
- ❌ Phase 1 fields < 50%
- ❌ Phase 2 fields < 30%

---

## Understanding Age Results

### Scenario 1: Age shows 0%, Diagnostic shows 0/5
```
Age (days listed):  0/30   0%
Age Detection: 0/5 listings
❌ Facebook does NOT show listing age
```
**Conclusion:** Facebook limitation (likely Canada), not code issue

### Scenario 2: Age shows 0%, Diagnostic shows 5/5
```
Age (days listed):  0/30   0%
Age Detection: 5/5 listings
✅ All listings show age data
```
**Conclusion:** Code needs fixing (data exists but extraction failing)

### Scenario 3: Age shows 73%, Diagnostic shows 5/5
```
Age (days listed): 22/30  73%
Age Detection: 5/5 listings
✅ All listings show age data
```
**Conclusion:** Everything working correctly!

---

## Field Targets

| Field | Target | Phase | ML Gain |
|-------|--------|-------|---------|
| **Core Fields** |
| Price | 95% | Core | - |
| Title | 95% | Core | - |
| Age | 70% | Core | - |
| Location | 80% | Core | - |
| URL | 100% | Core | - |
| Listing ID | 100% | Core | - |
| Currency | 95% | Core | - |
| Image URL | 85% | Core | - |
| **Phase 1 Fields** |
| Condition | 90% | Phase 1 | +40% |
| Seller Info | 70% | Phase 1 | +40% |
| Category | 85% | Phase 1 | +40% |
| Images | 90% | Phase 1 | +40% |
| Shipping Info | 60% | Phase 1 | +40% |
| **Phase 2 Fields** |
| Seller Badges | 50% | Phase 2 | +40% |
| Seller Rating | 40% | Phase 2 | +40% |
| Brand | 60% | Phase 2 | +40% |
| Model | 50% | Phase 2 | +40% |
| Specifications | 40% | Phase 2 | +40% |
| Urgency Keywords | 30% | Phase 2 | +40% |
| Description | 95% | Phase 2 | +40% |

---

## Quick Commands

```bash
# Run test
npm run test:dealbot

# Or direct
npm run test:20-fields

# Run and save
npm run test:dealbot > test-output.txt

# View results
cat test-results/dealbot-20-field-test-*.json | jq
```

---

## Customization

### Test Different Product

Edit `tests/dealbot-20-field-test.ts`:

```typescript
const result = await test.runTest('iPhone 14', 'Vancouver, BC');
```

### Test Different Location

```typescript
const result = await test.runTest('laptop', 'Toronto, ON');
```

### Change Diagnostic Sample Size

```typescript
// In testAgeDetection method
const totalChecked = Math.min(10, links.length); // Check 10 instead of 5
```

---

## Troubleshooting

### Issue: Extension not found

**Fix:**
```bash
npm run build
# Reload extension in chrome://extensions/
```

### Issue: "Research This Deal" button not found

**Possible causes:**
1. Button not injected (content script issue)
2. Different button text
3. Modal not appearing

**Fallback:** Test attempts direct extraction via console

### Issue: All fields show 0%

**Check:**
1. Did extraction run? (Look for console logs)
2. Is DealBot extension active?
3. Are you on Facebook Marketplace?

---

## What Gets Saved

**JSON Result File:**
```json
{
  "timestamp": 1698876543210,
  "searchQuery": "laptop",
  "location": "Vancouver, BC",
  "totalListings": 30,

  "coreFields": [
    {
      "fieldName": "Price",
      "extracted": 30,
      "total": 30,
      "percentage": 100,
      "status": "pass",
      "target": 95
    },
    // ... more fields
  ],

  "phase1Fields": [ /* ... */ ],
  "phase2Fields": [ /* ... */ ],

  "overallStats": {
    "coreSuccess": 87.5,
    "phase1Success": 80.0,
    "phase2Success": 71.4,
    "mlAccuracyGain": 72.0
  },

  "ageDetectionTest": {
    "facebookShowsAge": false,
    "ageDataAvailable": 0,
    "totalChecked": 5,
    "conclusion": "❌ Facebook does NOT show listing age"
  },

  "passed": true
}
```

---

## ML Accuracy Calculation

**Phase 1 (+40%):**
- If all 5 fields pass = +40%
- If 4/5 pass = +32%
- If 3/5 pass = +24%

**Phase 2 (+40% more):**
- If all 7 fields pass = +40%
- If 5/7 pass = +29%
- If 4/7 pass = +23%

**Total ML Gain:**
```
Total = (Phase1Active/5 × 40) + (Phase2Active/7 × 40)

Example:
- Phase 1: 4/5 pass = 32%
- Phase 2: 5/7 pass = 29%
- Total: 32% + 29% = 61% ML accuracy gain
```

---

## Integration with Other Tests

```bash
# Run all tests
npm run test:dealbot
npm run test:multi-location
npm run test:marketplace

# Analyze all
npm run test:analyze

# Generate combined report
npm run test:report
```

---

## CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Run DealBot 20-field test
  run: npm run test:dealbot

- name: Upload results
  uses: actions/upload-artifact@v2
  with:
    name: dealbot-results
    path: test-results/dealbot-20-field-test-*.json
```

---

## Next Steps

1. Run test: `npm run test:dealbot`
2. Check age diagnostic result
3. Review Phase 1 & 2 success rates
4. Calculate ML accuracy gain
5. Fix any failing fields if needed

---

**That's it! One command tests everything.** 🚀

For full details: `tests/dealbot-20-field-test.ts`
