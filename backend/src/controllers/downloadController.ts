import { Request, Response } from 'express';

export class DownloadController {
  public getLatestRelease = (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      release: {
        version: '2.41.79',
        platform: 'windows-x64',
        filename: 'Spoorf Sentinel Setup 1.0.0.exe',
        downloadUrl: '/downloads/Spoorf%20Sentinel%20Setup%201.0.0.exe',
        fileSizeBytes: 98566144,
        releaseDate: '2026-09-21',
        releaseNotes:
          'Background heartbeat engine, 7-day sliding grace period window, remote kick reconciler, and anti-self-cut security guards.',
      },
    });
  };
}

export const downloadController = new DownloadController();
export default downloadController;
