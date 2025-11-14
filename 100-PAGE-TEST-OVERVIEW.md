# 100-Page Comprehensive Cross-Capability Test

**Date**: November 13, 2025
**Purpose**: Test ALL Claude Agent Browser capabilities across 100 real web pages
**Goal**: Validate cross-component learning and AgentDB pattern collection

---

## 🎯 Test Overview

This comprehensive test exercises **10 core capabilities** of Claude Agent Browser across **100 real web pages**, storing all patterns in a unified AgentDB for cross-component learning.

### Capabilities Tested

1. **DOM Element Detection** - Detect divs, inputs, buttons, links, forms
2. **Form Field Detection** - Identify input types, names, IDs, placeholders
3. **Button Detection** - Find clickable buttons and submit elements
4. **Link Extraction** - Extract hyperlinks and navigation elements
5. **Shadow DOM Detection** - Detect and traverse shadow roots
6. **Iframe Detection** - Find embedded iframes
7. **Dynamic Content Detection** - Identify SPA frameworks (React, Vue, Angular, Svelte)
8. **CAPTCHA Detection** - Detect reCAPTCHA, hCAPTCHA, Cloudflare challenges
9. **Performance Metrics** - Measure load times, response times
10. **API Interception** - Track XHR/fetch requests

### Test Sites (100 Pages)

**Form Testing Sites**:
- The Internet Herokuapp (login, dropdown, checkboxes, etc.)
- Practice Test Automation
- SauceDemo
- ParaBank
- OrangeHRM Demo

**Dynamic Content Sites**:
- UI Testing Playground (AJAX, Dynamic ID, Client-side delay)
- The Internet (Dynamic Loading, Infinite Scroll)

**Shadow DOM Sites**:
- UI Testing Playground (Shadow DOM elements)

**Iframe Sites**:
- The Internet (Frames, Nested Frames)

**Real-World Sites** (read-only observation):
- GitHub, Amazon, Stack Overflow
- Reddit, Twitter/X, LinkedIn
- YouTube, Wikipedia
- And 80+ more curated test sites

---

## 📊 Data Collection

### AgentDB Pattern Storage

Every test records patterns to **unified AgentDB** (`./data/unified-agentdb/`):

```typescript
interface ActionPattern {
  action: string;           // 'detect', 'detect_field', 'detect_button', etc.
  selector: string;         // CSS selector or element type
  value?: string;           // Optional value (button text, etc.)
  url: string;              // Page URL
  success: boolean;         // Test success
  timestamp: string;        // ISO timestamp
  metadata: {
    capability: string;     // Which capability detected this
    [key: string]: unknown; // Additional metadata
    source: '100-page-test';
  };
}
```

### Expected Patterns

- **DOM Detection**: ~5 patterns per page (5 element types)
- **Form Fields**: 0-20 patterns per page (varies by site)
- **Buttons**: 0-20 patterns per page
- **Links**: 10 patterns per page (limited to first 10)
- **Shadow DOM**: 0-5 patterns per page (if present)
- **Iframes**: 0-3 patterns per page (if present)
- **Frameworks**: 0-4 patterns per page
- **CAPTCHAs**: 0-3 patterns per page (if present)
- **Performance**: 1 pattern per page
- **API Calls**: 1 pattern per page (if API calls detected)

**Total Expected**: **5,000-15,000 patterns** across 100 pages

---

## 🎮 Test Execution

### Running the Test

```bash
# Run comprehensive test
npx tsx scripts/100-page-comprehensive-test.ts

# Monitor progress in real-time (separate terminal)
npx tsx scripts/monitor-test-progress.ts
```

### Test Flow

For each of 100 pages:
1. Navigate to page (30s timeout)
2. Run all 10 capability tests
3. Store patterns to AgentDB
4. Calculate success rate
5. Close page
6. Save progress every 10 sites

### Progress Tracking

Progress saved to: `./data/test-results/100-page-progress.json`

```json
{
  "timestamp": "2025-11-13T...",
  "completed": 25,
  "total": 100,
  "results": [/* array of TestResult */]
}
```

---

## 📈 Expected Results

### Test Duration

- **Per Page**: ~10-30 seconds
- **Total Time**: ~15-50 minutes (depends on site responsiveness)

### Success Metrics

- **DOM Detection**: 95-100% (should always work)
- **Form Detection**: 70-90% (depends on page type)
- **Button Detection**: 70-90% (depends on page type)
- **Link Extraction**: 85-95% (most pages have links)
- **Shadow DOM**: 100% (works when present, rare)
- **Iframe Detection**: 100% (works when present)
- **Framework Detection**: 100% (accurate detection)
- **CAPTCHA Detection**: 100% (accurate when present)
- **Performance**: 100% (always available)
- **API Interception**: 60-80% (depends on page behavior)

**Overall Expected Success**: **75-90%** across all capabilities

### Pattern Learning

- **Unique Selectors**: 2,000-5,000 unique CSS selectors
- **Button Patterns**: 500-1,000 button text/selector pairs
- **Field Types**: 100-200 unique field type combinations
- **Frameworks**: 4 framework detection patterns
- **Performance Baselines**: 100 page load metrics

---

## 🧠 Cross-Component Learning

All patterns stored in **unified AgentDB** can be queried by:

