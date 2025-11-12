# Workflow Example: Complete Signup & API Key Extraction

This example demonstrates a complete signup workflow including credential generation, form filling, CAPTCHA solving, and credential storage.

## Use Case

Automate signup for a new service and extract the API key for future use.

## Prerequisites

- Browser automation extension loaded in Chrome
- MCP server running
- Target website: any service with signup form

## Workflow Steps

### Step 1: Generate Credentials

```javascript
// Generate a random username
const username = await username_generate({});
// Result: { success: true, username: "swift-tiger-7423" }

// Generate a secure password
const password = await password_generate({
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true
});
// Result: { success: true, password: "Xk9@mP2$vL8#qR5!wN3%aB4&" }
```

### Step 2: Navigate to Signup Page

```javascript
await browser_navigate({
  url: "https://example-service.com/signup",
  waitUntil: "networkidle"
});
// Result: { success: true, finalUrl: "https://example-service.com/signup", title: "Sign Up" }
```

### Step 3: Fill Signup Form

```javascript
await browser_fill_form({
  fields: {
    username: username.username,
    email: `${username.username}@tempmail.com`,
    password: password.password,
    confirm_password: password.password,
    agree_to_terms: true
  },
  selectors: {
    username: "#signup-username",
    email: "#signup-email",
    password: "#signup-password",
    confirm_password: "#signup-password-confirm",
    agree_to_terms: "#agree-to-tos"
  }
});
// Result: { success: true, fieldsFilled: ["username", "email", "password", "confirm_password", "agree_to_terms"], errors: [] }
```

### Step 4: Handle CAPTCHA (if present)

```javascript
// Detect CAPTCHA
const captcha = await captcha_detect({});
// Result: { detected: true, type: "recaptcha_v2", sitekey: "6Le-wvkSA..." }

// Solve it if detected
if (captcha.detected) {
  await captcha_solve({
    type: captcha.type,
    sitekey: captcha.sitekey,
    url: "https://example-service.com/signup",
    strategy: "auto"  // Try AI first, fall back to API
  });
  // Result: { success: true, solution: "03AGdBq24...", strategy_used: "ai", time_taken: 3456 }
}
```

### Step 5: Submit Form

```javascript
await browser_click({
  selector: "#signup-submit-button",
  waitForNavigation: true,
  timeout: 10000
});
// Result: { success: true, navigationOccurred: true }
```

### Step 6: Wait for API Key Display

```javascript
await browser_wait({
  type: "selector",
  value: ".api-key-display",
  timeout: 15000,
  visible: true
});
// Result: { success: true, elementFound: true, waitTime: 2345 }
```

### Step 7: Extract API Key

```javascript
const apiKey = await browser_extract({
  selector: ".api-key-display",
  attribute: "textContent"
});
// Result: { success: true, data: "sk-1234567890abcdef...", elements: 1 }
```

### Step 8: Store Credentials

```javascript
await credential_store({
  service: "example-service",
  username: username.username,
  password: apiKey.data,
  notes: `API key extracted on ${new Date().toISOString()}`,
  metadata: {
    signup_email: `${username.username}@tempmail.com`,
    signup_password: password.password,
    created_at: new Date().toISOString()
  }
});
// Result: { success: true, service: "example-service", message: "Credential stored successfully" }
```

### Step 9: Save Pattern for Future Use

```javascript
await pattern_store({
  domain: "example-service.com",
  action: "signup",
  intent: "create account and extract API key",
  steps: [
    { type: "navigate", url: "https://example-service.com/signup" },
    { type: "fill", selector: "#signup-username", field: "username" },
    { type: "fill", selector: "#signup-email", field: "email" },
    { type: "fill", selector: "#signup-password", field: "password" },
    { type: "fill", selector: "#signup-password-confirm", field: "confirm_password" },
    { type: "click", selector: "#agree-to-tos" },
    { type: "captcha_solve", strategy: "auto" },
    { type: "click", selector: "#signup-submit-button" },
    { type: "wait", selector: ".api-key-display" },
    { type: "extract", selector: ".api-key-display", field: "apiKey" }
  ],
  success: true,
  metadata: {
    browser: "chromium",
    version: "120.0.0.0",
    timestamp: new Date().toISOString(),
    duration_ms: 8500
  }
});
// Result: { success: true, pattern_id: "pattern-67890", embedding: [...] }
```

### Step 10: Take Screenshot for Verification

```javascript
await browser_screenshot({
  fullPage: false,
  format: "png",
  path: `/tmp/signup-success-${Date.now()}.png`
});
// Result: { success: true, path: "/tmp/signup-success-1234567890.png" }
```

## Complete Script

