import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, syncDatabase } from './config/database';
import { initModels, User, UserClosure, CommissionConfig, Product } from './models';
import { hashPassword } from './services/AuthService';

/**
 * Helper to create user with closure entries
 */
async function createUser(
  id: string,
  email: string,
  password: string,
  referralCode: string,
  sponsorId: string | null,
  position: 'left' | 'right',
  level: number
): Promise<User> {
  const passwordHash = await hashPassword(password);

  const user = await User.create({
    id,
    email,
    passwordHash,
    referralCode,
    sponsorId,
    position,
    level,
    status: 'active',
    role: 'user',
    currency: 'USD',
  });

  // Self-reference closure
  await UserClosure.create({
    ancestorId: user.id,
    descendantId: user.id,
    depth: 0,
  });

  // Ancestor closures (all ancestors up the tree)
  if (sponsorId) {
    // Get all ancestors of the sponsor
    const sponsorClosures = await UserClosure.findAll({
      where: { descendantId: sponsorId },
    });

    // Create closure entries for each ancestor
    for (const closure of sponsorClosures) {
      await UserClosure.create({
        ancestorId: closure.ancestorId,
        descendantId: user.id,
        depth: closure.depth + 1,
      });
    }
  }

  console.log(`✅ Created ${email} (level ${level}, ${position})`);
  return user;
}

/**
 * Seed default commission configurations
 */
async function seedCommissionConfigs(): Promise<void> {
  const businessTypes = ['suscripcion', 'producto', 'membresia', 'servicio', 'otro'];
  const levels = ['direct', 'level_1', 'level_2', 'level_3', 'level_4'];

  // Default rates for each business type
  const defaultRates: Record<string, Record<string, number>> = {
    suscripcion: {
      direct: 0.2, // 20%
      level_1: 0.1, // 10%
      level_2: 0.08, // 8%
      level_3: 0.05, // 5%
      level_4: 0.03, // 3%
    },
    producto: {
      direct: 0.15, // 15%
      level_1: 0.08, // 8%
      level_2: 0.05, // 5%
      level_3: 0.03, // 3%
      level_4: 0.02, // 2%
    },
    membresia: {
      direct: 0.25, // 25%
      level_1: 0.12, // 12%
      level_2: 0.08, // 8%
      level_3: 0.05, // 5%
      level_4: 0.03, // 3%
    },
    servicio: {
      direct: 0.18, // 18%
      level_1: 0.1, // 10%
      level_2: 0.06, // 6%
      level_3: 0.04, // 4%
      level_4: 0.02, // 2%
    },
    otro: {
      direct: 0.1, // 10%
      level_1: 0.05, // 5%
      level_2: 0.03, // 3%
      level_3: 0.02, // 2%
      level_4: 0.01, // 1%
    },
  };

  for (const businessType of businessTypes) {
    for (const level of levels) {
      const exists = await CommissionConfig.findOne({
        where: { businessType: businessType as any, level: level as any },
      });

      if (!exists) {
        await CommissionConfig.create({
          businessType: businessType as any,
          level: level as any,
          percentage: defaultRates[businessType]?.[level] || 0.05,
          isActive: true,
        });
        console.log(`  ✅ Created ${businessType} - ${level}`);
      }
    }
  }

  console.log('\n✅ Commission configs seeded');
}

/**
 * Seed default products for landing pages
 */
async function seedProducts(): Promise<void> {
  const products = [
    {
      id: '00000000-0000-0000-0000-000000000101',
      name: 'Netflix Premium',
      description:
        'Enjoy unlimited access to thousands of TV shows, movies, and original content. Stream in 4K Ultra HD on multiple devices.',
      platform: 'netflix' as const,
      price: 22.99,
      currency: 'USD',
      durationDays: 30,
      isActive: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000102',
      name: 'Spotify Premium',
      description:
        'Ad-free music streaming with offline downloads and high-quality audio. Access to exclusive podcasts and playlists.',
      platform: 'spotify' as const,
      price: 10.99,
      currency: 'USD',
      durationDays: 30,
      isActive: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000103',
      name: 'Disney+ Bundle',
      description:
        'Get Disney+, Pixar, Marvel, Star Wars, and National Geographic. Family-friendly content for everyone.',
      platform: 'disney_plus' as const,
      price: 14.99,
      currency: 'USD',
      durationDays: 30,
      isActive: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000104',
      name: 'HBO Max',
      description:
        'Stream HBO originals, Warner Bros. movies, and DC Universe content. Ad-free streaming experience.',
      platform: 'hbo_max' as const,
      price: 15.99,
      currency: 'USD',
      durationDays: 30,
      isActive: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000105',
      name: 'Amazon Prime',
      description:
        'Prime Video, free shipping, Prime Music, and exclusive deals. Complete Amazon ecosystem membership.',
      platform: 'amazon_prime' as const,
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
      platform: 'youtube_premium' as const,
      price: 13.99,
      currency: 'USD',
      durationDays: 30,
      isActive: true,
    },
  ];

  for (const product of products) {
    const exists = await Product.findByPk(product.id);
    if (!exists) {
      await Product.create(product);
      console.log(`  ✅ Created product: ${product.name}`);
    } else {
      console.log(`  ⏭️  Product already exists: ${product.name}`);
    }
  }

  console.log('\n✅ Products seeded');
}

