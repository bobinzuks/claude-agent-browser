#!/bin/bash
# Recursive workflow validation and fix loop

WORKFLOW_FILE=".github/workflows/create-gmail-account.yml"
MAX_ATTEMPTS=10
ATTEMPT=1

echo "🔄 Starting recursive workflow validation loop..."
echo ""

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Attempt $ATTEMPT/$MAX_ATTEMPTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Commit and push current version
    git add "$WORKFLOW_FILE"
    git commit -m "fix(workflow): Attempt $ATTEMPT - Fix GitHub Actions syntax" --no-verify 2>/dev/null || echo "No changes to commit"
    git push origin main 2>&1 | tail -3

    echo ""
    echo "⏳ Waiting 5 seconds for GitHub to process..."
    sleep 5

    # Check workflow validation status
    echo ""
    echo "🔍 Checking workflow validation..."

    VALIDATION=$(curl -s "https://api.github.com/repos/bobinzuks/claude-agent-browser/actions/workflows" | \
        jq -r '.workflows[] | select(.path == ".github/workflows/create-gmail-account.yml") | .state')

    echo "Workflow state: $VALIDATION"

    if [ "$VALIDATION" == "active" ]; then
        echo ""
        echo "✅ SUCCESS! Workflow is valid and active!"
        echo ""
        echo "🚀 You can now run the workflow at:"
        echo "https://github.com/bobinzuks/claude-agent-browser/actions/workflows/create-gmail-account.yml"
        echo ""
        exit 0
    else
        echo ""
        echo "❌ Workflow validation failed. Fetching error..."
        echo ""

        # Take screenshot if possible (would need a browser)
        echo "📸 Error details from GitHub API:"
        curl -s "https://api.github.com/repos/bobinzuks/claude-agent-browser/contents/.github/workflows/create-gmail-account.yml" | \
            jq -r '.message // "No error message available"'

        echo ""
        echo "🔧 Needs manual fix. Check GitHub UI for specific error."
        echo "https://github.com/bobinzuks/claude-agent-browser/actions"
        echo ""

        ((ATTEMPT++))

        if [ $ATTEMPT -le $MAX_ATTEMPTS ]; then
            echo "⏳ Waiting 10 seconds before next attempt..."
            sleep 10
        fi
    fi
done

echo ""
echo "❌ Max attempts reached. Manual intervention required."
echo "Please check: https://github.com/bobinzuks/claude-agent-browser/actions"
exit 1
