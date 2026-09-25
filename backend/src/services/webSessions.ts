import { Prisma } from '@prisma/client';
import { LICENSE_TOKEN_TTL_DAYS } from '../utils/cryptoSigner';

/** Sessions created from the web portal. They are revocable but do not use desktop device slots. */
export const WEB_PLATFORM = 'web';

export const WEB_SESSION_EXPIRED_REASON = 'Sesi web kedaluwarsa: token berakhir tanpa logout.';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Kept on top of the token lifetime: lastSeenAt is written moments before a token is signed, and
 * API nodes' clocks can differ slightly. The margin keeps the cleanup from ever expiring a session
 * that could still hold a valid token.
 */
const EXPIRY_MARGIN_MS = 60 * 60 * 1000;

/**
 * The web portal replaces its session id whenever it drops an expired token, so such a web session
 * is never logged out. Once it has gone without a new token for longer than the token lifetime, no
 * token issued for it can still be valid (every issuance refreshes lastSeenAt: login/register
 * upsert, heartbeat, issueSessionToken), so it is marked revoked and stops appearing as active.
 *
 * Must run inside a transaction that already holds the account's `User` row lock, so it orders
 * with bindSession like every other session write for that account.
 */
export async function expireOrphanedWebSessions(
  tx: Prisma.TransactionClient,
  userId: string,
  exceptSessionId?: string
): Promise<number> {
  const { count } = await tx.session.updateMany({
    where: {
      userId,
      platform: WEB_PLATFORM,
      isRevoked: false,
      lastSeenAt: { lt: new Date(Date.now() - LICENSE_TOKEN_TTL_DAYS * DAY_MS - EXPIRY_MARGIN_MS) },
      ...(exceptSessionId ? { sessionId: { not: exceptSessionId } } : {}),
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: WEB_SESSION_EXPIRED_REASON,
    },
  });
  return count;
}
