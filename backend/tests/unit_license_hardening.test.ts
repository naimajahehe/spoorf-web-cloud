import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { LicenseTier } from '@prisma/client';
import { prisma } from '../src/config/database';
import { AuthService } from '../src/services/authService';
import { getDefaultCryptoSigner } from '../src/utils/cryptoSigner';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Regression suite for the 2026-09-25 audit: signed entitlements for web portal
 * sessions and per-account serialization of voucher redemption.
 */
describe('License Hardening Suite (Web Session Claims, Voucher Stacking)', () => {
  const authService = new AuthService(prisma);
  const tag = Date.now();
  const password = 'Password123!';
  const paidEmail = `lic_paid_${tag}@spoorf.app`;
  const stackEmail = `lic_stack_${tag}@spoorf.app`;
  const voucherPrefix = `LIC-${tag}`;
  let paidUserId: string;

  const claimsOf = (token: string) => getDefaultCryptoSigner().verifyLicenseToken(token);

  before(async () => {
    await authService.register({ email: paidEmail, password });
    await authService.register({ email: stackEmail, password });
    const paidUser = await prisma.user.findUniqueOrThrow({ where: { email: paidEmail } });
    paidUserId = paidUser.id;
    await prisma.license.update({
      where: { userId: paidUserId },
      data: {
        tier: LicenseTier.PRO,
        maxCuts: 999,
        canThrottle: true,
        canGateway: true,
        canAutoreblock: true,
        canDeepFingerprint: true,
        cloudSync: true,
        expiresAt: new Date(Date.now() + 30 * DAY_MS),
      },
    });
  });

  after(async () => {
    await prisma.licenseKey.deleteMany({ where: { key: { startsWith: voucherPrefix } } });
    await prisma.user.deleteMany({ where: { email: { in: [paidEmail, stackEmail] } } });
  });

  test('1. a web session token carries Free entitlements even on a paid account', async () => {
    const res = await authService.login({ email: paidEmail, password, session_id: crypto.randomUUID(), platform: 'web' });

    const claims = claimsOf(res.token);
    assert.equal(claims.tier, 'free');
    assert.equal(claims.canThrottle, false);
    assert.equal(claims.maxCuts, 5);
    // The unsigned JSON license stays accurate for the web dashboard.
    assert.equal(res.license.tier, 'pro');
  });

  test('2. heartbeat and token rotation on a web session keep Free entitlements', async () => {
    const sessionId = crypto.randomUUID();
    await authService.login({ email: paidEmail, password, session_id: sessionId, platform: 'web' });

    const hb = await authService.sessionHeartbeat(paidUserId, sessionId);
    assert.equal(claimsOf(hb.token).tier, 'free');

    const rotated = await authService.issueSessionToken(paidUserId, sessionId);
    assert.equal(claimsOf(rotated).tier, 'free');
  });

  test('3. re-login without a platform keeps a web session on Free entitlements', async () => {
    const sessionId = crypto.randomUUID();
    await authService.login({ email: paidEmail, password, session_id: sessionId, platform: 'web' });

    const relogin = await authService.login({ email: paidEmail, password, session_id: sessionId });
    assert.equal(claimsOf(relogin.token).tier, 'free');
  });

  test('4. a desktop session token carries the paid entitlements', async () => {
    const res = await authService.login({ email: paidEmail, password, session_id: crypto.randomUUID(), platform: 'win32' });

    const claims = claimsOf(res.token);
    assert.equal(claims.tier, 'pro');
    assert.equal(claims.canThrottle, true);
  });

  test('5. concurrent redemptions by one account each extend the license', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: stackEmail } });
    const keys = [1, 2, 3].map((i) => `${voucherPrefix}-STACK-${i}`);
    await prisma.licenseKey.createMany({ data: keys.map((key) => ({ key, tier: LicenseTier.PRO, durationDays: 30 })) });

    const startedAt = Date.now();
    await Promise.all(keys.map((key) => authService.redeemLicenseKey(user.id, key)));

    const license = await prisma.license.findUniqueOrThrow({ where: { userId: user.id } });
    const addedDays = Math.round((license.expiresAt!.getTime() - startedAt) / DAY_MS);
    assert.equal(addedDays, 90, 'each of the 3 vouchers must add its 30 days');
  });

  test('6. issueSessionToken fails closed to Free when the session row is missing', async () => {
    // authGuard always validates the session before redeem, so a missing row is anomalous;
    // the token must not grant paid entitlements in that case.
    const token = await authService.issueSessionToken(paidUserId, 'no-such-session-id');
    assert.equal(claimsOf(token).tier, 'free');
  });
});