1. **Click Factory** - Find proven selectors for form automation
2. **Signup Assistant** - Identify common signup field patterns
3. **Email Collector** - Detect email field patterns
4. **Chrome Extension** - Real-time selector suggestions
5. **MCP Server** - API-driven automation with learned patterns

### Example Queries

```typescript
// Find username field patterns
db.findSimilar({
  action: 'detect_field',
  selector: 'input[type="text"]',
  url: 'https://example.com',
  success: true
}, 10, { successOnly: true });

// Find React-based sites
db.queryByMetadata({
  'metadata.framework': 'react'
});

// Find sites with CAPTCHAs
db.queryByMetadata({
  'metadata.captchaType': 'recaptcha'
});
```

---

## 📁 Output Files

### Test Results

1. **Progress File** (updates every 10 sites):
   ```
   ./data/test-results/100-page-progress.json
   ```

2. **Final Report**:
   ```
   ./data/test-results/100-page-final-report.json
   ```
   Contains:
   - Summary statistics
   - Capability performance breakdown
   - Category performance (Forms, Dynamic, Real-World, etc.)
   - AgentDB statistics
   - All individual test results

3. **AgentDB Database**:
   ```
   ./data/unified-agentdb/index.dat        # HNSW vector index
   ./data/unified-agentdb/metadata.json    # Pattern metadata
   ```

### Report Structure

```json
{
  "timestamp": "2025-11-13T...",
  "summary": {
    "pagesT": 100,
    "totalCapabilities": 1000,
    "successfulCapabilities": 850,
    "avgSuccessRate": 0.85,
    "totalDuration": 1800000,  // ms
    "totalPatterns": 12500
  },
  "capabilityStats": [
    {
      "capability": "DOM Detection",
      "total": 100,
      "successful": 99,
      "successRate": 0.99
    },
    // ... 9 more capabilities
  ],
  "categoryStats": [
    {
      "category": "Forms",
      "siteCount": 30,
      "avgSuccessRate": 0.92
    },
    // ... more categories
  ],
  "agentDBStats": {
    "totalActions": 12500,
    "successRate": 0.78,
    "actionTypes": {
      "detect": 500,
      "detect_field": 3000,
      "detect_button": 2500,
      // ...
    }
  }
}
```

---

## 🎯 Success Criteria

### Test Completion

- ✅ All 100 pages visited
- ✅ All 10 capabilities tested per page
- ✅ Patterns stored in unified AgentDB
- ✅ Progress saved throughout
- ✅ Final report generated

### Quality Metrics

- ✅ **75%+ overall success rate** across all capabilities
- ✅ **5,000+ patterns learned** minimum
- ✅ **90%+ success** on DOM/Form/Button detection
- ✅ **Zero crashes** during execution
- ✅ **Database integrity** maintained

### Learning Validation

- ✅ Patterns queryable by selector similarity
- ✅ Metadata filters work correctly
- ✅ Cross-component access enabled
- ✅ Top patterns identified
- ✅ Statistics accurate

---

## 🔍 Analysis After Test

### Queries to Run

1. **Find most reliable selectors**:
   ```typescript
   const topPatterns = db.getTopPatterns(50);
   // Filter for 90%+ success rate
   const reliable = topPatterns.filter(p => p.successRate > 0.9);
   ```

2. **Identify framework distribution**:
   ```typescript
   const reactSites = db.queryByMetadata({ 'metadata.framework': 'react' });
   const vueSites = db.queryByMetadata({ 'metadata.framework': 'vue' });
   ```

3. **Find CAPTCHA-protected sites**:
   ```typescript
   const captchaSites = db.queryByMetadata({ 'metadata.captchaType': /.*/ });
   ```

4. **Performance insights**:
   ```typescript
   const perfPatterns = db.queryByMetadata({ capability: 'Performance Metrics' });
   const avgLoadTime = perfPatterns.reduce((sum, p) =>
     sum + p.metadata.loadComplete, 0) / perfPatterns.length;
   ```

---

## 🚀 Next Steps After Test

1. **Import Additional Training Data**:
   - Email Gauntlet patterns (15 patterns, 93.3% success)
   - Auto-accept affiliate networks (80+ networks)
   - Social media patterns (7 patterns)

2. **Enable Passive Learning**:
   - Install PassiveLearner in Chrome Extension
   - Learn from regular browsing automatically

3. **Implement Advanced Features**:
   - ReflexionMemory (self-critique on failures)
   - SkillLibrary (semantic skill search)
   - CausalMemory (cause-effect tracking)
   - LearnerRuntime (Q-learning optimization)

4. **Production Deployment**:
   - Use unified AgentDB across all components
   - Enable cross-component pattern sharing
   - Monitor pattern growth over time

---

## 📊 Current State

**AgentDB**: 521 marathon training patterns already imported
**Test Status**: Running 100-page comprehensive test
**Expected Completion**: 15-50 minutes
**Final Pattern Count**: 5,521-15,521 patterns (521 existing + 5,000-15,000 new)

---

**Test Created**: November 13, 2025
**Script**: `scripts/100-page-comprehensive-test.ts`
**Monitor**: `scripts/monitor-test-progress.ts`
**Database**: `./data/unified-agentdb/`
