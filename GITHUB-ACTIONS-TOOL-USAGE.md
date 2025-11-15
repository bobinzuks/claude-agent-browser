# GitHub Actions Tool - Usage Guide

## Overview

The GitHub Actions Tool allows you to programmatically trigger and monitor GitHub Actions workflows from your code. This is perfect for triggering Gmail account creation workflows that run on GitHub's residential-grade IPs.

---

## 🚀 Quick Start

### 1. Set Up GitHub Token

Create a Personal Access Token with `repo` and `workflow` scopes:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
4. Generate token and save it

**Set as environment variable:**
```bash
export GITHUB_TOKEN=ghp_your_token_here
```

### 2. Install Dependencies

```bash
npm install @octokit/rest
```

### 3. Run the Trigger Script

**Trigger and wait for completion:**
```bash
GITHUB_TOKEN=ghp_xxx npx tsx scripts/trigger-gmail-workflow.ts --count 3 --wait --download
```

**Just trigger (don't wait):**
```bash
GITHUB_TOKEN=ghp_xxx npx tsx scripts/trigger-gmail-workflow.ts --count 5
```

---

## 📋 CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--count <number>` | Number of Gmail accounts to create | 1 |
| `--wait` | Wait for workflow to complete | false |
| `--download` | Download artifacts after completion | false |
| `--output-dir <path>` | Directory to save downloaded artifacts | `./downloaded-artifacts` |

---

## 🔧 Programmatic Usage

### Basic Example: Trigger Workflow

```typescript
import { GitHubActionsTool } from './src/tools/github-actions-tool';

const github = new GitHubActionsTool({
  token: process.env.GITHUB_TOKEN!,
  owner: 'your-username',
  repo: 'claude-agent-browser'
});

// Trigger workflow
await github.triggerWorkflow({
  workflowId: 'create-gmail-account.yml',
  ref: 'main',
  inputs: {
    account_count: 3,
    use_click_factory: true
  }
});

console.log('✅ Workflow triggered!');
```

### Advanced Example: Trigger and Monitor

```typescript
import { GitHubActionsTool } from './src/tools/github-actions-tool';

const github = new GitHubActionsTool({
  token: process.env.GITHUB_TOKEN!,
  owner: 'your-username',
  repo: 'claude-agent-browser'
});

// Trigger and wait for completion
const run = await github.triggerAndWait(
  {
    workflowId: 'create-gmail-account.yml',
    ref: 'main',
    inputs: {
      account_count: 5,
      use_click_factory: true
    }
  },
  {
    pollInterval: 10000, // Check every 10 seconds
    timeout: 1800000, // 30 minutes timeout
    onProgress: (run) => {
      console.log(`Status: ${run.status} | Conclusion: ${run.conclusion}`);
    }
  }
);

if (run.conclusion === 'success') {
  // Download artifacts
  const artifacts = await github.listWorkflowArtifacts(run.id);

  for (const artifact of artifacts) {
    await github.downloadArtifact(
      artifact.id,
      `./artifacts/${artifact.name}.zip`
    );
  }

  console.log('✅ All artifacts downloaded!');
}
```

### Monitor Existing Workflow

```typescript
// Get the latest run
const latestRun = await github.getLatestWorkflowRun('create-gmail-account.yml');

if (latestRun) {
  // Wait for it to complete
  const completedRun = await github.waitForWorkflowCompletion(latestRun.id);

  // Get job details
  const jobs = await github.getWorkflowJobs(completedRun.id);

  jobs.forEach(job => {
    console.log(`Job: ${job.name} - ${job.conclusion}`);
    job.steps.forEach(step => {
      console.log(`  Step: ${step.name} - ${step.conclusion}`);
    });
  });
}
```

---

## 🎯 Common Use Cases

### 1. Create Gmail Accounts on Demand

```typescript
import { GitHubActionsTool } from './src/tools/github-actions-tool';

async function createGmailAccounts(count: number) {
  const github = new GitHubActionsTool({
    token: process.env.GITHUB_TOKEN!,
    owner: 'your-username',
    repo: 'claude-agent-browser'
  });

  const run = await github.triggerAndWait({
    workflowId: 'create-gmail-account.yml',
    inputs: { account_count: count }
  });

  if (run.conclusion === 'success') {
    // Download and parse account credentials
    const artifacts = await github.listWorkflowArtifacts(run.id);
    const credentialsArtifact = artifacts.find(a => a.name.includes('credentials'));

    if (credentialsArtifact) {
      await github.downloadArtifact(
        credentialsArtifact.id,
        './accounts.zip'
      );

      // Unzip and read account data
      // ... parse JSON files
    }
  }
}

// Create 3 accounts
await createGmailAccounts(3);
```

### 2. Scheduled Account Creation

```typescript
import { GitHubActionsTool } from './src/tools/github-actions-tool';
import * as cron from 'node-cron';

const github = new GitHubActionsTool({
  token: process.env.GITHUB_TOKEN!,
  owner: 'your-username',
  repo: 'claude-agent-browser'
});

// Create 2 accounts every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🕐 Scheduled account creation starting...');

  await github.triggerWorkflow({
    workflowId: 'create-gmail-account.yml',
    inputs: { account_count: 2 }
  });

  console.log('✅ Workflow triggered');
});
```

### 3. Batch Account Creation with Error Handling

```typescript
async function createAccountsBatch(totalAccounts: number, batchSize: number = 3) {
  const github = new GitHubActionsTool({
    token: process.env.GITHUB_TOKEN!,
    owner: 'your-username',
    repo: 'claude-agent-browser'
  });

  const batches = Math.ceil(totalAccounts / batchSize);
  const results = [];

  for (let i = 0; i < batches; i++) {
    const count = Math.min(batchSize, totalAccounts - i * batchSize);

    console.log(`📦 Batch ${i + 1}/${batches}: Creating ${count} accounts...`);

    try {
      const run = await github.triggerAndWait({
        workflowId: 'create-gmail-account.yml',
        inputs: { account_count: count }
      });

      results.push({
        batch: i + 1,
        success: run.conclusion === 'success',
        runId: run.id,
        url: run.html_url
      });

      // Wait 5 minutes between batches to avoid rate limiting
      if (i < batches - 1) {
        console.log('⏳ Waiting 5 minutes before next batch...');
        await new Promise(resolve => setTimeout(resolve, 300000));
      }

    } catch (error) {
      console.error(`❌ Batch ${i + 1} failed:`, error);
      results.push({
        batch: i + 1,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  console.log(`\n✅ Completed ${successful}/${batches} batches successfully`);

  return results;
}

// Create 15 accounts in batches of 3
await createAccountsBatch(15, 3);
```

---

## 🛠️ API Reference

### Constructor

```typescript
new GitHubActionsTool({
  token: string;      // GitHub Personal Access Token
  owner: string;      // Repository owner (username or org)
  repo: string;       // Repository name
})
```

### Methods

#### `triggerWorkflow(dispatch)`
Trigger a workflow dispatch event.

```typescript
await github.triggerWorkflow({
  workflowId: 'workflow-file.yml',
  ref: 'main', // optional, default: 'main'
  inputs: {
    key: 'value'
  }
});
```

#### `getLatestWorkflowRun(workflowId)`
Get the most recent workflow run.

```typescript
const run = await github.getLatestWorkflowRun('create-gmail-account.yml');
console.log(run.status, run.conclusion);
```

#### `waitForWorkflowCompletion(runId, options)`
Wait for a workflow run to complete.

```typescript
const run = await github.waitForWorkflowCompletion(12345, {
  pollInterval: 10000,  // ms between checks
  timeout: 1800000,     // max wait time
  onProgress: (run) => {
    console.log(`Status: ${run.status}`);
  }
});
```

#### `listWorkflowArtifacts(runId)`
List all artifacts from a workflow run.

```typescript
const artifacts = await github.listWorkflowArtifacts(12345);
artifacts.forEach(artifact => {
  console.log(`${artifact.name}: ${artifact.size_in_bytes} bytes`);
});
```

#### `downloadArtifact(artifactId, outputPath)`
Download an artifact to a file.

```typescript
await github.downloadArtifact(67890, './artifacts/results.zip');
```

#### `cancelWorkflowRun(runId)`
Cancel a running workflow.

```typescript
await github.cancelWorkflowRun(12345);
```

#### `getWorkflowJobs(runId)`
Get detailed job information.

```typescript
const jobs = await github.getWorkflowJobs(12345);
jobs.forEach(job => {
  console.log(`${job.name}: ${job.status}`);
  job.steps.forEach(step => {
    console.log(`  - ${step.name}: ${step.conclusion}`);
  });
});
```

#### `triggerAndWait(dispatch, options)`
Trigger a workflow and wait for completion (combined operation).

```typescript
const run = await github.triggerAndWait(
  {
    workflowId: 'create-gmail-account.yml',
    inputs: { account_count: 5 }
  },
  {
    pollInterval: 10000,
    timeout: 1800000
  }
);
```

---

## 🔐 Security Best Practices

### 1. Store Tokens Securely

**❌ Don't do this:**
```typescript
const github = new GitHubActionsTool({
  token: 'ghp_hardcoded_token_here', // BAD!
  owner: 'user',
  repo: 'repo'
});
```

**✅ Do this:**
```typescript
const github = new GitHubActionsTool({
  token: process.env.GITHUB_TOKEN!, // GOOD!
  owner: process.env.GITHUB_OWNER!,
  repo: process.env.GITHUB_REPOSITORY!
});
```

### 2. Use Minimal Token Scopes

Only grant the scopes you need:
- `repo` - For private repositories
- `workflow` - For triggering workflows
- `read:org` - Only if needed for organization repos

### 3. Rotate Tokens Regularly

Set token expiration and rotate every 90 days.

---

## 🐛 Troubleshooting

### Error: "GITHUB_TOKEN not set"

**Solution:**
```bash
export GITHUB_TOKEN=ghp_your_token_here
# Or
GITHUB_TOKEN=ghp_xxx npx tsx scripts/trigger-gmail-workflow.ts
```

### Error: "Could not determine owner/repo"

**Solution:**
```bash
export GITHUB_OWNER=your-username
export GITHUB_REPOSITORY=claude-agent-browser
# Or specify in code
```

### Error: "Resource not accessible by personal access token"

**Solution:** Token needs `workflow` scope. Regenerate with correct scopes.

### Workflow doesn't trigger

**Check:**
1. Workflow file exists at `.github/workflows/create-gmail-account.yml`
2. Token has `workflow` scope
3. Workflow has `workflow_dispatch` trigger
4. Branch name is correct (usually `main` or `master`)

### Artifacts not found

**Reasons:**
1. Workflow hasn't completed yet
2. Workflow failed before creating artifacts
3. Artifacts expired (default: 7 days retention)

---

## 📊 Monitoring & Logging

### Enable Detailed Logging

```typescript
const github = new GitHubActionsTool({
  token: process.env.GITHUB_TOKEN!,
  owner: 'user',
  repo: 'repo'
});

// Monitor with progress callback
const run = await github.waitForWorkflowCompletion(12345, {
  onProgress: (run) => {
    console.log(`[${new Date().toISOString()}] ${run.status} | ${run.conclusion || 'running'}`);
  }
});
```

### Track Metrics

```typescript
interface WorkflowMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageDuration: number;
}

async function getWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics> {
  // Implementation to track workflow performance over time
  // ...
}
```

---

## 🎯 Next Steps

1. ✅ Set up GitHub token with correct scopes
2. ✅ Test trigger script: `npx tsx scripts/trigger-gmail-workflow.ts --count 1 --wait`
3. ✅ Verify artifacts are downloaded correctly
4. ✅ Integrate into your automation pipeline
5. ✅ Set up monitoring and alerting

---

## 📚 Additional Resources

- [GitHub Actions API Documentation](https://docs.github.com/en/rest/actions)
- [Octokit.js Documentation](https://octokit.github.io/rest.js/)
- [Workflow Dispatch Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)
