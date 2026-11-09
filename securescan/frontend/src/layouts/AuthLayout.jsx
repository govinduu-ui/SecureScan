import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-cyber-base text-cyber-text flex flex-col justify-between relative overflow-hidden font-sans selection:bg-cyber-cyan/15 selection:text-cyber-text">
      {/* Background Subtle Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-70 pointer-events-none" />

      {/* Top Header Branding (Logo Removed) */}
      <header className="p-6 relative z-10 flex items-center justify-between max-w-6xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-cyber-text leading-none">
              SECURESCAN
            </span>
            <span className="font-mono text-[10px] text-cyber-text-secondary uppercase tracking-widest mt-0.5">
              Platform SecOps
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-cyber-cyan font-semibold px-2.5 py-1 rounded-[4px] bg-cyber-overlay border border-cyber-border">
            SEC-PORTAL V2.4
          </span>
        </div>
      </header>

      {/* Center Auth Outlet */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <Outlet />
      </main>

      {/* Footer Disclaimer */}
      <footer className="p-6 relative z-10 text-center">
        <p className="font-mono text-[11px] text-cyber-text-muted">
          SecureScan Platform • Automated Non-Intrusive Security Assessment Engine
        </p>
      </footer>
    </div>
  );
}
