import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, syncDatabase } from './config/database';
import { initModels, User } from './models';
import { hashPassword } from './services/AuthService';

async function seed(): Promise<void> {
  try {
    await connectDatabase();
    initModels();
    await syncDatabase(true);

    const adminPassword = await hashPassword('admin123');
    const user1Password = await hashPassword('user123');
    const user2Password = await hashPassword('user123');

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
    console.log(
      '✅ Created admin:',
      admin.email,
      '- Code:',
      admin.referralCode,
      '- Role:',
      admin.role
    );

    const user1 = await User.create({
      id: '00000000-0000-0000-0000-000000000002',
      email: 'user1@mlm.com',
      passwordHash: user1Password,
      referralCode: 'MLM-USER1-002',
      sponsorId: admin.id,
      position: 'left',
      level: 1,
      status: 'active',
      role: 'user',
      currency: 'USD',
    });
    console.log('✅ Created user1:', user1.email, '- Code:', user1.referralCode);

    const user2 = await User.create({
      id: '00000000-0000-0000-0000-000000000003',
      email: 'user2@mlm.com',
      passwordHash: user2Password,
      referralCode: 'MLM-USER2-003',
      sponsorId: admin.id,
      position: 'right',
      level: 1,
      status: 'active',
      role: 'user',
      currency: 'USD',
    });
    console.log('✅ Created user2:', user2.email, '- Code:', user2.referralCode);

    console.log('\n📋 Test Credentials:');
    console.log('   Admin: admin@mlm.com / admin123');
    console.log('   User1: user1@mlm.com / user123');
    console.log('   User2: user2@mlm.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
