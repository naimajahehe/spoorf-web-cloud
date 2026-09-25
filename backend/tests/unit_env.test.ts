import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { envSchema } from '../src/config/env';

/**
 * DESKTOP_DOWNLOAD_URL is opened via window.open on the client, so the schema must reject
 * non-http(s) schemes (javascript:, data:) that z.string().url() otherwise accepts.
 */
describe('Env Schema Suite (DESKTOP_DOWNLOAD_URL scheme allowlist)', () => {
  const base = { DATABASE_URL: 'postgresql://u:p@localhost:5432/spoorf_cloud?schema=public' };

  test('1. accepts an https installer URL', () => {
    const result = envSchema.safeParse({ ...base, DESKTOP_DOWNLOAD_URL: 'https://dl.example.com/app.exe' });
    assert.equal(result.success, true);
  });

  test('2. rejects a javascript: URL', () => {
    const result = envSchema.safeParse({ ...base, DESKTOP_DOWNLOAD_URL: 'javascript:alert(1)' });
    assert.equal(result.success, false);
  });

  test('3. rejects a data: URL', () => {
    const result = envSchema.safeParse({ ...base, DESKTOP_DOWNLOAD_URL: 'data:text/html,<script>1</script>' });
    assert.equal(result.success, false);
  });

  test('4. treats an empty string as unset', () => {
    const result = envSchema.safeParse({ ...base, DESKTOP_DOWNLOAD_URL: '' });
    assert.equal(result.success, true);
    assert.equal(result.success && result.data.DESKTOP_DOWNLOAD_URL, undefined);
  });
});
