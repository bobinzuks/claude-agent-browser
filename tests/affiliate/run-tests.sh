#!/bin/bash

# Affiliate Test Suite Runner
# Runs comprehensive tests for affiliate automation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
UNIT_PASSED=0
E2E_PASSED=0
COVERAGE_MET=0

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Affiliate Automation Test Suite${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to print section header
print_header() {
    echo ""
    echo -e "${BLUE}----------------------------------------${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}----------------------------------------${NC}"
    echo ""
}

# Function to check test result
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $1 failed${NC}"
        return 1
    fi
}

# Parse command line arguments
RUN_UNIT=1
RUN_E2E=1
RUN_COVERAGE=0
WATCH_MODE=0

while [[ $# -gt 0 ]]; do
    case $1 in
        --unit-only)
            RUN_E2E=0
            shift
            ;;
        --e2e-only)
            RUN_UNIT=0
            shift
            ;;
        --coverage)
            RUN_COVERAGE=1
            shift
            ;;
        --watch)
            WATCH_MODE=1
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--unit-only] [--e2e-only] [--coverage] [--watch]"
            exit 1
            ;;
    esac
done

# Change to project root
cd "$(dirname "$0")/../.."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_header "Installing dependencies"
    npm install
    check_result "Dependency installation"
fi

# Run unit tests
if [ $RUN_UNIT -eq 1 ]; then
    print_header "Running Unit Tests"

    if [ $WATCH_MODE -eq 1 ]; then
        echo "Running in watch mode..."
        npm test -- --watch tests/affiliate/unit/
    else
        npm test -- tests/affiliate/unit/
        if check_result "Unit tests"; then
            UNIT_PASSED=1
        fi
    fi
fi

# Run E2E tests
if [ $RUN_E2E -eq 1 ] && [ $WATCH_MODE -eq 0 ]; then
    print_header "Running E2E Tests"

    npx playwright test tests/affiliate/e2e/
    if check_result "E2E tests"; then
        E2E_PASSED=1
    fi
fi

# Run coverage analysis
if [ $RUN_COVERAGE -eq 1 ] && [ $WATCH_MODE -eq 0 ]; then
    print_header "Analyzing Test Coverage"

    npm run test:coverage -- tests/affiliate/

    # Check if coverage meets threshold (80%)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Coverage threshold met (80%+)${NC}"
        COVERAGE_MET=1
    else
        echo -e "${RED}✗ Coverage threshold not met${NC}"
    fi

    # Open coverage report
    if command -v xdg-open &> /dev/null; then
        echo "Opening coverage report..."
        xdg-open coverage/lcov-report/index.html
    elif command -v open &> /dev/null; then
        echo "Opening coverage report..."
        open coverage/lcov-report/index.html
    fi
fi

# Print summary
if [ $WATCH_MODE -eq 0 ]; then
    echo ""
    print_header "Test Summary"

    if [ $RUN_UNIT -eq 1 ]; then
        if [ $UNIT_PASSED -eq 1 ]; then
            echo -e "${GREEN}✓ Unit Tests: PASSED${NC}"
        else
            echo -e "${RED}✗ Unit Tests: FAILED${NC}"
        fi
    fi

    if [ $RUN_E2E -eq 1 ]; then
        if [ $E2E_PASSED -eq 1 ]; then
            echo -e "${GREEN}✓ E2E Tests: PASSED${NC}"
        else
            echo -e "${RED}✗ E2E Tests: FAILED${NC}"
        fi
    fi

    if [ $RUN_COVERAGE -eq 1 ]; then
        if [ $COVERAGE_MET -eq 1 ]; then
            echo -e "${GREEN}✓ Coverage: 80%+ MET${NC}"
        else
            echo -e "${YELLOW}⚠ Coverage: Below 80%${NC}"
        fi
    fi

    echo ""

    # Overall result
    TOTAL_FAILED=0
    if [ $RUN_UNIT -eq 1 ] && [ $UNIT_PASSED -eq 0 ]; then
        TOTAL_FAILED=1
    fi
    if [ $RUN_E2E -eq 1 ] && [ $E2E_PASSED -eq 0 ]; then
        TOTAL_FAILED=1
    fi

    if [ $TOTAL_FAILED -eq 0 ]; then
        echo -e "${GREEN}================================================${NC}"
        echo -e "${GREEN}  All Tests Passed! ✓${NC}"
        echo -e "${GREEN}================================================${NC}"
        exit 0
    else
        echo -e "${RED}================================================${NC}"
        echo -e "${RED}  Some Tests Failed ✗${NC}"
        echo -e "${RED}================================================${NC}"
        exit 1
    fi
fi
