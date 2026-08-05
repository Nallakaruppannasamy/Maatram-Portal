/**
 * @file src/scripts/seed_super_admin.ts
 * @description Seeds or updates a Super Admin user in the database.
 */

import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

async function seedSuperAdmin() {
  console.log('🌱 Seeding Super Admin user...');

  const email = 'admin@maatram.com';
  const name = 'Super Admin';
  const plainPassword = 'admin@123';

  try {
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        role: 'admin',
        isActive: true,
        isFirstLogin: false,
      },
      create: {
        email,
        passwordHash,
        role: 'admin',
        isActive: true,
        isFirstLogin: false,
      },
    });

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: name,
        designation: 'Super Administrator',
      },
      create: {
        userId: user.id,
        fullName: name,
        designation: 'Super Administrator',
      },
    });

    console.log(`\n✅ Super Admin created/updated successfully!`);
    console.log(`-------------------------------------------`);
    console.log(`  Name    : ${name}`);
    console.log(`  Email   : ${email}`);
    console.log(`  Password: ${plainPassword}`);
    console.log(`  Role    : admin`);
    console.log(`-------------------------------------------\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding Super Admin:', error.message || error);
    process.exit(1);
  }
}

seedSuperAdmin();
