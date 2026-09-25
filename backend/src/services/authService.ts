import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { PrismaClient, Prisma, LicenseTier, License } from '@prisma/client';
import { prisma } from '../config/database';
import { getDefaultCryptoSigner } from '../utils/cryptoSigner';
import { WEB_PLATFORM, expireOrphanedWebSessions } from './webSessions';
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
  session_id?: string;
  sessionId?: string;
  platform?: string;
  app_version?: string;
  deviceName?: string;
  ipAddress?: string;
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

export interface LicensePayload {
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
  license: LicensePayload;
}

export interface HeartbeatResponsePayload {
  status: 'success';
  token: string;
  isRevoked: false;
  grace_period_until: string;
  license: LicensePayload;
}

export interface ProfilePayload {
  user: {
    id: string;
    userId: string;
    email: string;
    name: string;
    role: string;
    tier: string;
    avatar_url: string | null;
  };
  license: LicensePayload;
}

type LicenseFields = Pick<
  License,
  | 'tier'
  | 'maxCuts'
  | 'canThrottle'
  | 'canGateway'
  | 'canAutoreblock'
  | 'canArsenal'
  | 'canDeepFingerprint'
  | 'cloudSync'
  | 'expiresAt'
>;

const DAY_MS = 24 * 60 * 60 * 1000;
const GRACE_PERIOD_MS = 7 * DAY_MS;

export { WEB_PLATFORM };

const CONCURRENT_SESSION_LIMITS: Record<LicenseTier, number> = {
  FREE: 1,
  PRO: 2,
  VIP: 5,
};

const TIER_RANK: Record<LicenseTier, number> = {
  FREE: 0,
  PRO: 1,
  VIP: 2,
};

// Compared against when the email is unknown so login timing does not reveal registered accounts.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('spoorf-timing-equalizer', 10);

function tierTemplate(tier: LicenseTier): Omit<LicenseFields, 'expiresAt'> {
  const isPro = tier === LicenseTier.PRO;
  const isVip = tier === LicenseTier.VIP;
  return {
    tier,
    maxCuts: isVip ? 9999 : isPro ? 999 : 5,
    canThrottle: isPro || isVip,
    canGateway: isPro || isVip,
    canAutoreblock: isPro || isVip,
    canArsenal: isVip,
    canDeepFingerprint: isPro || isVip,
    cloudSync: isPro || isVip,
  };
}

/**
 * A paid license past its `expiresAt` is served as Free. The stored row is left
 * untouched so the user keeps their history and the expiry date stays visible.
 */
export function resolveEffectiveLicense(license: LicenseFields | null | undefined): LicenseFields {
  if (!license) {
    return { ...tierTemplate(LicenseTier.FREE), expiresAt: null };
  }
  const isExpired = license.expiresAt !== null && license.expiresAt.getTime() <= Date.now();
  if (license.tier !== LicenseTier.FREE && isExpired) {
    return { ...tierTemplate(LicenseTier.FREE), expiresAt: license.expiresAt };
  }
  return license;
}

function toLicensePayload(license: LicenseFields, gracePeriodUntil: string): LicensePayload {
  return {
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
  };
}

function newGracePeriodUntil(): string {
  return new Date(Date.now() + GRACE_PERIOD_MS).toISOString();
}

