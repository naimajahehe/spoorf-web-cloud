import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { UserProfile, LicenseInfo, AuthResponse } from '../types/auth';

export interface AuthContextType {
  user: UserProfile | null;
  license: LicenseInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'spoorf_cloud_token';
const USER_KEY = 'spoorf_cloud_user';
const LICENSE_KEY = 'spoorf_cloud_license';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  });
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(USER_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [license, setLicense] = useState<LicenseInfo | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LICENSE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Parse raw user payload to conform with UserProfile interface
  const parseUserProfile = useCallback((rawUser: any): UserProfile => {
    return {
      id: rawUser.id || rawUser.userId || '',
      email: rawUser.email || '',
      name: rawUser.name || (rawUser.email ? rawUser.email.split('@')[0] : 'Operator'),
      role: rawUser.role || 'user',
      avatar_url: rawUser.avatar_url || null,
    };
  }, []);

  // Parse raw license payload to conform with LicenseInfo interface
  const parseLicenseInfo = useCallback((rawLicense: any, userTierFallback?: string): LicenseInfo => {
    if (rawLicense) {
      return {
        tier: (rawLicense.tier || userTierFallback || 'free').toLowerCase(),
        max_cuts:
          rawLicense.max_cuts ??
          (rawLicense.tier === 'vip' ? 9999 : rawLicense.tier === 'pro' ? 999 : 5),
        can_throttle: Boolean(rawLicense.can_throttle),
        can_gateway: Boolean(rawLicense.can_gateway),
        can_autoreblock: Boolean(rawLicense.can_autoreblock),
        can_arsenal: Boolean(rawLicense.can_arsenal),
        can_deep_fingerprint: Boolean(rawLicense.can_deep_fingerprint),
        cloud_sync: Boolean(rawLicense.cloud_sync),
        expires_at: rawLicense.expires_at || null,
        grace_period_until: rawLicense.grace_period_until || '',
      };
    }

    const tier = (userTierFallback || 'free').toLowerCase();
    const isPro = tier === 'pro';
    const isVip = tier === 'vip';
    return {
      tier,
      max_cuts: isVip ? 9999 : isPro ? 999 : 5,
      can_throttle: isPro || isVip,
      can_gateway: isPro || isVip,
      can_autoreblock: isPro || isVip,
      can_arsenal: isVip,
      can_deep_fingerprint: isPro || isVip,
      cloud_sync: isPro || isVip,
      expires_at: null,
      grace_period_until: '',
    };
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get<{ status: string; user: any; license?: any }>('/auth/me');
      if (response.data && response.data.user) {
        const parsedUser = parseUserProfile(response.data.user);
        const parsedLicense = parseLicenseInfo(response.data.license, response.data.user.tier);
        setUser(parsedUser);
        setLicense(parsedLicense);
        localStorage.setItem(USER_KEY, JSON.stringify(parsedUser));
        localStorage.setItem(LICENSE_KEY, JSON.stringify(parsedLicense));
      }
    } catch (error) {
      console.error('[AuthContext] Gagal memperbarui profil pengguna:', error);
      throw error;
    }
  }, [parseUserProfile, parseLicenseInfo]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      const { token: newToken, user: rawUser, license: rawLicense } = response.data;

      const parsedUser = parseUserProfile(rawUser);
      const parsedLicense = parseLicenseInfo(rawLicense, rawUser?.role);

      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(parsedUser));
      localStorage.setItem(LICENSE_KEY, JSON.stringify(parsedLicense));

      setToken(newToken);
      setUser(parsedUser);
      setLicense(parsedLicense);
    },
    [parseUserProfile, parseLicenseInfo]
  );

  const register = useCallback(
    async (email: string, password: string, name?: string): Promise<void> => {
      const payload: { email: string; password: string; name?: string } = { email, password };
      if (name) payload.name = name;

      const response = await api.post<AuthResponse>('/auth/register', payload);
      const { token: newToken, user: rawUser, license: rawLicense } = response.data;

      const parsedUser = parseUserProfile(rawUser);
      const parsedLicense = parseLicenseInfo(rawLicense);

      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(parsedUser));
      localStorage.setItem(LICENSE_KEY, JSON.stringify(parsedLicense));

      setToken(newToken);
      setUser(parsedUser);
      setLicense(parsedLicense);
    },
    [parseUserProfile, parseLicenseInfo]
  );

  const logout = useCallback((): void => {
    // Notify server of logout (fire and forget)
    api.post('/auth/logout').catch(() => {});

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LICENSE_KEY);

    setToken(null);
    setUser(null);
    setLicense(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<{ status: string; user: any; license?: any }>('/auth/me');
        if (response.data && response.data.user) {
          const parsedUser = parseUserProfile(response.data.user);
          const parsedLicense = parseLicenseInfo(response.data.license, response.data.user.tier);
          setUser(parsedUser);
          setLicense(parsedLicense);
          localStorage.setItem(USER_KEY, JSON.stringify(parsedUser));
          localStorage.setItem(LICENSE_KEY, JSON.stringify(parsedLicense));
        }
      } catch (error) {
        console.error('[AuthContext] Sesi kedaluwarsa atau token tidak valid:', error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(LICENSE_KEY);
        setToken(null);
        setUser(null);
        setLicense(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [parseUserProfile, parseLicenseInfo]);

  const isAuthenticated = useMemo(() => {
    return Boolean(token && user);
  }, [token, user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      license,
      token,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, license, token, isAuthenticated, isLoading, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
