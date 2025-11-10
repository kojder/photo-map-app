#!/bin/bash

# run-all-tests.sh - Run all tests (frontend unit, backend, E2E)
# Usage: ./scripts/run-all-tests.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
FRONTEND_UNIT_RESULT=""
BACKEND_RESULT=""
E2E_RESULT=""

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Photo Map MVP - Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if PostgreSQL test database is running
check_postgres() {
    echo -e "${YELLOW}[0/4] Checking PostgreSQL test database (port 5433)...${NC}"

    if docker ps --format '{{.Names}}' | grep -q "photomap-postgres-test"; then
        echo -e "${GREEN}✓ PostgreSQL test database is already running${NC}"
    else
        echo -e "${YELLOW}⚠ PostgreSQL test database not found, starting...${NC}"

        # Check if container exists but stopped
        if docker ps -a --format '{{.Names}}' | grep -q "photomap-postgres-test"; then
            echo "  Starting existing container..."
            docker start photomap-postgres-test
        else
            echo "  Creating new container..."
            docker run -d \
                --name photomap-postgres-test \
                -p 5433:5432 \
                -e POSTGRES_DB=photomap_test \
                -e POSTGRES_USER=photomap_test \
                -e POSTGRES_PASSWORD=test123 \
                postgres:15-alpine
        fi

        # Wait for PostgreSQL to be ready
        echo "  Waiting for PostgreSQL to be ready..."
        sleep 3

        for i in {1..10}; do
            if docker exec photomap-postgres-test pg_isready -U photomap_test > /dev/null 2>&1; then
                echo -e "${GREEN}✓ PostgreSQL test database is ready${NC}"
                break
            fi
            if [ $i -eq 10 ]; then
                echo -e "${RED}✗ PostgreSQL failed to start${NC}"
                exit 1
            fi
            sleep 1
        done
    fi
    echo ""
}

# Run frontend unit tests (Karma)
run_frontend_unit_tests() {
    echo -e "${YELLOW}[1/3] Running Frontend Unit Tests (Karma)...${NC}"
    echo ""

    cd "$PROJECT_ROOT/frontend"

    if npm run test:coverage; then
        FRONTEND_UNIT_RESULT="PASSED"
        echo ""
        echo -e "${GREEN}✅ Frontend Unit Tests PASSED${NC}"
        echo -e "   Coverage report: ${BLUE}frontend/coverage/frontend/index.html${NC}"
    else
        FRONTEND_UNIT_RESULT="FAILED"
        echo ""
        echo -e "${RED}❌ Frontend Unit Tests FAILED${NC}"
        return 1
    fi

    echo ""
}

# Run backend tests (Maven)
run_backend_tests() {
    echo -e "${YELLOW}[2/3] Running Backend Tests (Maven)...${NC}"
    echo ""

    cd "$PROJECT_ROOT/backend"

    if ./mvnw test; then
        BACKEND_RESULT="PASSED"
        echo ""
        echo -e "${GREEN}✅ Backend Tests PASSED${NC}"
        echo -e "   Coverage report: ${BLUE}backend/target/site/jacoco/index.html${NC}"
    else
        BACKEND_RESULT="FAILED"
        echo ""
        echo -e "${RED}❌ Backend Tests FAILED${NC}"
        return 1
    fi

    echo ""
}

# Run E2E tests (Playwright)
run_e2e_tests() {
    echo -e "${YELLOW}[3/3] Running E2E Tests (Playwright)...${NC}"
    echo ""

    cd "$PROJECT_ROOT/frontend"

    if npm run test:e2e; then
        E2E_RESULT="PASSED"
        echo ""
        echo -e "${GREEN}✅ E2E Tests PASSED${NC}"
        echo -e "   HTML report: ${BLUE}frontend/playwright-report/index.html${NC}"
    else
        E2E_RESULT="FAILED"
        echo ""
        echo -e "${RED}❌ E2E Tests FAILED${NC}"
        return 1
    fi

    echo ""
}

# Print summary
print_summary() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}  TEST RESULTS SUMMARY${NC}"
    echo -e "${BLUE}============================================${NC}"

    # Frontend Unit Tests
    if [ "$FRONTEND_UNIT_RESULT" = "PASSED" ]; then
        echo -e "Frontend Unit Tests (Karma):    ${GREEN}✅ PASSED${NC}"
    elif [ "$FRONTEND_UNIT_RESULT" = "FAILED" ]; then
        echo -e "Frontend Unit Tests (Karma):    ${RED}❌ FAILED${NC}"
    else
        echo -e "Frontend Unit Tests (Karma):    ${YELLOW}⏭️  SKIPPED${NC}"
    fi

    # Backend Tests
    if [ "$BACKEND_RESULT" = "PASSED" ]; then
        echo -e "Backend Tests (Maven):           ${GREEN}✅ PASSED${NC}"
    elif [ "$BACKEND_RESULT" = "FAILED" ]; then
        echo -e "Backend Tests (Maven):           ${RED}❌ FAILED${NC}"
    else
        echo -e "Backend Tests (Maven):           ${YELLOW}⏭️  SKIPPED${NC}"
    fi

    # E2E Tests
    if [ "$E2E_RESULT" = "PASSED" ]; then
        echo -e "E2E Tests (Playwright):          ${GREEN}✅ PASSED${NC}"
    elif [ "$E2E_RESULT" = "FAILED" ]; then
        echo -e "E2E Tests (Playwright):          ${RED}❌ FAILED${NC}"
    else
        echo -e "E2E Tests (Playwright):          ${YELLOW}⏭️  SKIPPED${NC}"
    fi

    echo -e "${BLUE}============================================${NC}"

    # Final verdict
    if [ "$FRONTEND_UNIT_RESULT" = "PASSED" ] && [ "$BACKEND_RESULT" = "PASSED" ] && [ "$E2E_RESULT" = "PASSED" ]; then
        echo -e "${GREEN}✓ All tests PASSED - OK to commit!${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ Tests FAILED - fix errors before commit!${NC}"
        echo ""
        return 1
    fi
}

# Main execution
main() {
    # Check PostgreSQL
    check_postgres

    # Run tests (stop on first failure)
    if ! run_frontend_unit_tests; then
        print_summary
        exit 1
    fi

    if ! run_backend_tests; then
        print_summary
        exit 1
    fi

    if ! run_e2e_tests; then
        print_summary
        exit 1
    fi

    # All tests passed
    print_summary
    exit 0
}

# Run main
main
