import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple instances of Prisma Client in development
  var __prisma: PrismaClient | undefined;
}

/**
 * Refuse to run the test suite against a non-test database. Tests create and
 * delete rows freely, so pointing them at dev/staging data is destructive.
 */
function assertTestDatabase(url: string | undefined): void {
  if (process.env.NODE_ENV !== 'test') return;
  let dbName = '';
  try {
    dbName = url ? new URL(url).pathname.replace(/^\//, '') : '';
  } catch {
    // fall through to the error below
  }
  if (!dbName.endsWith('_test')) {
    throw new Error(
      `[Database] NODE_ENV=test but resolved database "${dbName || 'unknown'}" is not a *_test database. ` +
      'Set TEST_DATABASE_URL to a dedicated test database.'
    );
  }
}

export function createPrismaClient(urlOverride?: string): PrismaClient {
  const effectiveUrl = urlOverride || (process.env.NODE_ENV === 'test' && process.env.TEST_DATABASE_URL ? process.env.TEST_DATABASE_URL : undefined);
  assertTestDatabase(effectiveUrl || process.env.DATABASE_URL);
  return new PrismaClient({
    datasources: effectiveUrl ? { db: { url: effectiveUrl } } : undefined,
    log: process.env.NODE_ENV === 'development'
      ? ['warn', 'error']
      : ['error'],
  });
}

export const prisma = global.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

/**
 * Health check probe to verify database connectivity with timeout.
 */
export async function pingDatabase(client: PrismaClient = prisma, timeoutMs: number = 3000): Promise<boolean> {
  try {
    const checkPromise = client.$queryRawUnsafe('SELECT 1 as alive;');
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database ping timeout')), timeoutMs);
    });

    await Promise.race([checkPromise, timeoutPromise]);
    return true;
  } catch (err) {
    console.error('❌ [Database] Health check failed:', err);
    return false;
  }
}

/**
 * Graceful disconnect handler for clean shutdown.
 */
export async function disconnectDatabase(client: PrismaClient = prisma): Promise<void> {
  try {
    await client.$disconnect();
  } catch (err) {
    console.error('Error disconnecting Prisma:', err);
  }
}