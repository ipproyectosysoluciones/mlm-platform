#!/bin/bash
#
# @fileoverview Initialize Test Database
# @description Creates mlm_test database for integration tests
#              Crea la base de datos mlm_test para tests de integración
#
# Usage: ./scripts/init-test-db.sh

set -e

echo "📦 Checking MySQL connection..."

# Get DB credentials from .env or use defaults
source "$(dirname "$0")/../.env" 2>/dev/null || true

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-rootpassword}"
DB_NAME="${TEST_DB_NAME:-mlm_test}"

echo "🔧 Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   User: $DB_USER"
echo "   DB:   $DB_NAME"

# Try to create database (ignore error if it already exists)
echo "� Creating database '$DB_NAME'..."

if [ "$DB_PASSWORD" = "rootpassword" ]; then
    # Default password - try without password first
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || \
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || \
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" --skip-password -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
else
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
fi

if [ $? -eq 0 ]; then
    echo "✅ Database '$DB_NAME' created successfully!"
else
    echo "❌ Failed to create database. Please check your MySQL credentials."
    exit 1
fi

echo "📋 Database ready for tests!"
echo ""
echo "To run tests:"
echo "  cd backend && pnpm test:integration"
