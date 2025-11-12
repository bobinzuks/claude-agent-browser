# 📱 Phone Verification Setup Guide

Complete guide for setting up automated phone verification using Twilio SMS.

---

## 🎯 Overview

The phone verification system provides:
- **Automatic SMS code detection** via Twilio webhook
- **Pattern learning** with AgentDB (remembers successful flows)
- **Multi-provider support** (Twilio implemented, extensible to others)
- **Fully automated verification** without manual intervention

---

## 📦 Prerequisites

### 1. Twilio Account Setup

1. **Sign up for Twilio**: https://www.twilio.com/try-twilio
   - Free trial includes $15 credit
   - Enough for ~2000 SMS messages

2. **Get your credentials**:
   - Account SID: Found on console dashboard
   - Auth Token: Found on console dashboard (click "show")
   - Phone Number: Purchase a phone number ($1/month)

3. **Configure webhook URL**:
   - For local testing: Use ngrok to expose your webhook
   ```bash
   # Install ngrok (if not already installed)
   npm install -g ngrok

   # Expose webhook port
   ngrok http 3456
   ```

   - Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
   - In Twilio Console → Phone Numbers → Your Number → Messaging
   - Set "A MESSAGE COMES IN" webhook to: `https://abc123.ngrok.io/sms`
   - Save configuration

---

## 🔧 Installation

### 1. Install Dependencies

The package already includes required dependencies:
```json
{
  "dependencies": {
    "playwright": "^1.56.1",
    "hnswlib-node": "^3.0.0"
  }
}
```

No additional packages needed! The SMS webhook uses Node's built-in `http` module.

### 2. Set Environment Variables

Create a `.env` file in your project root:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567

# Webhook Configuration (optional)
WEBHOOK_PORT=3456
WEBHOOK_PATH=/sms
```

Or export them directly:
```bash
export TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export TWILIO_AUTH_TOKEN=your_auth_token_here
export TWILIO_PHONE_NUMBER=+15551234567
```

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { ExtendedBrowserController } from './src/extension/lib/browser-controller-extensions.js';
import { TwilioProvider } from './src/extension/lib/sms-providers/twilio-provider.js';

// 1. Initialize Twilio provider
const twilioProvider = new TwilioProvider({
  accountSid: process.env.TWILIO_ACCOUNT_SID!,
  authToken: process.env.TWILIO_AUTH_TOKEN!,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
  webhookPort: 3456,
});

// 2. Start webhook server
await twilioProvider.startListening();

// 3. Initialize browser
const controller = new ExtendedBrowserController({ headless: false });
await controller.launch();

// 4. Setup phone verification
controller.setupPhoneVerification(twilioProvider, './verification-db');

// 5. Navigate to page with phone verification
await controller.navigate('https://example.com/signup');

// 6. Handle verification automatically
const result = await controller.handlePhoneVerification();

if (result.success) {
  console.log('✅ Verified!', result);
} else {
  console.log('❌ Failed:', result.error);
}

// 7. Cleanup
await controller.close();
await twilioProvider.stopListening();
```

### Advanced Usage with Manual Control

```typescript
import { BrowserController } from './src/mcp-bridge/browser-controller.js';
import { PhoneVerificationHandler } from './src/extension/lib/phone-verification-handler.js';
import { TwilioProvider } from './src/extension/lib/sms-providers/twilio-provider.js';
import { AgentDBClient } from './src/training/agentdb-client.js';

const controller = new BrowserController({ headless: false });
await controller.launch();

const twilioProvider = new TwilioProvider({
  accountSid: process.env.TWILIO_ACCOUNT_SID!,
  authToken: process.env.TWILIO_AUTH_TOKEN!,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
});

await twilioProvider.startListening();

const agentDB = new AgentDBClient('./verification-patterns', 384);
const handler = new PhoneVerificationHandler(controller, {
  smsProvider: twilioProvider,
  agentDB,
});

// Navigate to page
await controller.navigate('https://example.com/verify');

// Detect verification flow
const flow = await handler.detectVerificationFlow();
console.log('Detected flow:', flow);

// Manual step-by-step control
const phoneNumber = await twilioProvider.getPhoneNumber();
await handler.enterPhoneNumber(phoneNumber);

// Click submit button manually if needed
await controller.click('#submit-phone-btn');

// Wait for code
const code = await handler.waitForVerificationCode(60000);
console.log('Received code:', code);

// Enter code
await handler.enterVerificationCode(code!);

// Cleanup
agentDB.save();
await controller.close();
await twilioProvider.stopListening();
```

