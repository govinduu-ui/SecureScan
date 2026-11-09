import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Radar,
  Download,
  Trash2,
  RotateCw,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plus,
  Globe,
} from 'lucide-react';
import api from '../services/api';
import SeverityBadge from '../components/SeverityBadge';

export default function ScanHistoryPage() {
  const navigate = useNavigate();

  const [scans, setScans] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchScans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/scans?page=${page}&page_size=${pageSize}`);
      setScans(res.data.scans || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load scan history:', err);
      setError('Unable to load scan records from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [page]);

  const handleDelete = async (scanId) => {
    if (!window.confirm('Delete this website scan record?')) return;
    try {
      setDeletingId(scanId);
      await api.delete(`/api/scans/${scanId}`);
      setScans((prev) => prev.filter((s) => s.id !== scanId));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert('Failed to delete scan record.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredScans = scans.filter((s) => {
    if (!searchQuery.trim()) return true;
    return s.target_url?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg text-slate-900 tracking-tight">
              Scan History
            </h1>
            <p className="text-xs text-slate-500">
              Audit log of previous security evaluations and downloaded reports
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/scanner')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Scan</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by domain..."
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Total Scans:</span>
          <span className="text-indigo-600 font-bold">{total}</span>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50">
                <th className="py-3 px-4">Website URL</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4 text-right">Score</th>
                <th className="py-3 px-4 text-right">Findings</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 text-xs">
                    Loading historical scan records...
                  </td>
                </tr>
              ) : filteredScans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 text-xs">
                    No scans found. Click &quot;New Scan&quot; to test a website URL.
                  </td>
                </tr>
              ) : (
                filteredScans.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-xs">{s.target_url}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityBadge
                        severity={s.grade === 'A+' || s.grade === 'A' ? 'pass' : s.grade === 'B+' || s.grade === 'B' ? 'info' : 'warning'}
                        label={s.grade ? `Grade ${s.grade}` : 'Pending'}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-slate-900">
                      {s.score !== null ? `${s.score}/100` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-500">
                      {s.findings_count || 13} checks
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {s.created_at ? s.created_at.slice(0, 10) : 'Just now'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/scans/${s.id}`)}
                          className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs transition-colors"
                        >
                          Results
                        </button>

                        <button
                          type="button"
                          onClick={() => window.open(`/api/reports/${s.id}/download`, '_blank')}
                          className="p-1.5 rounded-md bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 shadow-xs transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          className="p-1.5 rounded-md bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 shadow-xs transition-colors disabled:opacity-50"
                          title="Delete Scan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
