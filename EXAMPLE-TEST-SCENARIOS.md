# Example Test Scenarios - Boss Battle System

## Quick Reference Card

```javascript
// ESSENTIAL COMMANDS
bossFight.listBosses()           // See all bosses
testBoss('dom')                  // Start battle
bossFight.attack(0)              // Execute attack
bossFight.simulate()             // Auto-battle
bossFight.debug()                // Show state
bossFight.reset()                // Reset

// AVAILABLE BOSSES
'dom'          - DOM Manipulator
'captcha'      - CAPTCHA Detector
'form'         - Form Hunter
'javascript'   - JavaScript Warrior
'network'      - Network Inspector
'performance'  - Performance Monitor
```

---

## Scenario 1: Login Form Testing

**Objective:** Test DOM automation on a login form

**Target Page:** Any website with a login form (e.g., GitHub, Twitter, Gmail)

**Steps:**
```javascript
// 1. Navigate to login page
// Open https://github.com/login in browser

// 2. Open F12 Console and paste console-test-commands.js

// 3. Spawn DOM boss
testBoss('dom')

// 4. Test form filling
bossFight.attack(0)
// Expected: Fills username and password fields

// 5. Test selector intelligence
bossFight.attack(3)
// Expected: Detects email and password fields

// 6. Check results
bossFight.debug()
```

**Expected Output:**
```
⚔️ Turn 1: Form Filling Frenzy
   📝 Finding all input fields...
   Found 2 input fields
   ✅ Filled 2 fields

   ✅ HIT! Boss takes 50 damage!
   Boss HP: 450/500
```

**What This Tests:**
- Input field detection
- Form filling capability
- Event triggering (input/change)
- Smart selector matching

---

## Scenario 2: Registration Form Analysis

**Objective:** Analyze complex multi-step registration forms

**Target Page:** Any registration page (e.g., Reddit, Medium, Discord)

**Steps:**
```javascript
// 1. Navigate to registration page
// Example: https://www.reddit.com/register/

// 2. Load testing system

// 3. Start form analysis
testBoss('form')

// 4. Discover all forms
bossFight.attack(0)

// 5. Classify input types
bossFight.attack(1)

// 6. Locate submit buttons
bossFight.attack(2)

// 7. Review complete analysis
bossFight.debug()
```

**Expected Output:**
```
Form 1:
  - Inputs: 4
  - Buttons: 1
  - Action: /register
  - Method: POST

Input type breakdown:
  - email: 1
  - password: 1
  - text: 2
```

**What This Tests:**
- Form structure understanding
- Input classification
- Submit button detection
- Form attribute extraction

---

## Scenario 3: CAPTCHA Detection Test

**Objective:** Detect various CAPTCHA types

**Target Pages:**
- https://www.google.com/recaptcha/api2/demo (reCAPTCHA v2)
- https://dashboard.hcaptcha.com/signup (hCaptcha)
- Any page with image CAPTCHA

**Steps:**
```javascript
// On reCAPTCHA demo page
testBoss('captcha')
bossFight.attack(0)  // Detect reCAPTCHA v2

// On hCaptcha page
bossFight.reset()
testBoss('captcha')
bossFight.attack(1)  // Detect hCaptcha

// Test all detection methods
bossFight.simulate()
```

**Expected Output:**
```
🤖 Scanning for reCAPTCHA v2...
✅ reCAPTCHA v2 detected!
Element: DIV.g-recaptcha

✅ HIT! Boss takes 80 damage!
Boss HP: 920/1000
```

**What This Tests:**
- CAPTCHA type identification
- iframe detection
- Element class matching
- Image CAPTCHA recognition

---

## Scenario 4: Shadow DOM Navigation

**Objective:** Test shadow DOM element detection

**Target Page:** Any page using Web Components (e.g., YouTube, Polymer demo)

**Steps:**
```javascript
// Navigate to page with shadow DOM
// Example: https://www.youtube.com/

testBoss('dom')

// Test shadow DOM detection
bossFight.attack(2)

// Check results
bossFight.debug()
```

**Expected Output:**
```
👻 Searching for shadow DOM elements...
Found shadow root in: YTD-APP
Found shadow root in: TP-YT-PAPER-TAB
Found shadow root in: YT-ICON-BUTTON
✅ Found 15 shadow DOM roots

✅ HIT! Boss takes 60 damage!
```

