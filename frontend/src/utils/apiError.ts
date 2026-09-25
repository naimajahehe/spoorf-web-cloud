/**
 * Human-readable message from an API error envelope ({ success: false, error: { message, details } }).
 * Shared by the auth pages and the dashboard so every screen reports failures the same way.
 */
export function getApiErrorMessage(err: any, fallback: string): string {
  const payload = err?.response?.data?.error;

  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.details) && payload.details.length > 0) {
      return payload.details.map((d: any) => d?.message || String(d)).join(' ');
    }
    if (typeof payload.message === 'string' && payload.message) return payload.message;
  }
  if (typeof err?.response?.data?.message === 'string') return err.response.data.message;
  if (!err?.response) return 'Server tidak dapat dihubungi. Periksa koneksi internet lalu coba lagi.';
  return fallback;
}
