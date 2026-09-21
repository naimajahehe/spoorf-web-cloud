import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PrismaClient, LicenseTier } from '@prisma/client';
import { SessionService } from '../src/services/sessionService';
import { NotFoundError } from '../src/errors/AppError';

describe('SessionService Unit & Business Logic Suite', () => {
  let prismaTest: PrismaClient;
  let sessionService: SessionService;
  let userAId: string;
  let userBId: string;
  const userAEmail = `userA_${Date.now()}@spoorf.app`;
  const userBEmail = `userB_${Date.now()}@spoorf.app`;

  before(async () => {
    const testUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/spoorf_cloud_test?schema=public';
    prismaTest = new PrismaClient({
      datasources: { db: { url: testUrl } }
    });
    sessionService = new SessionService(prismaTest);

    // Create 2 test users for multi-tenant isolation testing
    const userA = await prismaTest.user.create({
      data: {
        email: userAEmail,
        passwordHash: 'dummy_hash_1',
        name: 'Operator User A',
        license: {
          create: {
            tier: LicenseTier.PRO,
            maxCuts: 999
          }
        }
      }
    });
    userAId = userA.id;

    const userB = await prismaTest.user.create({
      data: {
        email: userBEmail,
        passwordHash: 'dummy_hash_2',
        name: 'Operator User B',
        license: {
          create: {
            tier: LicenseTier.FREE,
            maxCuts: 5
          }
        }
      }
    });
    userBId = userB.id;
  });

  after(async () => {
    if (prismaTest) {
      // Clean up test users (cascades to all sessions)
      await prismaTest.user.deleteMany({
        where: { id: { in: [userAId, userBId] } }
      });
      await prismaTest.$disconnect();
    }
  });

  test('1. getUserSessions: lists user sessions, sorted by lastSeenAt DESC, computed is_online', async () => {
    const now = Date.now();

    // Session 1: seen 1 min ago, active -> is_online: true
    const sessionRecentActive = await prismaTest.session.create({
      data: {
        userId: userAId,
        sessionId: crypto.randomUUID(),
        deviceName: 'Laptop Lenovo Legion',
        platform: 'win32',
        appVersion: '2.41.36',
        ipAddress: '192.168.1.100',
        isRevoked: false,
        lastSeenAt: new Date(now - 1 * 60 * 1000)
      }
    });

    // Session 2: seen 10 min ago, active -> is_online: false (> 5 min)
    const sessionOldActive = await prismaTest.session.create({
      data: {
        userId: userAId,
        sessionId: crypto.randomUUID(),
        deviceName: 'MacBook Pro M2',
        platform: 'darwin',
        appVersion: '2.41.30',
        ipAddress: '192.168.1.101',
        isRevoked: false,
        lastSeenAt: new Date(now - 10 * 60 * 1000)
      }
    });

    // Session 3: seen 30 sec ago, revoked -> is_online: false (isRevoked is true)
    const sessionRecentRevoked = await prismaTest.session.create({
      data: {
        userId: userAId,
        sessionId: crypto.randomUUID(),
        deviceName: 'Workstation Desktop',
        platform: 'linux',
        appVersion: '2.41.35',
        ipAddress: '192.168.1.102',
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'Batas sesi terlampaui',
        lastSeenAt: new Date(now - 30 * 1000)
      }
    });

    // Create session for user B to verify multi-tenant isolation in listing
    await prismaTest.session.create({
      data: {
        userId: userBId,
        sessionId: crypto.randomUUID(),
        deviceName: 'User B Device',
        platform: 'win32',
        isRevoked: false,
        lastSeenAt: new Date()
      }
    });

    const sessions = await sessionService.getUserSessions(userAId);

    // Should only contain userA's 3 sessions
    assert.equal(sessions.length, 3);

    // Sorted by lastSeenAt DESC
    // sessionRecentRevoked (-30s) > sessionRecentActive (-1m) > sessionOldActive (-10m)
    assert.equal(sessions[0].id, sessionRecentRevoked.id);
    assert.equal(sessions[1].id, sessionRecentActive.id);
    assert.equal(sessions[2].id, sessionOldActive.id);

    // Verify computed is_online
    assert.equal(sessions[0].is_online, false); // revoked
    assert.equal(sessions[1].is_online, true);  // active & seen 1 min ago
    assert.equal(sessions[2].is_online, false); // active but seen 10 min ago (> 5m threshold)
  });

  test('2. revokeSession: soft-revokes by setting isRevoked, revokedAt, and standard revokedReason', async () => {
    // Create an active session for User A
    const session = await prismaTest.session.create({
      data: {
        userId: userAId,
        sessionId: crypto.randomUUID(),
        deviceName: 'iPad Pro',
        platform: 'ios',
        isRevoked: false
      }
    });

    // Revoke by DB id
    const res = await sessionService.revokeSession(userAId, session.id);
    assert.equal(res.success, true);
    assert.ok(res.message);

    // Verify in database
    const updated = await prismaTest.session.findUnique({
      where: { id: session.id }
    });
    assert.ok(updated);
    assert.equal(updated.isRevoked, true);
    assert.ok(updated.revokedAt);
    assert.equal(updated.revokedReason, 'Dicabut secara manual oleh pengguna melalui Web Dashboard');

    // Create another active session for User A and revoke by sessionId (UUID from client)
    const clientSessionId = crypto.randomUUID();
    const sessionByClient = await prismaTest.session.create({
      data: {
        userId: userAId,
        sessionId: clientSessionId,
        deviceName: 'Surface Pro',
        platform: 'win32',
        isRevoked: false
      }
    });

    const resByClient = await sessionService.revokeSession(userAId, clientSessionId);
    assert.equal(resByClient.success, true);

    const updatedByClient = await prismaTest.session.findUnique({
      where: { id: sessionByClient.id }
    });
    assert.ok(updatedByClient);
    assert.equal(updatedByClient.isRevoked, true);
    assert.equal(updatedByClient.revokedReason, 'Dicabut secara manual oleh pengguna melalui Web Dashboard');
  });

  test('3. Multi-tenant isolation: throws NotFoundError if trying to revoke another user\'s session', async () => {
    // Create an active session for User B
    const sessionB = await prismaTest.session.create({
      data: {
        userId: userBId,
        sessionId: crypto.randomUUID(),
        deviceName: 'Target Victim Laptop',
        platform: 'win32',
        isRevoked: false
      }
    });

    // User A attempts to revoke User B's session using session ID
    await assert.rejects(
      async () => {
        await sessionService.revokeSession(userAId, sessionB.id);
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundError);
        assert.equal(err.statusCode, 404);
        return true;
      }
    );

    // User A attempts to revoke User B's session using sessionId
    await assert.rejects(
      async () => {
        await sessionService.revokeSession(userAId, sessionB.sessionId);
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundError);
        assert.equal(err.statusCode, 404);
        return true;
      }
    );

    // Attempt to revoke non-existent session
    await assert.rejects(
      async () => {
        await sessionService.revokeSession(userAId, crypto.randomUUID());
      },
      (err: any) => {
        assert.ok(err instanceof NotFoundError);
        assert.equal(err.statusCode, 404);
        return true;
      }
    );

    // Ensure User B's session was NOT revoked
    const sessionBCheck = await prismaTest.session.findUnique({
      where: { id: sessionB.id }
    });
    assert.ok(sessionBCheck);
    assert.equal(sessionBCheck.isRevoked, false);
  });

  test('4. revokeAllSessions: soft-revokes all active sessions for that user', async () => {
    // Clean up existing sessions for user A to have a clean slate
    await prismaTest.session.deleteMany({
      where: { userId: userAId }
    });

    // Create 3 active sessions for user A
    await prismaTest.session.createMany({
      data: [
        {
          userId: userAId,
          sessionId: crypto.randomUUID(),
          deviceName: 'Device 1',
          isRevoked: false
        },
        {
          userId: userAId,
          sessionId: crypto.randomUUID(),
          deviceName: 'Device 2',
          isRevoked: false
        },
        {
          userId: userAId,
          sessionId: crypto.randomUUID(),
          deviceName: 'Device 3',
          isRevoked: false
        }
      ]
    });

    // Create 1 already revoked session for user A
    await prismaTest.session.create({
      data: {
        userId: userAId,
        sessionId: crypto.randomUUID(),
        deviceName: 'Device 4 (Already Revoked)',
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'Already revoked'
      }
    });

    // Create 1 active session for user B
    const sessionBActive = await prismaTest.session.create({
      data: {
        userId: userBId,
        sessionId: crypto.randomUUID(),
        deviceName: 'User B Device Active',
        isRevoked: false
      }
    });

    // Revoke all sessions for User A
    const res = await sessionService.revokeAllSessions(userAId);
    assert.equal(res.success, true);
    assert.equal(res.revokedCount, 3);
    assert.ok(res.message);

    // Verify all of user A's sessions are now revoked
    const userASessions = await prismaTest.session.findMany({
      where: { userId: userAId }
    });
    assert.equal(userASessions.length, 4);
    assert.ok(userASessions.every(s => s.isRevoked === true));

    // Verify User B's session was unaffected
    const sessionBCheck = await prismaTest.session.findUnique({
      where: { id: sessionBActive.id }
    });
    assert.ok(sessionBCheck);
    assert.equal(sessionBCheck.isRevoked, false);

    // Calling revokeAllSessions again returns revokedCount 0
    const resAgain = await sessionService.revokeAllSessions(userAId);
    assert.equal(resAgain.success, true);
    assert.equal(resAgain.revokedCount, 0);
  });
});
