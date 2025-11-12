#!/bin/bash

###############################################################################
# Multi-Location Search Test Runner
#
# Automates testing of the DealBot multi-location search feature
###############################################################################

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 DealBot Multi-Location Test Runner${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if TypeScript is compiled
if [ ! -d "dist" ]; then
  echo -e "${YELLOW}⚠️  TypeScript not compiled. Running build...${NC}"
  npm run build
  echo ""
fi

# Parse command line arguments
MODE="${1:-test-page}"

case "$MODE" in
  test-page)
    echo -e "${GREEN}📄 Testing via Test Page (Option A)${NC}"
    echo -e "${YELLOW}This will:${NC}"
    echo "  1. Load extension in Chrome"
    echo "  2. Open test-multi-location.html"
    echo "  3. Click test button"
    echo "  4. Monitor tab automation"
    echo "  5. Extract and validate results"
    echo ""
    npx ts-node tests/multi-location-automated-test.ts test-page
    ;;

  facebook)
    echo -e "${GREEN}🌐 Testing via Facebook Marketplace (Option B)${NC}"
    echo -e "${YELLOW}This will:${NC}"
    echo "  1. Load extension in Chrome"
    echo "  2. Navigate to Facebook Marketplace"
    echo "  3. Search for product"
    echo "  4. Click 'Research This Deal'"
    echo "  5. Trigger multi-location search"
    echo "  6. Extract and validate results"
    echo ""
    echo -e "${YELLOW}⚠️  You may need to login to Facebook manually${NC}"
    echo ""
    npx ts-node tests/multi-location-automated-test.ts facebook
    ;;

  full)
    echo -e "${GREEN}🎯 Running Full Test Suite${NC}"
    echo -e "${YELLOW}This will run both test-page and Facebook tests${NC}"
    echo ""
    npx ts-node tests/multi-location-automated-test.ts full
    ;;

  monitor)
    echo -e "${GREEN}📡 Starting Console Monitor${NC}"
    echo -e "${YELLOW}This will monitor extension console in real-time${NC}"
    echo ""
    npx ts-node tests/console-monitor.ts
    ;;

  analyze)
    echo -e "${GREEN}📊 Analyzing Test Results${NC}"
    echo ""
    npx ts-node tests/extraction-analysis.ts compare
    ;;

  help|--help|-h)
    echo -e "${GREEN}Usage:${NC}"
    echo "  ./run-multi-location-test.sh [mode]"
    echo ""
    echo -e "${GREEN}Modes:${NC}"
    echo "  test-page    Test using extension test page (default)"
    echo "  facebook     Test using real Facebook Marketplace"
    echo "  full         Run complete test suite (both modes)"
    echo "  monitor      Start console monitor for live debugging"
    echo "  analyze      Analyze previous test results"
    echo "  help         Show this help message"
    echo ""
    echo -e "${GREEN}Examples:${NC}"
    echo "  ./run-multi-location-test.sh test-page"
    echo "  ./run-multi-location-test.sh facebook"
    echo "  ./run-multi-location-test.sh full"
    echo ""
    exit 0
    ;;

  *)
    echo -e "${RED}❌ Unknown mode: $MODE${NC}"
    echo "Run with 'help' to see available modes"
    exit 1
    ;;
esac

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Test completed successfully${NC}"
else
  echo -e "${RED}❌ Test failed with exit code $EXIT_CODE${NC}"
fi

echo ""
echo -e "${BLUE}📁 Results saved to: test-results/${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

exit $EXIT_CODE
