# 📱 Phone Verification Quick Start

**Get up and running in 5 minutes!**

---

## ⚡ 1-Minute Setup

```bash
# 1. Get Twilio credentials (https://www.twilio.com/try-twilio)
export TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export TWILIO_AUTH_TOKEN=your_auth_token_here
export TWILIO_PHONE_NUMBER=+15551234567

# 2. Start ngrok for webhook (separate terminal)
ngrok http 3456

# 3. Configure Twilio webhook
# Go to: Twilio Console → Phone Numbers → Your Number
# Set "A MESSAGE COMES IN" to: https://YOUR-NGROK-URL.ngrok.io/sms

# 4. Test setup
npm run build
node test-phone-verification-setup.js
```

---

## 🚀 Simple Example (Copy & Paste)

```typescript
import { ExtendedBrowserController } from './src/extension/lib/browser-controller-extensions.js';
import { TwilioProvider } from './src/extension/lib/sms-providers/twilio-provider.js';

async function run() {
  // Setup Twilio
  const twilio = new TwilioProvider({
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    webhookPort: 3456,
  });
  await twilio.startListening();

  // Setup Browser
  const browser = new ExtendedBrowserController({ headless: false });
  await browser.launch();
  browser.setupPhoneVerification(twilio, './verification-db');

  // Use it!
  await browser.navigate('https://your-site.com/signup');
  const result = await browser.handlePhoneVerification();

  console.log(result.success ? '✅ Verified!' : '❌ Failed:', result);

  // Cleanup
  await browser.close();
  await twilio.stopListening();
}

run();
```

**That's it!** The system will:
1. ✅ Find phone input field
2. ✅ Enter Twilio number
3. ✅ Wait for SMS code
4. ✅ Extract code automatically
5. ✅ Enter code and submit

---

## 📞 Manual Testing

```bash
# Terminal 1: Start webhook server
node test-phone-verification-setup.js

# Terminal 2: Simulate SMS
curl -X POST http://localhost:3456/sms \
  -d "From=%2B15559876543" \
  -d "To=%2B15551234567" \
  -d "Body=Your code is 123456" \
  -d "MessageSid=SMtest123"

# Terminal 1 should show:
# [TwilioProvider] SMS received: {...}
# [TwilioProvider] Verification code detected: 123456
```

---

## 🎯 Common Selectors

If auto-detection fails, pass custom selectors:

```typescript
// Manual phone entry
await handler.enterPhoneNumber('+15551234567', '#phone-input');

// Manual code entry
await handler.enterVerificationCode('123456', '#code-input');
```

---

## 💰 Pricing

- **Free Trial**: $15 credit (~2000 SMS)
- **Phone Number**: $1/month
- **SMS Received**: $0.0075 each

**Example:** 100 verifications = $1.75 total

---

## 🐛 Troubleshooting

### "Webhook not receiving SMS"
```bash
# Check ngrok is running
curl https://YOUR-NGROK-URL.ngrok.io/health
# Should return: OK

# Check Twilio webhook configured
# Must be: https://YOUR-NGROK-URL.ngrok.io/sms (not http://)
```

### "Code not extracted"
```typescript
// Check what SMS body looks like
const messages = await twilio.getMessages(phoneNumber);
console.log('SMS body:', messages[0].body);

// Add custom pattern if needed (see docs)
```

### "Selectors not found"
```typescript
// Run detection to see what was found
const flow = await browser.detectPhoneVerification();
console.log('Detected flow:', flow);

// Pass custom selectors
await handler.enterPhoneNumber(phone, '#custom-phone');
await handler.enterVerificationCode(code, '#custom-code');
```

---

## 📚 Full Docs

- **Setup Guide**: `PHONE-VERIFICATION-SETUP.md`
- **Implementation Details**: `PHONE-VERIFICATION-IMPLEMENTATION.md`
- **Example Code**: `examples/phone-verification-example.ts`

---

## 🎉 You're Ready!

**Start automating phone verifications now!** 🚀