async function seed(): Promise<void> {
  try {
    await connectDatabase();
    initModels();
    await syncDatabase(true);

    // Seed commission configs first
    await seedCommissionConfigs();

    // Seed products for landing pages
    await seedProducts();

    // Create admin
    const adminPassword = await hashPassword('admin123');
    const admin = await User.create({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@mlm.com',
      passwordHash: adminPassword,
      referralCode: 'MLM-ADMIN-001',
      level: 1,
      status: 'active',
      role: 'admin',
      currency: 'USD',
    });

    // Admin closure (self)
    await UserClosure.create({
      ancestorId: admin.id,
      descendantId: admin.id,
      depth: 0,
    });

    console.log('✅ Created admin:', admin.email, '- Code:', admin.referralCode);

    // Level 1 - Direct referrals of admin
    const user1 = await createUser(
      '00000000-0000-0000-0000-000000000002',
      'user1@mlm.com',
      'user123',
      'MLM-001-002',
      admin.id,
      'left',
      1
    );

    const user2 = await createUser(
      '00000000-0000-0000-0000-000000000003',
      'user2@mlm.com',
      'user123',
      'MLM-002-003',
      admin.id,
      'right',
      1
    );

    // Level 2 - Referrals of user1 (left side)
    const user3 = await createUser(
      '00000000-0000-0000-0000-000000000004',
      'user3@mlm.com',
      'user123',
      'MLM-003-004',
      user1.id,
      'left',
      2
    );

    const user4 = await createUser(
      '00000000-0000-0000-0000-000000000005',
      'user4@mlm.com',
      'user123',
      'MLM-004-005',
      user1.id,
      'right',
      2
    );

    // Level 2 - Referrals of user2 (right side)
    const user5 = await createUser(
      '00000000-0000-0000-0000-000000000006',
      'user5@mlm.com',
      'user123',
      'MLM-005-006',
      user2.id,
      'left',
      2
    );

    const user6 = await createUser(
      '00000000-0000-0000-0000-000000000007',
      'user6@mlm.com',
      'user123',
      'MLM-006-007',
      user2.id,
      'right',
      2
    );

    // Level 3 - More referrals for a fuller tree
    await createUser(
      '00000000-0000-0000-0000-000000000008',
      'user7@mlm.com',
      'user123',
      'MLM-007-008',
      user3.id,
      'left',
      3
    );

    await createUser(
      '00000000-0000-0000-0000-000000000009',
      'user8@mlm.com',
      'user123',
      'MLM-008-009',
      user4.id,
      'left',
      3
    );

    await createUser(
      '00000000-0000-0000-0000-000000000010',
      'user9@mlm.com',
      'user123',
      'MLM-009-010',
      user5.id,
      'right',
      3
    );

    await createUser(
      '00000000-0000-0000-0000-000000000011',
      'user10@mlm.com',
      'user123',
      'MLM-010-011',
      user6.id,
      'right',
      3
    );

    console.log('\n✅ Closure table populated with multi-level referrals');
    console.log('\n📋 Tree Structure:');
    console.log('   Admin (root)');
    console.log('   ├── Level 1 - Left: user1');
    console.log('   │   ├── Level 2 - Left: user3');
    console.log('   │   │   └── Level 3 - Left: user7');
    console.log('   │   └── Level 2 - Right: user4');
    console.log('   │       └── Level 3 - Left: user8');
    console.log('   └── Level 1 - Right: user2');
    console.log('       ├── Level 2 - Left: user5');
    console.log('       │   └── Level 3 - Right: user9');
    console.log('       └── Level 2 - Right: user6');
    console.log('           └── Level 3 - Right: user10');

    console.log('\n📋 Test Credentials:');
    console.log('   Admin: admin@mlm.com / admin123 (root - 10 referrals)');
    console.log('   All users: user123');
    console.log('');
    console.log('   To test different tree levels, login as any user:');
    console.log('   - user1@mlm.com → 2 referrals');
    console.log('   - user2@mlm.com → 2 referrals');
    console.log('   - user3@mlm.com → 1 referral');
    console.log('   - etc.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
