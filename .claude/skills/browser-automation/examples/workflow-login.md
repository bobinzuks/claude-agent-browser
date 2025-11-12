# Workflow Example: Login with Pattern Learning

This example shows how to login using stored credentials and learned patterns.

## Use Case

Login to a service using previously stored credentials, with automatic pattern matching for similar sites.

## Workflow Steps

### Step 1: Retrieve Stored Credentials

```javascript
const credentials = await credential_retrieve({
  service: "github"
});
// Result: {
//   success: true,
//   credential: {
//     service: "github",
//     username: "myuser",
//     password: "ghp_1234567890abcdef",
//     notes: "GitHub personal access token"
//   }
// }
```

### Step 2: Search for Learned Login Pattern

```javascript
const patterns = await pattern_search({
  query: "github login workflow",
  domain: "github.com",
  limit: 1,
  min_similarity: 0.8
});
// Result: {
//   success: true,
//   results: [{
//     pattern_id: "pattern-111",
//     domain: "github.com",
//     action: "login",
//     similarity: 0.95,
//     steps: [...]
//   }],
//   count: 1
// }
```

### Step 3: Execute Learned Pattern (if found)

```javascript
if (patterns.results.length > 0) {
  const pattern = patterns.results[0];

  for (const step of pattern.steps) {
    switch (step.type) {
      case "navigate":
        await browser_navigate({ url: step.url });
        break;

      case "fill":
        await browser_fill_form({
          fields: { [step.field]: credentials.credential[step.field] },
          selectors: { [step.field]: step.selector }
        });
        break;

      case "click":
        await browser_click({ selector: step.selector });
        break;

      case "wait":
        await browser_wait({ type: "selector", value: step.selector });
        break;
    }
  }
}
```

### Step 4: Manual Login (if no pattern found)

```javascript
else {
  // Navigate to login page
  await browser_navigate({
    url: "https://github.com/login",
    waitUntil: "networkidle"
  });

  // Fill credentials
  await browser_fill_form({
    fields: {
      login: credentials.credential.username,
      password: credentials.credential.password
    },
    selectors: {
      login: "#login_field",
      password: "#password"
    }
  });

  // Submit
  await browser_click({
    selector: "input[name='commit']",
    waitForNavigation: true
  });

  // Save this pattern for future use
  await pattern_store({
    domain: "github.com",
    action: "login",
    intent: "authenticate user to GitHub",
    steps: [
      { type: "navigate", url: "https://github.com/login" },
      { type: "fill", selector: "#login_field", field: "username" },
      { type: "fill", selector: "#password", field: "password" },
      { type: "click", selector: "input[name='commit']" }
    ],
    success: true
  });
}
```

### Step 5: Verify Login Success

```javascript
// Wait for profile element
await browser_wait({
  type: "selector",
  value: "img[alt='@" + credentials.credential.username + "']",
  timeout: 10000,
  visible: true
});
// Result: { success: true, elementFound: true }

// Or check URL
const currentState = await browser_navigate({ url: "" }); // Gets current URL
if (currentState.finalUrl.includes("github.com") && !currentState.finalUrl.includes("/login")) {
  console.log("Login successful!");
}
```

## Complete Script

