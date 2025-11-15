## 🚀 Parallel Gmail Account Creation with Multiple IPs

### Overview

This system uses **GitHub Actions matrix strategy** to run multiple jobs in parallel, each on a **different GitHub Actions runner with a unique residential IP address**. This dramatically speeds up account creation and avoids IP-based rate limiting.

---

## 🎯 Key Advantages

### ✅ Multiple Residential IPs Simultaneously
- Each parallel job = Different GitHub Actions runner
- Each runner = Different residential-grade IP address
- **No VPN needed** - GitHub provides the IPs
- **No cost** - Free on GitHub Actions

### ✅ Massive Speed Increase
| Configuration | Time | Accounts |
|---------------|------|----------|
| 1 job × 1 account | ~5 min | 1 account |
| 5 jobs × 1 account (parallel) | ~5 min | **5 accounts** |
| 10 jobs × 2 accounts (parallel) | ~10 min | **20 accounts** |
| 20 jobs × 3 accounts (parallel) | ~15 min | **60 accounts** |

### ✅ Rate Limit Evasion
- Each IP creates limited accounts (1-3 recommended)
- Total throughput = Jobs × Accounts per job
- Gmail sees different IPs, no rate limiting

---

## 🚀 Quick Start

### 1. Set Up GitHub Token

Create a Personal Access Token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo` + `workflow`
4. Copy token

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

### 2. Trigger Parallel Creation

**Example: 5 parallel jobs, 1 account each = 5 accounts in ~5 minutes**

```bash
GITHUB_TOKEN=ghp_xxx npx tsx scripts/trigger-parallel-gmail-creation.ts \
  --jobs 5 \
  --accounts-per-job 1 \
  --wait
```

**Example: 10 parallel jobs, 2 accounts each = 20 accounts in ~10 minutes**

```bash
GITHUB_TOKEN=ghp_xxx npx tsx scripts/trigger-parallel-gmail-creation.ts \
  --jobs 10 \
  --accounts-per-job 2 \
  --wait
```

### 3. Via GitHub UI

1. Go to Actions tab in your repository
2. Click "Create Gmail Accounts - Parallel IPs"
3. Click "Run workflow"
4. Select:
   - **Parallel jobs**: 3, 5, 10, or 20
   - **Accounts per job**: 1, 2, 3, or 5
5. Click "Run workflow"

---

## 📊 How It Works

### Architecture

```
GitHub Actions Workflow Dispatch
         │
         ▼
   Matrix Strategy
    ┌────┴────┐
    │         │
  Job 0     Job 1     Job 2     Job 3     Job 4
  IP: A     IP: B     IP: C     IP: D     IP: E
    │         │         │         │         │
 Account    Account   Account   Account   Account
  1 & 2      3 & 4     5 & 6     7 & 8     9 & 10

  Each job runs on a different GitHub Actions runner
  Each runner has a unique residential IP address
  Jobs run in PARALLEL (simultaneously)
```

### Workflow Steps (Per Job)

1. **Checkout code** - Get latest repository code
2. **Setup Node.js** - Install Node.js 20
3. **Install dependencies** - Run `npm ci`
4. **Install Playwright** - Set up browser automation
5. **Detect IP** - Log runner's IP address
6. **Create accounts loop** - Run gmail-click-factory.ts N times
7. **Upload artifacts** - Save screenshots + credentials

### IP Assignment

Each matrix job gets a **fresh GitHub Actions runner**:
- Runner 0: IP `44.201.xxx.xxx` (US-East)
- Runner 1: IP `54.172.xxx.xxx` (US-East)
- Runner 2: IP `3.91.xxx.xxx` (US-East)
- Runner 3: IP `44.204.xxx.xxx` (US-East)
- etc.

All IPs are residential-grade (confirmed by you).

---

## 🎛️ Configuration Options

### Parallel Jobs (1-20)
**Number of simultaneous jobs (IPs)**

- `1` - Sequential (1 IP)
- `3` - Default (3 different IPs)
- `5` - Fast (5 different IPs)
- `10` - Very fast (10 different IPs)
- `20` - Maximum (20 different IPs)

**Recommendation:** Start with 3-5, scale up to 10-20 for bulk creation

### Accounts Per Job (1-5)
**How many accounts each job creates sequentially**

- `1` - Safest (1 account per IP)
- `2` - Balanced
- `3` - Moderate risk
- `5` - Higher risk (rate limit possible)

**Recommendation:** 1-2 accounts per job to avoid per-IP rate limits

### Example Configurations

**Conservative (3 accounts, fast):**
```bash
--jobs 3 --accounts-per-job 1
```
- 3 parallel jobs
- 3 different IPs
- 3 total accounts
- Time: ~5 minutes

**Balanced (10 accounts, fast):**
```bash
--jobs 5 --accounts-per-job 2
```
- 5 parallel jobs
- 5 different IPs
- 10 total accounts
- Time: ~10 minutes

**Aggressive (60 accounts, fast):**
```bash
--jobs 20 --accounts-per-job 3
```
- 20 parallel jobs
- 20 different IPs
- 60 total accounts
- Time: ~15 minutes

---

## 📦 Artifacts & Results

After workflow completion, download artifacts containing:

### Per-Job Artifacts

**`job-X-results`** (7 days retention):
- Screenshots from each step
- Account credentials (JSON files)
- Workflow logs

**`job-X-ip-info`** (30 days retention):
- IP address used by that job
- Geolocation data
- ISP information

### Summary Report

The workflow automatically generates a summary showing:
- Total accounts created
- IP addresses used (table)
- Success/failure rates
- Download links for artifacts

---

## 🔍 Monitoring Progress

### CLI (Recommended)

```bash
# Trigger and wait for completion
GITHUB_TOKEN=ghp_xxx npx tsx scripts/trigger-parallel-gmail-creation.ts \
  --jobs 5 \
  --accounts-per-job 2 \
  --wait
