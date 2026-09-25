// End-to-end regression test for web portal logout (2026-09-25 audit).
//
// Requires the frontend and the backend to be running, e.g. against the test database:
//   backend : NODE_ENV=test PORT=4100 CLIENT_URL=http://localhost:3100 npx tsx src/server.ts
//   frontend: VITE_API_URL=http://localhost:4100/v1 npx vite --port 3100 --strictPort
//   run     : APP_URL=http://localhost:3100 API_URL=http://localhost:4100/v1 npm run test:e2e
//
// Checks that logging out revokes the browser's session on the server, and that logging in
// again from the same browser does not bring the revoked token back to life.
import { chromium } from 'playwright';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/v1';
const email = `e2e_web_${Date.now()}@spoorf.app`;
const password = 'Password123!';

const failures = [];
const check = (condition, message) => {
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${message}`);
  if (!condition) failures.push(message);
};

const meStatus = async (token) =>
  (await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })).status;

async function waitForStatus(token, expected, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let status = await meStatus(token);
  while (status !== expected && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    status = await meStatus(token);
  }
  return status;
}

async function login(page) {
  await page.goto(`${APP_URL}/login`);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await page.waitForURL('**/dashboard');
  return page.evaluate(() => ({
    token: localStorage.getItem('spoorf_cloud_token'),
    sessionId: localStorage.getItem('spoorf_web_session_id'),
  }));
}

const register = await fetch(`${API_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
if (!register.ok) {
  console.error(`Could not register ${email}: HTTP ${register.status}`);
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();

  const first = await login(page);
  check(Boolean(first.token), 'login stores a token');
  check((await meStatus(first.token)) === 200, 'token is accepted after login');

  await page.getByRole('button', { name: 'Keluar' }).click();
  await page.waitForURL('**/login');
  check((await waitForStatus(first.token, 401)) === 401, 'logout revokes the session on the server');

  const second = await login(page);
  check(second.sessionId !== first.sessionId, 'login after logout uses a new web session id');
  check((await meStatus(first.token)) === 401, 'the revoked token stays revoked after logging in again');
  check((await meStatus(second.token)) === 200, 'the new token is accepted');

  // Remote revoke ("Putuskan semua" from another device): the browser drops its token on the
  // next 401 and must not revive the revoked session when the user signs in again.
  const other = await (
    await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, session_id: crypto.randomUUID(), platform: 'web' }),
    })
  ).json();
  await fetch(`${API_URL}/sessions/revoke-all`, { method: 'POST', headers: { Authorization: `Bearer ${other.token}` } });
  check((await meStatus(second.token)) === 401, 'remote revoke invalidates the browser session');

  await page.goto(`${APP_URL}/dashboard`);
  await page.waitForURL('**/login');
  const third = await login(page);
  check(third.sessionId !== second.sessionId, 'login after a remote revoke uses a new web session id');
  check((await meStatus(second.token)) === 401, 'the remotely revoked token stays revoked after logging in again');
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll session revocation checks passed.');
