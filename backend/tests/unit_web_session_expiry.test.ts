import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { prisma } from '../src/config/database';
import { AuthService } from '../src/services/authService';
import { LICENSE_TOKEN_TTL_DAYS } from '../src/utils/cryptoSigner';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The web portal rotates its session id whenever it drops a token, so a web session whose
 * token simply expired is never logged out and would stay "active" forever. Login expires
 * such rows for the same account; desktop sessions are left to the device-slot logic.
 */
describe('Web Session Expiry Suite (orphaned web sessions)', () => {
  const authService = new AuthService(prisma);
  const tag = Date.now();
  const password = 'Password123!';
  const email = `wse_owner_${tag}@spoorf.app`;
  const otherEmail = `wse_other_${tag}@spoorf.app`;
  let userId: string;
  let otherUserId: string;

  const addSession = (ownerId: string, platform: string, idleDays: number) =>
    prisma.session.create({
      data: {
        userId: ownerId,
        sessionId: crypto.randomUUID(),
        platform,
        lastSeenAt: new Date(Date.now() - idleDays * DAY_MS),
      },
    });

  const rowOf = (sessionId: string) => prisma.session.findUniqueOrThrow({ where: { sessionId } });

  before(async () => {
    await authService.register({ email, password });
    await authService.register({ email: otherEmail, password });
    userId = (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
    otherUserId = (await prisma.user.findUniqueOrThrow({ where: { email: otherEmail } })).id;
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [email, otherEmail] } } });
  });

  test('1. login expires the account\'s web sessions idle longer than the token lifetime', async () => {
    const stale = await addSession(userId, 'web', LICENSE_TOKEN_TTL_DAYS + 1);

    await authService.login({ email, password, session_id: crypto.randomUUID(), platform: 'web' });

    const row = await rowOf(stale.sessionId);
    assert.equal(row.isRevoked, true);
    assert.ok(row.revokedAt);
    assert.match(row.revokedReason || '', /kedaluwarsa/i);
  });

  test('2. a web session used within the token lifetime stays active', async () => {
    const recent = await addSession(userId, 'web', LICENSE_TOKEN_TTL_DAYS - 1);

    await authService.login({ email, password, session_id: crypto.randomUUID(), platform: 'web' });

    assert.equal((await rowOf(recent.sessionId)).isRevoked, false);
  });

  test('3. idle desktop sessions and other accounts are not touched', async () => {
    const desktop = await addSession(userId, 'win32', LICENSE_TOKEN_TTL_DAYS + 5);
    const foreignWeb = await addSession(otherUserId, 'web', LICENSE_TOKEN_TTL_DAYS + 5);

    await authService.login({ email, password, session_id: crypto.randomUUID(), platform: 'web' });

    assert.equal((await rowOf(desktop.sessionId)).isRevoked, false, 'desktop sessions follow the slot logic');
    assert.equal((await rowOf(foreignWeb.sessionId)).isRevoked, false, 'only the signing-in account is cleaned up');
  });

  test('4. rotating a session token refreshes its lastSeenAt', async () => {
    const idle = await addSession(userId, 'web', 10);

    await authService.issueSessionToken(userId, idle.sessionId);

    const ageMs = Date.now() - (await rowOf(idle.sessionId)).lastSeenAt.getTime();
    assert.ok(ageMs < 60_000, 'a freshly issued token must count as activity');
  });
});
