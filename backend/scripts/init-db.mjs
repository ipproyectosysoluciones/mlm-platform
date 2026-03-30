/**
 * Init script - sincroniza la base de datos antes de iniciar el servidor
 */
import { connectDatabase, syncDatabase } from './config/database';
import { initModels } from './models';

async function init() {
  console.log('🔄 Initializing database...');
  
  await connectDatabase();
  initModels();
  
  // Sync sin force para no perder datos, alter para agregar columnas nuevas
  await syncDatabase(false);
  
  console.log('✅ Database initialized');
}

init()
  .then(() => {
    console.log('🚀 Starting server...');
    // Dynamic import del server para evitar ciclos
    import('./server.js').then(() => {
      console.log('Server started');
    }).catch(() => {
      // Si falla, el server se levanta desde CMD
      process.exit(0);
    });
  })
  .  catch((err) => {
    console.error('❌ Database init failed:', err);
    process.exit(1);
  });
