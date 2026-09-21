import bcrypt from 'bcryptjs';
import { PrismaClient, LicenseTier } from '@prisma/client';
import { prisma } from '../config/database';
import { getDefaultCryptoSigner } from '../utils/cryptoSigner';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  SessionRevokedError,
  NotFoundError,
} from '../errors/AppError';
import { logger } from '../utils/logger';

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password?: string;
  token?: string;
  session_id?: string;
  sessionId?: string;
  hwid?: string;
  platform?: string;
  app_version?: string;
  deviceName?: string;
  ipAddress?: string;
}

export interface AuthResponsePayload {
  status: 'success';
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  license: {
    tier: string;
    max_cuts: number;
    can_throttle: boolean;
    can_gateway: boolean;
    can_autoreblock: boolean;
    can_arsenal: boolean;
    can_deep_fingerprint: boolean;
    cloud_sync: boolean;
    expires_at: string | null;
    grace_period_until: string;
  };
}

const CONCURRENT_SESSION_LIMITS: Record<LicenseTier, number> = {
  FREE: 1,
  PRO: 2,
  VIP: 5,
};

export class AuthService {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  /**
   * Register a new user and automatically assign standard Free tier license.
   */
  public async register(dto: RegisterDto): Promise<AuthResponsePayload> {
    const cleanEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new ConflictError('Email sudah terdaftar. Silakan login.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.db.user.create({
      data: {
        email: cleanEmail,
        name: dto.name?.trim() || cleanEmail.split('@')[0],
        passwordHash,
        license: {
          create: {
            tier: LicenseTier.FREE,
            maxCuts: 5,
            canThrottle: false,
            canGateway: false,
            canAutoreblock: false,
            canArsenal: false,
            canDeepFingerprint: false,
            cloudSync: false,
          },
        },
      },
      include: { license: true },
    });

