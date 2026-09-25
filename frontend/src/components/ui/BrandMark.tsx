import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

interface BrandMarkProps {
  to?: string;
  /** Small tag next to the wordmark ("Fleet" on the landing page, "Console" in the app). */
  tag?: string;
}

/** Brand monogram shared by the landing and console navbars. */
export const BrandMark: React.FC<BrandMarkProps> = ({ to = '/', tag = 'Fleet' }) => (
  <Link
    to={to}
    className="flex items-center gap-2.5 group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
  >
    <span className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
      <Shield className="w-4 h-4 text-brand" />
    </span>
    <span className="flex items-center gap-1.5">
      <span className="font-sans font-bold tracking-tight text-foreground text-sm">SPOORF</span>
      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-brand/10 text-brand font-semibold tracking-wider">
        {tag}
      </span>
    </span>
    <span className="w-2 h-2 rounded-full bg-emerald-600 status-pulse ml-0.5" aria-hidden="true" />
  </Link>
);

export default BrandMark;