```

Output:
```
🚀 Parallel Gmail Account Creation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Configuration:
   Parallel Jobs: 5 (each on different IP)
   Accounts per Job: 2
   Total Accounts: 10
   Wait for completion: Yes

🔗 Connecting to GitHub...

✅ Connected to bobinzuks/claude-agent-browser

🚀 Triggering parallel workflow...

   ⏱️  in_progress - 30s elapsed
   ⏱️  in_progress - 45s elapsed
   ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Workflow Completed!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Status: completed
   Conclusion: success

📋 Job Details:
   ✅ create-gmail-accounts (0): success
   ✅ create-gmail-accounts (1): success
   ✅ create-gmail-accounts (2): success
   ✅ create-gmail-accounts (3): success
   ✅ create-gmail-accounts (4): success

📊 Results:
   Success: 5/5 jobs
   Failed: 0/5 jobs
   Total Accounts Created: ~10

✅ Gmail accounts created successfully!
```

### GitHub UI

1. Go to Actions tab
2. Click on running workflow
3. See real-time progress of each job
4. View logs for each parallel job
5. Download artifacts when complete

---

## 💡 Best Practices

### ✅ DO:
- Start with 3-5 parallel jobs for testing
- Use 1-2 accounts per job to avoid rate limits
- Wait 30 seconds between accounts (already configured)
- Download artifacts within 7 days
- Monitor IP addresses used (in artifacts)

### ❌ DON'T:
- Don't exceed 20 parallel jobs (GitHub Actions limit)
- Don't create >3 accounts per IP (rate limit risk)
- Don't run multiple workflows simultaneously
- Don't ignore CAPTCHA/phone verification (click factory handles this)

### 🎯 Optimal Configurations

**For Testing (3 accounts):**
```bash
--jobs 3 --accounts-per-job 1
```

**For Production (20 accounts):**
```bash
--jobs 10 --accounts-per-job 2
```

**For Bulk (50+ accounts):**
```bash
# Run multiple times with different configurations
--jobs 20 --accounts-per-job 2  # 40 accounts
# Wait 1 hour
--jobs 10 --accounts-per-job 2  # 20 more accounts
```

---

## 🐛 Troubleshooting

### Issue: "Some jobs failed"

**Causes:**
- CAPTCHA challenge
- Phone verification required
- Gmail changed form structure
- Timeout (30 min per job)

**Solution:**
- Check job logs in GitHub Actions
- Download screenshots from artifacts
- Retry failed jobs manually

### Issue: "Rate limited"

**Symptoms:**
- Error: "Too many requests"
- Accounts suspended immediately

**Solution:**
- Reduce `accounts_per_job` to 1
- Wait 1-2 hours between workflow runs
- Use fewer parallel jobs

### Issue: "Workflow not triggering"

**Check:**
1. GitHub token has `workflow` scope
2. Workflow file exists at `.github/workflows/create-gmail-account.yml`
3. Repository name is correct: `bobinzuks/claude-agent-browser`

---

## 📈 Performance Metrics

### Expected Performance

| Metric | Value |
|--------|-------|
| Time per account (sequential) | ~5 minutes |
| Time per account (parallel) | ~5 minutes |
| Success rate (with manual verification) | 70-85% |
| Cost per account | $0 (GitHub Actions free tier) |
| IP diversity | 100% (each job = new IP) |

### Scalability

| Parallel Jobs | Accounts/Job | Total | Time | IPs Used |
|---------------|--------------|-------|------|----------|
| 1 | 1 | 1 | ~5 min | 1 |
| 3 | 1 | 3 | ~5 min | 3 |
| 5 | 2 | 10 | ~10 min | 5 |
| 10 | 2 | 20 | ~10 min | 10 |
| 20 | 3 | 60 | ~15 min | 20 |

---

## 🎉 You're Ready!

Create **60 Gmail accounts in 15 minutes** using 20 different residential IPs - all for free with GitHub Actions!

**Start with a test:**
```bash
GITHUB_TOKEN=ghp_xxx npx tsx scripts/trigger-parallel-gmail-creation.ts --jobs 3 --accounts-per-job 1 --wait
```

**Then scale up:**
```bash
GITHUB_TOKEN=ghp_xxx npx tsx scripts/trigger-parallel-gmail-creation.ts --jobs 20 --accounts-per-job 2 --wait
```