    const gracePeriodUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const signer = getDefaultCryptoSigner();
    const token = signer.signLicenseToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tier: 'free',
      maxCuts: 5,
      canThrottle: false,
      canGateway: false,
      canAutoreblock: false,
      canArsenal: false,
      canDeepFingerprint: false,
      cloudSync: false,
      gracePeriodUntil,
    });

    return {
      status: 'success',
      token,
      user: {
        id: user.id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        avatar_url: null,
      },
      license: {
        tier: 'free',
        max_cuts: 5,
        can_throttle: false,
        can_gateway: false,
        can_autoreblock: false,
        can_arsenal: false,
        can_deep_fingerprint: false,
        cloud_sync: false,
        expires_at: null,
        grace_period_until: gracePeriodUntil,
      },
    };
  }

  /**
   * Authenticate user, enforce concurrent session slot limits ("Kick Mechanism"),
   * and issue signed RS256 token matching desktop contract.
   */
  public async login(dto: LoginDto): Promise<AuthResponsePayload> {
    const cleanEmail = dto.email.trim().toLowerCase();
    const clientSessionId = dto.session_id || dto.sessionId || dto.hwid;

    const user = await this.db.user.findUnique({
      where: { email: cleanEmail },
      include: { license: true },
    });

    if (!user) {
      throw new UnauthorizedError('Email atau kata sandi tidak valid.');
    }

    if (dto.password) {
      const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedError('Email atau kata sandi tidak valid.');
      }
    } else if (dto.token) {
      try {
        const signer = getDefaultCryptoSigner();
        const decoded = signer.verifyLicenseToken(dto.token);
        if (decoded.email.toLowerCase() !== cleanEmail) {
          throw new UnauthorizedError('Token tidak cocok dengan akun email');
        }
      } catch {
        throw new UnauthorizedError('Sesi token tidak valid atau telah kedaluwarsa.');
      }
    } else {
      throw new BadRequestError('Kata sandi atau token otentikasi wajib disertakan.');
    }

    const license = user.license || {
      tier: LicenseTier.FREE,
      maxCuts: 5,
      canThrottle: false,
      canGateway: false,
      canAutoreblock: false,
      canArsenal: false,
      canDeepFingerprint: false,
      cloudSync: false,
      expiresAt: null,
    };

    // --- Concurrent Session Slot Enforcement ("Kick Mechanism") ---
    if (clientSessionId) {
      const maxSlots = CONCURRENT_SESSION_LIMITS[license.tier] || 1;

      // Find other active, unrevoked sessions for this user (excluding the current session)
      const otherActiveSessions = await this.db.session.findMany({
        where: {
          userId: user.id,
          isRevoked: false,
          sessionId: { not: clientSessionId },
        },
        orderBy: { lastSeenAt: 'asc' }, // oldest first
      });

      // If active sessions reach or exceed max allowed slots (saving 1 slot for this new session)
      if (otherActiveSessions.length >= maxSlots) {
        const excessCount = otherActiveSessions.length - maxSlots + 1;
        const sessionsToKick = otherActiveSessions.slice(0, excessCount);

        for (const sess of sessionsToKick) {
          await this.db.session.update({
            where: { id: sess.id },
            data: {
              isRevoked: true,
              revokedAt: new Date(),
              revokedReason: `Sesi dicabut otomatis karena batas login bersamaan (${maxSlots} perangkat) terlampaui oleh login baru.`,
            },
          });
          logger.info(`🚫 [Session Kick] Kicked session ${sess.sessionId.substring(0, 8)}... for user ${user.email}`);
        }
      }

      // Upsert current session
      await this.db.session.upsert({
        where: { sessionId: clientSessionId },
        update: {
          userId: user.id, // Reassign to current authenticated user upon device login
          isRevoked: false,
          revokedAt: null,
          revokedReason: null,
          lastSeenAt: new Date(),
          platform: dto.platform || undefined,
          appVersion: dto.app_version || undefined,
          deviceName: dto.deviceName || undefined,
          ipAddress: dto.ipAddress || undefined,
        },
        create: {
          userId: user.id,
          sessionId: clientSessionId,
          platform: dto.platform || null,
          appVersion: dto.app_version || null,
          deviceName: dto.deviceName || null,
          ipAddress: dto.ipAddress || null,
          isRevoked: false,
          lastSeenAt: new Date(),
        },
      });
    }

    const gracePeriodUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const signer = getDefaultCryptoSigner();
    const token = signer.signLicenseToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tier: license.tier.toLowerCase() as any,
      maxCuts: license.maxCuts,
      canThrottle: license.canThrottle,
      canGateway: license.canGateway,
      canAutoreblock: license.canAutoreblock,
      canArsenal: license.canArsenal,
      canDeepFingerprint: license.canDeepFingerprint,
      cloudSync: license.cloudSync,
      sessionId: clientSessionId,
      expiresAt: license.expiresAt ? license.expiresAt.toISOString() : null,
      gracePeriodUntil,
    });

    return {
      status: 'success',
      token,
      user: {
        id: user.id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        avatar_url: null,
      },
      license: {
        tier: license.tier.toLowerCase(),
        max_cuts: license.maxCuts,
        can_throttle: license.canThrottle,
        can_gateway: license.canGateway,
        can_autoreblock: license.canAutoreblock,
        can_arsenal: license.canArsenal,
        can_deep_fingerprint: license.canDeepFingerprint,
        cloud_sync: license.cloudSync,
        expires_at: license.expiresAt ? license.expiresAt.toISOString() : null,
        grace_period_until: gracePeriodUntil,
      },
    };
  }

  /**
   * Heartbeat to extend grace period and check if session was kicked.
   */
  public async sessionHeartbeat(userId: string, sessionId?: string): Promise<{
    status: 'success';
    token: string;
    isRevoked: boolean;
    grace_period_until: string;
  }> {
    if (sessionId) {
      const session = await this.db.session.findUnique({
        where: { sessionId },
      });

      if (session && session.isRevoked) {
        throw new SessionRevokedError(
          session.revokedReason || 'Sesi Anda telah dicabut karena login di perangkat lain.'
        );
      }

      if (session) {
        await this.db.session.update({
          where: { id: session.id },
          data: {
            userId,
            lastSeenAt: new Date(),
          },
        });
      }
    }

    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: { license: true },
    });

    if (!user) {
      throw new NotFoundError('Pengguna tidak ditemukan');
    }

    const license = user.license || {
      tier: LicenseTier.FREE,
      maxCuts: 5,
      canThrottle: false,
      canGateway: false,
      canAutoreblock: false,
      canArsenal: false,
      canDeepFingerprint: false,
      cloudSync: false,
      expiresAt: null,
    };

    const gracePeriodUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const signer = getDefaultCryptoSigner();
    const token = signer.signLicenseToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tier: license.tier.toLowerCase() as any,
      maxCuts: license.maxCuts,
      canThrottle: license.canThrottle,
      canGateway: license.canGateway,
      canAutoreblock: license.canAutoreblock,
      canArsenal: license.canArsenal,
      canDeepFingerprint: license.canDeepFingerprint,
      cloudSync: license.cloudSync,
      sessionId,
      expiresAt: license.expiresAt ? license.expiresAt.toISOString() : null,
      gracePeriodUntil,
    });

    return {
      status: 'success',
      token,
      isRevoked: false,
      grace_period_until: gracePeriodUntil,
    };
  }

  /**
   * Redeem license voucher key (e.g. "PRO-SENTINEL-XXXX") to upgrade account tier.
   */
  public async redeemLicenseKey(userId: string, rawKey: string): Promise<AuthResponsePayload['license']> {
    const cleanKey = rawKey.trim().toUpperCase();

    const voucher = await this.db.licenseKey.findUnique({
      where: { key: cleanKey },
    });

    if (!voucher) {
      throw new BadRequestError('Kode voucher lisensi tidak ditemukan.');
    }

    if (voucher.isUsed) {
      throw new BadRequestError('Kode voucher lisensi ini sudah pernah digunakan.');
    }

    if (voucher.expiresAt && voucher.expiresAt.getTime() < Date.now()) {
      throw new BadRequestError('Kode voucher lisensi telah kedaluwarsa.');
    }

    // Determine target tier attributes
    const targetTier = voucher.tier;
    const durationDays = voucher.durationDays || 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const isPro = targetTier === LicenseTier.PRO;
    const isVip = targetTier === LicenseTier.VIP;

    await this.db.$transaction([
      this.db.licenseKey.update({
        where: { id: voucher.id },
        data: {
          isUsed: true,
          usedByUserId: userId,
          usedAt: new Date(),
        },
      }),
      this.db.license.upsert({
        where: { userId },
        update: {
          tier: targetTier,
          maxCuts: isVip ? 9999 : isPro ? 999 : 5,
          canThrottle: isPro || isVip,
          canGateway: isPro || isVip,
          canAutoreblock: isPro || isVip,
          canArsenal: isVip,
          canDeepFingerprint: isPro || isVip,
          cloudSync: isPro || isVip,
          expiresAt,
        },
        create: {
          userId,
          tier: targetTier,
          maxCuts: isVip ? 9999 : isPro ? 999 : 5,
          canThrottle: isPro || isVip,
          canGateway: isPro || isVip,
          canAutoreblock: isPro || isVip,
          canArsenal: isVip,
          canDeepFingerprint: isPro || isVip,
          cloudSync: isPro || isVip,
          expiresAt,
        },
      }),
    ]);

    const updatedLicense = await this.db.license.findUnique({
      where: { userId },
    });

    return {
      tier: updatedLicense!.tier.toLowerCase(),
      max_cuts: updatedLicense!.maxCuts,
      can_throttle: updatedLicense!.canThrottle,
      can_gateway: updatedLicense!.canGateway,
      can_autoreblock: updatedLicense!.canAutoreblock,
      can_arsenal: updatedLicense!.canArsenal,
      can_deep_fingerprint: updatedLicense!.canDeepFingerprint,
      cloud_sync: updatedLicense!.cloudSync,
      expires_at: updatedLicense!.expiresAt ? updatedLicense!.expiresAt.toISOString() : null,
      grace_period_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Logout current device session.
   */
  public async logout(sessionId?: string): Promise<void> {
    if (sessionId) {
      await this.db.session.updateMany({
        where: { sessionId },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'Pengguna melakukan logout manual dari aplikasi.',
        },
      });
    }
  }
}