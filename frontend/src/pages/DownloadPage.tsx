import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Check, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { buttonClass } from '../components/ui/button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface ReleaseMetadata {
  version: string;
  platform: string;
  filename: string;
  downloadUrl: string;
  fileSizeBytes: number;
  releaseDate: string;
  releaseNotes: string;
}

const FALLBACK_RELEASE: ReleaseMetadata = {
  version: '2.41.79',
  platform: 'windows-x64',
  filename: 'Spoorf Sentinel Setup 1.0.0.exe',
  downloadUrl: '/downloads/Spoorf%20Sentinel%20Setup%201.0.0.exe',
  fileSizeBytes: 98566144,
  releaseDate: '2026-09-21',
  releaseNotes:
    'Background heartbeat engine, 7-day sliding grace period window, remote kick reconciler, and anti-self-cut security guards.',
};

const SYSTEM_REQUIREMENTS = [
  { title: 'Sistem operasi', desc: 'Windows 10 atau Windows 11 (64-bit)' },
  { title: 'Driver injeksi L2', desc: 'Npcap 1.70+ dengan mode "WinPcap API-compatible" aktif' },
  { title: 'Lingkungan eksekusi', desc: 'Python 3.11+ (sudah termasuk dalam installer)' },
  { title: 'Antarmuka jaringan', desc: 'Wi-Fi 802.11ac/ax atau Gigabit Ethernet dengan mode promiscuous' },
  { title: 'Hak akses', desc: 'Administrator lokal, untuk raw socket dan manipulasi ARP' },
  { title: 'Perangkat keras', desc: 'RAM minimal 4 GB dan ruang kosong minimal 500 MB' },
];

const RELEASE_HIGHLIGHTS = [
  {
    title: 'Background heartbeat engine',
    desc: 'Sinkronisasi berkala dengan masa tenggang 7 hari untuk verifikasi lisensi tanpa mengganggu operasi.',
  },
  {
    title: 'Remote kick & session reconciler',
    desc: 'Pencabutan sesi dari portal web terdeteksi cepat, lengkap dengan pemberitahuan ke pengguna.',
  },
  {
    title: 'Anti-self-cut & gateway immunity',
    desc: 'Gateway router dan perangkat operator tidak akan pernah menjadi target, mencegah gangguan tak disengaja.',
  },
  {
    title: 'PWM bandwidth throttling',
    desc: 'Batasi kecepatan perangkat target secara presisi berbasis Scapy Layer 2.',
  },
];

export const DownloadPage: React.FC = () => {
  const [release, setRelease] = useState<ReleaseMetadata>(FALLBACK_RELEASE);

  useDocumentTitle('Unduh aplikasi');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const response = await api.get('/download/latest');
        if (isMounted && response.data?.release) setRelease(response.data.release);
      } catch {
        // Keep the bundled fallback metadata when the server is unreachable.
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const sizeMb = release.fileSizeBytes ? (release.fileSizeBytes / (1024 * 1024)).toFixed(0) : '94';

  const handleDownload = () => {
    const base = (api.defaults.baseURL || '').replace(/\/v1\/?$/, '');
    const url = release.downloadUrl.startsWith('http') ? release.downloadUrl : `${base}${release.downloadUrl}`;
    window.open(url, '_blank', 'noopener');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      <header className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-foreground leading-[1.1] text-balance">
          Unduh <span className="font-serif italic font-normal text-brand">Spoorf Sentinel</span> untuk desktop
        </h1>
        <p className="mt-3 text-sm sm:text-base text-ink/80 leading-relaxed">
          Aplikasi Layer 2 untuk deteksi perangkat, pembatasan bandwidth, dan kontrol jaringan lokal, dengan lisensi
          yang tersinkron ke akun cloud Anda.
        </p>
      </header>

      {/* Download card */}
      <section className="rounded-3xl bg-white border border-border shadow-panel p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Spoorf Sentinel Client</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-brand/10 text-brand">v{release.version}</span>
            </div>
            <p className="mt-1 text-sm text-ink">{release.filename}</p>
            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <dt className="text-ink/60">Ukuran</dt>
                <dd className="font-medium text-foreground">{sizeMb} MB</dd>
              </div>
              <div>
                <dt className="text-ink/60">Arsitektur</dt>
                <dd className="font-medium text-foreground">{release.platform}</dd>
              </div>
              <div>
                <dt className="text-ink/60">Rilis</dt>
                <dd className="font-medium text-foreground">{release.releaseDate}</dd>
              </div>
            </dl>
          </div>

          <div className="shrink-0">
            <button type="button" onClick={handleDownload} className={buttonClass('primary', 'lg')}>
              <Download className="w-4 h-4" />
              Unduh untuk Windows
            </button>
            <p className="mt-2 text-xs text-ink/60 text-center">Butuh akses administrator saat memasang Npcap.</p>
          </div>
        </div>
      </section>

      {/* Two-column detail */}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-3xl bg-white border border-border shadow-card p-6 sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Persyaratan sistem</h2>
          <ul className="mt-4 space-y-4">
            {SYSTEM_REQUIREMENTS.map((req) => (
              <li key={req.title} className="flex gap-3">
                <Check className="w-4 h-4 mt-0.5 text-brand shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-foreground">{req.title}</p>
                  <p className="text-sm text-ink">{req.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-white border border-border shadow-card p-6 sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Yang baru di v{release.version}</h2>
          <ul className="mt-4 space-y-4">
            {RELEASE_HIGHLIGHTS.map((item) => (
              <li key={item.title}>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-ink">{item.desc}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="text-center text-sm text-ink">
        Belum punya akun?{' '}
        <Link to="/register" className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-4">
          Daftar gratis <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </p>
    </div>
  );
};

export default DownloadPage;
