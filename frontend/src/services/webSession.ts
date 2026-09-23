const WEB_SESSION_KEY = 'spoorf_web_session_id';

/** Platform marker the API uses to keep web sessions out of desktop device slots. */
export const WEB_PLATFORM = 'web';

/**
 * Stable per-browser session id sent on login/register, so the API can bind the
 * token to a revocable session (logout, remote kick, "revoke all").
 */
export const getWebSessionId = (): string => {
  let sessionId: string | null = null;
  try {
    sessionId = localStorage.getItem(WEB_SESSION_KEY);
  } catch {
    // Storage unavailable (private mode): fall through and use an in-memory id.
  }
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    try {
      localStorage.setItem(WEB_SESSION_KEY, sessionId);
    } catch {
      // Ignore; a fresh id per page load still works, it just shows up as a new session.
    }
  }
  return sessionId;
};

const describeBrowser = (): string => {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : '';
  return `Web Portal · ${browser}${os ? ` (${os})` : ''}`;
};

export const getWebSessionPayload = () => ({
  session_id: getWebSessionId(),
  platform: WEB_PLATFORM,
  deviceName: describeBrowser(),
});
