import { resetWebSessionId } from './webSession';

export const TOKEN_KEY = 'spoorf_cloud_token';
export const USER_KEY = 'spoorf_cloud_user';
export const LICENSE_KEY = 'spoorf_cloud_license';

/**
 * Forget the signed-in account in this browser (logout, rejected token). The web
 * session id is replaced as well, so a later login cannot revive the revoked session.
 */
export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LICENSE_KEY);
  resetWebSessionId();
}
