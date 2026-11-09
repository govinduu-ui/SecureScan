import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Download,
  RotateCw,
  Clock,
  ArrowLeft,
  ExternalLink,
  Layers,
  Terminal,
  FileCheck2,
  Globe,
} from 'lucide-react';
import api from '../services/api';
import ScoreGauge from '../components/ScoreGauge';
import SeverityBadge from '../components/SeverityBadge';
import FindingsTable from '../components/FindingsTable';

export default function ScanResultsPage() {
  const { scanId } = useParams();
  const navigate = useNavigate();

  const [scan, setScan] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWireModal, setShowWireModal] = useState(false);

  useEffect(() => {
    const fetchScanData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [scanRes, findingsRes] = await Promise.all([
          api.get(`/api/scans/${scanId}`),
          api.get(`/api/scans/${scanId}/findings`),
        ]);
        setScan(scanRes.data);
        setFindings(findingsRes.data.findings || []);
      } catch (err) {
        console.error('Failed to load scan results:', err);
        setError('Unable to load assessment findings from server.');
      } finally {
        setLoading(false);
      }
    };

    fetchScanData();
  }, [scanId]);

  const handleDownloadPdf = () => {
    window.open(`/api/reports/${scanId}/download`, '_blank');
  };

  const handleReevaluate = () => {
    if (scan?.target_url) {
      navigate(`/scanner?target=${encodeURIComponent(scan.target_url)}`);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-slate-500 font-medium">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span>Loading scan findings...</span>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="py-16 flex flex-col items-center gap-4">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error || 'Scan not found.'}
        </div>
        <button
          type="button"
          onClick={() => navigate('/scans')}
          className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
        >
          Return to Scan History
        </button>
      </div>
    );
  }

  const catScores = scan.category_scores || {};

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/scans')}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
            title="Back to all scans"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Target:</span>
              <h1 className="font-mono font-bold text-base text-slate-900">
                {scan.target_url}
              </h1>
            </div>
            <span className="text-xs text-slate-500 mt-0.5">
              Scan ID: {scan.id} • Completed in {scan.duration_ms ? `${scan.duration_ms}ms` : '1.8s'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {scan.raw_headers && scan.raw_headers.length > 0 && (
            <button
              type="button"
              onClick={() => setShowWireModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-600" />
              <span>HTTP Headers</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReevaluate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Re-scan</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* Overview Bento Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Overall Score Card (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-600">
              Security Scorecard
            </span>
            <SeverityBadge
              severity={scan.grade === 'A+' || scan.grade === 'A' ? 'pass' : scan.grade === 'B+' || scan.grade === 'B' ? 'info' : 'warning'}
              label={`Grade ${scan.grade || 'N/A'}`}
            />
          </div>

          <div className="flex items-center justify-center my-4">
            <ScoreGauge
              score={scan.score || 0}
              grade={scan.grade || 'N/A'}
              size={120}
              strokeWidth={9}
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 flex justify-between">
            <span>Diagnosed Findings:</span>
            <span className="text-slate-900 font-bold">{scan.findings_count || 13} checks</span>
          </div>
        </div>

        {/* Right: Category Breakdown Cards (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-800 font-semibold">TLS & Cryptography</span>
              <span className="text-xs text-indigo-600 font-bold">{catScores.tls_https ?? 25} / 25</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${((catScores.tls_https ?? 25) / 25) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Handshake protocol, CA trust chain, and certificate expiration health.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-800 font-semibold">Security Headers</span>
              <span className="text-xs text-sky-600 font-bold">{catScores.security_headers ?? 30} / 45</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-sky-600 h-full rounded-full"
                style={{ width: `${((catScores.security_headers ?? 30) / 45) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              HSTS, CSP, X-Frame-Options, X-Content-Type, and Referrer policy controls.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-800 font-semibold">Cookie Security</span>
              <span className="text-xs text-emerald-600 font-bold">{catScores.cookie_security ?? 14} / 15</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${((catScores.cookie_security ?? 14) / 15) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Auditing Secure, HttpOnly, and SameSite attributes on cookies.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-800 font-semibold">Information Disclosure</span>
              <span className="text-xs text-indigo-600 font-bold">{catScores.information_disclosure ?? 15} / 15</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${((catScores.information_disclosure ?? 15) / 15) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Server header minimization and suppression of runtime version banners.
            </p>
          </div>
        </div>
      </div>

      {/* Findings Table Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-sans font-bold text-base text-slate-900">
            Security Checks & Remediation Items
          </h2>
          <span className="text-xs text-slate-500">
            {findings.length} Passive Diagnostic Checks
          </span>
        </div>

        <FindingsTable
          findings={findings}
          onSelectFinding={(f) => navigate(`/scans/${scanId}/findings/${f.id || f.check_id}`)}
        />
      </div>

      {/* HTTP Response Headers Modal */}
      {showWireModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-slate-900">
                  HTTP Response Headers
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowWireModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 rounded transition-colors"
              >
                Close
              </button>
            </div>

            <div className="p-4 bg-slate-50 font-mono text-xs leading-relaxed overflow-y-auto flex-1 flex flex-col gap-1.5">
              {scan.raw_headers?.map((h, i) => (
                <div key={i} className="py-0.5 border-b border-slate-200/50 last:border-0">
                  <span className="text-indigo-700 font-semibold">{h.name}: </span>
                  <span className="text-slate-700">{h.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
