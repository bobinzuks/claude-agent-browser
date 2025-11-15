/**
 * Trigger Gmail Account Creation via GitHub Actions
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx npx tsx scripts/trigger-gmail-workflow.ts --count 3
 *   GITHUB_TOKEN=ghp_xxx npx tsx scripts/trigger-gmail-workflow.ts --count 5 --wait
 */

import { GitHubActionsTool } from '../src/tools/github-actions-tool';
import * as path from 'path';
import * as fs from 'fs';

interface CLIOptions {
  count: number;
  wait: boolean;
  download: boolean;
  outputDir: string;
}

async function main() {
  // Parse CLI arguments
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    count: 1,
    wait: false,
    download: false,
    outputDir: './downloaded-artifacts'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      options.count = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--wait') {
      options.wait = true;
    } else if (args[i] === '--download') {
      options.download = true;
    } else if (args[i] === '--output-dir' && args[i + 1]) {
      options.outputDir = args[i + 1];
      i++;
    }
  }

  console.log('🎯 Gmail Account Creation via GitHub Actions');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Validate environment
  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable not set');
    console.log('\nSet it with:');
    console.log('  export GITHUB_TOKEN=ghp_your_token_here');
    console.log('  or');
    console.log('  GITHUB_TOKEN=ghp_xxx npx tsx scripts/trigger-gmail-workflow.ts\n');
    process.exit(1);
  }

  // Determine owner/repo from git or environment
  let owner = process.env.GITHUB_OWNER;
  let repo = process.env.GITHUB_REPOSITORY;

  if (!owner || !repo) {
    // Try to parse from git remote
    try {
      const { execSync } = require('child_process');
      const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();

      // Parse git@github.com:owner/repo.git or https://github.com/owner/repo.git
      const match = remote.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
      if (match) {
        owner = match[1];
        repo = match[2];
      }
    } catch (error) {
      console.warn('⚠️  Could not detect owner/repo from git remote');
    }
  }

  if (!owner || !repo) {
    console.error('❌ Could not determine GitHub owner/repo');
    console.log('\nSet them with:');
    console.log('  export GITHUB_OWNER=your-username');
    console.log('  export GITHUB_REPOSITORY=your-repo');
    console.log('  or');
    console.log('  GITHUB_OWNER=xxx GITHUB_REPOSITORY=yyy npx tsx scripts/trigger-gmail-workflow.ts\n');
    process.exit(1);
  }

  console.log(`📦 Repository: ${owner}/${repo}`);
  console.log(`📊 Accounts to create: ${options.count}`);
  console.log(`⏳ Wait for completion: ${options.wait ? 'Yes' : 'No'}`);
  console.log(`⬇️  Download artifacts: ${options.download ? 'Yes' : 'No'}\n`);

  // Create GitHub Actions tool
  const github = new GitHubActionsTool({
    token: process.env.GITHUB_TOKEN,
    owner,
    repo
  });

  try {
    // Get repo info
    const repoInfo = await github.getRepoInfo();
    console.log(`✅ Connected to ${owner}/${repo} (default branch: ${repoInfo.defaultBranch})\n`);

    // List available workflows
    console.log('📋 Available workflows:');
    const workflows = await github.listWorkflows();
    workflows.forEach(workflow => {
      console.log(`   - ${workflow.name} (${workflow.path})`);
    });
    console.log('');

    // Trigger workflow
    console.log('🚀 Triggering workflow...\n');

    if (options.wait) {
      // Trigger and wait for completion
      const run = await github.triggerAndWait(
        {
          workflowId: 'create-gmail-account.yml',
          ref: repoInfo.defaultBranch,
          inputs: {
            account_count: options.count,
            use_click_factory: true
          }
        },
        {
          pollInterval: 15000, // Check every 15 seconds
          timeout: 1800000, // 30 minutes
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
      console.log(`   Run #${run.run_number}`);
      console.log(`   URL: ${run.html_url}\n`);

      // Get job details
      console.log('📋 Job Details:');
      const jobs = await github.getWorkflowJobs(run.id);
      jobs.forEach(job => {
        console.log(`\n   Job: ${job.name}`);
        console.log(`   Status: ${job.status} | Conclusion: ${job.conclusion}`);
        console.log(`   Steps:`);
        job.steps.forEach(step => {
          const icon = step.conclusion === 'success' ? '✅' :
                       step.conclusion === 'failure' ? '❌' : '⏳';
          console.log(`     ${icon} ${step.name} (${step.status})`);
        });
      });

      // List artifacts
      console.log('\n📦 Artifacts:');
      const artifacts = await github.listWorkflowArtifacts(run.id);

      if (artifacts.length === 0) {
        console.log('   No artifacts found');
      } else {
        artifacts.forEach(artifact => {
          const sizeMB = (artifact.size_in_bytes / 1024 / 1024).toFixed(2);
          console.log(`   - ${artifact.name} (${sizeMB} MB)`);
        });

        // Download artifacts if requested
        if (options.download && artifacts.length > 0) {
          console.log(`\n⬇️  Downloading artifacts to ${options.outputDir}...\n`);

          // Create output directory
          if (!fs.existsSync(options.outputDir)) {
            fs.mkdirSync(options.outputDir, { recursive: true });
          }

          for (const artifact of artifacts) {
            const outputPath = path.join(options.outputDir, `${artifact.name}.zip`);
            await github.downloadArtifact(artifact.id, outputPath);
          }

          console.log(`\n✅ All artifacts downloaded to ${options.outputDir}`);
          console.log(`   Unzip them with: unzip '${options.outputDir}/*.zip' -d ${options.outputDir}/extracted\n`);
        }
      }

      if (run.conclusion === 'success') {
        console.log('\n✅ Gmail accounts created successfully!');
        console.log(`   Check artifacts for account credentials and screenshots\n`);
      } else {
        console.log('\n❌ Workflow failed. Check the logs at:');
        console.log(`   ${run.html_url}\n`);
      }

    } else {
      // Just trigger, don't wait
      await github.triggerWorkflow({
        workflowId: 'create-gmail-account.yml',
        ref: repoInfo.defaultBranch,
        inputs: {
          account_count: options.count,
          use_click_factory: true
        }
      });

      console.log('✅ Workflow triggered successfully!');
      console.log('\nMonitor progress at:');
      console.log(`   https://github.com/${owner}/${repo}/actions`);
      console.log('\nOr run with --wait to wait for completion:');
      console.log(`   GITHUB_TOKEN=xxx npx tsx scripts/trigger-gmail-workflow.ts --count ${options.count} --wait --download\n`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run
main();
