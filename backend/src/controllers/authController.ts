import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { ForbiddenError } from '../errors/AppError';

const sessionIdField = z.string().trim().min(8, 'session_id tidak valid').max(128);

const deviceMetaFields = {
  session_id: sessionIdField.optional(),
  sessionId: sessionIdField.optional(),
  platform: z.string().max(32).optional(),
  app_version: z.string().max(32).optional(),
  deviceName: z.string().max(100).optional(),
};

export const registerSchema = z.object({
  email: z.string().email('Format email tidak valid').max(255),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter').max(72, 'Kata sandi maksimal 72 karakter'),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100).optional(),
  ...deviceMetaFields,
});

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().max(200).optional(),
  token: z.string().max(4096).optional(),
  hwid: sessionIdField.optional(),
  ...deviceMetaFields,
});

export const heartbeatSchema = z.object({
  session_id: z.string().optional(),
  sessionId: z.string().optional(),
});

export const redeemSchema = z.object({
  key: z.string().min(5, 'Format kode lisensi tidak valid').max(50),
});

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService = new AuthService()) {
    this.authService = authService;
  }

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register({ ...req.body, ipAddress: req.ip });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // req.ip honours the `trust proxy` setting; raw X-Forwarded-For is client-controlled.
      const result = await this.authService.login({ ...req.body, ipAddress: req.ip });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public heartbeat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const tokenSessionId = req.sessionContext?.sessionId;
      const bodySessionId = req.body.session_id || req.body.sessionId;

      // The session is taken from the verified token; the body value is only a consistency check
      // kept for desktop clients that still send it.
      if (bodySessionId && bodySessionId !== tokenSessionId) {
        throw new ForbiddenError('session_id tidak cocok dengan sesi pada token.');
      }

      const result = await this.authService.sessionHeartbeat(userId, tokenSessionId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public redeem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const updatedLicense = await this.authService.redeemLicenseKey(userId, req.body.key);
      // authGuard guarantees a bound session; the rotated token carries the new tier as signed claims.
      const token = await this.authService.issueSessionToken(userId, req.sessionContext!.sessionId!);
      res.status(200).json({
        status: 'success',
        message: 'Kode voucher lisensi berhasil diaktivasi.',
        token,
        license: updatedLicense,
      });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.logout(req.user!.userId, req.sessionContext?.sessionId);
      res.status(200).json({
        status: 'success',
        message: 'Berhasil logout.',
      });
    } catch (error) {
      next(error);
    }
  };

  public getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.authService.getProfile(req.user!.userId);
      res.status(200).json({
        status: 'success',
        ...profile,
      });
    } catch (error) {
      next(error);
    }
  };
}
