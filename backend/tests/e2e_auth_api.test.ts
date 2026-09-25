process.env.NODE_ENV = 'test';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { LicenseTier } from '@prisma/client';
import http from 'node:http';
import crypto from 'node:crypto';

describe('End-to-End HTTP API Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  const prismaTest = prisma;
  const testEmail = `e2e_${Date.now()}@spoorf.app`;
  const testPassword = 'PasswordE2E123!';
  let authToken: string;

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      server.close();
    }
    if (prismaTest) {
      await prismaTest.user.deleteMany({
        where: { email: testEmail }
      });
      await prismaTest.licenseKey.deleteMany({
        where: { key: { startsWith: 'PRO-E2E-' } }
      });
    }
  });

  test('1. GET /v1/health returns 200 and healthy status', async () => {
    const res = await fetch(`${baseUrl}/v1/health`);
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.status, 'healthy');
    assert.equal(body.database, 'connected');
    assert.equal(body.version, '0.0.6');
  });

  test('2. POST /v1/auth/register validates schema and creates account (201 Created)', async () => {
    const res = await fetch(`${baseUrl}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Tester E2E'
      })
    });

    assert.equal(res.status, 201);
    const body: any = await res.json();
    assert.equal(body.status, 'success');
    assert.equal(body.user.email, testEmail);
    assert.equal(body.license.tier, 'free');
    assert.ok(body.token);
  });

  test('3. POST /v1/auth/register rejects weak password with 400 Validation Error', async () => {
    const res = await fetch(`${baseUrl}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid@spoorf.app',
        password: 'short' // less than 8 chars
      })
    });

    assert.equal(res.status, 400);
    const body: any = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  test('4. POST /v1/auth/login succeeds and returns signed RS256 token (200 OK)', async () => {
    const sessionId = crypto.randomUUID();
    const res = await fetch(`${baseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        session_id: sessionId,
        platform: 'win32',
        app_version: '2.41.36'
      })
    });

    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.status, 'success');
    assert.ok(body.token);
    authToken = body.token;
    assert.equal(body.license.tier, 'free');
    assert.equal(body.license.max_cuts, 5);
  });

  test('5. GET /v1/auth/me returns authenticated user with valid Bearer token', async () => {
    const res = await fetch(`${baseUrl}/v1/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.status, 'success');
    assert.equal(body.user.email, testEmail);
  });

  test('6. GET /v1/auth/me rejects invalid token with 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/v1/auth/me`, {
      headers: { 'Authorization': `Bearer fake_invalid_token` }
    });

    assert.equal(res.status, 401);
    const body: any = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });

  test('7. POST /v1/auth/heartbeat extends license grace period', async () => {
    const res = await fetch(`${baseUrl}/v1/auth/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({})
    });

    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.status, 'success');
    assert.ok(body.token);
    assert.ok(body.grace_period_until);
  });

  test('8. POST /v1/auth/redeem validates and upgrades user tier to Pro', async () => {
    const voucherKey = `PRO-E2E-${Date.now()}`;
    await prismaTest.licenseKey.create({
      data: {
        key: voucherKey,
        tier: LicenseTier.PRO,
        durationDays: 30
      }
    });

    const res = await fetch(`${baseUrl}/v1/auth/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ key: voucherKey })
    });

    const body: any = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.status, 'success');
    assert.equal(body.license.tier, 'pro');
    assert.equal(body.license.can_throttle, true);

    // Rotated token carries the redeemed tier as signed claims (desktop offline verification)
    assert.ok(body.token);
    const claims = JSON.parse(Buffer.from(body.token.split('.')[1], 'base64url').toString('utf8'));
    assert.equal(claims.tier, 'pro');
    authToken = body.token;
  });

  test('9. POST /v1/auth/logout succeeds and responds with success (200 OK)', async () => {
    const res = await fetch(`${baseUrl}/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({})
    });

    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.status, 'success');
  });
});