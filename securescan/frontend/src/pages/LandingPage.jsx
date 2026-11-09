import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Radar,
  Lock,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  FileText,
  Layers,
  Terminal,
  Cpu,
  X,
  Database,
  Globe2,
} from 'lucide-react';
import ScoreGauge from '../components/ScoreGauge';
import SeverityBadge from '../components/SeverityBadge';

export default function LandingPage() {
  const [targetUrl, setTargetUrl] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showArchModal, setShowArchModal] = useState(false);
  const navigate = useNavigate();

  const handleStartScan = (e) => {
    e.preventDefault();
    const url = targetUrl.trim() || 'stripe.com';
    navigate(`/scanner?target=${encodeURIComponent(url)}`);
  };

  const sampleTargets = ['stripe.com', 'github.com', 'cloudflare.com', 'apple.com'];

  const sampleChecks = [
    { name: 'HTTPS & TLS 1.3 Negotiation', status: 'pass', detail: 'Negotiated TLS 1.3 • Cipher: TLS_AES_256_GCM_SHA384' },
    { name: 'SSL Certificate Validity', status: 'pass', detail: 'DigiCert Global Root CA • 214 days remaining on trust chain' },
    { name: 'Strict-Transport-Security (HSTS)', status: 'pass', detail: 'RFC 6797 compliant • max-age=31536000 • includeSubDomains active' },
    { name: 'Content-Security-Policy (CSP)', status: 'warning', detail: "script-src missing strict nonce/hash directives (W3C CSP Level 3)" },
    { name: 'X-Frame-Options Redress Defense', status: 'pass', detail: 'DENY policy enforced • Mitigates clickjacking framing attacks' },
    { name: 'Cookie Security Attributes', status: 'pass', detail: 'Secure, HttpOnly, and SameSite=Lax verified on Set-Cookie' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFD] text-slate-900 font-sans antialiased selection:bg-indigo-500/15 selection:text-indigo-900">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              SecureScan
            </span>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              ENGINE v2.4
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowArchModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-colors"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              <span>System Design</span>
            </button>
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/scanner"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-xs transition-all active:scale-[0.98]"
            >
              Launch Console
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-16 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Deterministic Passive Web Security Audit</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Automated website security audit <br className="hidden sm:inline" />
            and configuration compliance.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Audit SSL/TLS ciphers, strict transport policies (HSTS), Content Security Policy directives, and cookie flags with zero downtime risk. Non-invasive passive assessment with copyable Nginx and Apache fixes.
          </p>

          {/* Interactive URL Scan Input Form */}
          <form
            onSubmit={handleStartScan}
            className="mt-8 max-w-xl mx-auto p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row gap-2"
          >
            <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus-within:bg-white focus-within:border-indigo-600 transition-all">
              <span className="font-mono text-xs text-slate-400 select-none mr-1.5 font-bold">
                https://
              </span>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="stripe.com"
                className="w-full bg-transparent font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
            >
              <Radar className="w-4 h-4" />
              <span>Audit Target</span>
            </button>
          </form>

          {/* Quick-test Interactive Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-slate-500">
            <span className="font-medium text-slate-400">Sample targets:</span>
            {sampleTargets.map((site) => (
              <button
                key={site}
                type="button"
                onClick={() => setTargetUrl(site)}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-mono text-[11px] hover:border-indigo-300 hover:text-indigo-600 shadow-2xs transition-colors cursor-pointer"
              >
                {site}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Live Posture Preview */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* Card Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Diagnostic Assessment Snapshot</h2>
              <p className="text-xs text-slate-500 mt-0.5">Passive inspection report for sample production endpoint</p>
            </div>

            {/* Interactive Mode Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'overview'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Scorecard
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('checks')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'checks'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Diagnostic Checks
              </button>
            </div>
          </div>

          {/* Tab 1: Overview Scorecard */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-6">
              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50/70 border border-slate-100 rounded-xl">
                <ScoreGauge score={88} grade="B+" size={120} />
                <span className="mt-3 font-semibold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  Strong Security Baseline
                </span>
              </div>

              <div className="md:col-span-8 flex flex-col gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[11px] text-slate-500 font-medium">Protocols</span>
                    <p className="text-base font-bold text-indigo-600 mt-0.5">TLS 1.3</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[11px] text-slate-500 font-medium">SSL Expiry</span>
                    <p className="text-base font-bold text-emerald-600 mt-0.5">214 days</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[11px] text-slate-500 font-medium">HSTS Header</span>
                    <p className="text-base font-bold text-emerald-600 mt-0.5">1 Year</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[11px] text-slate-500 font-medium">Passed Checks</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">11 / 13</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 border border-indigo-100/60 rounded-lg text-xs">
                  <span className="text-slate-700 font-medium">
                    Strict CSP nonce configuration will elevate this endpoint to <strong>Grade A (94/100)</strong>.
                  </span>
                  <Link to="/scanner" className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    <span>Audit Website</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Checks List */}
          {activeTab === 'checks' && (
            <div className="flex flex-col gap-2.5 pt-6">
              {sampleChecks.map((chk, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{chk.name}</span>
                    <span className="text-slate-500 text-[11px] font-mono mt-0.5">{chk.detail}</span>
                  </div>
                  <SeverityBadge severity={chk.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3 Engineering Core Pillars */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Engineered for DevSecOps and Infrastructure Teams</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Rigorous RFC standards compliance without intrusive probing or server stress.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mt-1">13 Passive RFC Checks</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Audits TLS cipher negotiation, HSTS Preload list eligibility, CSP Level 3 directives, cookie attributes, and technology stack leaks.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mt-1">Zero Downtime Risk</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              100% non-invasive passive inspection. Anti-SSRF DNS pinning prevents internal network leakage with zero exploit payloads.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mt-1">Automated PDF & Code Fixes</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generates executive PDF compliance briefs alongside ready-to-paste Nginx, Apache, FastAPI, and Cloudflare configuration snippets.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">SecureScan</span>
            <span className="text-slate-400">• Passive Web Security Engineering</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowArchModal(true)}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              System Design
            </button>
            <Link to="/scanner" className="hover:text-slate-900 transition-colors">Scanner</Link>
            <Link to="/dashboard" className="hover:text-slate-900 transition-colors">Dashboard</Link>
            <Link to="/customization" className="hover:text-slate-900 transition-colors">Preferences</Link>
            <Link to="/login" className="hover:text-slate-900 transition-colors">Login</Link>
          </div>
          <span className="text-[11px] text-slate-400">Deterministic RFC Compliance Engine</span>
        </div>
      </footer>

      {/* Engineering Architecture & System Design Modal */}
      {showArchModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowArchModal(false)}
          />
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  SecureScan System Architecture & Engineering
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowArchModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-slate-800">
                <span className="font-bold text-indigo-900 block mb-1">
                  Deterministic & Standards-Based (Zero AI Hallucinations)
                </span>
                <p className="text-xs">
                  SecureScan uses 100% deterministic, standards-based verification against published RFCs (RFC 8446 TLS 1.3, RFC 6797 HSTS, RFC 6265bis Cookie Flags) and OWASP Application Security Verification Standards (ASVS v4.0).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                    High-Concurrency Backend
                  </span>
                  <p className="text-[11px] text-slate-500">
                    FastAPI + Python 3.14 async runtime utilizing <code>httpx</code> for asynchronous HTTP/2 multiplexing, non-blocking TLS socket handshakes, and strict connection timeouts.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    Multi-Tier SSRF Defense
                  </span>
                  <p className="text-[11px] text-slate-500">
                    DNS resolution with strict IP pinning blocks RFC 1918 private ranges, AWS/GCP cloud metadata IPs (<code>169.254.169.254</code>), loopback (<code>127.0.0.1</code>), and DNS rebinding.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-600" />
                    Cloud Storage & DB
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Supabase PostgreSQL with JSONB audit schemas, indexed scan histories, and bucket-based ReportLab PDF report generation and download streams.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
                    Enterprise Frontend
                  </span>
                  <p className="text-[11px] text-slate-500">
                    React 18 SPA with Tailwind CSS, custom preference persistence (theme, density, hotkeys, localization), Recharts responsive analytics, and WCAG AA contrast.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowArchModal(false)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-xs"
              >
                Close Spec
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
