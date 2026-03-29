#!/bin/bash

echo "🚀 MLM Database Setup Script (PostgreSQL)"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if PostgreSQL containers are already running
if [ "$(docker ps -q -f name=mlm_postgres)" ]; then
    echo "⚠️  PostgreSQL container is already running."
    read -p "Do you want to restart it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose up -d postgres postgres-test
    fi
else
    echo "📦 Starting PostgreSQL containers..."
    docker-compose up -d postgres postgres-test
fi

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."

# Check main database
for i in {1..30}; do
    if docker exec mlm_postgres pg_isready -U mlm -d mlm_db > /dev/null 2>&1; then
        echo "✅ Main PostgreSQL database is ready!"
        break
    fi
    echo "   Waiting for main DB... ($i/30)"
    sleep 2
done

# Check test database
for i in {1..30}; do
    if docker exec mlm_postgres_test pg_isready -U mlm_test -d mlm_test > /dev/null 2>&1; then
        echo "✅ Test PostgreSQL database is ready!"
        break
    fi
    echo "   Waiting for test DB... ($i/30)"
    sleep 2
done

# Create .env file for PostgreSQL
echo ""
echo "📝 Creating .env file for PostgreSQL..."
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000

# PostgreSQL Configuration (main database)
DB_HOST=localhost
DB_PORT=5434
DB_NAME=mlm_db
DB_USER=mlm
DB_PASSWORD=mlm123
DB_DIALECT=postgres

# Test Database (optional - for running integration tests)
TEST_DB_HOST=127.0.0.1
TEST_DB_PORT=5435
TEST_DB_NAME=mlm_test
TEST_DB_USER=mlm_test
TEST_DB_PASSWORD=mlm_test
TEST_DB_DIALECT=postgres

JWT_SECRET=your-super-secret-jwt-key-change-in-production-$(date +%s)
JWT_EXPIRES_IN=7d

APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
EOF

echo "✅ .env file created!"
echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run: npm run dev"
echo "  2. Access API at: http://localhost:3000"
echo "  3. To sync database: npm run dev -- --force-sync"
echo ""
echo "Database connection info:"
echo "  Main DB:   postgresql://mlm:mlm123@localhost:5434/mlm_db"
echo "  Test DB:   postgresql://mlm_test:mlm_test@localhost:5435/mlm_test"
