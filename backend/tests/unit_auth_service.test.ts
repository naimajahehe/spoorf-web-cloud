import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient, LicenseTier } from '@prisma/client';
import { AuthService } from '../src/services/authService';
import { getDefaultCryptoSigner } from '../src/utils/cryptoSigner';
import crypto from 'node:crypto';

describe('AuthService Unit & Business Logic Suite', () => {
  let prismaTest: PrismaClient;
  let authService: AuthService;
  const testEmail = `operator_${Date.now()}@spoorf.app`;
  const testPassword = 'SecurePassword123!';

  before(async () => {
    const testUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/spoorf_cloud_test?schema=public';
    prismaTest = new PrismaClient({
      datasources: { db: { url: testUrl } }
    });
    authService = new AuthService(prismaTest);
  });

  after(async () => {
    if (prismaTest) {
      // Clean up test user and the vouchers created by this suite
      await prismaTest.user.deleteMany({
        where: { email: testEmail }
      });
      await prismaTest.licenseKey.deleteMany({
        where: { key: { startsWith: 'PRO-UNIT-' } }
      });
      await prismaTest.$disconnect();
    }
  });

  test('1. register: creates user, default Free license, and valid RS256 token', async () => {
    const res = await authService.register({
      email: testEmail,
      password: testPassword,
      name: 'Naim Hanif'
    });

    assert.equal(res.status, 'success');
    assert.ok(res.user.id);
    assert.equal(res.user.email, testEmail);
    assert.equal(res.license.tier, 'free');
    assert.equal(res.license.max_cuts, 5);
    assert.equal(res.license.can_throttle, false);

    // Verify token validity
    const signer = getDefaultCryptoSigner();
    const decoded = signer.verifyLicenseToken(res.token);
    assert.equal(decoded.email, testEmail);
    assert.equal(decoded.tier, 'free');
  });

  test('2. register: rejects duplicate email with ConflictError', async () => {
    await assert.rejects(
      async () => {
        await authService.register({
          email: testEmail,
          password: 'AnotherPassword123!'
        });
      },
      /Email sudah terdaftar/i
    );
  });

  test('3. login: succeeds with valid credentials and matches Desktop Contract', async () => {
    const sessionId = crypto.randomUUID();
    const res = await authService.login({
      email: testEmail,
      password: testPassword,
      session_id: sessionId,
      platform: 'win32',
      app_version: '2.41.36'
    });

    assert.equal(res.status, 'success');
    assert.ok(res.token);
    assert.equal(res.user.email, testEmail);
    assert.equal(res.license.tier, 'free');
    assert.equal(res.license.max_cuts, 5);
    assert.ok(res.license.grace_period_until);

    // Verify session was created in DB
    const dbSession = await prismaTest.session.findUnique({
      where: { sessionId }
    });
    assert.ok(dbSession);
    assert.equal(dbSession.isRevoked, false);
  });

  test('4. login: rejects invalid password with UnauthorizedError', async () => {
    await assert.rejects(
      async () => {
        await authService.login({
          email: testEmail,
          password: 'WrongPassword999!',
          session_id: crypto.randomUUID()
        });
      },
      /Email atau kata sandi tidak valid/i
    );
  });

  test('5. Concurrent Session Enforcement (Kick Mechanism): Free tier allows 1 active session', async () => {
    const session1 = crypto.randomUUID();
    const session2 = crypto.randomUUID();

    // Session 1 logs in
    await authService.login({
      email: testEmail,
      password: testPassword,
      session_id: session1,
      deviceName: 'Laptop A'
    });

    const s1RecordBefore = await prismaTest.session.findUnique({ where: { sessionId: session1 } });
    assert.equal(s1RecordBefore?.isRevoked, false);

    // Session 2 logs in on new device (exceeds Free tier 1 slot limit)
    await authService.login({
      email: testEmail,
      password: testPassword,
      session_id: session2,
      deviceName: 'Laptop B'
    });

    // Session 1 must be kicked/revoked
    const s1RecordAfter = await prismaTest.session.findUnique({ where: { sessionId: session1 } });
    assert.equal(s1RecordAfter?.isRevoked, true);
    assert.ok(s1RecordAfter?.revokedReason?.includes('batas login bersamaan'));

    // Session 2 must be active
    const s2Record = await prismaTest.session.findUnique({ where: { sessionId: session2 } });
    assert.equal(s2Record?.isRevoked, false);
  });

  test('6. sessionHeartbeat: extends grace period for active session and detects kicked session', async () => {
    const user = await prismaTest.user.findUnique({ where: { email: testEmail } });
    assert.ok(user);

    const activeSessionId = crypto.randomUUID();
    await authService.login({
      email: testEmail,
      password: testPassword,
      session_id: activeSessionId
    });

    const heartbeatRes = await authService.sessionHeartbeat(user.id, activeSessionId);
    assert.equal(heartbeatRes.status, 'success');
    assert.equal(heartbeatRes.isRevoked, false);
    assert.ok(heartbeatRes.token);

    // Now simulate being kicked
    await prismaTest.session.update({
      where: { sessionId: activeSessionId },
      data: { isRevoked: true, revokedReason: 'Kicked by admin' }
    });

    await assert.rejects(
      async () => {
        await authService.sessionHeartbeat(user.id, activeSessionId);
      },
      /SessionRevokedError/i
    );
  });

  test('7. redeemLicenseKey: upgrades tier from Free to Pro with valid voucher', async () => {
    const user = await prismaTest.user.findUnique({ where: { email: testEmail } });
    assert.ok(user);

    const voucherCode = `PRO-UNIT-${Date.now()}`;
    await prismaTest.licenseKey.create({
      data: {
        key: voucherCode,
        tier: LicenseTier.PRO,
        durationDays: 30
      }
    });

    const updatedLicense = await authService.redeemLicenseKey(user.id, voucherCode);
    assert.equal(updatedLicense.tier, 'pro');
    assert.equal(updatedLicense.max_cuts, 999);
    assert.equal(updatedLicense.can_throttle, true);
    assert.equal(updatedLicense.can_gateway, true);
    assert.equal(updatedLicense.can_deep_fingerprint, true);
  });

  // Handover stays supported for shared machines; the previous owner's token is invalidated
  // by authGuard's ownership check (see e2e_security_regression test 8).
  test('8. Multi-user device handover: login with existing device sessionId reassigns session to new user', async () => {
    const emailUser1 = `handover_user1_${Date.now()}@spoorf.app`;
    const emailUser2 = `handover_user2_${Date.now()}@spoorf.app`;
    const pwd = 'Password123!';
    const sharedHwid = `device_hwid_${Date.now()}`;

    // Register User 1 and User 2
    const u1 = await authService.register({ email: emailUser1, password: pwd, name: 'User One' });
    const u2 = await authService.register({ email: emailUser2, password: pwd, name: 'User Two' });

    // User 1 logs in with device HWID
    await authService.login({
      email: emailUser1,
      password: pwd,
      session_id: sharedHwid,
      deviceName: 'Office PC',
      platform: 'win32',
    });

    // Check that session is owned by User 1
    let sessionRecord = await prismaTest.session.findUnique({ where: { sessionId: sharedHwid } });
    assert.ok(sessionRecord);
    assert.equal(sessionRecord.userId, u1.user.id);

    // Now User 2 logs in on that exact SAME device
    await authService.login({
      email: emailUser2,
      password: pwd,
      session_id: sharedHwid,
      deviceName: 'Office PC Naim',
      platform: 'win32',
    });

    // Session record MUST be reassigned to User 2
    sessionRecord = await prismaTest.session.findUnique({ where: { sessionId: sharedHwid } });
    assert.ok(sessionRecord);
    assert.equal(sessionRecord.userId, u2.user.id, 'Session userId must be updated to new logged in user');

    // Clean up
    await prismaTest.user.deleteMany({ where: { email: { in: [emailUser1, emailUser2] } } });
  });
});