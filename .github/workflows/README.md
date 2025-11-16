# GitHub Actions - Multi-IP Twitter Swarm Testing

Automated cache training and testing using GitHub Actions' distributed infrastructure to simulate different IP addresses and geographic locations.

## 🎯 Purpose

Run the Twitter swarm cache training across multiple GitHub Actions runners, each with a different IP address, to:

1. **Test from different IPs** - Avoid rate limiting and blocks
2. **Parallel training** - Learn patterns faster across distributed agents
3. **Geographic diversity** - Test from different regions simultaneously
4. **Automated testing** - Schedule regular cache training runs
5. **CI/CD integration** - Validate cache performance on every PR

## 📋 Available Workflows

### 1. `twitter-swarm-multi-ip.yml` - Regional Testing

**Features:**
- 3 parallel jobs (US-East, US-West, EU-Central)
- 13 agents per region (39 total)
- Manual or scheduled execution
- Consolidated reporting

**Usage:**
```bash
# Via GitHub UI
Actions → Twitter Swarm Multi-IP Test → Run workflow
  - Duration: 60 minutes
  - Target Hit Rate: 90%

# Via GitHub CLI
gh workflow run twitter-swarm-multi-ip.yml \
  -f duration_minutes=60 \
  -f target_hit_rate=90
```

**Scheduled Run:**
- Automatically runs daily at 2 AM UTC
- Results uploaded as artifacts

### 2. `twitter-swarm-distributed.yml` - Distributed IP Testing

**Features:**
- Configurable number of parallel jobs (1-10+)
- Dynamic matrix generation
- IP geolocation detection
- Comprehensive aggregated reporting
- Job-specific AgentDB uploads

**Usage:**
```bash
# Via GitHub UI
Actions → Twitter Swarm - Distributed IP Testing → Run workflow
  - Parallel Jobs: 10
  - Agents per Job: 4
  - Duration: 90 minutes

# Via GitHub CLI
gh workflow run twitter-swarm-distributed.yml \
  -f parallel_jobs=10 \
  -f agents_per_job=4 \
  -f duration_minutes=90
```

**Advanced:**
```bash
# Maximum distribution (10 different IPs)
gh workflow run twitter-swarm-distributed.yml \
  -f parallel_jobs=10 \
  -f agents_per_job=5 \
  -f duration_minutes=120
```

## 🌍 How GitHub Actions Provides Different IPs

GitHub Actions runners are dynamically allocated from Microsoft Azure's infrastructure:

1. **Different runner instances** = Different IP addresses
2. **Parallel matrix jobs** = Multiple runners = Multiple IPs
3. **Geographic diversity** through Azure's global datacenters
4. **IP ranges vary** based on GitHub's infrastructure

**Example IP Distribution:**
```
Job 1: 20.102.45.123 (US-East, Virginia)
Job 2: 13.91.45.67  (US-West, California)
Job 3: 52.174.12.89 (EU-Central, Netherlands)
Job 4: 20.79.156.34 (US-East, Virginia)
...
```

## 📊 Results and Artifacts

Each workflow run produces:

### Per-Job Artifacts
- `swarm-results-{region}/` - Individual job results
- `agentdb-patterns-{region}/` - Learned patterns per region
- Logs for each job

### Consolidated Artifacts
- `consolidated-multi-ip-report` - Aggregated markdown report
- `multi-ip-aggregated-report` - Comprehensive analysis
- AgentDB patterns from all jobs

### Downloading Results
```bash
# Download latest run artifacts
gh run download

# Download specific run
gh run download 1234567890

# View in browser
gh run view 1234567890 --web
```

## 🔧 Configuration

### Environment Variables

The workflows support these environment variables:

```yaml
env:
  SWARM_ID: "SWARM-A"           # Swarm identifier
  REGION: "US-East"             # Geographic region
  AGENT_COUNT: 13               # Number of agents
  TARGET_HIT_RATE: 90           # Target cache hit rate %
  RUNNER_IP: "20.102.45.123"    # Auto-detected runner IP
```

### Secrets

No secrets required for basic operation. Optional:

```yaml
secrets:
  TWITTER_USERNAME: ${{ secrets.TWITTER_USERNAME }}
  TWITTER_PASSWORD: ${{ secrets.TWITTER_PASSWORD }}
```

