#!/bin/bash

# install-hooks.sh - Install git pre-commit hook
# Usage: ./scripts/install-hooks.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "Installing git pre-commit hook..."
echo ""

# Check if .git directory exists
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "Error: .git directory not found. Are you in a git repository?"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/.git/hooks"

# Copy pre-commit hook
cp "$PROJECT_ROOT/scripts/git-hooks/pre-commit" "$PROJECT_ROOT/.git/hooks/pre-commit"

# Make it executable
chmod +x "$PROJECT_ROOT/.git/hooks/pre-commit"

echo -e "${GREEN}✅ Git pre-commit hook installed successfully!${NC}"
echo ""
echo "Hook location: ${BLUE}.git/hooks/pre-commit${NC}"
echo ""
echo "From now on, all tests will run automatically before each commit."
echo ""
echo "Commands:"
echo "  - Run tests manually: ${BLUE}./scripts/run-all-tests.sh${NC}"
echo "  - Bypass hook (not recommended): ${BLUE}git commit --no-verify${NC}"
echo ""
