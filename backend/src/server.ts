// Instrument Sentry BEFORE any other imports (Sentry ESM pattern)
import './instrument';

import app from './app';
import { connectDatabase, syncDatabase } from './config/database';
import { config } from './config/env';
import { logger } from './utils/logger';
import { initModels, User, Product, CommissionConfig, UserClosure } from './models';
import { achievementService } from './services/AchievementService';
import bcrypt from 'bcryptjs';

/**
 * Auto-seed de Nexo Real — corre solo si la DB está vacía.
 * Nexo Real auto-seed — runs only when the DB is empty.
 *
 * Crea el árbol Unilevel mínimo con super_admin + admin + un asesor + un usuario,
 * más los productos de servicios colombianos y las configs de comisión.
 *
 * Creates the minimal Unilevel tree with super_admin + admin + one advisor + one user,
 * plus Colombian service products and commission configs.
 */
async function autoSeed(): Promise<void> {
  try {
    // Verificar si ya hay datos / Check if data already exists
    const userCount = await User.count();
    if (userCount > 0) {
      logger.info({ userCount }, 'Database already seeded');
      return;
    }

    logger.info('Database empty — running Nexo Real auto-seed...');

    // ── Comisiones / Commission configs ─────────────────────────────────────
    const commissionData: Array<{
      businessType: 'servicio' | 'otro';
      customBusinessName: string;
      rates: Record<'direct' | 'level_1' | 'level_2' | 'level_3' | 'level_4', number>;
    }> = [
      {
        businessType: 'servicio',
        customBusinessName: 'arrendamiento',
        rates: { direct: 0.05, level_1: 0.03, level_2: 0.02, level_3: 0.01, level_4: 0.005 },
      },
      {
        businessType: 'otro',
        customBusinessName: 'venta_inmueble',
        rates: { direct: 0.03, level_1: 0.015, level_2: 0.01, level_3: 0.005, level_4: 0.002 },
      },
      {
        businessType: 'servicio',
        customBusinessName: 'property_management',
        rates: { direct: 0.08, level_1: 0.04, level_2: 0.025, level_3: 0.015, level_4: 0.005 },
      },
      {
        businessType: 'otro',
        customBusinessName: 'tour_turistico',
        rates: { direct: 0.1, level_1: 0.05, level_2: 0.03, level_3: 0.015, level_4: 0.005 },
      },
      {
        businessType: 'otro',
        customBusinessName: 'hospitalidad',
        rates: { direct: 0.07, level_1: 0.035, level_2: 0.02, level_3: 0.01, level_4: 0.005 },
      },
    ];

    const levels = ['direct', 'level_1', 'level_2', 'level_3', 'level_4'] as const;

    for (const cfg of commissionData) {
      for (const level of levels) {
        await CommissionConfig.create({
          businessType: cfg.businessType,
          customBusinessName: cfg.customBusinessName,
          level,
          percentage: cfg.rates[level],
          isActive: true,
        });
      }
    }
    logger.info('Commission configs seeded (5 types × 5 levels)');

    // ── Productos / Products ─────────────────────────────────────────────────
    const products: Array<{
      id: string;
      name: string;
      description: string;
      platform: 'other';
      price: number;
      currency: string;
      durationDays: number;
      isActive: boolean;
      type: 'service';
      isDigital: boolean;
      metadata: Record<string, unknown>;
    }> = [
      {
        id: '00000000-0000-0000-0000-000000000101',
        name: 'Arriendo Apartamento — El Poblado, Medellín',
        description:
          'Gestión integral de arriendo para apartamento en El Poblado, Medellín. ' +
          'Full rental management for apartment in El Poblado, Medellín.',
        platform: 'other',
        price: 3_500_000,
        currency: 'COP',
        durationDays: 30,
        isActive: true,
        type: 'service',
        isDigital: true,
        metadata: {
          city: 'Medellín',
          zone: 'El Poblado',
          category: 'arrendamiento',
          country: 'CO',
        },
      },
      {
        id: '00000000-0000-0000-0000-000000000102',
        name: 'Asesoría Venta Inmueble — Chapinero, Bogotá',
        description:
          'Asesoría completa para venta de inmueble en Chapinero, Bogotá. ' +
          'Complete advisory for property sale in Chapinero, Bogotá.',
        platform: 'other',
        price: 8_000_000,
        currency: 'COP',
        durationDays: 90,
        isActive: true,
        type: 'service',
        isDigital: true,
        metadata: { city: 'Bogotá', zone: 'Chapinero', category: 'venta_inmueble', country: 'CO' },
      },
      {
        id: '00000000-0000-0000-0000-000000000103',
        name: 'Property Management Premium — Laureles, Medellín',
        description:
          'Administración total de propiedad en Laureles, Medellín. ' +
          'Full property management in Laureles, Medellín.',
        platform: 'other',
        price: 1_800_000,
        currency: 'COP',
        durationDays: 30,
        isActive: true,
        type: 'service',
        isDigital: true,
        metadata: {
          city: 'Medellín',
          zone: 'Laureles',
          category: 'property_management',
          country: 'CO',
        },
      },
      {
        id: '00000000-0000-0000-0000-000000000104',
        name: 'Tour Histórico — Ciudad Amurallada, Cartagena',
        description:
          'Tour guiado por la Ciudad Amurallada de Cartagena con guía bilingüe. ' +
          "Guided tour through Cartagena's Walled City with bilingual guide.",
        platform: 'other',
        price: 180_000,
        currency: 'COP',
        durationDays: 1,
        isActive: true,
        type: 'service',
        isDigital: false,
        metadata: {
          city: 'Cartagena',
          zone: 'Ciudad Amurallada',
          category: 'tour_turistico',
          country: 'CO',
        },
      },
      {
        id: '00000000-0000-0000-0000-000000000105',
        name: 'Paquete Buceo — San Andrés Isla',
        description:
          'Paquete de buceo en San Andrés: 2 inmersiones y equipo completo incluidos. ' +
          'Diving package in San Andrés: 2 guided dives and full equipment included.',
        platform: 'other',
        price: 420_000,
        currency: 'COP',
        durationDays: 3,
        isActive: true,
        type: 'service',
        isDigital: false,
        metadata: {
          city: 'San Andrés',
          zone: 'La Piscinita',
          category: 'tour_turistico',
          country: 'CO',
        },
      },
      {
        id: '00000000-0000-0000-0000-000000000106',
        name: 'Alojamiento Boutique — Getsemaní, Cartagena',
        description:
          'Hospedaje en hotel boutique en Getsemaní. Desayuno y concierge incluidos. ' +
          'Boutique hotel stay in Getsemaní. Breakfast and concierge included.',
        platform: 'other',
        price: 320_000,
        currency: 'COP',
        durationDays: 1,
        isActive: true,
        type: 'service',
        isDigital: false,
        metadata: { city: 'Cartagena', zone: 'Getsemaní', category: 'hospitalidad', country: 'CO' },
      },
    ];

    for (const prod of products) {
      await Product.create(prod);
      logger.info({ product: prod.name }, 'Created product');
    }

    // ── Árbol Unilevel mínimo / Minimal Unilevel tree ────────────────────────
    const hashedPassword = await bcrypt.hash('Nexo2024!', 10);

    /** Crea usuario + entradas de closure / Creates user + closure entries */
    async function createUserWithClosure(
      id: string,
      email: string,
      referralCode: string,
      role: string,
      sponsorId: string | null,
      level: number
    ): Promise<User> {
      const user = await User.create({
        id,
        email,
        passwordHash: hashedPassword,
        referralCode,
        sponsorId,
        position: null, // Unilevel — sin posición binaria / no binary position
        level,
        status: 'active',
        role,
        currency: 'COP',
      });
      await UserClosure.create({ ancestorId: user.id, descendantId: user.id, depth: 0 });
      if (sponsorId) {
        const sponsorClosures = await UserClosure.findAll({ where: { descendantId: sponsorId } });
        for (const closure of sponsorClosures) {
          await UserClosure.create({
            ancestorId: closure.ancestorId,
            descendantId: user.id,
            depth: closure.depth + 1,
          });
        }
      }
      logger.info({ role, email }, 'Created user');
      return user;
    }

    const superAdmin = await createUserWithClosure(
      '00000000-0000-0000-0000-000000000001',
      'superadmin@nexoreal.xyz',
      'NXR-SA-001',
      'super_admin',
      null,
      1
    );

    const admin = await createUserWithClosure(
      '00000000-0000-0000-0000-000000000002',
      'admin@nexoreal.xyz',
      'NXR-AD-002',
      'admin',
      superAdmin.id,
      2
    );

    const advisor = await createUserWithClosure(
      '00000000-0000-0000-0000-000000000003',
      'valentina.ospina@nexoreal.xyz',
      'NXR-AV-003',
      'advisor',
      admin.id,
      3
    );

    await createUserWithClosure(
      '00000000-0000-0000-0000-000000000004',
      'andres.martinez@nexoreal.xyz',
      'NXR-US-004',
      'user',
      advisor.id,
      4
    );

    await createUserWithClosure(
      '00000000-0000-0000-0000-000000000005',
      'invitado@nexoreal.xyz',
      'NXR-GT-005',
      'guest',
      null,
      1
    );

    logger.info('Nexo Real — Test Credentials:');
    logger.info('  superadmin@nexoreal.xyz  /  Nexo2024!  (super_admin)');
    logger.info('  admin@nexoreal.xyz       /  Nexo2024!  (admin)');
    logger.info('  valentina.ospina@...     /  Nexo2024!  (advisor)');
    logger.info('  andres.martinez@...      /  Nexo2024!  (user)');
    logger.info('  invitado@nexoreal.xyz    /  Nexo2024!  (guest)');
  } catch (error) {
    logger.error({ err: error }, 'Auto-seed failed');
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
      logger.warn('Database synced with force=true (drop tables)');
    } else {
      await syncDatabase(false);
      logger.info('Database schema synced (alter mode)');
    }

    // Auto-seed if database is empty
    await autoSeed();

    // Seed achievements (idempotent — safe on every restart)
    achievementService
      .seedAchievements()
      .catch((err) => logger.error({ err }, 'Achievements seed failed'));

    app.listen(config.port, () => {
      logger.info(
        {
          environment: config.nodeEnv,
          port: config.port,
          database: config.db.name,
          frontend: config.app.frontendUrl,
        },
        'Nexo Real — Backend Server started'
      );
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