## 📈 Expected Results

### Single Region (twitter-swarm-multi-ip.yml)
- **Jobs:** 3 regions
- **Total Agents:** 39 (13 per region)
- **Expected Hit Rate:** 85-92% (Twitter-only)
- **Duration:** 45-90 minutes
- **Patterns Learned:** 2,000-5,000

### Distributed (twitter-swarm-distributed.yml)
- **Jobs:** 10 (configurable)
- **Total Agents:** 40 (4 per job)
- **Expected Hit Rate:** 85-95% (Twitter-only)
- **Duration:** 60-120 minutes
- **Patterns Learned:** 5,000-15,000
- **Unique IPs:** 8-10

## 🚀 Quick Start

1. **Enable GitHub Actions** in your repository
   ```bash
   # Repository Settings → Actions → General → Allow all actions
   ```

2. **Run first test**
   ```bash
   gh workflow run twitter-swarm-distributed.yml \
     -f parallel_jobs=3 \
     -f agents_per_job=4 \
     -f duration_minutes=30
   ```

3. **Monitor progress**
   ```bash
   gh run watch
   ```

4. **View results**
   ```bash
   gh run view --web
   ```

## 📝 Sample Report Output

```markdown
# 🌍 Twitter Swarm Multi-IP Test Report

**Run ID:** 1234567890
**Date:** 2025-11-16 14:30:00 UTC
**Total Agents:** 40

## 📊 Summary Statistics

| Metric | Value |
|--------|-------|
| Jobs Completed | 10 |
| Total Patterns | 12,543 |
| Total Actions | 45,678 |
| Average Hit Rate | 87% |

## 🗺️ Results by IP/Location

### Job 1 - Ashburn, US
- **IP:** 20.102.45.123
- **Hit Rate:** 89%
- **Patterns Learned:** 1,234

### Job 2 - Los Angeles, US
- **IP:** 13.91.45.67
- **Hit Rate:** 86%
- **Patterns Learned:** 1,189
...
```

## 🔍 Monitoring

### During Execution

```bash
# Watch all jobs
gh run watch

# View logs for specific job
gh run view --log

# Check job status
gh run list --workflow=twitter-swarm-distributed.yml
```

### After Completion

```bash
# Download all artifacts
gh run download

# View summary
cat MULTI-IP-REPORT.md

# Analyze AgentDB
jq '.totalActions' all-results/agentdb-job-*/metadata.json
```

## 🎛️ Advanced Usage

### Custom Matrix (manual editing)

Edit `.github/workflows/twitter-swarm-distributed.yml`:

```yaml
strategy:
  matrix:
    include:
      - job_id: 1
        special_config: "high-frequency"
      - job_id: 2
        special_config: "low-frequency"
```

### Integration with PRs

The workflows automatically comment results on PRs when triggered by PR events.

### Scheduled Runs

```yaml
on:
  schedule:
    # Every 6 hours
    - cron: '0 */6 * * *'
    # Daily at 2 AM
    - cron: '0 2 * * *'
```

## 🛠️ Troubleshooting

### Job Fails with ENOMEM
Reduce `agents_per_job`:
```bash
gh workflow run twitter-swarm-distributed.yml \
  -f agents_per_job=2  # Instead of 4
```

### Timeout Issues
Increase duration:
```bash
gh workflow run twitter-swarm-distributed.yml \
  -f duration_minutes=120  # Instead of 60
```

### No Results File
Check logs:
```bash
gh run view --log-failed
```

## 📚 Related Documentation

- [Cache Optimization Complete](../../CACHE-OPTIMIZATION-COMPLETE.md)
- [Quick Start: 90% Guide](../../QUICK-START-90-PERCENT.md)
- [Twitter 90% Script](../../scripts/twitter-90-percent.ts)

## 🎯 Next Steps

1. **Run initial test** with 3 jobs to validate setup
2. **Scale up** to 10 jobs for maximum IP diversity
3. **Schedule daily runs** for continuous training
4. **Analyze results** to optimize agent count and duration
5. **Integrate with CI/CD** for automated testing

---

**🔥 Ready to train cache from multiple IPs simultaneously!**
