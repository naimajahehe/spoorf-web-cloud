import React from 'react';

interface AuthLayoutProps {
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/** Centered paper card used by the sign-in and sign-up pages. */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, description, children, footer }) => (
  <div className="px-4 pt-16 pb-24 sm:pt-20 flex justify-center">
    <div className="w-full max-w-[420px]">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-foreground leading-[1.1] text-balance">
          {title}
        </h1>
        <p className="mt-3 text-sm text-ink/80 leading-relaxed">{description}</p>
      </div>

      <div className="rounded-3xl bg-white border border-border shadow-panel p-6 sm:p-8">{children}</div>

      <p className="mt-6 text-center text-sm text-ink">{footer}</p>
    </div>
  </div>
);

export default AuthLayout;
