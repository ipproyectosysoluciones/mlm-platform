/**
 * @fileoverview Seed Script - Datos iniciales para Nexo Real
 * @description Pobla la base de datos con usuarios demo, productos de servicios
 *              inmobiliarios/turísticos colombianos y configuraciones de comisiones.
 *              Árbol Unilevel (sin posición left/right).
 *
 * @description Populates the database with demo users, Colombian real estate /
 *              tourism service products, and commission configurations.
 *              Unilevel tree (no left/right position).
 *
 * @module seed
 * @author Nexo Real Development Team
 * @version 2.4.0
 *
 * @example
 * // ES: Ejecutar seed
 * pnpm --filter backend seed
 *
 * // EN: Run seed
 * pnpm --filter backend seed
 */

import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, syncDatabase } from './config/database';
import { initModels, User, UserClosure, CommissionConfig, Product } from './models';
import { hashPassword } from './services/AuthService';

// ─── Tipos auxiliares ─────────────────────────────────────────────────────────

/** IDs fijos para reproducibilidad del seed / Fixed IDs for seed reproducibility */
const SEED_IDS = {
  // Usuarios / Users
  SUPER_ADMIN: '00000000-0000-0000-0000-000000000001',
  ADMIN: '00000000-0000-0000-0000-000000000002',
  FINANCE: '00000000-0000-0000-0000-000000000003',
  SALES: '00000000-0000-0000-0000-000000000004',
  ADVISOR_1: '00000000-0000-0000-0000-000000000005',
  ADVISOR_2: '00000000-0000-0000-0000-000000000006',
  VENDOR_1: '00000000-0000-0000-0000-000000000007',
  VENDOR_2: '00000000-0000-0000-0000-000000000008',
  USER_1: '00000000-0000-0000-0000-000000000009',
  USER_2: '00000000-0000-0000-0000-000000000010',
  USER_3: '00000000-0000-0000-0000-000000000011',
  GUEST: '00000000-0000-0000-0000-000000000012',
  // Productos / Products
  PROD_ARRIENDO_MDE: '00000000-0000-0000-0000-000000000101',
  PROD_VENTA_BOG: '00000000-0000-0000-0000-000000000102',
  PROD_PROP_MGMT: '00000000-0000-0000-0000-000000000103',
  PROD_TOUR_CTG: '00000000-0000-0000-0000-000000000104',
  PROD_TOUR_SAI: '00000000-0000-0000-0000-000000000105',
  PROD_HOSPITALIDAD: '00000000-0000-0000-0000-000000000106',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Crea un usuario y registra sus entradas en la tabla de cierre (Unilevel).
 * Creates a user and registers its entries in the closure table (Unilevel).
 *
 * @param id          - UUID fijo / Fixed UUID
 * @param email       - Correo del usuario / User email
 * @param password    - Contraseña en texto plano / Plain-text password
 * @param referralCode - Código de referido / Referral code
 * @param role        - Rol RBAC del usuario / User RBAC role
 * @param sponsorId   - ID del sponsor directo (null para raíz) / Direct sponsor ID (null for root)
 * @param level       - Nivel en el árbol unilevel / Level in unilevel tree
 * @param currency    - Moneda preferida / Preferred currency
 */
async function createUser(
  id: string,
  email: string,
  password: string,
  referralCode: string,
  role: User['role'],
  sponsorId: string | null,
  level: number,
  currency: 'USD' | 'COP' | 'MXN' = 'COP'
): Promise<User> {
  const passwordHash = await hashPassword(password);

  const user = await User.create({
    id,
    email,
    passwordHash,
    referralCode,
    sponsorId,
    position: null, // Unilevel — sin posición binaria / no binary position
    level,
    status: 'active',
    role,
    currency,
  });

  // Auto-referencia (depth 0) / Self-reference (depth 0)
  await UserClosure.create({
    ancestorId: user.id,
    descendantId: user.id,
    depth: 0,
  });

  // Cierres ancestrales / Ancestor closures
  if (sponsorId) {
    const sponsorClosures = await UserClosure.findAll({
      where: { descendantId: sponsorId },
    });

    for (const closure of sponsorClosures) {
      await UserClosure.create({
        ancestorId: closure.ancestorId,
        descendantId: user.id,
        depth: closure.depth + 1,
      });
    }
  }

  console.log(`  ✅ [${role.padEnd(11)}] ${email}  (nivel ${level})`);
  return user;
}

// ─── Comisiones ───────────────────────────────────────────────────────────────

/**
 * Seed de configuraciones de comisiones para servicios de Nexo Real.
 * Seed commission configurations for Nexo Real services.
 *
 * Tipos de negocio / Business types:
 *   - arrendamiento : Gestión y comisión por alquiler de propiedades
 *   - venta         : Comisión por venta de inmuebles
 *   - servicio      : Property management, consultoría
 *   - otro          : Tours, hospitalidad, paquetes turísticos
 */
async function seedCommissionConfigs(): Promise<void> {
  console.log('\n📊 Seeding commission configs...');

  /**
   * Tasas de comisión por tipo de negocio y nivel Unilevel.
   * Commission rates by business type and Unilevel level.
   *
   * Nexo Real model (5 levels):
   *   direct  → referido directo / direct referral
   *   level_1 → 2do nivel / 2nd level
   *   level_2 → 3er nivel / 3rd level
   *   level_3 → 4to nivel / 4th level
   *   level_4 → 5to nivel / 5th level
   */
  const commissionMatrix: Array<{
    businessType: 'suscripcion' | 'producto' | 'membresia' | 'servicio' | 'otro';
    customBusinessName?: string;
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

  for (const config of commissionMatrix) {
    for (const level of levels) {
      const exists = await CommissionConfig.findOne({
        where: { businessType: config.businessType, level },
      });

      if (!exists) {
        await CommissionConfig.create({
          businessType: config.businessType,
          customBusinessName: config.customBusinessName,
          level,
          percentage: config.rates[level],
          isActive: true,
        });
        console.log(
          `  ✅ ${(config.customBusinessName ?? config.businessType).padEnd(22)} › ${level}`
        );
      }
    }
  }

  console.log('✅ Commission configs seeded');
}

// ─── Productos ────────────────────────────────────────────────────────────────

/**
 * Seed de productos/servicios inmobiliarios y turísticos colombianos.
 * Seed of Colombian real estate and tourism products/services.
 */
async function seedProducts(): Promise<void> {
  console.log('\n🏠 Seeding products (Nexo Real services)...');

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
      id: SEED_IDS.PROD_ARRIENDO_MDE,
      name: 'Arriendo Apartamento — El Poblado, Medellín',
      description:
        'Gestión integral de arriendo para apartamento en El Poblado, Medellín. ' +
        'Incluye estudio de inquilinos, contrato, cobro y soporte 24/7. ' +
        'Full rental management for apartment in El Poblado, Medellín. ' +
        'Includes tenant screening, contract, collection and 24/7 support.',
      platform: 'other',
      price: 3_500_000,
      currency: 'COP',
      durationDays: 30,
      isActive: true,
      type: 'service',
      isDigital: true,
      metadata: { city: 'Medellín', zone: 'El Poblado', category: 'arrendamiento', country: 'CO' },
    },
    {
      id: SEED_IDS.PROD_VENTA_BOG,
      name: 'Asesoría Venta Inmueble — Chapinero, Bogotá',
      description:
        'Asesoría completa para venta de inmueble en Chapinero, Bogotá. ' +
        'Avalúo, publicación, negociación y cierre notarial incluidos. ' +
        'Complete advisory for property sale in Chapinero, Bogotá. ' +
        'Appraisal, listing, negotiation and notarial closing included.',
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
      id: SEED_IDS.PROD_PROP_MGMT,
      name: 'Property Management Premium — Laureles, Medellín',
      description:
        'Administración total de propiedad en Laureles, Medellín. ' +
        'Mantenimiento preventivo, gestión de proveedores y reportes mensuales. ' +
        'Full property management in Laureles, Medellín. ' +
        'Preventive maintenance, vendor management and monthly reports.',
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
      id: SEED_IDS.PROD_TOUR_CTG,
      name: 'Tour Histórico — Ciudad Amurallada, Cartagena',
      description:
        'Tour guiado por la Ciudad Amurallada de Cartagena. ' +
        'Incluye guía bilingüe, entrada a museos y transporte interno. ' +
        "Guided tour through Cartagena's Walled City. " +
        'Includes bilingual guide, museum entry and local transport.',
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
      id: SEED_IDS.PROD_TOUR_SAI,
      name: 'Paquete Buceo — San Andrés Isla',
      description:
        'Paquete de buceo en San Andrés Isla: 2 inmersiones guiadas, equipo completo ' +
        'y certificación básica PADI incluida. ' +
        'Diving package in San Andrés Island: 2 guided dives, full equipment ' +
        'and basic PADI certification included.',
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
      id: SEED_IDS.PROD_HOSPITALIDAD,
      name: 'Alojamiento Boutique — Getsemaní, Cartagena',
      description:
        'Hospedaje en hotel boutique en el barrio Getsemaní, Cartagena. ' +
        'Desayuno incluido, piscina y concierge para tours personalizados. ' +
        'Boutique hotel stay in Getsemaní neighborhood, Cartagena. ' +
        'Breakfast included, pool and concierge for custom tours.',
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

  for (const product of products) {
    const exists = await Product.findByPk(product.id);
    if (!exists) {
      await Product.create(product);
      console.log(`  ✅ ${product.name}`);
    } else {
      console.log(`  ⏭️  Ya existe: ${product.name}`);
    }
  }

  console.log('✅ Products seeded');
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────

/**
 * Seed del árbol de usuarios Unilevel de Nexo Real.
 * Seed of Nexo Real's Unilevel user tree.
 *
 * Árbol / Tree:
 *
 *   super_admin (raíz)
 *   └── admin
 *       ├── finance
 *       ├── sales
 *       │   ├── advisor_1
 *       │   │   ├── user_1
 *       │   │   └── user_2
 *       │   └── advisor_2
 *       │       └── user_3
 *       └── vendor_1
 *           └── vendor_2
 *   + guest (sin sponsor — invitado sin red)
 */
async function seedUsers(): Promise<void> {
  console.log('\n👥 Seeding users (Nexo Real — datos colombianos)...');

  // Nivel 0 — raíz del sistema / System root
  const superAdmin = await createUser(
    SEED_IDS.SUPER_ADMIN,
    'superadmin@nexoreal.com',
    'Nexo2024!',
    'NXR-SA-001',
    'super_admin',
    null,
    1,
    'COP'
  );

  // Nivel 1 — admin general / General admin
  const admin = await createUser(
    SEED_IDS.ADMIN,
    'admin@nexoreal.com',
    'Nexo2024!',
    'NXR-AD-002',
    'admin',
    superAdmin.id,
    2,
    'COP'
  );

  // Nivel 2 — roles operativos bajo admin / Operational roles under admin
  const finance = await createUser(
    SEED_IDS.FINANCE,
    'finanzas@nexoreal.com',
    'Nexo2024!',
    'NXR-FN-003',
    'finance',
    admin.id,
    3,
    'COP'
  );

  const sales = await createUser(
    SEED_IDS.SALES,
    'ventas@nexoreal.com',
    'Nexo2024!',
    'NXR-SL-004',
    'sales',
    admin.id,
    3,
    'COP'
  );

  const vendor1 = await createUser(
    SEED_IDS.VENDOR_1,
    'camilo.restrepo@nexoreal.com',
    'Nexo2024!',
    'NXR-VD-007',
    'vendor',
    admin.id,
    3,
    'COP'
  );

  // Nivel 3 — asesores comerciales bajo ventas / Sales advisors under sales
  const advisor1 = await createUser(
    SEED_IDS.ADVISOR_1,
    'valentina.ospina@nexoreal.com',
    'Nexo2024!',
    'NXR-AV-005',
    'advisor',
    sales.id,
    4,
    'COP'
  );

  const advisor2 = await createUser(
    SEED_IDS.ADVISOR_2,
    'santiago.gomez@nexoreal.com',
    'Nexo2024!',
    'NXR-AV-006',
    'advisor',
    sales.id,
    4,
    'COP'
  );

  const vendor2 = await createUser(
    SEED_IDS.VENDOR_2,
    'isabella.vargas@nexoreal.com',
    'Nexo2024!',
    'NXR-VD-008',
    'vendor',
    vendor1.id,
    4,
    'COP'
  );

  // Nivel 4 — usuarios finales bajo asesores / End users under advisors
  await createUser(
    SEED_IDS.USER_1,
    'andres.martinez@nexoreal.com',
    'usuario123',
    'NXR-US-009',
    'user',
    advisor1.id,
    5,
    'COP'
  );

  await createUser(
    SEED_IDS.USER_2,
    'luisa.fernandez@nexoreal.com',
    'usuario123',
    'NXR-US-010',
    'user',
    advisor1.id,
    5,
    'COP'
  );

  await createUser(
    SEED_IDS.USER_3,
    'miguel.torres@nexoreal.com',
    'usuario123',
    'NXR-US-011',
    'user',
    advisor2.id,
    5,
    'COP'
  );

  // Guest — sin sponsor (invitado registrado via link) / Guest — no sponsor (registered via link)
  await createUser(
    SEED_IDS.GUEST,
    'invitado@nexoreal.com',
    'invitado123',
    'NXR-GT-012',
    'guest',
    null, // sin red / no network
    1,
    'COP'
  );

  // Suprimir advertencia de 'finance' no usado / suppress unused warning
  void finance;

  console.log('\n✅ Árbol Unilevel seeded');
  console.log('\n📋 Estructura del árbol / Tree Structure:');
  console.log('   super_admin (superadmin@nexoreal.com)');
  console.log('   └── admin (admin@nexoreal.com)');
  console.log('       ├── finance (finanzas@nexoreal.com)');
  console.log('       ├── sales (ventas@nexoreal.com)');
  console.log('       │   ├── advisor_1 (valentina.ospina@nexoreal.com)');
  console.log('       │   │   ├── user_1 (andres.martinez@nexoreal.com)');
  console.log('       │   │   └── user_2 (luisa.fernandez@nexoreal.com)');
  console.log('       │   └── advisor_2 (santiago.gomez@nexoreal.com)');
  console.log('       │       └── user_3 (miguel.torres@nexoreal.com)');
  console.log('       └── vendor_1 (camilo.restrepo@nexoreal.com)');
  console.log('           └── vendor_2 (isabella.vargas@nexoreal.com)');
  console.log('   + guest (invitado@nexoreal.com) — sin red');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Función principal de seed.
 * Main seed function.
 *
 * Ejecuta en orden / Runs in order:
 *   1. connectDatabase + initModels + syncDatabase (force=true — limpia tablas)
 *   2. seedCommissionConfigs
 *   3. seedProducts
 *   4. seedUsers
 */
async function seed(): Promise<void> {
  try {
    await connectDatabase();
    initModels();
    await syncDatabase(true); // force=true — limpia y recrea / force=true — cleans and recreates

    await seedCommissionConfigs();
    await seedProducts();
    await seedUsers();

    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║          ✅  Nexo Real — Seed completado                  ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  Credenciales de prueba / Test credentials:               ║');
    console.log('║                                                           ║');
    console.log('║  superadmin@nexoreal.com  /  Nexo2024!  (super_admin)     ║');
    console.log('║  admin@nexoreal.com       /  Nexo2024!  (admin)           ║');
    console.log('║  finanzas@nexoreal.com    /  Nexo2024!  (finance)         ║');
    console.log('║  ventas@nexoreal.com      /  Nexo2024!  (sales)           ║');
    console.log('║  valentina.ospina@...     /  Nexo2024!  (advisor)         ║');
    console.log('║  santiago.gomez@...       /  Nexo2024!  (advisor)         ║');
    console.log('║  camilo.restrepo@...      /  Nexo2024!  (vendor)          ║');
    console.log('║  isabella.vargas@...      /  Nexo2024!  (vendor)          ║');
    console.log('║  andres.martinez@...      /  usuario123 (user)            ║');
    console.log('║  luisa.fernandez@...      /  usuario123 (user)            ║');
    console.log('║  miguel.torres@...        /  usuario123 (user)            ║');
    console.log('║  invitado@nexoreal.com    /  invitado123 (guest)          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
