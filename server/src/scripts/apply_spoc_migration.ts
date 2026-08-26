import { prisma } from '../config/database';

async function main() {
  console.log('🔄 Applying SPOC migration to database...');

  // 1. Add isSpoc column if not exists
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "isSpoc" BOOLEAN NOT NULL DEFAULT false;
  `);
  console.log('✅ Column "isSpoc" added/verified on table "students".');

  // 2. Create indexes
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "students_isSpoc_idx" ON "students"("isSpoc");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "students_isSpoc_zoneId_idx" ON "students"("isSpoc", "zoneId");
  `);
  console.log('✅ Indexes "students_isSpoc_idx" and "students_isSpoc_zoneId_idx" created/verified.');

  // 3. Check existing records
  const total = await prisma.student.count();
  const spocCount = await prisma.student.count({ where: { isSpoc: true } });
  const nonSpocCount = await prisma.student.count({ where: { isSpoc: false } });

  console.log(`📊 Migration Status: Total Students: ${total}, SPOCs: ${spocCount}, Non-SPOCs: ${nonSpocCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
