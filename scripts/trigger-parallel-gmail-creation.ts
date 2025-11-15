/**
 * Trigger Parallel Gmail Account Creation on GitHub Actions
 *
 * Each job runs on a different GitHub Actions runner = different residential IP
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx npx tsx scripts/trigger-parallel-gmail-creation.ts --jobs 5 --accounts-per-job 2
 */

import { GitHubActionsTool } from '../src/tools/github-actions-tool';

interface ParallelConfig {
  parallelJobs: number;
  accountsPerJob: number;
  wait: boolean;
}

async function main() {
  // Parse CLI arguments
  const args = process.argv.slice(2);
  const config: ParallelConfig = {
    parallelJobs: 3,
    accountsPerJob: 1,
    wait: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--jobs' && args[i + 1]) {
      config.parallelJobs = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--accounts-per-job' && args[i + 1]) {
      config.accountsPerJob = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--wait') {
      config.wait = true;
    }
  }

  const totalAccounts = config.parallelJobs * config.accountsPerJob;

  console.log('🚀 Parallel Gmail Account Creation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`📊 Configuration:`);
  console.log(`   Parallel Jobs: ${config.parallelJobs} (each on different IP)`);
  console.log(`   Accounts per Job: ${config.accountsPerJob}`);
  console.log(`   Total Accounts: ${totalAccounts}`);
  console.log(`   Wait for completion: ${config.wait ? 'Yes' : 'No'}\n`);

  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable not set\n');
    console.log('Set it with:');
    console.log('  export GITHUB_TOKEN=ghp_your_token_here\n');
    process.exit(1);
  }

  // Create GitHub Actions tool
  const github = new GitHubActionsTool({
    token: process.env.GITHUB_TOKEN,
    owner: 'bobinzuks',
    repo: 'claude-agent-browser'
  });

  try {
    console.log('🔗 Connecting to GitHub...\n');
    const repoInfo = await github.getRepoInfo();
    console.log(`✅ Connected to ${repoInfo.owner}/${repoInfo.repo}\n`);

    console.log('🚀 Triggering parallel workflow...\n');

    if (config.wait) {
      // Trigger and wait
      const run = await github.triggerAndWait(
        {
          workflowId: 'create-gmail-account.yml',
          ref: repoInfo.defaultBranch,
          inputs: {
            parallel_jobs: String(config.parallelJobs),
            accounts_per_job: String(config.accountsPerJob)
          }
        },
        {
          pollInterval: 15000,
          timeout: 1800000,
          onProgress: (run) => {
            const elapsed = Math.floor((Date.now() - new Date(run.created_at).getTime()) / 1000);
            console.log(`   ⏱️  ${run.status} - ${elapsed}s elapsed`);
          }
        }
      );

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Workflow Completed!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Status: ${run.status}`);
      console.log(`   Conclusion: ${run.conclusion}`);
      console.log(`   URL: ${run.html_url}\n`);

      // Get job details
      console.log('📋 Job Details:');
      const jobs = await github.getWorkflowJobs(run.id);

      let successCount = 0;
      let failCount = 0;

      jobs.forEach(job => {
        const icon = job.conclusion === 'success' ? '✅' : '❌';
        console.log(`   ${icon} ${job.name}: ${job.conclusion}`);

        if (job.conclusion === 'success') successCount++;
        else if (job.conclusion === 'failure') failCount++;
      });

      console.log(`\n📊 Results:`);
      console.log(`   Success: ${successCount}/${jobs.length} jobs`);
      console.log(`   Failed: ${failCount}/${jobs.length} jobs`);
      console.log(`   Total Accounts Created: ~${successCount * config.accountsPerJob}\n`);

      // List artifacts
      console.log('📦 Downloading IP information...\n');
      const artifacts = await github.listWorkflowArtifacts(run.id);

      const ipArtifacts = artifacts.filter(a => a.name.includes('ip-info'));
      console.log(`Found ${ipArtifacts.length} IP artifacts\n`);

      if (run.conclusion === 'success') {
        console.log('✅ Gmail accounts created successfully!');
        console.log('   Check artifacts for account credentials and screenshots\n');
      } else {
        console.log('⚠️  Some jobs failed. Check the logs at:');
        console.log(`   ${run.html_url}\n`);
      }

    } else {
      // Just trigger
      await github.triggerWorkflow({
        workflowId: 'create-gmail-account.yml',
        ref: repoInfo.defaultBranch,
        inputs: {
          parallel_jobs: String(config.parallelJobs),
          accounts_per_job: String(config.accountsPerJob)
        }
      });

      console.log('✅ Workflow triggered successfully!\n');
      console.log('Monitor progress at:');
      console.log(`   https://github.com/bobinzuks/claude-agent-browser/actions\n`);
      console.log('Or run with --wait to monitor completion:');
      console.log(`   GITHUB_TOKEN=xxx npx tsx scripts/trigger-parallel-gmail-creation.ts --jobs ${config.parallelJobs} --accounts-per-job ${config.accountsPerJob} --wait\n`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
