// Instrument Sentry BEFORE any other imports (Sentry ESM pattern)
import './instrument';

import app from './app';
import { connectDatabase, syncDatabase } from './config/database';
import { config } from './config/env';
import { initModels } from './models';
import { achievementService } from './services/AchievementService';

// Auto-seed function
async function autoSeed(): Promise<void> {
  try {
    const { User, Product, CommissionConfig, UserClosure } = require('./models');
    const bcrypt = require('bcryptjs');

    // Check if users exist
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('✅ Database already seeded (' + userCount + ' users)');
      return;
    }

    console.log('🌱 Database empty - running auto-seed...');

    // Seed commission configs
    const businessTypes = ['suscripcion', 'producto', 'membresia', 'servicio', 'otro'];
    const levels = ['direct', 'level_1', 'level_2', 'level_3', 'level_4'];
    const defaultRates: Record<string, Record<string, number>> = {
      suscripcion: { direct: 0.2, level_1: 0.1, level_2: 0.08, level_3: 0.05, level_4: 0.03 },
      producto: { direct: 0.15, level_1: 0.08, level_2: 0.05, level_3: 0.03, level_4: 0.02 },
      membresia: { direct: 0.25, level_1: 0.12, level_2: 0.08, level_3: 0.05, level_4: 0.03 },
      servicio: { direct: 0.18, level_1: 0.1, level_2: 0.06, level_3: 0.04, level_4: 0.02 },
      otro: { direct: 0.1, level_1: 0.05, level_2: 0.03, level_3: 0.02, level_4: 0.01 },
    };

    for (const bType of businessTypes) {
      for (const level of levels) {
        await CommissionConfig.create({
          businessType: bType,
          level: level,
          percentage: defaultRates[bType]?.[level] || 0.05,
          isActive: true,
        });
      }
    }
    console.log('  ✅ Commission configs seeded');

    // Seed products
    const products = [
      {
        id: '00000000-0000-0000-0000-000000000101',
        name: 'Netflix Premium',
        description:
          'Enjoy unlimited access to thousands of TV shows, movies, and original content. Stream in 4K Ultra HD.',
        platform: 'netflix',
        price: 22.99,
        currency: 'USD',
        durationDays: 30,
        isActive: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000102',
        name: 'Spotify Premium',
        description: 'Ad-free music streaming with offline downloads and high-quality audio.',
        platform: 'spotify',
        price: 10.99,
        currency: 'USD',
        durationDays: 30,
        isActive: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000103',
        name: 'Disney+ Bundle',
        description:
          'Get Disney+, Pixar, Marvel, Star Wars, and National Geographic. Family-friendly content.',
        platform: 'disney_plus',
        price: 14.99,
        currency: 'USD',
        durationDays: 30,
        isActive: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000104',
        name: 'HBO Max',
        description:
          'Stream HBO originals, Warner Bros. movies, and DC Universe content. Ad-free streaming.',
        platform: 'hbo_max',
        price: 15.99,
        currency: 'USD',
        durationDays: 30,
        isActive: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000105',
        name: 'Amazon Prime',
        description: 'Prime Video, free shipping, Prime Music, and exclusive deals.',
        platform: 'amazon_prime',
        price: 14.99,
        currency: 'USD',
        durationDays: 30,
        isActive: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000106',
        name: 'YouTube Premium',
        description:
          'Ad-free YouTube, YouTube Music Premium, background play, and offline downloads.',
        platform: 'youtube_premium',
        price: 13.99,
        currency: 'USD',
        durationDays: 30,
        isActive: true,
      },
    ];

    for (const prod of products) {
      await Product.create(prod);
      console.log('  ✅ Created product: ' + prod.name);
    }

    // Seed admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@mlm.com',
      passwordHash: hashedPassword,
      referralCode: 'MLM-ADMIN-001',
      level: 1,
      status: 'active',
      role: 'admin',
      currency: 'USD',
    });
    await UserClosure.create({ ancestorId: admin.id, descendantId: admin.id, depth: 0 });
    console.log('  ✅ Created admin: admin@mlm.com');

    // Seed test users
    const users = [
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'user1@mlm.com',
        referralCode: 'MLM-001-002',
        sponsorId: admin.id,
        position: 'left',
        level: 2,
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'user2@mlm.com',
        referralCode: 'MLM-002-003',
        sponsorId: admin.id,
        position: 'right',
        level: 2,
      },
    ];

    for (const u of users) {
      const user = await User.create({
        id: u.id,
        email: u.email,
        passwordHash: hashedPassword,
        referralCode: u.referralCode,
        sponsorId: u.sponsorId,
        position: u.position,
        level: u.level,
        status: 'active',
        role: 'user',
        currency: 'USD',
      });
      await UserClosure.create({ ancestorId: user.id, descendantId: user.id, depth: 0 });
      // Add closure for sponsor
      const sponsorClosures = await UserClosure.findAll({ where: { descendantId: u.sponsorId } });
      for (const closure of sponsorClosures) {
        await UserClosure.create({
          ancestorId: closure.ancestorId,
          descendantId: user.id,
          depth: closure.depth + 1,
        });
      }
      console.log('  ✅ Created user: ' + u.email);
    }

    console.log('');
    console.log('📋 Test Credentials:');
    console.log('   Admin: admin@mlm.com / admin123');
    console.log('   Users: user1@mlm.com, user2@mlm.com / admin123');
    console.log('');
  } catch (error) {
    console.error('❌ Auto-seed failed:', error);
  }
}

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    initModels();

    // Sync database schema on startup (safe - only alters, doesn't drop)
    const forceSync = process.argv.includes('--force-sync');
    if (forceSync) {
      await syncDatabase(true);
      console.log('⚠️  Database synced with force=true (drop tables)');
    } else {
      await syncDatabase(false);
      console.log('✅ Database schema synced (alter mode)');
    }

    // Auto-seed if database is empty
    await autoSeed();

    // Seed achievements (idempotent — safe on every restart)
    achievementService.seedAchievements().catch((err) => console.error('[Achievements seed]', err));

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