**What This Tests:**
- Shadow DOM detection
- Shadow root enumeration
- Web component identification

---

## Scenario 5: Event System Testing

**Objective:** Verify JavaScript event simulation

**Target Page:** Any interactive page (works on any site)

**Steps:**
```javascript
testBoss('javascript')

// Test event simulation
bossFight.attack(0)

// Test local storage
bossFight.attack(1)

// Test cookie access
bossFight.attack(2)

// Review results
bossFight.debug()
```

**Expected Output:**
```
⚡ Testing event simulation...
✅ Successfully triggered 7/7 events

💾 Testing localStorage...
✅ localStorage read/write successful

🍪 Inspecting cookies...
Found 3 cookies
Cookie names:
  - _ga
  - session_token
  - preferences
```

**What This Tests:**
- Event dispatching
- Storage API access
- Cookie reading
- JavaScript execution

---

## Scenario 6: API Endpoint Discovery

**Objective:** Discover API endpoints in single-page applications

**Target Page:** SPAs like Twitter, Reddit, Discord

**Steps:**
```javascript
// Navigate to SPA (e.g., https://twitter.com/)

testBoss('network')

// Discover API endpoints
bossFight.attack(0)

// Test XHR interception
bossFight.attack(1)

// Check findings
bossFight.debug()
```

**Expected Output:**
```
🌐 Discovering API endpoints...
Found 12 potential API endpoints
  - https://api.twitter.com/2/users
  - https://api.twitter.com/1.1/timeline
  - https://api.twitter.com/graphql
  ...

✅ HIT! Boss takes 90 damage!
```

**What This Tests:**
- Script content scanning
- URL pattern matching
- API endpoint extraction
- XHR mocking capability

---

## Scenario 7: Performance Profiling

**Objective:** Profile page load performance

**Target Page:** Any page (heavier pages show more data)

**Steps:**
```javascript
// Navigate to page and wait for full load

testBoss('performance')

// Get timing metrics
bossFight.attack(0)

// Count resources
bossFight.attack(1)

// Review metrics
bossFight.debug()
```

**Expected Output:**
```
⏱️ Analyzing performance...
📊 Performance Metrics:
  - Page Load Time: 1234ms
  - DOM Ready: 567ms
  - DNS Lookup: 45ms
  - TCP Connection: 23ms

📦 Counting resources...
Resource breakdown:
  - Images: 23
  - Scripts: 15
  - Stylesheets: 8
  - Iframes: 2
  - Total: 48
```

**What This Tests:**
- Performance API access
- Timing measurement
- Resource counting
- Network analysis

---

## Scenario 8: Complete Automation Suite

**Objective:** Run full test suite on a complex page

**Target Page:** Modern web application (e.g., Reddit, GitHub, Discord)

**Steps:**
```javascript
// Full automation test sequence

console.log('🎮 Starting Complete Automation Suite\n');

// Test 1: DOM Capabilities
console.log('Test 1: DOM Capabilities');
testBoss('dom');
await bossFight.simulate();
bossFight.reset();

// Test 2: Form Analysis
console.log('Test 2: Form Analysis');
testBoss('form');
await bossFight.simulate();
bossFight.reset();

// Test 3: CAPTCHA Detection
console.log('Test 3: CAPTCHA Detection');
testBoss('captcha');
await bossFight.simulate();
bossFight.reset();

// Test 4: JavaScript Features
console.log('Test 4: JavaScript Features');
testBoss('javascript');
await bossFight.simulate();
bossFight.reset();

// Test 5: Network Analysis
console.log('Test 5: Network Analysis');
testBoss('network');
await bossFight.simulate();
bossFight.reset();

// Test 6: Performance Profiling
console.log('Test 6: Performance Profiling');
testBoss('performance');
await bossFight.simulate();

console.log('✅ Complete Automation Suite Finished!');
```

**What This Tests:**
- All automation features
- System integration
- Error handling
- Comprehensive coverage

---

## Scenario 9: Email Provider Testing

**Objective:** Test automation on temporary email services

**Target Pages:**
- https://temp-mail.org
- https://10minutemail.com
- https://www.guerrillamail.com

**Steps:**
```javascript
// Navigate to temp email service

// Test form detection
testBoss('form');
bossFight.attack(0);

// Test DOM manipulation
bossFight.reset();
testBoss('dom');
bossFight.attack(0);  // Fill any forms
bossFight.attack(3);  // Test selectors

// Check results
bossFight.debug();
```