---

## 🧪 Testing

### Run the Example

```bash
# Make sure environment variables are set
export TWILIO_ACCOUNT_SID=ACxxxxxx
export TWILIO_AUTH_TOKEN=xxxxxxxx
export TWILIO_PHONE_NUMBER=+15551234567

# Start ngrok (in separate terminal)
ngrok http 3456

# Update Twilio webhook URL with ngrok URL

# Run example
npm run build
ts-node examples/phone-verification-example.ts
```

### Test Webhook Locally

```bash
# Start webhook server
npm run build
node -e "
import('./dist/extension/lib/sms-providers/twilio-provider.js').then(m => {
  const provider = new m.TwilioProvider({
    accountSid: 'test',
    authToken: 'test',
    phoneNumber: '+15551234567',
  });
  provider.startListening();
});
"

# In another terminal, test webhook
curl -X POST http://localhost:3456/sms \
  -d "From=%2B15559876543" \
  -d "To=%2B15551234567" \
  -d "Body=Your verification code is 123456" \
  -d "MessageSid=SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## 📊 How It Works

### Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Browser navigates to site with phone verification         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. PhoneVerificationHandler detects verification flow        │
│    - Finds phone input field                                 │
│    - Finds code input field                                  │
│    - Determines verification type (SMS/Voice/WhatsApp)       │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Enters Twilio phone number into form                      │
│    - Gets phone from TwilioProvider.getPhoneNumber()         │
│    - Fills input field automatically                         │
│    - Clicks submit button if present                         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Site sends SMS to Twilio phone number                     │
│    - SMS delivered to Twilio                                 │
│    - Twilio forwards to webhook                              │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Webhook server receives SMS                               │
│    - HTTP POST to http://localhost:3456/sms                  │
│    - Parses Twilio payload                                   │
│    - Extracts verification code using regex                  │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Code automatically entered into browser                   │
│    - waitForCode() resolves with extracted code              │
│    - enterVerificationCode() fills code input                │
│    - Auto-submits form if configured                         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. AgentDB stores successful pattern                         │
│    - Saves selectors and flow type                           │
│    - Uses HNSW vector index for similarity search            │
│    - Future verifications on same site are faster            │
└─────────────────────────────────────────────────────────────┘
```

### Code Extraction Patterns

The system uses regex to extract verification codes:

```typescript
// Supported patterns (in priority order)
/\b(\d{6})\b/           // 6-digit code (most common)
/\b(\d{4})\b/           // 4-digit code
/\b(\d{8})\b/           // 8-digit code
/code[:\s]+(\d{4,8})/i  // "code: 123456"
/is[:\s]+(\d{4,8})/i    // "is 123456"
/(\d{4,8})\s+is your/i  // "123456 is your code"
```

Examples that will be detected:
- "Your verification code is 123456"
- "Use code 4567 to verify"
- "123456 is your verification code"
- "Code: 789012"

---

## 💰 Cost Analysis

### Twilio Pricing

| Item | Cost | Notes |
|------|------|-------|
| Phone Number | $1.00/month | One-time rental |
| SMS (Inbound) | $0.0075/SMS | Per message received |
| SMS (Outbound) | $0.0079/SMS | If sending confirmations |

**Example Costs:**
- 10 verifications/day × 30 days = **$2.25/month**
- 100 verifications/day × 30 days = **$23.50/month**
- 1000 verifications/day × 30 days = **$226.00/month**

**Free Trial:**
- $15 credit = ~2000 verifications
- Perfect for testing and development

---

## 🔐 Security Considerations

### 1. Protect Credentials
```bash
# NEVER commit credentials to git
echo ".env" >> .gitignore
```

### 2. Webhook Security
```typescript
// Add Twilio signature validation (recommended for production)
import { validateRequest } from 'twilio';

const isValid = validateRequest(
  authToken,
  twilioSignature,
  webhookUrl,
  params
);

if (!isValid) {
  res.writeHead(403);
  res.end('Invalid signature');
  return;
}
```

