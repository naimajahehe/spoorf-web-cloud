import { PrismaClient, Session } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError } from '../errors/AppError';
import { logger } from '../utils/logger';

export interface EnrichedSession extends Session {
  is_online: boolean;
}

export interface RevokeSessionResponse {
  success: boolean;
  message: string;
}

export interface RevokeAllSessionsResponse {
  success: boolean;
  revokedCount: number;
  message: string;
}

/** 5 minutes threshold to determine whether a device is currently online */
const ONLINE_HEARTBEAT_THRESHOLD_MS = 5 * 60 * 1000;

export class SessionService {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  /**
   * Retrieves all device sessions belonging to a user, sorted by lastSeenAt DESC,
   * enriched with the computed `is_online` status.
   */
  public async getUserSessions(userId: string): Promise<EnrichedSession[]> {
    const sessions = await this.db.session.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });

    const now = Date.now();

    return sessions.map((session) => {
      const lastSeenTime = new Date(session.lastSeenAt).getTime();
      const is_online = !session.isRevoked && (now - lastSeenTime < ONLINE_HEARTBEAT_THRESHOLD_MS);

      return {
        ...session,
        is_online,
      };
    });
  }

  /**
   * Revokes a specific session belonging to the user by its database id or client sessionId.
   * Enforces multi-tenant isolation by verifying user ownership.
   */
  public async revokeSession(userId: string, identifier: string): Promise<RevokeSessionResponse> {
    const session = await this.db.session.findFirst({
      where: {
        userId,
        OR: [
          { id: identifier },
          { sessionId: identifier },
        ],
      },
    });

    if (!session) {
      throw new NotFoundError('Sesi tidak ditemukan atau Anda tidak memiliki akses.');
    }

    await this.db.session.update({
      where: { id: session.id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'Dicabut secara manual oleh pengguna melalui Web Dashboard',
      },
    });

    logger.info(`🚫 [Session Revoke] Revoked session ${session.sessionId} for user ${userId}`);

    return {
      success: true,
      message: 'Sesi berhasil dicabut.',
    };
  }

  /**
   * Revokes all currently active sessions for a user.
   */
  public async revokeAllSessions(userId: string): Promise<RevokeAllSessionsResponse> {
    const result = await this.db.session.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'Dicabut secara manual oleh pengguna melalui Web Dashboard',
      },
    });

    logger.info(`🚫 [Session Revoke All] Revoked ${result.count} active sessions for user ${userId}`);

    return {
      success: true,
      revokedCount: result.count,
      message: `${result.count} sesi aktif berhasil dicabut.`,
    };
  }
}

export const sessionService = new SessionService();
export default sessionService;
