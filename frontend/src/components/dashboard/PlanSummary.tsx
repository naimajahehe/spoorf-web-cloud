import React from 'react';
import { Link } from 'react-router-dom';
import { LicenseInfo } from '../../types/auth';
import { TIER_LABELS, formatDate } from '../../utils/format';

const SLOT_LIMITS: Record<string, number> = { free: 1, pro: 2, vip: 5 };

interface PlanSummaryProps {
  license: LicenseInfo | null;
  desktopSessionCount: number;
}

function validityText(tier: string, expiresAt: string | null): string {
  if (!expiresAt) return tier === 'free' ? 'Gratis, tanpa batas waktu' : 'Berlaku tanpa batas waktu';
  const isPast = new Date(expiresAt).getTime() <= Date.now();
  return isPast ? `Paket berbayar berakhir ${formatDate(expiresAt)}` : `Berlaku hingga ${formatDate(expiresAt)}`;
}

/** Plan, device slot usage and feature access in one divided panel. */
export const PlanSummary: React.FC<PlanSummaryProps> = ({ license, desktopSessionCount }) => {
  const tier = (license?.tier || 'free').toLowerCase();
  const maxSlots = SLOT_LIMITS[tier] || 1;
  const usage = Math.min(100, Math.round((desktopSessionCount / maxSlots) * 100));
  const isFull = desktopSessionCount >= maxSlots;
  const maxCuts = license?.max_cuts ?? 5;

  const features = [
    { label: 'Pembatasan kecepatan', enabled: Boolean(license?.can_throttle) },
    { label: 'Smart gateway', enabled: Boolean(license?.can_gateway) },
    { label: 'Auto-reblock', enabled: Boolean(license?.can_autoreblock) },
    { label: 'Deep fingerprint', enabled: Boolean(license?.can_deep_fingerprint) },
    { label: 'Arsenal (VIP)', enabled: Boolean(license?.can_arsenal) },
  ];

  return (
    <section
      aria-label="Ringkasan paket"
      className="rounded-3xl bg-white border border-border shadow-card grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border"
    >
      <div className="p-6">
        <h2 className="text-sm text-ink">Paket</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{TIER_LABELS[tier] || tier}</p>
        <p className="mt-1 text-sm text-ink">{validityText(tier, license?.expires_at ?? null)}</p>
        <p className="mt-3 text-sm text-ink">
          {maxCuts >= 999 ? 'Target diputus tanpa batas' : `Hingga ${maxCuts} target diputus bersamaan`}
        </p>
        {tier === 'free' && (
          <Link
            to="/#pricing"
            className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-4"
          >
            Lihat paket Pro dan VIP
          </Link>
        )}
      </div>

      <div className="p-6">
        <h2 className="text-sm text-ink">Slot perangkat desktop</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {desktopSessionCount}
          <span className="text-lg font-medium text-ink"> dari {maxSlots}</span>
        </p>
        <div
          className="mt-3 h-2 rounded-full bg-surface-muted overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={maxSlots}
          aria-valuenow={desktopSessionCount}
        >
          <div className={`h-full rounded-full ${isFull ? 'bg-status-idle' : 'bg-brand'}`} style={{ width: `${usage}%` }} />
        </div>
        <p className="mt-3 text-sm text-ink leading-relaxed">
          {isFull
            ? 'Semua slot terpakai. Masuk di perangkat baru akan mengeluarkan perangkat yang paling lama tidak aktif.'
            : 'Sesi browser tidak menghitung slot perangkat desktop.'}
        </p>
      </div>

      <div className="p-6">
        <h2 className="text-sm text-ink">Fitur aktif</h2>
        <ul className="mt-3 space-y-2">
          {features.map((feature) => (
            <li key={feature.label} className="flex items-center gap-2 text-sm">
              <span
                className={`w-1.5 h-1.5 rounded-full ${feature.enabled ? 'bg-status-online' : 'bg-ink/25'}`}
                aria-hidden="true"
              />
              <span className={feature.enabled ? 'text-foreground' : 'text-ink/50'}>{feature.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default PlanSummary;
