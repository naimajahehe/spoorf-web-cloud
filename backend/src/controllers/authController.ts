import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';

export const registerSchema = z.object({
  email: z.string().email('Format email tidak valid').max(255),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter').max(100),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().optional(),
  token: z.string().optional(),
  session_id: z.string().optional(),
  sessionId: z.string().optional(),
  hwid: z.string().optional(),
  platform: z.string().optional(),
  app_version: z.string().optional(),
  deviceName: z.string().optional(),
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
      const result = await this.authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || undefined;
      const result = await this.authService.login({
        ...req.body,
        ipAddress,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public heartbeat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const sessionId = req.body.session_id || req.body.sessionId || req.sessionContext?.sessionId;
      const result = await this.authService.sessionHeartbeat(userId, sessionId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public redeem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const updatedLicense = await this.authService.redeemLicenseKey(userId, req.body.key);
      res.status(200).json({
        status: 'success',
        message: 'Kode voucher lisensi berhasil diaktivasi.',
        license: updatedLicense,
      });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.body?.session_id || req.body?.sessionId || req.sessionContext?.sessionId;
      await this.authService.logout(sessionId);
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
      res.status(200).json({
        status: 'success',
        user: req.user,
      });
    } catch (error) {
      next(error);
    }
  };
}