**Expected Results:**
- Email field detection
- Form structure analysis
- Element interaction capability

---

## Scenario 10: Social Media Login Pages

**Objective:** Test on social media authentication flows

**Target Pages:**
- https://twitter.com/login
- https://facebook.com/login
- https://linkedin.com/login

**Steps:**
```javascript
// On social media login page

// Comprehensive test
testBoss('dom');
await bossFight.simulate();

// Form analysis
bossFight.reset();
testBoss('form');
await bossFight.simulate();

// JavaScript features
bossFight.reset();
testBoss('javascript');
await bossFight.simulate();
```

**What This Tests:**
- Modern framework compatibility (React, Vue)
- Dynamic form handling
- Event system compatibility
- AJAX form submission detection

---

## Scenario 11: E-commerce Testing

**Objective:** Test on e-commerce checkout flows

**Target Pages:**
- Amazon product pages
- eBay listings
- Shopify stores

**Steps:**
```javascript
// On product page

// Detect add-to-cart buttons
testBoss('dom');
bossFight.attack(1);  // Button click detection

// Analyze form structure
bossFight.reset();
testBoss('form');
bossFight.attack(0);  // Form discovery

// Network analysis
bossFight.reset();
testBoss('network');
bossFight.attack(0);  // API discovery
```

**What This Tests:**
- Button detection
- Form field types
- API endpoints
- Dynamic content

---

## Scenario 12: Multi-Language Sites

**Objective:** Test internationalization compatibility

**Target Pages:**
- Sites with language switchers
- Multi-language forms

**Steps:**
```javascript
// Test in English
testBoss('form');
bossFight.simulate();

// Switch language (manually or via console)
document.querySelector('[lang="es"]')?.click();

// Test in Spanish
bossFight.reset();
testBoss('form');
bossFight.simulate();

// Compare results
bossFight.debug();
```

**What This Tests:**
- Language-independent detection
- Internationalized selectors
- Multi-language form handling

---

## Scenario 13: Progressive Web Apps (PWA)

**Objective:** Test PWA features and service workers

**Target Pages:**
- Twitter PWA
- Instagram Web
- Pinterest

**Steps:**
```javascript
// Test JavaScript features
testBoss('javascript');
bossFight.simulate();

// Test network capabilities
bossFight.reset();
testBoss('network');
bossFight.simulate();

// Test performance
bossFight.reset();
testBoss('performance');
bossFight.simulate();
```

**What This Tests:**
- Service worker compatibility
- Offline capabilities
- Cache API access
- PWA-specific features

---

## Scenario 14: Error Recovery Testing

**Objective:** Test system resilience

**Steps:**
```javascript
// Intentionally cause errors

// Test on page with no forms
testBoss('form');
bossFight.attack(0);  // Should handle gracefully

// Test on page with no CAPTCHA
bossFight.reset();
testBoss('captcha');
bossFight.simulate();  // Should report "none found"

// Test invalid attack index
bossFight.reset();
testBoss('dom');
bossFight.attack(999);  // Should show error message

// Verify error handling
bossFight.debug();
```

**What This Tests:**
- Error handling
- Graceful degradation
- Error messages
- Recovery mechanisms

---

## Scenario 15: Comparative Testing

**Objective:** Compare automation across different sites

**Steps:**
```javascript
// Test Site A
const resultsA = {};
testBoss('dom');
await bossFight.simulate();
resultsA.dom = bossFight.state.combatLog;

// Test Site B (navigate manually)
bossFight.reset();
const resultsB = {};
testBoss('dom');
await bossFight.simulate();
resultsB.dom = bossFight.state.combatLog;

// Compare
console.log('Site A Results:', resultsA);
console.log('Site B Results:', resultsB);
```

**What This Tests:**
- Cross-site compatibility
- Consistency
- Reliability
- Performance variance

---

## Advanced Scenarios

### Scenario 16: Custom Boss Creation

**Objective:** Create a custom test boss

