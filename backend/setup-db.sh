#!/bin/bash

echo "🚀 MLM Database Setup Script"
echo "============================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if container is already running
if [ "$(docker ps -q -f name=mlm_mysql)" ]; then
    echo "⚠️  MySQL container is already running."
    read -p "Do you want to restart it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down && docker-compose up -d
    fi
else
    echo "📦 Starting MySQL container..."
    docker-compose up -d
fi

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
for i in {1..30}; do
    if docker exec mlm_mysql mysqladmin ping -h localhost -u root -prootpassword > /dev/null 2>&1; then
        echo "✅ MySQL is ready!"
        break
    fi
    echo "   Waiting... ($i/30)"
    sleep 2
done

# Create .env file
echo ""
echo "📝 Creating .env file..."
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=mlm_db
DB_USER=root
DB_PASSWORD=rootpassword

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
echo "  2. Access phpMyAdmin at: http://localhost:8080"
echo "  3. To sync database: npm run dev -- --force-sync"
