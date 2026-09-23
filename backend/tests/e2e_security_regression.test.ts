import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { LicenseTier } from '@prisma/client';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { AuthService } from '../src/services/authService';

/**
 * Regression suite for the 2026-09-23 audit findings on session binding,
 * voucher redemption, license expiry and error mapping.
 */
describe('Security Regression Suite (Session Binding, Vouchers, Expiry)', () => {
  let server: http.Server;
  let baseUrl: string;
  const tag = Date.now();
  const password = 'Password123!';
  const victimEmail = `sec_victim_${tag}@spoorf.app`;
  const attackerEmail = `sec_attacker_${tag}@spoorf.app`;
  const voucherPrefix = `SEC-${tag}`;

  const post = async (path: string, body: unknown, token?: string, rawBody?: string) => {
    const res = await fetch(`${baseUrl}/v1${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: rawBody ?? JSON.stringify(body),
    });
    return { status: res.status, body: (await res.json().catch(() => null)) as any };
  };

  const get = async (path: string, token: string) => {
    const res = await fetch(`${baseUrl}/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return { status: res.status, body: (await res.json().catch(() => null)) as any };
  };

  const login = (email: string, sessionId: string, extra: Record<string, unknown> = {}) =>
    post('/auth/login', { email, password, session_id: sessionId, platform: 'win32', ...extra });

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${(server.address() as any).port}`;
        resolve();
      });
    });
    await post('/auth/register', { email: victimEmail, password });
    await post('/auth/register', { email: attackerEmail, password });
  });

  after(async () => {
    server?.close();
    await prisma.licenseKey.deleteMany({ where: { key: { startsWith: voucherPrefix } } });
    await prisma.user.deleteMany({ where: { email: { in: [victimEmail, attackerEmail] } } });
  });

  test('1. login without session_id is rejected (no unbound, unrevocable tokens)', async () => {
    const res = await post('/auth/login', { email: victimEmail, password });
    assert.equal(res.status, 400);
  });

  test('2. logout cannot revoke another user\'s session via body session_id', async () => {
    const victimSession = crypto.randomUUID();
    const victim = await login(victimEmail, victimSession);
    const attacker = await login(attackerEmail, crypto.randomUUID());

    await post('/auth/logout', { session_id: victimSession }, attacker.body.token);

    const row = await prisma.session.findUnique({ where: { sessionId: victimSession } });
    assert.equal(row?.isRevoked, false, 'victim session must stay active');
    assert.equal((await get('/auth/me', victim.body.token)).status, 200);
  });

  test('3. logout revokes the caller\'s own session bound in the token', async () => {
    const sessionId = crypto.randomUUID();
    const { body } = await login(victimEmail, sessionId);
    assert.equal((await post('/auth/logout', {}, body.token)).status, 200);
    const me = await get('/auth/me', body.token);
    assert.equal(me.status, 401);
    assert.equal(me.body.error.code, 'SESSION_REVOKED');
  });

  test('4. heartbeat with a foreign session_id is rejected and does not change ownership', async () => {
    const victimSession = crypto.randomUUID();
    await login(victimEmail, victimSession);
    const attacker = await login(attackerEmail, crypto.randomUUID());

    const hb = await post('/auth/heartbeat', { session_id: victimSession }, attacker.body.token);
    assert.equal(hb.status, 403);

    const row = await prisma.session.findUnique({ where: { sessionId: victimSession }, include: { user: true } });
    assert.equal(row?.user.email, victimEmail);
  });

  test('5. heartbeat returns the current license so desktop clients can resync tier', async () => {
    const sessionId = crypto.randomUUID();
    const { body } = await login(victimEmail, sessionId);
    const hb = await post('/auth/heartbeat', { session_id: sessionId, sessionId }, body.token);
    assert.equal(hb.status, 200);
    assert.equal(hb.body.status, 'success');
    assert.equal(hb.body.isRevoked, false);
    assert.ok(hb.body.token);
    assert.ok(hb.body.grace_period_until);
    assert.equal(hb.body.license.tier, 'free');
    assert.equal(hb.body.license.max_cuts, 5);
  });

  test('6. token re-login cannot resurrect a revoked (kicked) session', async () => {
    const sessionId = crypto.randomUUID();
    const { body } = await login(victimEmail, sessionId);
    await prisma.session.update({ where: { sessionId }, data: { isRevoked: true, revokedReason: 'Kicked' } });

    const relogin = await post('/auth/login', { email: victimEmail, token: body.token, session_id: sessionId });
    assert.equal(relogin.status, 401);
    const row = await prisma.session.findUnique({ where: { sessionId } });
    assert.equal(row?.isRevoked, true);
  });

  test('7. token re-login succeeds for an active session bound to the same token', async () => {
    const sessionId = crypto.randomUUID();
    const { body } = await login(victimEmail, sessionId);
    const relogin = await post('/auth/login', { email: victimEmail, token: body.token, session_id: sessionId });
    assert.equal(relogin.status, 200);
  });

  test('8. device handover invalidates the previous owner\'s token for that session', async () => {
    const sharedSession = crypto.randomUUID();
    const first = await login(victimEmail, sharedSession);
    await login(attackerEmail, sharedSession);
    const me = await get('/auth/me', first.body.token);
    assert.equal(me.status, 401);
    assert.equal(me.body.error.code, 'SESSION_REVOKED');
  });

  test('9. web sessions do not consume desktop device slots', async () => {
    const desktopSession = crypto.randomUUID();
    const desktop = await login(victimEmail, desktopSession);
    await post('/auth/login', { email: victimEmail, password, session_id: crypto.randomUUID(), platform: 'web' });
    assert.equal((await get('/auth/me', desktop.body.token)).status, 200, 'Free desktop slot must survive a web login');
  });

  test('10. a voucher can only be redeemed once under concurrency', async () => {
    const key = `${voucherPrefix}-RACE`;
    await prisma.licenseKey.create({ data: { key, tier: LicenseTier.PRO, durationDays: 30 } });
    const users = await prisma.user.findMany({ where: { email: { in: [victimEmail, attackerEmail] } } });
    const authService = new AuthService(prisma);

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) => authService.redeemLicenseKey(users[i % 2].id, key))
    );
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  });

  test('11. an expired paid license is served as Free on login and heartbeat', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: attackerEmail } });
    await prisma.license.update({
      where: { userId: user.id },
      data: { tier: LicenseTier.VIP, maxCuts: 9999, canThrottle: true, expiresAt: new Date(Date.now() - 60_000) },
    });

    const sessionId = crypto.randomUUID();
    const res = await login(attackerEmail, sessionId);
    assert.equal(res.body.license.tier, 'free');
    assert.equal(res.body.license.can_throttle, false);

    const hb = await post('/auth/heartbeat', { session_id: sessionId }, res.body.token);
    assert.equal(hb.body.license.tier, 'free');
  });

  test('12. GET /auth/me includes the live license from the database', async () => {
    const { body } = await login(victimEmail, crypto.randomUUID(), { platform: 'web' });
    const me = await get('/auth/me', body.token);
    assert.equal(me.status, 200);
    assert.ok(me.body.license);
    assert.ok(['free', 'pro', 'vip'].includes(me.body.license.tier));
  });

  test('13. malformed JSON returns 400, disallowed CORS origin returns 403', async () => {
    const bad = await post('/auth/login', null, undefined, '{bad json');
    assert.equal(bad.status, 400);

    const cors = await fetch(`${baseUrl}/v1/health`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(cors.status, 403);
  });
});
