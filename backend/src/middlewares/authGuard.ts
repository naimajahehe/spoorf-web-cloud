import { Request, Response, NextFunction } from 'express';
import { getDefaultCryptoSigner } from '../utils/cryptoSigner';
import { UnauthorizedError, ForbiddenError, SessionRevokedError } from '../errors/AppError';
import { prisma } from '../config/database';

export interface AuthContextUser {
  userId: string;
  email: string;
  role?: string;
  tier?: string;
}

export interface AuthContextSession {
  sessionId?: string;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthContextUser;
      sessionContext?: AuthContextSession;
      requestId?: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Format token autentikasi tidak valid. Gunakan format: Bearer <token>');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedError('Token otentikasi kosong');
    }

    const signer = getDefaultCryptoSigner();
    let decoded: any;
    try {
      decoded = signer.verifyLicenseToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token otentikasi telah kedaluwarsa. Silakan login kembali.');
      }
      throw new UnauthorizedError('Token otentikasi tidak sah atau telah dimodifikasi.');
    }

    // Check if session has been revoked (Kick Mechanism)
    if (decoded.sessionId) {
      const dbSession = await prisma.session.findUnique({
        where: { sessionId: decoded.sessionId }
      });

      if (dbSession && dbSession.isRevoked) {
        throw new SessionRevokedError(
          dbSession.revokedReason || 'Sesi Anda telah dicabut karena login baru di perangkat lain.'
        );
      }
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      tier: decoded.tier || 'free'
    };

    req.sessionContext = {
      sessionId: decoded.sessionId
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Otentikasi diperlukan');
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Hak akses tidak mencukupi untuk menjalankan aksi ini.');
    }

    next();
  };
}