export class AuthService {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  /**
   * Web portal sessions do not occupy a desktop device slot, so their tokens are signed with
   * Free entitlements. Desktop clients trust only these signed claims; otherwise a web login
   * would be an uncounted licensed device. `sessionPlatform` must come from the stored session.
   */
  private signToken(
    user: { id: string; email: string; role: string },
    license: LicenseFields,
    sessionId: string,
    sessionPlatform: string | null,
    gracePeriodUntil: string
  ): string {
    const entitlements: LicenseFields =
      sessionPlatform === WEB_PLATFORM ? { ...tierTemplate(LicenseTier.FREE), expiresAt: null } : license;

    return getDefaultCryptoSigner().signLicenseToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tier: entitlements.tier.toLowerCase() as 'free' | 'pro' | 'vip',
      maxCuts: entitlements.maxCuts,
      canThrottle: entitlements.canThrottle,
      canGateway: entitlements.canGateway,
      canAutoreblock: entitlements.canAutoreblock,
      canArsenal: entitlements.canArsenal,
      canDeepFingerprint: entitlements.canDeepFingerprint,
      cloudSync: entitlements.cloudSync,
      sessionId,
      expiresAt: entitlements.expiresAt ? entitlements.expiresAt.toISOString() : null,
      gracePeriodUntil,
    });
  }

  /**
   * Binds `sessionId` to `userId` and enforces the concurrent desktop device limit.
   * Runs under a per-user row lock so parallel logins cannot exceed the slot limit.
   * Returns the stored platform, which a re-login without `platform` leaves unchanged.
   */
  private async bindSession(
    userId: string,
    email: string,
    tier: LicenseTier,
    sessionId: string,
    meta: { platform?: string; app_version?: string; deviceName?: string; ipAddress?: string }
  ): Promise<string | null> {
    const isWeb = meta.platform === WEB_PLATFORM;

    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;

      await expireOrphanedWebSessions(tx, userId, sessionId);

      if (!isWeb) {
        const maxSlots = CONCURRENT_SESSION_LIMITS[tier] || 1;
        const otherDesktopSessions = await tx.session.findMany({
          where: {
            userId,
            isRevoked: false,
            sessionId: { not: sessionId },
            OR: [{ platform: null }, { platform: { not: WEB_PLATFORM } }],
          },
          orderBy: { lastSeenAt: 'asc' }, // oldest first
        });

        // Keep one slot free for the session that is logging in now.
        if (otherDesktopSessions.length >= maxSlots) {
          const sessionsToKick = otherDesktopSessions.slice(0, otherDesktopSessions.length - maxSlots + 1);
          await tx.session.updateMany({
            where: { id: { in: sessionsToKick.map((s) => s.id) } },
            data: {
              isRevoked: true,
              revokedAt: new Date(),
              revokedReason: `Sesi dicabut otomatis karena batas login bersamaan (${maxSlots} perangkat) terlampaui oleh login baru.`,
            },
          });
          for (const sess of sessionsToKick) {
            logger.info(`🚫 [Session Kick] Kicked session ${sess.sessionId.substring(0, 8)}... for user ${email}`);
          }
        }
      }

      // Re-login on the same device reactivates its session. A different account logging in
      // on the same device takes the session over; the previous owner's token then fails
      // authGuard's ownership check and is treated as revoked.
      const session = await tx.session.upsert({
        where: { sessionId },
        update: {
          userId,
          isRevoked: false,
          revokedAt: null,
          revokedReason: null,
          lastSeenAt: new Date(),
          platform: meta.platform || undefined,
          appVersion: meta.app_version || undefined,
          deviceName: meta.deviceName || undefined,
          ipAddress: meta.ipAddress || undefined,
        },
        create: {
          userId,
          sessionId,
          platform: meta.platform || null,
          appVersion: meta.app_version || null,
          deviceName: meta.deviceName || null,
          ipAddress: meta.ipAddress || null,
          isRevoked: false,
          lastSeenAt: new Date(),
        },
      });
      return session.platform;
    });
  }

  /**
   * Register a new user with a Free license and an initial session.
   * Web clients send their own `session_id`; one is generated when omitted.
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
          create: tierTemplate(LicenseTier.FREE),
        },
      },
      include: { license: true },
    });

    const sessionId = dto.session_id || dto.sessionId || crypto.randomUUID();
    const license = resolveEffectiveLicense(user.license);
    const sessionPlatform = await this.bindSession(user.id, user.email, license.tier, sessionId, {
      platform: dto.platform || WEB_PLATFORM,
      app_version: dto.app_version,
      deviceName: dto.deviceName,
      ipAddress: dto.ipAddress,
    });

    const gracePeriodUntil = newGracePeriodUntil();
    return {
      status: 'success',
      token: this.signToken(user, license, sessionId, sessionPlatform, gracePeriodUntil),
      user: {
        id: user.id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        avatar_url: null,
      },
      license: toLicensePayload(license, gracePeriodUntil),
    };
  }

  /**
   * Authenticate user, enforce concurrent session slot limits ("Kick Mechanism"),
   * and issue signed RS256 token matching desktop contract.
   */
  public async login(dto: LoginDto): Promise<AuthResponsePayload> {
    const cleanEmail = dto.email.trim().toLowerCase();
    const clientSessionId = dto.session_id || dto.sessionId || dto.hwid;

    if (!clientSessionId) {
      throw new BadRequestError('session_id wajib disertakan untuk mengikat token ke perangkat.');
    }
    if (!dto.password && !dto.token) {
      throw new BadRequestError('Kata sandi atau token otentikasi wajib disertakan.');
    }

    const user = await this.db.user.findUnique({
      where: { email: cleanEmail },
      include: { license: true },
    });

    if (!user) {
      if (dto.password) {
        await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
      }
      throw new UnauthorizedError('Email atau kata sandi tidak valid.');
    }

    if (dto.password) {
      const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedError('Email atau kata sandi tidak valid.');
      }
    } else {
      await this.assertReusableToken(dto.token!, user.id, clientSessionId);
    }

    const license = resolveEffectiveLicense(user.license);
    const sessionPlatform = await this.bindSession(user.id, user.email, license.tier, clientSessionId, dto);

    const gracePeriodUntil = newGracePeriodUntil();
    return {
      status: 'success',
      token: this.signToken(user, license, clientSessionId, sessionPlatform, gracePeriodUntil),
      user: {
        id: user.id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        avatar_url: null,
      },
      license: toLicensePayload(license, gracePeriodUntil),
    };
  }

  /**
   * Token re-login is only allowed for the same user and the same, still active session.
   * Otherwise a kicked device could re-login with its old token and kick the others back.
   */
  private async assertReusableToken(token: string, userId: string, sessionId: string): Promise<void> {
    let decoded: { userId?: string; sessionId?: string };
    try {
      decoded = getDefaultCryptoSigner().verifyLicenseToken(token);
    } catch {
      throw new UnauthorizedError('Sesi token tidak valid atau telah kedaluwarsa.');
    }

    if (decoded.userId !== userId || decoded.sessionId !== sessionId) {
      throw new UnauthorizedError('Token tidak cocok dengan akun atau perangkat ini.');
    }

    const session = await this.db.session.findUnique({ where: { sessionId } });
    if (!session || session.userId !== userId || session.isRevoked) {
      throw new SessionRevokedError(
        session?.revokedReason || 'Sesi perangkat ini telah dicabut. Silakan login kembali dengan kata sandi.'
      );
    }
  }

  /**
   * Heartbeat to extend grace period, rotate the token, return the live license
   * and detect kicked sessions. `sessionId` must come from the verified token.
   */
  public async sessionHeartbeat(userId: string, sessionId?: string): Promise<HeartbeatResponsePayload> {
    if (!sessionId) {
      throw new UnauthorizedError('Token tidak terikat ke sesi perangkat. Silakan login kembali.');
    }

    const session = await this.db.session.findUnique({
      where: { sessionId },
    });

    if (!session || session.userId !== userId || session.isRevoked) {
      throw new SessionRevokedError(
        session?.revokedReason || 'Sesi Anda telah dicabut karena login di perangkat lain.'
      );
    }

    await this.db.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });

    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: { license: true },
    });

    if (!user) {
      throw new NotFoundError('Pengguna tidak ditemukan');
    }

    const license = resolveEffectiveLicense(user.license);
    const gracePeriodUntil = newGracePeriodUntil();

    return {
      status: 'success',
      token: this.signToken(user, license, sessionId, session.platform, gracePeriodUntil),
      isRevoked: false,
      grace_period_until: gracePeriodUntil,
      license: toLicensePayload(license, gracePeriodUntil),
    };
  }

  /**
   * Fresh signed token for an existing session, e.g. after a redeem changed the tier.
   * Desktop clients derive their offline license from these verified claims.
   */
  public async issueSessionToken(userId: string, sessionId: string): Promise<string> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: { license: true },
    });

    if (!user) {
      throw new NotFoundError('Pengguna tidak ditemukan');
    }

    const session = await this.db.session.findUnique({ where: { sessionId } });
    if (session) {
      // Issuing a token is activity; web-session cleanup relies on lastSeenAt tracking every token.
      await this.db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
    }
    // Fail closed: this token is only issued for a session authGuard already validated, so a
    // missing row is anomalous — sign Free (as for a web session) instead of paid entitlements.
    const sessionPlatform = session ? session.platform : WEB_PLATFORM;
    return this.signToken(
      user,
      resolveEffectiveLicense(user.license),
      sessionId,
      sessionPlatform,
      newGracePeriodUntil()
    );
  }

  /**
   * Profile with the live license from the database (token claims can be stale).
   */
  public async getProfile(userId: string): Promise<ProfilePayload> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: { license: true },
    });

    if (!user) {
      throw new NotFoundError('Pengguna tidak ditemukan');
    }

    const license = resolveEffectiveLicense(user.license);
    return {
      user: {
        id: user.id,
        userId: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        role: user.role,
        tier: license.tier.toLowerCase(),
        avatar_url: null,
      },
      license: toLicensePayload(license, newGracePeriodUntil()),
    };
  }

  /**
   * Redeem license voucher key (e.g. "PRO-SENTINEL-XXXX") to upgrade account tier.
   * The voucher is claimed atomically, so concurrent requests can use it only once.
   * Redemptions for one account are serialized so each extends the license it just read.
   */
  public async redeemLicenseKey(userId: string, rawKey: string): Promise<LicensePayload> {
    const cleanKey = rawKey.trim().toUpperCase();

    const updated = await this.db.$transaction(async (tx) => {
      // Same per-user lock as bindSession: without it, parallel redemptions read the same
      // expiresAt and the last write discards the other vouchers' days.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;

      const voucher = await tx.licenseKey.findUnique({
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

      const current = resolveEffectiveLicense(await tx.license.findUnique({ where: { userId } }));
      const isSameActiveTier = current.tier === voucher.tier;

      if (TIER_RANK[current.tier] > TIER_RANK[voucher.tier]) {
        throw new BadRequestError('Akun Anda sudah memiliki lisensi dengan tier lebih tinggi yang masih aktif.');
      }
      if (isSameActiveTier && current.tier !== LicenseTier.FREE && current.expiresAt === null) {
        throw new BadRequestError('Lisensi Anda untuk tier ini sudah berlaku tanpa batas waktu.');
      }

      const claimed = await tx.licenseKey.updateMany({
        where: { id: voucher.id, isUsed: false },
        data: {
          isUsed: true,
          usedByUserId: userId,
          usedAt: new Date(),
        },
      });

      if (claimed.count !== 1) {
        throw new BadRequestError('Kode voucher lisensi ini sudah pernah digunakan.');
      }

      // Redeeming the tier you already have extends it instead of resetting the clock.
      const startsAt =
        isSameActiveTier && current.expiresAt && current.expiresAt.getTime() > Date.now()
          ? current.expiresAt.getTime()
          : Date.now();
      const durationDays = voucher.durationDays || 30;
      const licenseData = {
        ...tierTemplate(voucher.tier),
        expiresAt: new Date(startsAt + durationDays * DAY_MS),
      };

      return tx.license.upsert({
        where: { userId },
        update: licenseData,
        create: { userId, ...licenseData },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });

    return toLicensePayload(updated, newGracePeriodUntil());
  }

  /**
   * Logout the device session bound to the caller's token.
   */
  public async logout(userId: string, sessionId?: string): Promise<void> {
    if (!sessionId) return;
    await this.db.session.updateMany({
      where: { sessionId, userId, isRevoked: false },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'Pengguna melakukan logout manual dari aplikasi.',
      },
    });
  }
}
