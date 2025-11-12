#!/bin/bash

###############################################################################
# DealBot 20-Field Test Runner
#
# Automates testing of all 20 extraction fields with age detection diagnostic
###############################################################################

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 DealBot 20-Field Extraction Test${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if TypeScript is compiled
if [ ! -d "dist" ]; then
  echo -e "${YELLOW}⚠️  TypeScript not compiled. Running build...${NC}"
  npm run build
  echo ""
fi

echo -e "${GREEN}Testing all 20 extraction fields:${NC}"
echo ""
echo -e "${BLUE}🔵 CORE FIELDS (8):${NC}"
echo "  • Price, Title, Age, Location"
echo "  • URL, Listing ID, Currency, Image"
echo ""
echo -e "${GREEN}🟢 PHASE 1 (+40% ML accuracy - 5):${NC}"
echo "  • Condition, Seller, Category"
echo "  • Images, Shipping"
echo ""
echo -e "${YELLOW}🟡 PHASE 2 (+40% more ML accuracy - 7):${NC}"
echo "  • Badges, Rating, Brand, Model"
echo "  • Specs, Keywords, Description"
echo ""
echo -e "${YELLOW}📅 Includes age detection diagnostic to determine if:${NC}"
echo "  • Facebook shows listing age (or is it a Canada limitation)"
echo "  • Code needs fixing vs Facebook limitation"
echo ""

# Run test
npx ts-node tests/dealbot-20-field-test.ts

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
