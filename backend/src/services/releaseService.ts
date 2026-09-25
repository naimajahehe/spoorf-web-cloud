import { env } from '../config/env';

export interface DesktopRelease {
  version: string;
  platform: string;
  filename: string;
  fileSizeBytes: number;
  releaseDate: string;
  releaseNotes: string;
  /** Null until an installer is hosted; clients must not build a URL themselves. */
  downloadUrl: string | null;
}

export interface LatestReleaseResponse {
  available: boolean;
  release: DesktopRelease;
}

/** Latest Windows build produced by desktop-electron (electron-builder NSIS). */
const LATEST_DESKTOP_RELEASE: Omit<DesktopRelease, 'downloadUrl'> = {
  version: '2.41.82',
  platform: 'windows-x64',
  filename: 'Spoorf Sentinel Setup 2.41.82.exe',
  fileSizeBytes: 103946681,
  releaseDate: '2026-09-23',
  releaseNotes:
    'Offline RS256 license verification, locked-down packaged builds, session race guards, and license keys redeemed through Spoorf Cloud.',
};

export class ReleaseService {
  private downloadUrl: string | undefined;

  constructor(downloadUrl: string | undefined = env.DESKTOP_DOWNLOAD_URL) {
    this.downloadUrl = downloadUrl;
  }

  public getLatestRelease(): LatestReleaseResponse {
    const downloadUrl = this.downloadUrl || null;
    return {
      available: downloadUrl !== null,
      release: { ...LATEST_DESKTOP_RELEASE, downloadUrl },
    };
  }
}

export const releaseService = new ReleaseService();
export default releaseService;
