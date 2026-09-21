export type LicenseTier = 'free' | 'pro' | 'vip';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string | null;
}

export interface LicenseInfo {
  tier: LicenseTier | string;
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

export interface AuthResponse {
  status: string;
  token: string;
  user: UserProfile;
  license: LicenseInfo;
}
