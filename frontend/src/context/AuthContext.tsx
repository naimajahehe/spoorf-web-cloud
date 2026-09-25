import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import api from '../services/api';
import { getWebSessionPayload } from '../services/webSession';
import { TOKEN_KEY, USER_KEY, LICENSE_KEY, clearStoredAuth } from '../services/authStorage';
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
      const response = await api.post<AuthResponse>('/auth/login', { email, password, ...getWebSessionPayload() });
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

  const register = useCallback(
    async (email: string, password: string, name?: string): Promise<void> => {
      const payload: { email: string; password: string; name?: string } = { email, password, ...getWebSessionPayload() };
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
    // Revoke the server session (fire and forget). The token is passed explicitly because
    // axios request interceptors run after this function has already cleared storage.
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      // `{}` rather than null: axios would send the JSON literal "null", which express.json rejects.
      api.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${currentToken}` } }).catch(() => {});
    }

    clearStoredAuth();

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
        // Keep the cached session on network/server errors; only a rejected token logs out.
        if (!axios.isAxiosError(error) || error.response?.status !== 401) {
          console.warn('[AuthContext] Gagal memverifikasi sesi, memakai data tersimpan:', error);
          return;
        }
        console.error('[AuthContext] Sesi kedaluwarsa atau token tidak valid:', error);
        clearStoredAuth();
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
