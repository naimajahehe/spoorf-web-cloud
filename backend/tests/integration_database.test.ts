import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient, LicenseTier, PaymentStatus } from '@prisma/client';
import { pingDatabase } from '../src/config/database';
import crypto from 'node:crypto';

describe('PostgreSQL Database & Prisma Integration Suite', () => {
  let prismaTest: PrismaClient;
  const testEmail = `test_${Date.now()}@spoorf.app`;
  let createdUserId: string;

  before(async () => {
    // Connect to the test database
    const testUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/spoorf_cloud_test?schema=public';
    prismaTest = new PrismaClient({
      datasources: { db: { url: testUrl } }
    });
  });

  after(async () => {
    if (prismaTest) {
      await prismaTest.$disconnect();
    }
  });

  test('1. Database health probe: pingDatabase returns true on live PostgreSQL', async () => {
    const isAlive = await pingDatabase(prismaTest);
    assert.equal(isAlive, true);
  });

  test('2. User + License 1-to-1 creation and retrieval', async () => {
    const user = await prismaTest.user.create({
      data: {
        email: testEmail,
        name: 'Hanif Sentinel',
        passwordHash: 'hashed_secret_pw',
        role: 'user',
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

    assert.ok(user.id);
    createdUserId = user.id;
    assert.equal(user.email, testEmail);
    assert.ok(user.license);
    assert.equal(user.license.tier, LicenseTier.FREE);
    assert.equal(user.license.maxCuts, 5);
  });

  test('3. Constraint validation: duplicate email creation is rejected with P2002', async () => {
    await assert.rejects(
      async () => {
        await prismaTest.user.create({
          data: {
            email: testEmail,
            passwordHash: 'another_password'
          }
        });
      },
      (err: any) => {
        return err.code === 'P2002'; // Prisma unique constraint violation code
      }
    );
  });

  test('4. Session registration, query, and Kick mechanism (revocation)', async () => {
    const clientSessionId = crypto.randomUUID();

    // Create active session
    const session = await prismaTest.session.create({
      data: {
        userId: createdUserId,
        sessionId: clientSessionId,
        platform: 'win32',
        appVersion: '2.41.36',
        deviceName: 'Laptop Lenovo Legion - Win11'
      }
    });

    assert.equal(session.sessionId, clientSessionId);
    assert.equal(session.isRevoked, false);

    // Simulate "Kick" when user logs in elsewhere
    const revoked = await prismaTest.session.update({
      where: { sessionId: clientSessionId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'Exceeded concurrent session limit (logged in from another PC)'
      }
    });

    assert.equal(revoked.isRevoked, true);
    assert.ok(revoked.revokedReason?.includes('Exceeded concurrent session'));
  });

  test('5. Voucher LicenseKey creation, validation, and redemption flow', async () => {
    const voucherKey = `PRO-VOUCHER-${Date.now()}`;

    // Admin creates voucher
    const keyRecord = await prismaTest.licenseKey.create({
      data: {
        key: voucherKey,
        tier: LicenseTier.PRO,
        durationDays: 30
      }
    });
    assert.equal(keyRecord.isUsed, false);

    // User redeems voucher
    const redeemed = await prismaTest.licenseKey.update({
      where: { key: voucherKey },
      data: {
        isUsed: true,
        usedByUserId: createdUserId,
        usedAt: new Date()
      }
    });
    assert.equal(redeemed.isUsed, true);
    assert.equal(redeemed.usedByUserId, createdUserId);

    // Upgrade user license
    const updatedLicense = await prismaTest.license.update({
      where: { userId: createdUserId },
      data: {
        tier: LicenseTier.PRO,
        maxCuts: 999,
        canThrottle: true,
        canGateway: true,
        canAutoreblock: true,
        canDeepFingerprint: true,
        cloudSync: true
      }
    });
    assert.equal(updatedLicense.tier, LicenseTier.PRO);
    assert.equal(updatedLicense.canThrottle, true);
  });

  test('6. Payment Transaction lifecycle (PENDING -> SUCCESS)', async () => {
    const orderId = `ORDER-TEST-${Date.now()}`;

    const tx = await prismaTest.transaction.create({
      data: {
        userId: createdUserId,
        orderId,
        grossAmount: 50000,
        targetTier: LicenseTier.PRO,
        durationDays: 30,
        status: PaymentStatus.PENDING,
        snapToken: 'dummy-snap-token-123'
      }
    });
    assert.equal(tx.status, PaymentStatus.PENDING);

    // Webhook callback simulates successful payment
    const paidTx = await prismaTest.transaction.update({
      where: { orderId },
      data: {
        status: PaymentStatus.SUCCESS,
        paymentType: 'qris',
        paidAt: new Date(),
        metadata: { midtrans_transaction_id: 'mid-12345' }
      }
    });
    assert.equal(paidTx.status, PaymentStatus.SUCCESS);
    assert.equal(paidTx.paymentType, 'qris');
  });

  test('7. Cascade deletion: deleting User cleans up License, Sessions, and Transactions', async () => {
    await prismaTest.user.delete({
      where: { id: createdUserId }
    });

    const orphanLicense = await prismaTest.license.findUnique({
      where: { userId: createdUserId }
    });
    assert.equal(orphanLicense, null);

    const orphanSessions = await prismaTest.session.findMany({
      where: { userId: createdUserId }
    });
    assert.equal(orphanSessions.length, 0);

    const orphanTransactions = await prismaTest.transaction.findMany({
      where: { userId: createdUserId }
    });
    assert.equal(orphanTransactions.length, 0);
  });
});