**Steps:**
```javascript
// Define custom boss
const customBoss = {
  name: 'The Custom Tester',
  level: 10,
  hp: 1000,
  maxHp: 1000,
  xpReward: 1000,
  description: 'Tests custom automation features',
  weakness: 'innovation',
  attacks: [
    {
      name: 'Custom Link Finder',
      damage: 100,
      description: 'Find all external links',
      execute: async () => {
        const links = document.querySelectorAll('a[href^="http"]');
        console.log(`Found ${links.length} external links`);
        return links.length > 0;
      }
    },
    {
      name: 'Video Detector',
      damage: 80,
      description: 'Detect video players',
      execute: async () => {
        const videos = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]');
        console.log(`Found ${videos.length} video elements`);
        return true;
      }
    }
  ]
};

// Add to system
bossFight.bosses.set('custom', customBoss);

// Test it
testBoss('custom');
bossFight.simulate();
```

---

### Scenario 17: Integration with Existing Tests

**Objective:** Use boss battles in automated test suite

**Playwright Example:**
```javascript
import { test, expect } from '@playwright/test';

test('Boss battle - DOM automation', async ({ page }) => {
  await page.goto('https://example.com');

  // Inject test system
  const script = await fs.readFile('./console-test-commands.js', 'utf8');
  await page.addScriptTag({ content: script });

  // Run battle
  const result = await page.evaluate(async () => {
    await window.bossFight.testBoss('dom');
    await window.bossFight.simulate();
    return {
      victory: window.bossFight.state.victory,
      turns: window.bossFight.state.turn,
      combatLog: window.bossFight.state.combatLog
    };
  });

  // Assert results
  expect(result.victory).toBe(true);
  expect(result.turns).toBeGreaterThan(0);
  console.log('Combat Log:', result.combatLog);
});
```

---

## Debugging Scenarios

### Scenario 18: Debug Failed Tests

**Steps:**
```javascript
// Run a test
testBoss('dom');
bossFight.attack(0);

// If it fails, debug
if (bossFight.state.playerHp < 100) {
  console.log('Attack failed! Debugging...');

  // Check what elements exist
  console.log('Input fields:', document.querySelectorAll('input').length);
  console.log('Forms:', document.querySelectorAll('form').length);

  // Check boss state
  bossFight.debug();

  // Try alternative attack
  bossFight.attack(1);
}
```

---

### Scenario 19: Performance Benchmarking

**Objective:** Benchmark test execution speed

**Steps:**
```javascript
// Benchmark test execution
const benchmark = async () => {
  const results = {};

  for (const boss of ['dom', 'form', 'javascript', 'network', 'performance']) {
    const start = performance.now();

    testBoss(boss);
    await bossFight.simulate();

    const end = performance.now();
    results[boss] = {
      time: end - start,
      victory: bossFight.state.victory,
      turns: bossFight.state.turn
    };

    bossFight.reset();
  }

  console.table(results);
  return results;
};

// Run benchmark
await benchmark();
```

---

## Tips for Each Scenario

**Login Forms:**
- Look for password managers interfering
- Check for autocomplete attributes
- Test with and without JavaScript

**Registration Forms:**
- Test multi-step flows
- Check validation logic
- Test required field detection

**CAPTCHA Detection:**
- Test on pages without CAPTCHA (should report none)
- Test on demo pages (reliable)
- Check iframe detection

**Shadow DOM:**
- Modern sites use more shadow DOM
- YouTube is excellent test site
- Check Web Components

**API Discovery:**
- SPAs have more API endpoints
- Check Network tab correlation
- Test on heavy AJAX sites

**Performance:**
- Test on slow vs fast sites
- Compare resource counts
- Check timing accuracy

---

## Success Criteria

For each scenario, success means:

✅ **No JavaScript errors**
✅ **Accurate detection/reporting**
✅ **Boss defeated (HP = 0)**
✅ **Player survived (HP > 0)**
✅ **Combat log shows all attacks**
✅ **Debug info is accurate**

---

## Reporting Results

After testing, document results:

```javascript
// Generate test report
const report = {
  date: new Date().toISOString(),
  page: window.location.href,
  userAgent: navigator.userAgent,
  tests: []
};

// Run tests and collect results
['dom', 'form', 'captcha', 'javascript', 'network', 'performance'].forEach(async boss => {
  testBoss(boss);
  await bossFight.simulate();

  report.tests.push({
    boss: boss,
    victory: bossFight.state.victory,
    turns: bossFight.state.turn,
    combatLog: bossFight.state.combatLog
  });

  bossFight.reset();
});

// Export report
console.log(JSON.stringify(report, null, 2));
```

---

**Version:** 1.0.0
**Last Updated:** 2025-10-29
**Author:** Claude Code QA Team
