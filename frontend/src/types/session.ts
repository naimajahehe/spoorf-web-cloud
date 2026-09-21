export interface DeviceSession {
  id: string;
  userId: string;
  sessionId: string;
  deviceName: string;
  platform: string;
  appVersion: string;
  ipAddress: string | null;
  isRevoked: boolean;
  revokedAt: string | null;
  revokedReason: string | null;
  lastSeenAt: string;
  createdAt: string;
  is_online: boolean;
}

export interface SessionListResponse {
  success: boolean;
  sessions: DeviceSession[];
}

export interface RevokeResponse {
  success: boolean;
  message: string;
  revokedCount?: number;
}
