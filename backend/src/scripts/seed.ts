import bcrypt from 'bcryptjs';
import { prisma, disconnectDatabase } from '../config/database';
import { LicenseTier } from '@prisma/client';

async function seed() {
  console.log('🌱 [Seeder] Starting Spoorf Cloud database seeding...');

  const passwordHash = await bcrypt.hash('SpoorfSecret123!', 10);

  // 1. Seed Free User
  const freeUser = await prisma.user.upsert({
    where: { email: 'free@spoorf.app' },
    update: {},
    create: {
      email: 'free@spoorf.app',
      name: 'Free Sentinel Operator',
      passwordHash,
      role: 'user',
      isEmailVerified: true,
      license: {
        create: {
          tier: LicenseTier.FREE,
          maxCuts: 5,
          canThrottle: false,
          canGateway: false,
          canAutoreblock: false,
          canArsenal: false,
          canDeepFingerprint: false,
          cloudSync: false
        }
      }
    },
    include: { license: true }
  });
  console.log('✅ Seeded Free User:', freeUser.email, `(Tier: ${freeUser.license?.tier})`);

  // 2. Seed Pro User
  const proUser = await prisma.user.upsert({
    where: { email: 'pro@spoorf.app' },
    update: {},
    create: {
      email: 'pro@spoorf.app',
      name: 'Pro Sentinel Operator',
      passwordHash,
      role: 'user',
      isEmailVerified: true,
      license: {
        create: {
          tier: LicenseTier.PRO,
          maxCuts: 999,
          canThrottle: true,
          canGateway: true,
          canAutoreblock: true,
          canArsenal: false,
          canDeepFingerprint: true,
          cloudSync: true,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      }
    },
    include: { license: true }
  });
  console.log('✅ Seeded Pro User :', proUser.email, `(Tier: ${proUser.license?.tier})`);

  // 3. Seed VIP Enterprise User
  const vipUser = await prisma.user.upsert({
    where: { email: 'vip@spoorf.app' },
    update: {},
    create: {
      email: 'vip@spoorf.app',
      name: 'VIP Enterprise Operator',
      passwordHash,
      role: 'admin',
      isEmailVerified: true,
      license: {
        create: {
          tier: LicenseTier.VIP,
          maxCuts: 9999,
          canThrottle: true,
          canGateway: true,
          canAutoreblock: true,
          canArsenal: true,
          canDeepFingerprint: true,
          cloudSync: true
        }
      }
    },
    include: { license: true }
  });
  console.log('✅ Seeded VIP User :', vipUser.email, `(Tier: ${vipUser.license?.tier})`);

  // 4. Seed Voucher License Keys
  await prisma.licenseKey.upsert({
    where: { key: 'PRO-SENTINEL-DEV-2026' },
    update: {},
    create: {
      key: 'PRO-SENTINEL-DEV-2026',
      tier: LicenseTier.PRO,
      durationDays: 30,
      isUsed: false
    }
  });

  await prisma.licenseKey.upsert({
    where: { key: 'VIP-SENTINEL-LIFETIME-2026' },
    update: {},
    create: {
      key: 'VIP-SENTINEL-LIFETIME-2026',
      tier: LicenseTier.VIP,
      durationDays: 9999,
      isUsed: false
    }
  });
  console.log('✅ Seeded Demo Voucher Keys: PRO-SENTINEL-DEV-2026 & VIP-SENTINEL-LIFETIME-2026');

  console.log('🎉 [Seeder] Seeding finished successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeder error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDatabase();
  });