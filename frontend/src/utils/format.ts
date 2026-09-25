const PLATFORM_LABELS: Record<string, string> = {
  win32: 'Windows',
  darwin: 'macOS',
  linux: 'Linux',
  web: 'Browser',
};

export const TIER_LABELS: Record<string, string> = { free: 'Free', pro: 'Pro', vip: 'VIP' };

export function platformLabel(platform: string | null | undefined): string {
  if (!platform) return 'Desktop';
  return PLATFORM_LABELS[platform] || platform;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

/** "Baru saja", "5 menit lalu", "3 jam lalu", "2 hari lalu", then a short date. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return 'Tidak diketahui';
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return 'Tidak diketahui';

  const minutes = Math.floor((Date.now() - time) / 60_000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(iso);
}
