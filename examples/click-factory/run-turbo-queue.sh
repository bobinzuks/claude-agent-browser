#!/bin/bash
# Run Click Factory Turbo Queue

echo "🚀 Starting Click Factory Turbo Queue..."
echo ""
echo "Controls:"
echo "  • Green DONE button = Submit & close tab"
echo "  • Orange NEXT button = Skip for later"
echo "  • Auto-pauses after 30s of inactivity"
echo ""

export DISPLAY=:1
npx tsx src/automation/click-factory/turbo-queue.ts
