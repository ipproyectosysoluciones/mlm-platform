#!/bin/sh
# Script de inicialización - sincroniza BD y luego inicia el servidor

echo "🔄 Initializing database..."
node -e "
const { connectDatabase, syncDatabase } = require('./dist/config/database');
const { initModels } = require('./dist/models');

async function init() {
  await connectDatabase();
  initModels();
  await syncDatabase(false);
  console.log('✅ Database initialized');
  process.exit(0);
}

init().catch(err => {
  console.error('❌ Init failed:', err.message);
  process.exit(1);
});
"

echo "🚀 Starting server..."
exec node dist/server.cjs
