// Instrument Sentry BEFORE any other imports (Sentry ESM pattern)
import './instrument';

import app from './app';
import { connectDatabase, syncDatabase } from './config/database';
import { config } from './config/env';
import { initModels } from './models';

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    initModels();

    const forceSync = config.nodeEnv === 'development' && process.argv.includes('--force-sync');
    if (forceSync) {
      await syncDatabase(true);
      console.log('⚠️  Database synced with force=true');
    }

    app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    MLM Backend Server                       ║
╠═══════════════════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(40)}║
║  Port:        ${config.port.toString().padEnd(40)}║
║  Database:     ${config.db.name.padEnd(40)}║
║  Frontend:     ${config.app.frontendUrl.padEnd(40)}║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