```javascript
async function completeSignupWorkflow(signupUrl) {
  try {
    // 1. Generate credentials
    const username = await username_generate({});
    const password = await password_generate({ length: 20, symbols: true });

    // 2. Navigate
    await browser_navigate({ url: signupUrl, waitUntil: "networkidle" });

    // 3. Fill form
    await browser_fill_form({
      fields: {
        username: username.username,
        email: `${username.username}@tempmail.com`,
        password: password.password,
        confirm_password: password.password,
        agree_to_terms: true
      },
      selectors: {
        username: "#signup-username",
        email: "#signup-email",
        password: "#signup-password",
        confirm_password: "#signup-password-confirm",
        agree_to_terms: "#agree-to-tos"
      }
    });

    // 4. Handle CAPTCHA
    const captcha = await captcha_detect({});
    if (captcha.detected) {
      await captcha_solve({
        type: captcha.type,
        sitekey: captcha.sitekey,
        url: signupUrl,
        strategy: "auto"
      });
    }

    // 5. Submit
    await browser_click({ selector: "#signup-submit-button", waitForNavigation: true });

    // 6. Wait for API key
    await browser_wait({ type: "selector", value: ".api-key-display", timeout: 15000 });

    // 7. Extract
    const apiKey = await browser_extract({ selector: ".api-key-display", attribute: "textContent" });

    // 8. Store
    await credential_store({
      service: new URL(signupUrl).hostname,
      username: username.username,
      password: apiKey.data,
      metadata: {
        signup_email: `${username.username}@tempmail.com`,
        signup_password: password.password,
        created_at: new Date().toISOString()
      }
    });

    // 9. Save pattern
    await pattern_store({
      domain: new URL(signupUrl).hostname,
      action: "signup",
      intent: "create account and extract API key",
      success: true
    });

    // 10. Screenshot
    await browser_screenshot({ fullPage: false, format: "png" });

    return {
      success: true,
      username: username.username,
      apiKey: apiKey.data
    };

  } catch (error) {
    console.error("Signup workflow failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Usage
const result = await completeSignupWorkflow("https://example-service.com/signup");
console.log("Signup result:", result);
```

## Expected Results

- **Username**: Random generated (e.g., "swift-tiger-7423")
- **Password**: Secure 20-character random string
- **API Key**: Extracted from page (e.g., "sk-1234567890abcdef...")
- **Storage**: Encrypted in credential vault
- **Pattern**: Saved to AgentDB for future reuse
- **Screenshot**: Saved to /tmp/

## Error Handling

```javascript
// Check each step for success
if (!fillResult.success) {
  console.error("Form fill failed:", fillResult.errors);
  // Retry or abort
}

// Handle CAPTCHA failures
if (captchaResult && !captchaResult.success) {
  console.log("CAPTCHA failed, trying different strategy...");
  await captcha_solve({ ...captchaParams, strategy: "api" });
}

// Handle timeouts
try {
  await browser_wait({ type: "selector", value: ".api-key", timeout: 5000 });
} catch (e) {
  console.log("API key not found, checking for error messages...");
  const error = await browser_extract({ selector: ".error-message" });
  console.error("Signup error:", error.data);
}
```

## Variations

### With Temporary Email

```javascript
// Generate temp email first
const tempEmail = await email_collect({
  provider: "guerrillamail",
  count: 1,
  store_credentials: true
});

// Use it in signup
await browser_fill_form({
  fields: {
    email: tempEmail.accounts[0].email,
    // ...
  }
});

// Check for verification email
const inbox = await email_check_inbox({
  email: tempEmail.accounts[0].email,
  provider: "guerrillamail"
});

// Extract verification link
const verifyLink = inbox.emails[0].body.match(/https:\/\/.*\/verify.*/)[0];

// Navigate to verify
await browser_navigate({ url: verifyLink });
```

### With Stealth Profile

```javascript
// Create stealth profile first
const profile = await profile_create({
  name: "signup-stealth",
  randomize: {
    screen_resolution: true,
    timezone: true,
    webgl: true,
    canvas: true
  }
});

// Use profile ID in subsequent calls
// (configured in extension settings)

// Proceed with signup workflow...
```

## Tips

1. **Always wait for elements** before interacting
2. **Check success field** in every response
3. **Store patterns** immediately after success
4. **Add delays** between actions (500-2000ms) to appear human
5. **Screenshot failures** for debugging
6. **Use semantic selectors** that are less likely to change
7. **Validate extracted data** before storing

## Related Workflows

- `workflow-login.md` - Login with stored credentials
- `workflow-data-extraction.md` - Extract data from pages
- `workflow-pattern-learning.md` - Learn and reuse patterns

---

**Example Version**: 1.0
**Last Updated**: 2025-10-27
