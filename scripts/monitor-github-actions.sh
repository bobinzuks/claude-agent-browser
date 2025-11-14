#!/bin/bash

# Monitor GitHub Actions workflow execution
# Usage: ./scripts/monitor-github-actions.sh [workflow-name]

WORKFLOW="${1:-social-media-training.yml}"

echo "🔍 Monitoring GitHub Actions: $WORKFLOW"
echo "═══════════════════════════════════════════════════"
echo ""

# Get latest run
RUN_ID=$(gh run list --workflow="$WORKFLOW" --limit 1 --json databaseId --jq '.[0].databaseId')

if [ -z "$RUN_ID" ]; then
  echo "❌ No runs found for workflow: $WORKFLOW"
  exit 1
fi

echo "📋 Run ID: $RUN_ID"
echo "🔗 URL: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions/runs/$RUN_ID"
echo ""

# Monitor until completion
while true; do
  # Get run status
  RUN_INFO=$(gh run view $RUN_ID --json status,conclusion,jobs)
  STATUS=$(echo "$RUN_INFO" | jq -r '.status')
  CONCLUSION=$(echo "$RUN_INFO" | jq -r '.conclusion')

  # Clear previous output (optional)
  # clear

  echo "$(date '+%H:%M:%S') - Status: $STATUS"

  # Show job progress
  echo "$RUN_INFO" | jq -r '.jobs[] | "  \(.name): \(.status) \(.conclusion // "")"'

  # Check if completed
  if [ "$STATUS" = "completed" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "✅ Workflow completed: $CONCLUSION"
    echo ""

    # Download artifacts
    echo "📦 Downloading artifacts..."
    gh run download $RUN_ID --dir "./github-actions-results/run-$RUN_ID" 2>/dev/null || true

    if [ -d "./github-actions-results/run-$RUN_ID" ]; then
      echo "✅ Artifacts downloaded to: ./github-actions-results/run-$RUN_ID"

      # Show summary if available
      if [ -f "./github-actions-results/run-$RUN_ID/analysis-summary/summary.json" ]; then
        echo ""
        echo "📊 Quick Summary:"
        cat "./github-actions-results/run-$RUN_ID/analysis-summary/summary.json" | jq '.'
      fi
    fi

    break
  fi

  echo ""
  sleep 10
done
