#!/bin/bash
# ============================================
# MLM Platform - Run All Tests
# ============================================
# Execute this BEFORE pushing to remote
# Run from project root: ./scripts/test-all.sh

set -e

echo "🚀 Running all tests..."
echo ""

# Backend unit tests
echo "📦 Backend unit tests..."
cd backend && pnpm test && cd ..

# Backend integration tests
echo ""
echo "📦 Backend integration tests..."
# Requires PostgreSQL running (use docker-compose up -d postgres redis)
pnpm test:integration

# Frontend unit tests
echo ""
echo "📦 Frontend unit tests..."
cd frontend && pnpm test:run && cd ..

# Frontend E2E tests (requires running servers)
echo ""
echo "📦 Frontend E2E tests (Playwright)..."
echo "⚠️  Make sure backend and frontend are running first!"
read -p "Run E2E tests? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd frontend && pnpm exec playwright test && cd ..
fi

echo ""
echo "✅ All tests passed!"