```javascript
async function loginWithPattern(service, loginUrl) {
  try {
    // 1. Get credentials
    const creds = await credential_retrieve({ service });
    if (!creds.success) {
      throw new Error(`No credentials found for ${service}`);
    }

    // 2. Search for existing pattern
    const patterns = await pattern_search({
      query: `${service} login`,
      domain: new URL(loginUrl).hostname,
      limit: 1,
      min_similarity: 0.75
    });

    // 3. Execute pattern or manual login
    if (patterns.success && patterns.results.length > 0) {
      console.log("Using learned pattern...");
      const pattern = patterns.results[0];

      for (const step of pattern.steps) {
        console.log(`Executing step: ${step.type}`);

        switch (step.type) {
          case "navigate":
            await browser_navigate({ url: step.url, waitUntil: "networkidle" });
            break;

          case "fill":
            const fieldValue = step.field === "username"
              ? creds.credential.username
              : creds.credential.password;
            await browser_fill_form({
              fields: { [step.field]: fieldValue },
              selectors: { [step.field]: step.selector }
            });
            break;

          case "click":
            await browser_click({
              selector: step.selector,
              waitForNavigation: step.waitForNavigation || false
            });
            break;

          case "wait":
            await browser_wait({ type: "selector", value: step.selector });
            break;
        }

        // Human-like delay between steps
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      }
    } else {
      console.log("No pattern found, performing manual login...");

      // Navigate
      await browser_navigate({ url: loginUrl, waitUntil: "networkidle" });

      // Fill form (adjust selectors as needed)
      await browser_fill_form({
        fields: {
          username: creds.credential.username,
          password: creds.credential.password
        },
        selectors: {
          username: "input[type='text'], input[type='email'], input[name*='user'], input[name*='email'], input[name*='login']",
          password: "input[type='password']"
        }
      });

      // Submit
      await browser_click({
        selector: "button[type='submit'], input[type='submit']",
        waitForNavigation: true
      });

      // Store pattern for next time
      await pattern_store({
        domain: new URL(loginUrl).hostname,
        action: "login",
        intent: `authenticate user to ${service}`,
        steps: [
          { type: "navigate", url: loginUrl },
          { type: "fill", selector: "input[type='text'], input[name*='user']", field: "username" },
          { type: "fill", selector: "input[type='password']", field: "password" },
          { type: "click", selector: "button[type='submit']", waitForNavigation: true }
        ],
        success: true
      });
    }

    // 4. Verify success (wait for navigation away from login page)
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      service,
      username: creds.credential.username
    };

  } catch (error) {
    console.error("Login failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Usage
const result = await loginWithPattern("github", "https://github.com/login");
console.log("Login result:", result);
```

## Advanced: Multi-Service Login

```javascript
async function loginToMultipleServices(services) {
  const results = [];

  for (const { service, url } of services) {
    console.log(`Logging into ${service}...`);
    const result = await loginWithPattern(service, url);
    results.push(result);

    // Delay between logins
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  return results;
}

// Usage
const logins = await loginToMultipleServices([
  { service: "github", url: "https://github.com/login" },
  { service: "gitlab", url: "https://gitlab.com/users/sign_in" },
  { service: "bitbucket", url: "https://bitbucket.org/account/signin/" }
]);

console.log("All logins:", logins);
```

## With 2FA/MFA Support

```javascript
async function loginWith2FA(service, loginUrl) {
  // Standard login
  const loginResult = await loginWithPattern(service, loginUrl);

  // Check for 2FA prompt
  await browser_wait({ type: "selector", value: "input[name='otp'], input[name='code']", timeout: 5000 })
    .then(async () => {
      console.log("2FA required, please enter code manually...");

      // Wait for user to enter 2FA code
      await browser_wait({
        type: "function",
        value: () => !document.querySelector("input[name='otp'], input[name='code']"),
        timeout: 60000
      });
    })
    .catch(() => {
      console.log("No 2FA required");
    });

  return loginResult;
}
```

## Error Handling

```javascript
async function robustLogin(service, loginUrl, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Login attempt ${attempt}/${maxRetries}`);

    try {
      const result = await loginWithPattern(service, loginUrl);

      if (result.success) {
        return result;
      }

      // Check for error messages on page
      const errorMsg = await browser_extract({
        selector: ".error, .alert, [role='alert']",
        attribute: "textContent"
      }).catch(() => ({ data: "Unknown error" }));

      console.error(`Login failed: ${errorMsg.data}`);

      if (errorMsg.data.includes("credentials") || errorMsg.data.includes("password")) {
        console.log("Credentials may be incorrect, aborting retries");
        break;
      }

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = 1000 * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return { success: false, error: "Max retries exceeded" };
}
```

## Related Examples

- `workflow-signup.md` - Complete signup workflow
- `workflow-pattern-learning.md` - Learn and apply patterns
- `workflow-credential-management.md` - Manage credentials

---

**Example Version**: 1.0
**Last Updated**: 2025-10-27
