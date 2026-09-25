import { Request, Response } from 'express';
import releaseService, { ReleaseService } from '../services/releaseService';

export class DownloadController {
  private releaseService: ReleaseService;

  constructor(service: ReleaseService = releaseService) {
    this.releaseService = service;
  }

  public getLatestRelease = (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      ...this.releaseService.getLatestRelease(),
    });
  };
}

export const downloadController = new DownloadController();
export default downloadController;
