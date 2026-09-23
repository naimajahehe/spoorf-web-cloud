import React, { useState, useEffect } from 'react';
import { Download, Shield, Laptop, CheckCircle2, ArrowRight, HardDrive, Cpu, Terminal } from 'lucide-react';
import { api } from '../services/api';

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
  {
    title: 'Sistem Operasi',
    desc: 'Windows 10 / Windows 11 (64-bit Architecture)',
  },
  {
    title: 'Driver Injeksi L2',
    desc: 'Npcap 1.70+ (Mode instalasi "WinPcap API-compatible" aktif)',
  },
  {
    title: 'Lingkungan Eksekusi',
    desc: 'Python 3.11+ Runtime (Sudah terintegrasi otomatis dalam installer)',
  },
  {
    title: 'Antarmuka Jaringan',
    desc: 'Adapter Wi-Fi 802.11ac/ax atau Gigabit Ethernet dengan mode promiscuous',
  },
  {
    title: 'Hak Akses Sistem',
    desc: 'Hak Administrator Lokal (Dibutuhkan untuk raw socket & manipulasi ARP)',
  },
  {
    title: 'Kapasitas Perangkat Keras',
    desc: 'RAM minimal 4 GB & ruang penyimpanan kosong minimal 500 MB',
  },
];

const RELEASE_HIGHLIGHTS = [
  {
    title: 'Background Heartbeat Engine',
    desc: 'Sinkronisasi berkala 7 hari sliding grace window untuk verifikasi lisensi offline tanpa interupsi operasional.',
  },
  {
    title: 'Remote Kick & Session Reconciler',
    desc: 'Deteksi real-time pembatalan sesi jarak jauh melalui portal web dengan notifikasi edukatif otomatis.',
  },
  {
    title: 'Anti-Self-Cut & Gateway Immunity',
    desc: 'Invarian mutlak L2 engine yang secara preventif memblokir penargetan default gateway router dan adapter operator.',
  },
  {
    title: 'PWM Bandwidth Throttling',
    desc: 'Manipulasi kecepatan transfer data target LAN secara presisi berbasis Scapy Layer 2 stateful injector.',
  },
];

export const DownloadPage: React.FC = () => {
  const [release, setRelease] = useState<ReleaseMetadata>(FALLBACK_RELEASE);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchLatestRelease = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/download/latest');
        if (isMounted && response.data?.release) {
          setRelease(response.data.release);
        }
      } catch (error) {
        // Tetap gunakan fallback data jika request gagal atau offline
        console.warn('Gagal memuat rilis terbaru dari server, menggunakan data fallback lokal:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLatestRelease();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (!bytes || isNaN(bytes)) return '94.0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    const rawBase = api.defaults.baseURL || '';
    const serverOrigin = rawBase.replace(/\/v1\/?$/, '');
    const downloadUrl = release.downloadUrl.startsWith('http')
      ? release.downloadUrl
      : `${serverOrigin}${release.downloadUrl}`;

    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Sentinel Cyber Ambient Glow Backgrounds */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-20 pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        {/* Page Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-400">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>SPOORF SENTINEL DESKTOP SUITE</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-mono">
            Unduh <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Spoorf Sentinel</span> Desktop
          </h1>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Aplikasi desktop Layer 2 network manipulation, ARP throttling, dan discovery engine dengan kontrol lisensi cloud terdesentralisasi.
          </p>
        </div>

        {/* Primary Download Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden group">
          {/* Subtle Accent Glow */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all duration-500 pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Info: Laptop Icon & App Details */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
                  <Laptop className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-2xl font-bold text-white font-mono">
                      Spoorf Sentinel Client
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
                      v{release.version}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
                      {release.platform}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 font-mono">
                    Berkas: <span className="text-slate-200">{release.filename}</span>
                  </p>
                </div>
              </div>

              {/* Technical Specifications Pill List */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ukuran Berkas</span>
                  </div>
                  <div className="text-sm font-semibold text-white font-mono">
                    {formatFileSize(release.fileSizeBytes)}
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono mb-1">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Arsitektur</span>
                  </div>
                  <div className="text-sm font-semibold text-white font-mono">
                    x86-64 / AMD64
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono mb-1">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Rilis Tanggal</span>
                  </div>
                  <div className="text-sm font-semibold text-white font-mono">
                    {release.releaseDate}
                  </div>
                </div>
              </div>

              {/* Security Invariant Guarantee */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Terverifikasi RS256 &middot; Zero HWID Tracking &middot; Anti-Self-Cut Guard Built-in</span>
              </div>
            </div>

            {/* Right CTA: Download Action Button & Direct Trigger */}
            <div className="lg:col-span-5 flex flex-col items-stretch sm:items-center lg:items-end justify-center gap-4">
              <button
                onClick={handleDownload}
                disabled={isLoading}
                className="w-full sm:w-auto min-w-[240px] px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base font-mono shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group/btn"
              >
                <Download className="w-5 h-5 text-slate-950 group-hover/btn:-translate-y-0.5 transition-transform" />
                <span>Unduh Sekarang</span>
                <ArrowRight className="w-4 h-4 text-slate-950 group-hover/btn:translate-x-1 transition-transform" />
              </button>

              <div className="text-center lg:text-right space-y-1">
                <p className="text-xs text-slate-400 font-mono">
                  MD5 / SHA-256 Checksum otomatis divalidasi
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  Memerlukan hak administrator saat pemasangan Npcap
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Requirements & Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* System Requirements List with CheckCircle2 Icons */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-mono">
                  Persyaratan Sistem
                </h3>
                <p className="text-xs text-slate-400">
                  Spesifikasi minimum agar Spoorf Sentinel berjalan optimal
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {SYSTEM_REQUIREMENTS.map((req, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-slate-200">
                      {req.title}
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed">
                      {req.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Release Notes Section with Shield Icon */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-mono">
                  Catatan Rilis (v{release.version})
                </h3>
                <p className="text-xs text-slate-400">
                  Peningkatan keamanan, arsitektur, dan stabilitas kernel
                </p>
              </div>
            </div>

            {/* Release Description Summary */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-mono">
              {release.releaseNotes}
            </div>

            {/* Highlighted Architectural Features */}
            <div className="space-y-3.5 pt-1">
              {RELEASE_HIGHLIGHTS.map((hl, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-200">
                      {hl.title}
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed">
                      {hl.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
