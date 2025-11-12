#!/bin/bash

###############################################################################
# Fully Automated Research Test Runner
#
# Zero manual steps - completely automated end-to-end test:
# 1. Opens Facebook Marketplace
# 2. Searches for product
# 3. Clicks listing
# 4. Automatically clicks "Research This Deal" button
# 5. Monitors extraction
# 6. Validates all 20 fields
# 7. Reports results
###############################################################################

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🤖 Fully Automated Research Test${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if TypeScript is compiled
if [ ! -d "dist" ]; then
  echo -e "${YELLOW}⚠️  TypeScript not compiled. Running build...${NC}"
  npm run build
  echo ""
fi

echo -e "${GREEN}⚡ Zero manual steps - fully automated:${NC}"
echo ""
echo -e "  1. ${BLUE}Navigate${NC} to Facebook Marketplace"
echo -e "  2. ${BLUE}Search${NC} for product"
echo -e "  3. ${BLUE}Open${NC} first listing"
echo -e "  4. ${GREEN}Automatically click${NC} \"Research This Deal\" button"
echo -e "  5. ${BLUE}Monitor${NC} extraction logs"
echo -e "  6. ${BLUE}Validate${NC} all 20 fields"
echo -e "  7. ${BLUE}Report${NC} results"
echo ""

# Get search query from args or use default
SEARCH_QUERY=${1:-"laptop"}

echo -e "${YELLOW}🔍 Search query: ${SEARCH_QUERY}${NC}"
echo ""

# Run test
npx ts-node tests/auto-research-test.ts "$SEARCH_QUERY"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Test passed - Extraction working${NC}"
else
  echo -e "${RED}❌ Test failed - See issues above${NC}"
fi

echo ""
echo -e "${BLUE}📁 Results saved to: test-results/${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

exit $EXIT_CODE
