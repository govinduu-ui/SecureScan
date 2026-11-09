import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  Download,
  ExternalLink,
  ShieldAlert,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Globe,
  Plus,
} from 'lucide-react';
import api from '../services/api';
import SeverityBadge from '../components/SeverityBadge';

export default function ReportsPage() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/reports');
      setReports(res.data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Unable to load security reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownload = (scanId) => {
    window.open(`/api/reports/${scanId}/download`, '_blank');
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg text-slate-900 tracking-tight">
              Security Reports
            </h1>
            <p className="text-xs text-slate-500">
              Downloadable ReportLab PDF assessment briefs and security documentation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchReports}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/scanner')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Standards & Compliance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900">OWASP ASVS v4.0</span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Header Compliance
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Checks HTTP headers, strict transport policies, and cookie flags against OWASP Application Security standards.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900">NIST SP 800-53</span>
            <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              SC-8 Aligned
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Verifies cryptographic protocols, TLS certificates, and transport protection across external web boundaries.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900">Zero-Intrusion Safety</span>
            <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              100% Passive
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Safe for continuous production scanning with zero service disruption, zero exploits, and zero brute force.
          </p>
        </div>
      </div>

      {/* Reports List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            Generated Security Assessment Briefs
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {reports.length} Available Reports
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-white">
                <th className="py-3 px-4">Target Website</th>
                <th className="py-3 px-4">Security Grade</th>
                <th className="py-3 px-4 text-right">Score</th>
                <th className="py-3 px-4">Generated Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 text-xs">
                    Loading security reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 text-xs">
                    No reports generated yet. Run a website assessment in the scanner to generate your first PDF report.
                  </td>
                </tr>
              ) : (
                reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-xs">{rep.target_url}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityBadge
                        severity={rep.grade === 'A+' || rep.grade === 'A' ? 'pass' : rep.grade === 'B+' || rep.grade === 'B' ? 'info' : 'warning'}
                        label={`Grade ${rep.grade}`}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-slate-900">
                      {rep.score} / 100
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {rep.created_at ? rep.created_at.slice(0, 10) : 'Just now'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/scans/${rep.scan_id}`)}
                          className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs transition-colors"
                        >
                          View Results
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(rep.scan_id)}
                          className="px-3 py-1 rounded-md bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1 shadow-xs hover:bg-indigo-700 transition-colors active:scale-[0.98]"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
