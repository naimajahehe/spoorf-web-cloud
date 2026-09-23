process.env.NODE_ENV = 'test';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { LicenseTier } from '@prisma/client';
import { getDefaultCryptoSigner } from '../src/utils/cryptoSigner';

describe('End-to-End Session & Download API Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let userA: any;
  let userB: any;
  let tokenUserA: string;
  let tokenUserB: string;
  let sessionA1: any;
  let sessionA2: any;
  let webSessionA: any;

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });

    const timestamp = Date.now();

    // Create 2 test users (User A and User B)
    userA = await prisma.user.create({
      data: {
        email: `e2e_userA_${timestamp}@spoorf.app`,
        passwordHash: 'dummy_hash_user_a',
        name: 'User A Tester',
        license: {
          create: {
            tier: LicenseTier.PRO,
            maxCuts: 999,
          },
        },
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `e2e_userB_${timestamp}@spoorf.app`,
        passwordHash: 'dummy_hash_user_b',
        name: 'User B Tester',
        license: {
          create: {
            tier: LicenseTier.FREE,
            maxCuts: 5,
          },
        },
      },
    });

    // Web portal sessions the test tokens are bound to (authGuard requires a live session)
    webSessionA = await prisma.session.create({
      data: { userId: userA.id, sessionId: crypto.randomUUID(), platform: 'web' },
    });
    const webSessionB = await prisma.session.create({
      data: { userId: userB.id, sessionId: crypto.randomUUID(), platform: 'web' },
    });

    // Generate RS256 tokens using getDefaultCryptoSigner()
    const signer = getDefaultCryptoSigner();
    tokenUserA = signer.signLicenseToken({
      userId: userA.id,
      email: userA.email,
      role: 'user',
      tier: 'pro',
      maxCuts: 999,
      canThrottle: true,
      canGateway: true,
      canAutoreblock: true,
      canArsenal: false,
      sessionId: webSessionA.sessionId,
    });

    tokenUserB = signer.signLicenseToken({
      userId: userB.id,
      email: userB.email,
      role: 'user',
      tier: 'free',
      maxCuts: 5,
      canThrottle: false,
      canGateway: false,
      canAutoreblock: false,
      canArsenal: false,
      sessionId: webSessionB.sessionId,
    });

    // Seed test sessions for User A
    sessionA1 = await prisma.session.create({
      data: {
        userId: userA.id,
        sessionId: crypto.randomUUID(),
        deviceName: 'Laptop User A (Legion)',
        platform: 'win32',
        appVersion: '2.41.79',
        ipAddress: '192.168.1.100',
        isRevoked: false,
        lastSeenAt: new Date(),
      },
    });

    sessionA2 = await prisma.session.create({
      data: {
        userId: userA.id,
        sessionId: crypto.randomUUID(),
        deviceName: 'Desktop User A (Workstation)',
        platform: 'win32',
        appVersion: '2.41.79',
        ipAddress: '192.168.1.101',
        isRevoked: false,
        lastSeenAt: new Date(),
      },
    });
  });

  after(async () => {
    if (server) {
      server.close();
    }
    if (prisma && userA && userB) {
      await prisma.session.deleteMany({
        where: { userId: { in: [userA.id, userB.id] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [userA.id, userB.id] } },
      });
    }
  });

  test('1. GET /v1/sessions without Authorization -> 401', async () => {
    const res = await fetch(`${baseUrl}/v1/sessions`);
    assert.equal(res.status, 401);
    const body: any = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });

  test('2. GET /v1/sessions with User A token -> 200, returns { success: true, sessions: [...] }', async () => {
    const res = await fetch(`${baseUrl}/v1/sessions`, {
      headers: {
        Authorization: `Bearer ${tokenUserA}`,
      },
    });
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.sessions));
    assert.equal(body.sessions.length >= 2, true);
    const foundSessionA1 = body.sessions.find((s: any) => s.id === sessionA1.id);
    assert.ok(foundSessionA1);
    assert.equal(foundSessionA1.deviceName, 'Laptop User A (Legion)');
  });

  test('3. POST /v1/sessions/:id/revoke with User A token -> 200, sets session isRevoked: true', async () => {
    const res = await fetch(`${baseUrl}/v1/sessions/${sessionA1.id}/revoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenUserA}`,
      },
    });
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.success, true);

    const updated = await prisma.session.findUnique({
      where: { id: sessionA1.id },
    });
    assert.ok(updated);
    assert.equal(updated.isRevoked, true);
  });

  test("4. POST /v1/sessions/:id/revoke with User B token targeting User A's session -> 404 (multi-tenant guard)", async () => {
    const res = await fetch(`${baseUrl}/v1/sessions/${sessionA2.id}/revoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenUserB}`,
      },
    });
    assert.equal(res.status, 404);
    const body: any = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'NOT_FOUND');
  });

  test('5. POST /v1/sessions/revoke-all with User A token -> 200, revokes all other active sessions for User A', async () => {
    const res = await fetch(`${baseUrl}/v1/sessions/revoke-all`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenUserA}`,
      },
    });
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.success, true);

    const activeSessions = await prisma.session.findMany({
      where: {
        userId: userA.id,
        isRevoked: false,
      },
    });
    // Only the web session that issued the request stays active
    assert.deepEqual(activeSessions.map((s) => s.id), [webSessionA.id]);
  });

  test('6. GET /v1/download/latest -> 200, returns release metadata (version, filename, downloadUrl)', async () => {
    const res = await fetch(`${baseUrl}/v1/download/latest`);
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.release);
    assert.ok(body.release.version);
    assert.ok(body.release.filename);
    assert.ok(body.release.downloadUrl);
  });
});
