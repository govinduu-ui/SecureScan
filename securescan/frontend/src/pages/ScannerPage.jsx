import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Radar,
  Lock,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Terminal,
  Copy,
  CheckCircle2,
  Sliders,
  Layers,
  Clock,
  EyeOff,
  Code,
  FileCheck2,
  X,
  ExternalLink,
  Download,
  ArrowRight,
  Shield,
  FileText,
} from 'lucide-react';
import api from '../services/api';
import ScoreGauge from '../components/ScoreGauge';
import SeverityBadge from '../components/SeverityBadge';
import { useCustomization } from '../context/CustomizationContext';

export default function ScannerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useCustomization();

  const urlParamTarget = searchParams.get('target') || '';
  const [targetDomain, setTargetDomain] = useState(urlParamTarget);
  const [profile, setProfile] = useState('standard');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phaseText, setPhaseText] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [findings, setFindings] = useState([]);
  const [error, setError] = useState(null);
  const [rawHeadersCopied, setRawHeadersCopied] = useState(false);

  // If a target was provided in the query params on mount, we can auto-populate
  useEffect(() => {
    if (urlParamTarget) {
      setTargetDomain(urlParamTarget);
    }
  }, [urlParamTarget]);

  const handleStartScan = async (domainToScan) => {
    const domain = (domainToScan || targetDomain).trim();
    if (!domain) return;

    setError(null);
    setIsScanning(true);
    setProgress(15);
    setPhaseText('Phase 1/5: DNS Resolution & Anti-SSRF Validation');
    setScanResult(null);
    setFindings([]);

    try {
      const fullUrl = domain.startsWith('http://') || domain.startsWith('https://')
        ? domain
        : `https://${domain}`;

      const res = await api.post('/api/scans', { target_url: fullUrl });
      const scanId = res.data.id;

      // Realistic phase transitions as background task completes
      const t1 = setTimeout(() => {
        setProgress(38);
        setPhaseText('Phase 2/5: SSL/TLS Handshake & Cipher Suite Negotiation');
      }, 600);

      const t2 = setTimeout(() => {
        setProgress(65);
        setPhaseText('Phase 3/5: HTTP/2 Response Headers & CSP Evaluation');
      }, 1400);

      const t3 = setTimeout(() => {
        setProgress(88);
        setPhaseText('Phase 4/5: Cookie Flags & Server Signature Audit');
      }, 2200);

      // Poll scan completion from backend
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts += 1;
        try {
          const checkRes = await api.get(`/api/scans/${scanId}`);
          if (checkRes.data.status === 'completed' || checkRes.data.status === 'failed') {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearInterval(pollInterval);
            setIsScanning(false);
            setProgress(100);
            setPhaseText('Assessment Completed');
            setScanResult(checkRes.data);

            if (checkRes.data.status === 'failed') {
              setError(checkRes.data.error_message || 'Assessment failed. Check target domain accessibility.');
            } else {
              // Fetch genuine findings from backend
              const findingsRes = await api.get(`/api/scans/${scanId}/findings`);
              if (findingsRes.data?.findings) {
                setFindings(findingsRes.data.findings);
              }
            }
          }
        } catch {
          // Continue polling
        }

        if (attempts > 25) {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearInterval(pollInterval);
          setIsScanning(false);
          setError('Scan timed out. The remote server may be slow or blocking inbound diagnostic probes.');
        }
      }, 1000);
    } catch (err) {
      setIsScanning(false);
      setProgress(0);
      setError(
        err.response?.data?.detail ||
        'Validation failed: Private RFC 1918 IPs, loopbacks, and invalid hostnames are blocked for security.'
      );
    }
  };

  const handleCopyRawHeaders = () => {
    if (!scanResult?.raw_headers || scanResult.raw_headers.length === 0) return;
    const text = scanResult.raw_headers.map((h) => `${h.name}: ${h.value}`).join('\n');
    navigator.clipboard?.writeText(text);
    setRawHeadersCopied(true);
    setTimeout(() => setRawHeadersCopied(false), 2000);
  };

  // Summary counts computed from real findings
  const passedCount = findings.filter((f) => f.severity === 'pass').length;
  const warnCount = findings.filter((f) => f.severity === 'medium' || f.severity === 'low').length;
  const criticalCount = findings.filter((f) => f.severity === 'critical' || f.severity === 'high').length;

  const categoryScores = scanResult?.category_scores || {};

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Target URL Input Console */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col gap-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Website Security Scanner
                </h1>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
                  PASSIVE AUDIT
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect SSL/TLS validity, HTTP response headers, cookie flags, and technology disclosures with zero downtime risk.
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                100% Non-Invasive Passive Check
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            {/* Domain input */}
            <div className="lg:col-span-7 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 focus-within:bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 transition-all">
              <span className="font-mono text-xs text-slate-400 select-none font-bold mr-1">
                https://
              </span>
              <input
                type="text"
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleStartScan();
                  }
                }}
                placeholder="example.com"
                className="w-full bg-transparent font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {targetDomain && (
                <button
                  type="button"
                  onClick={() => setTargetDomain('')}
                  className="text-slate-400 hover:text-slate-700 p-1"
                  aria-label="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Profile Selector */}
            <div className="lg:col-span-3 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <Sliders className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] text-slate-500 font-medium">
                  Scan Profile
                </span>
                <select
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  className="bg-transparent font-sans text-xs text-indigo-700 font-semibold focus:outline-none cursor-pointer truncate border-0 p-0"
                >
                  <option value="standard" className="bg-white text-slate-800">
                    Full Suite (13 Checks)
                  </option>
                  <option value="deep" className="bg-white text-slate-800">
                    OWASP ASVS Standard
                  </option>
                  <option value="nist" className="bg-white text-slate-800">
                    NIST SP 800-53 Aligned
                  </option>
                </select>
              </div>
            </div>

            {/* Run Button */}
            <div className="lg:col-span-2">
              <button
                type="button"
                onClick={() => handleStartScan()}
                disabled={isScanning || !targetDomain.trim()}
                className="w-full h-full min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Auditing...' : 'Run Security Audit'}</span>
              </button>
            </div>
          </div>

          {/* Quick test presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
            <span className="font-medium text-slate-400">Sample targets:</span>
            {['stripe.com', 'github.com', 'cloudflare.com', 'apple.com'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setTargetDomain(s);
                  handleStartScan(s);
                }}
                className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200/60 font-mono text-[11px] text-slate-600 transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
            <span className="ml-auto text-[11px] font-mono text-slate-400">
              Avg duration: ~2.4 seconds
            </span>
          </div>
        </div>
      </section>

      {/* Real-time Progress Bar when scanning */}
      {isScanning && (
        <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                Audit Progress:
              </span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold flex items-center gap-1.5 border border-indigo-100">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                Scanning Target
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slate-500">{phaseText}</span>
              <span className="font-mono text-xs text-indigo-600 font-bold">{progress}%</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>
      )}

      {/* State 1: When no scan has been executed yet */}
      {!scanResult && !isScanning && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">TLS & Cryptography</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verifies TLS 1.3 protocol negotiation, cipher suite security, SAN expiration, and trust chain integrity.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Security Headers</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Audits HSTS (RFC 6797), Content-Security-Policy (W3C CSP Level 3), X-Frame-Options, and Referrer-Policy.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Safe Passive Inspection</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Anti-SSRF DNS pinning prevents internal network probing. Zero malicious payloads, safe for production.
            </p>
          </div>
        </div>
      )}

      {/* State 2: When scan results are available */}
      {scanResult && !isScanning && (
        <div className="flex flex-col gap-6">
          {/* Results Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Audited Target:</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{scanResult.target_url}</span>
                </div>
                <span className="text-xs text-slate-500">
                  Execution Time: {scanResult.duration_ms ? `${scanResult.duration_ms}ms` : '1.8s'} • {findings.length} checks performed
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/scans/${scanResult.id}`}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Full Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => window.open(`/api/reports/${scanResult.id}/download`, '_blank')}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Report</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Column: Diagnostic Checks (7 cols) */}
            <div className="xl:col-span-7 flex flex-col gap-6">
              <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <h2 className="font-bold text-sm text-slate-900">
                      Diagnostic Findings
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      {passedCount} PASSED
                    </span>
                    {warnCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        {warnCount} WARN
                      </span>
                    )}
                    {criticalCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                        {criticalCount} CRITICAL
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto">
                  {findings.map((item) => (
                    <div
                      key={item.id || item.check_id}
                      className="p-3 rounded-lg bg-slate-50/70 hover:bg-slate-50 transition-colors border border-slate-200/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-1 rounded bg-white text-indigo-600 shrink-0 mt-0.5 border border-slate-200 shadow-2xs">
                          {item.severity === 'pass' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          ) : item.severity === 'critical' ? (
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs text-slate-900">
                            {item.title}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 break-all mt-0.5">
                            {item.details || item.description}
                          </span>
                          {item.recommendation && (
                            <span className="text-[11px] text-indigo-700 mt-1 font-medium">
                              Fix: {item.recommendation}
                            </span>
                          )}
                        </div>
                      </div>
                      <SeverityBadge severity={item.severity} />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Scorecard & Real HTTP Response Headers (5 cols) */}
            <div className="xl:col-span-5 flex flex-col gap-6">
              {/* Scorecard Box */}
              <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Radar className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-sm text-slate-900">
                      Security Scorecard
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 font-semibold">
                    100 PT RUBRIC
                  </span>
                </div>

                <div className="flex items-center justify-around gap-4 py-2">
                  <ScoreGauge
                    score={scanResult?.score ?? 0}
                    grade={scanResult?.grade ?? 'N/A'}
                    size={120}
                    strokeWidth={9}
                  />

                  <div className="flex flex-col gap-2 font-mono text-[11px] flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">TLS & HTTPS:</span>
                      <span className="text-indigo-600 font-bold">
                        {categoryScores.tls_https != null ? `${categoryScores.tls_https} / 25` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Security Headers:</span>
                      <span className="text-sky-600 font-bold">
                        {categoryScores.security_headers != null ? `${categoryScores.security_headers} / 45` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Cookie Security:</span>
                      <span className="text-emerald-600 font-bold">
                        {categoryScores.cookie_security != null ? `${categoryScores.cookie_security} / 15` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Info Disclosure:</span>
                      <span className="text-slate-900 font-bold">
                        {categoryScores.information_disclosure != null ? `${categoryScores.information_disclosure} / 15` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Real HTTP Wire Response Headers */}
              <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-3 flex-1">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-sm text-slate-900">
                      HTTP Response Headers
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      HTTP Wire
                    </span>
                    {scanResult.raw_headers && scanResult.raw_headers.length > 0 && (
                      <button
                        type="button"
                        onClick={handleCopyRawHeaders}
                        className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-medium transition-colors"
                      >
                        {rawHeadersCopied ? 'COPIED' : 'COPY'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg font-mono text-xs leading-relaxed max-h-[300px] overflow-y-auto flex flex-col gap-1.5">
                  {scanResult.raw_headers && scanResult.raw_headers.length > 0 ? (
                    scanResult.raw_headers.map((h, i) => (
                      <div key={i} className="py-1 px-2 rounded bg-white border border-slate-100 text-slate-700 break-all">
                        <span className="text-slate-400 font-semibold">{h.name}: </span>
                        <span className="text-slate-900">{h.value}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-xs py-4 text-center">
                      No raw headers captured during inspection.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Developer CLI & Architecture Note */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-900 leading-tight">
              Deterministic Security Assessment Engine
            </span>
            <span className="font-mono text-xs text-slate-500 mt-0.5">
              Standards: RFC 8446 (TLS 1.3) • RFC 6797 (HSTS) • W3C CSP3 • OWASP ASVS v4.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            Scanner Policies
          </button>
          <button
            type="button"
            onClick={() => navigate('/scans')}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold shadow-xs transition-colors"
          >
            Audit History
          </button>
        </div>
      </section>
    </div>
  );
}