### 3. Rate Limiting
```typescript
// Add rate limiting to prevent abuse
const rateLimiter = new Map();

if (rateLimiter.get(phoneNumber) > 5) {
  console.warn('Rate limit exceeded');
  return;
}
```

---

## 🐛 Troubleshooting

### Issue: Webhook Not Receiving SMS

**Check:**
1. Is ngrok running? `ngrok http 3456`
2. Is webhook URL configured in Twilio console?
3. Is webhook server running? Check console for "Webhook server listening..."
4. Test webhook manually with curl (see Testing section)

**Solution:**
```bash
# Verify webhook is accessible
curl http://localhost:3456/health
# Should return "OK"
```

### Issue: Code Not Extracted

**Check:**
1. Look at SMS body in console logs
2. Verify code format matches regex patterns
3. SMS may contain non-standard format

**Solution:**
Add custom pattern to `extractVerificationCode()`:
```typescript
const patterns = [
  /your custom pattern here/,
  /\b(\d{6})\b/,
  // ... existing patterns
];
```

### Issue: Selectors Not Found

**Check:**
1. Run `detectVerificationFlow()` to see what was detected
2. Inspect page DOM to find correct selectors
3. Site may use dynamic selectors

**Solution:**
Pass custom selectors:
```typescript
await handler.enterPhoneNumber(phone, '#custom-phone-input');
await handler.enterVerificationCode(code, '#custom-code-input');
```

### Issue: AgentDB Index Error

**Check:**
1. Database directory exists and is writable
2. Index was initialized properly

**Solution:**
```bash
# Clear database and reinitialize
rm -rf ./verification-db
# Will auto-create on next run
```

---

## 🎓 Next Steps

1. **Test with real site**: Replace example.com with actual target
2. **Add more providers**: Implement Vonage or MessageBird provider
3. **Improve detection**: Train AgentDB with more patterns
4. **Add TOTP support**: For sites that support authenticator apps
5. **Deploy webhook**: Use Heroku/Railway for production webhook

---

## 📚 API Reference

### TwilioProvider

```typescript
class TwilioProvider extends SMSProvider {
  constructor(config: TwilioConfig)
  async getPhoneNumber(): Promise<string>
  async waitForCode(timeout?: number): Promise<string | null>
  async startListening(): Promise<void>
  async stopListening(): Promise<void>
  async getMessages(phoneNumber: string): Promise<SMSMessage[]>
  isConfigured(): boolean
}
```

### PhoneVerificationHandler

```typescript
class PhoneVerificationHandler {
  constructor(controller: BrowserController, config: PhoneVerificationConfig)
  async detectVerificationFlow(): Promise<VerificationFlow | null>
  async enterPhoneNumber(phoneNumber: string, selector?: string): Promise<boolean>
  async waitForVerificationCode(timeout?: number): Promise<string | null>
  async enterVerificationCode(code: string, selector?: string): Promise<boolean>
  async handleVerification(phoneNumber?: string): Promise<VerificationResult>
  async findSimilarPatterns(url: string, limit?: number): Promise<ActionPattern[]>
}
```

### ExtendedBrowserController

```typescript
class ExtendedBrowserController extends BrowserController {
  setupPhoneVerification(smsProvider: SMSProvider, agentDBPath?: string): void
  async handlePhoneVerification(phoneNumber?: string): Promise<VerificationResult>
  async detectPhoneVerification(): Promise<VerificationFlow | null>
  getVerificationStats(): Statistics | null
  saveVerificationPatterns(): void
}
```

---

## ✅ Complete Setup Checklist

- [ ] Twilio account created
- [ ] Phone number purchased ($1/month)
- [ ] Account SID and Auth Token obtained
- [ ] Environment variables configured
- [ ] ngrok installed and running
- [ ] Webhook URL configured in Twilio console
- [ ] Built project: `npm run build`
- [ ] Tested webhook with curl
- [ ] Ran example: `ts-node examples/phone-verification-example.ts`
- [ ] Successfully received and entered verification code

---

**🎉 You're ready to automate phone verifications!**
