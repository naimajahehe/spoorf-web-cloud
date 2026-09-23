import { Request, Response, NextFunction } from 'express';
import sessionService, { SessionService } from '../services/sessionService';

export class SessionController {
  private sessionService: SessionService;

  constructor(service: SessionService = sessionService) {
    this.sessionService = service;
  }

  public getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const sessions = await this.sessionService.getUserSessions(userId);
      res.status(200).json({
        success: true,
        sessions,
      });
    } catch (err) {
      next(err);
    }
  };

  public revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const result = await this.sessionService.revokeSession(userId, id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  public revokeAllSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const result = await this.sessionService.revokeAllSessions(userId, req.sessionContext?.sessionId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const sessionController = new SessionController();
export default sessionController;
