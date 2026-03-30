#!/bin/sh
# Init script que sincroniza la BD y luego inicia el servidor

# Sincronizar tablas
echo "🔄 Syncing database schema..."
node -e "
const { connectDatabase, syncDatabase } = require('./dist/config/database');
const { initModels } = require('./dist/models');

async function init() {
  try {
    await connectDatabase();
    initModels();
    await syncDatabase({ alter: true });
    console.log('✅ Database schema synced');
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
    process.exit(1);
  }
}

init();
"

echo "🚀 Starting server..."
exec node dist/server.cjs
