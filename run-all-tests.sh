#!/bin/bash

# Run All Tests Script
# Comprehensive test runner for frontend and backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Track results
FRONTEND_RESULT=0
BACKEND_UNIT_RESULT=0
BACKEND_PROPERTY_RESULT=0
BACKEND_INTEGRATION_RESULT=0

# Parse arguments
VERBOSE=false
COVERAGE=false
PARALLEL=false
FRONTEND_ONLY=false
BACKEND_ONLY=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -v|--verbose) VERBOSE=true ;;
        -c|--coverage) COVERAGE=true ;;
        -p|--parallel) PARALLEL=true ;;
        --frontend) FRONTEND_ONLY=true ;;
        --backend) BACKEND_ONLY=true ;;
        -h|--help)
            echo "Usage: ./run-all-tests.sh [options]"
            echo ""
            echo "Options:"
            echo "  -v, --verbose    Show detailed test output"
            echo "  -c, --coverage   Generate coverage reports"
            echo "  -p, --parallel   Run frontend and backend in parallel"
            echo "  --frontend       Run only frontend tests"
            echo "  --backend        Run only backend tests"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}       Running Full Test Suite${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Count test files
FRONTEND_TEST_COUNT=$(find frontend/src -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l | tr -d ' ')
BACKEND_TEST_COUNT=$(find backend/tests -name "test_*.py" 2>/dev/null | wc -l | tr -d ' ')

echo -e "${BLUE}Found ${FRONTEND_TEST_COUNT} frontend test files${NC}"
echo -e "${BLUE}Found ${BACKEND_TEST_COUNT} backend test files${NC}"
echo ""

run_frontend_tests() {
    echo -e "${YELLOW}[Frontend] Running Vitest tests...${NC}"
    echo "--------------------------------------------"
    
    cd frontend
    
    if [ "$COVERAGE" = true ]; then
        npm run test:coverage 2>&1
    else
        npm test 2>&1
    fi
    FRONTEND_RESULT=$?
    
    cd ..
    
    if [ $FRONTEND_RESULT -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend tests passed${NC}"
    else
        echo -e "${RED}✗ Frontend tests failed${NC}"
    fi
    echo ""
}

run_backend_tests() {
    echo -e "${YELLOW}[Backend] Running Pytest tests...${NC}"
    echo "--------------------------------------------"
    
    cd backend
    
    # Unit tests
    if [ -d "tests/unit" ] && [ "$(ls -A tests/unit/*.py 2>/dev/null | grep -v __init__ | head -1)" ]; then
        echo -e "${CYAN}  → Unit tests${NC}"
        python3 -m pytest tests/unit/ --tb=short -q 2>&1
        BACKEND_UNIT_RESULT=$?
    fi
    
    # Property-based tests
    if [ -d "tests/property" ]; then
        echo -e "${CYAN}  → Property-based tests${NC}"
        python3 -m pytest tests/property/ --tb=short -q 2>&1
        BACKEND_PROPERTY_RESULT=$?
    fi
    
    # Integration tests
    if [ -d "tests/integration" ]; then
        echo -e "${CYAN}  → Integration tests${NC}"
        python3 -m pytest tests/integration/ --tb=short -q 2>&1
        BACKEND_INTEGRATION_RESULT=$?
    fi
    
    cd ..
    
    if [ $BACKEND_UNIT_RESULT -eq 0 ] && [ $BACKEND_PROPERTY_RESULT -eq 0 ] && [ $BACKEND_INTEGRATION_RESULT -eq 0 ]; then
        echo -e "${GREEN}✓ Backend tests passed${NC}"
    else
        echo -e "${RED}✗ Backend tests failed${NC}"
    fi
    echo ""
}

# Run tests based on flags
if [ "$PARALLEL" = true ] && [ "$FRONTEND_ONLY" = false ] && [ "$BACKEND_ONLY" = false ]; then
    echo -e "${BLUE}Running tests in parallel...${NC}"
    echo ""
    
    # Run in parallel using background processes
    run_frontend_tests &
    FRONTEND_PID=$!
    
    run_backend_tests &
    BACKEND_PID=$!
    
    wait $FRONTEND_PID
    wait $BACKEND_PID
else
    if [ "$BACKEND_ONLY" = false ]; then
        run_frontend_tests
    fi
    
    if [ "$FRONTEND_ONLY" = false ]; then
        run_backend_tests
    fi
fi

# Summary
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}              Test Summary${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

TOTAL_FAILED=0

if [ "$BACKEND_ONLY" = false ]; then
    if [ $FRONTEND_RESULT -eq 0 ]; then
        echo -e "  Frontend:           ${GREEN}PASSED${NC}"
    else
        echo -e "  Frontend:           ${RED}FAILED${NC}"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi
fi

if [ "$FRONTEND_ONLY" = false ]; then
    if [ $BACKEND_UNIT_RESULT -eq 0 ]; then
        echo -e "  Backend Unit:       ${GREEN}PASSED${NC}"
    else
        echo -e "  Backend Unit:       ${RED}FAILED${NC}"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi
    
    if [ $BACKEND_PROPERTY_RESULT -eq 0 ]; then
        echo -e "  Backend Property:   ${GREEN}PASSED${NC}"
    else
        echo -e "  Backend Property:   ${RED}FAILED${NC}"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi
    
    if [ $BACKEND_INTEGRATION_RESULT -eq 0 ]; then
        echo -e "  Backend Integration:${GREEN}PASSED${NC}"
    else
        echo -e "  Backend Integration:${RED}FAILED${NC}"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi
fi

echo ""
echo "--------------------------------------------"

if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ $TOTAL_FAILED test suite(s) failed${NC}"
    exit 1
fi
