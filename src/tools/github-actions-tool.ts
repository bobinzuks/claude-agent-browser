/**
 * GitHub Actions Tool
 * Trigger and monitor GitHub Actions workflows programmatically
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

export interface GitHubActionsConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface WorkflowDispatchInput {
  workflowId: string; // e.g., 'create-gmail-account.yml'
  ref?: string; // branch/tag, default: 'main'
  inputs?: Record<string, string | number | boolean>;
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_number: number;
}

export interface WorkflowArtifact {
  id: number;
  name: string;
  size_in_bytes: number;
  archive_download_url: string;
  created_at: string | null;
  expired: boolean;
}

export class GitHubActionsTool {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(config: GitHubActionsConfig) {
    this.octokit = new Octokit({
      auth: config.token
    });
    this.owner = config.owner;
    this.repo = config.repo;
  }

  /**
   * Trigger a workflow dispatch event
   */
  async triggerWorkflow(dispatch: WorkflowDispatchInput): Promise<void> {
    console.log(`🚀 Triggering workflow: ${dispatch.workflowId}`);
    console.log(`   Inputs:`, dispatch.inputs);

    await this.octokit.actions.createWorkflowDispatch({
      owner: this.owner,
      repo: this.repo,
      workflow_id: dispatch.workflowId,
      ref: dispatch.ref || 'main',
      inputs: dispatch.inputs as Record<string, string>
    });

    console.log(`✅ Workflow dispatch triggered`);
  }

  /**
   * Get the latest workflow run for a specific workflow
   */
  async getLatestWorkflowRun(workflowId: string): Promise<WorkflowRun | null> {
    const response = await this.octokit.actions.listWorkflowRuns({
      owner: this.owner,
      repo: this.repo,
      workflow_id: workflowId,
      per_page: 1
    });

    if (response.data.workflow_runs.length === 0) {
      return null;
    }

    const run = response.data.workflow_runs[0];
    return {
      id: run.id,
      name: run.name || 'Unknown',
      status: run.status as WorkflowRun['status'],
      conclusion: run.conclusion as WorkflowRun['conclusion'],
      html_url: run.html_url,
      created_at: run.created_at,
      updated_at: run.updated_at,
      run_number: run.run_number
    };
  }

  /**
   * Wait for workflow run to complete
   */
  async waitForWorkflowCompletion(
    runId: number,
    options: {
      pollInterval?: number; // ms, default: 10000 (10 seconds)
      timeout?: number; // ms, default: 1800000 (30 minutes)
      onProgress?: (run: WorkflowRun) => void;
    } = {}
  ): Promise<WorkflowRun> {
    const pollInterval = options.pollInterval || 10000;
    const timeout = options.timeout || 1800000; // 30 minutes
    const startTime = Date.now();

    console.log(`⏳ Waiting for workflow run #${runId} to complete...`);

    while (true) {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(`Workflow run #${runId} timed out after ${timeout}ms`);
      }

      // Get workflow run status
      const response = await this.octokit.actions.getWorkflowRun({
        owner: this.owner,
        repo: this.repo,
        run_id: runId
      });

      const run: WorkflowRun = {
        id: response.data.id,
        name: response.data.name || 'Unknown',
        status: response.data.status as WorkflowRun['status'],
        conclusion: response.data.conclusion as WorkflowRun['conclusion'],
        html_url: response.data.html_url,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        run_number: response.data.run_number
      };

      // Call progress callback
      if (options.onProgress) {
        options.onProgress(run);
      }

      // Check if completed
      if (run.status === 'completed') {
        console.log(`✅ Workflow run #${runId} completed with conclusion: ${run.conclusion}`);
        return run;
      }

      // Log progress
      console.log(`   Status: ${run.status} (checking again in ${pollInterval / 1000}s)`);

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * Get workflow run logs
   */
  async getWorkflowRunLogs(runId: number): Promise<string> {
    console.log(`📋 Fetching logs for workflow run #${runId}...`);

    const response = await this.octokit.actions.downloadWorkflowRunLogs({
      owner: this.owner,
      repo: this.repo,
      run_id: runId
    });

    // Response is a redirect URL, need to fetch it
    if (typeof response.data === 'string') {
      const logsResponse = await fetch(response.data);
      return await logsResponse.text();
    }

    return 'No logs available';
  }

  /**
   * List workflow run artifacts
   */
  async listWorkflowArtifacts(runId: number): Promise<WorkflowArtifact[]> {
    console.log(`📦 Listing artifacts for workflow run #${runId}...`);

    const response = await this.octokit.actions.listWorkflowRunArtifacts({
      owner: this.owner,
      repo: this.repo,
      run_id: runId
    });

    return response.data.artifacts.map(artifact => ({
      id: artifact.id,
      name: artifact.name,
      size_in_bytes: artifact.size_in_bytes,
      archive_download_url: artifact.archive_download_url,
      created_at: artifact.created_at,
      expired: artifact.expired
    }));
  }

  /**
   * Download workflow artifact
   */
  async downloadArtifact(
    artifactId: number,
    outputPath: string
  ): Promise<string> {
    console.log(`⬇️  Downloading artifact #${artifactId}...`);

    const response = await this.octokit.actions.downloadArtifact({
      owner: this.owner,
      repo: this.repo,
      artifact_id: artifactId,
      archive_format: 'zip'
    });

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write artifact to file
    const buffer = Buffer.from(response.data as ArrayBuffer);
    fs.writeFileSync(outputPath, buffer);

    console.log(`✅ Artifact downloaded to: ${outputPath}`);
    return outputPath;
  }

  /**
   * Cancel a workflow run
   */
  async cancelWorkflowRun(runId: number): Promise<void> {
    console.log(`🛑 Cancelling workflow run #${runId}...`);

    await this.octokit.actions.cancelWorkflowRun({
      owner: this.owner,
      repo: this.repo,
      run_id: runId
    });

    console.log(`✅ Workflow run #${runId} cancelled`);
  }

  /**
   * List all workflows in repository
   */
  async listWorkflows(): Promise<Array<{
    id: number;
    name: string;
    path: string;
    state: string;
  }>> {
    const response = await this.octokit.actions.listRepoWorkflows({
      owner: this.owner,
      repo: this.repo
    });

    return response.data.workflows.map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      path: workflow.path,
      state: workflow.state
    }));
  }

  /**
   * Trigger workflow and wait for completion
   */
  async triggerAndWait(
    dispatch: WorkflowDispatchInput,
    options: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (run: WorkflowRun) => void;
    } = {}
  ): Promise<WorkflowRun> {
    // Trigger workflow
    await this.triggerWorkflow(dispatch);

    // Wait a bit for the run to be created
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get the latest run
    const latestRun = await this.getLatestWorkflowRun(dispatch.workflowId);
    if (!latestRun) {
      throw new Error('Failed to find triggered workflow run');
    }

    console.log(`📊 Found workflow run #${latestRun.run_number} (ID: ${latestRun.id})`);
    console.log(`   URL: ${latestRun.html_url}`);

    // Wait for completion
    return await this.waitForWorkflowCompletion(latestRun.id, options);
  }

  /**
   * Get workflow run jobs
   */
  async getWorkflowJobs(runId: number): Promise<Array<{
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    started_at: string;
    completed_at: string | null;
    steps: Array<{
      name: string;
      status: string;
      conclusion: string | null;
      number: number;
    }>;
  }>> {
    const response = await this.octokit.actions.listJobsForWorkflowRun({
      owner: this.owner,
      repo: this.repo,
      run_id: runId
    });

    return response.data.jobs.map(job => ({
      id: job.id,
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      started_at: job.started_at,
      completed_at: job.completed_at,
      steps: job.steps?.map(step => ({
        name: step.name,
        status: step.status,
        conclusion: step.conclusion,
        number: step.number
      })) || []
    }));
  }

  /**
   * Get repository information
   */
  async getRepoInfo(): Promise<{
    owner: string;
    repo: string;
    defaultBranch: string;
  }> {
    const response = await this.octokit.repos.get({
      owner: this.owner,
      repo: this.repo
    });

    return {
      owner: this.owner,
      repo: this.repo,
      defaultBranch: response.data.default_branch
    };
  }
}

/**
 * Helper function to create GitHubActionsTool from environment
 */
export function createGitHubActionsTool(): GitHubActionsTool {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable not set');
  }

  // Try to parse from git remote
  let owner = process.env.GITHUB_OWNER;
  let repo = process.env.GITHUB_REPOSITORY;

  if (!owner || !repo) {
    // Try to extract from GITHUB_REPOSITORY (format: owner/repo)
    const githubRepo = process.env.GITHUB_REPOSITORY;
    if (githubRepo) {
      [owner, repo] = githubRepo.split('/');
    }
  }

  if (!owner || !repo) {
    throw new Error('Could not determine GitHub owner/repo. Set GITHUB_OWNER and GITHUB_REPOSITORY env vars');
  }

  return new GitHubActionsTool({
    token,
    owner,
    repo
  });
}
