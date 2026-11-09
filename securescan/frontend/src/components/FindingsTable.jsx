import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import SeverityBadge from './SeverityBadge';
import { useCustomization } from '../context/CustomizationContext';

export default function FindingsTable({
  findings = [],
  onSelectFinding,
  showFilters = true,
}) {
  const { settings } = useCustomization();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isCompact = settings?.layout?.tableDensity === 'compact';
  const pageSize = Number(settings?.layout?.findingsPageSize) || 10;

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCopy = (id, text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredFindings = findings.filter((f) => {
    if (severityFilter !== 'all') {
      if (severityFilter === 'issues' && f.severity === 'pass') return false;
      if (severityFilter !== 'issues' && f.severity?.toLowerCase() !== severityFilter) return false;
    }
    if (categoryFilter !== 'all' && f.category !== categoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = f.title?.toLowerCase().includes(q);
      const matchDesc = f.description?.toLowerCase().includes(q);
      const matchCheck = f.check_id?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCheck;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredFindings.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedFindings = filteredFindings.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const cellPadding = isCompact ? 'py-2 px-3' : 'py-3.5 px-4';
  const headerPadding = isCompact ? 'py-2 px-3' : 'py-3 px-4';

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Filter and Search Bar */}
      {showFilters && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium mr-1">
              Filter:
            </span>

            {/* Severity Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {['all', 'issues', 'critical', 'high', 'medium', 'pass'].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                    severityFilter === sev
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-600 cursor-pointer font-medium"
            >
              <option value="all">All Categories</option>
              <option value="tls_https">TLS & Protocols</option>
              <option value="security_headers">Security Headers</option>
              <option value="cookie_security">Cookie Flags</option>
              <option value="information_disclosure">Information Disclosure</option>
            </select>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search checks or evidence..."
              className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>
      )}

      {/* Findings Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                <th className={`${headerPadding} w-10`}></th>
                <th className={headerPadding}>Diagnostic Check</th>
                <th className={headerPadding}>Category</th>
                <th className={headerPadding}>Severity</th>
                <th className={`${headerPadding} text-right`}>Points</th>
                <th className={`${headerPadding} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFindings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No diagnostic findings matching current filters.
                  </td>
                </tr>
              ) : (
                paginatedFindings.map((finding) => {
                  const isExpanded = expandedId === (finding.id || finding.check_id);
                  const isPassing = finding.severity === 'pass';

                  return (
                    <React.Fragment key={finding.id || finding.check_id}>
                      <tr
                        className={`transition-colors hover:bg-slate-50/80 cursor-pointer ${
                          isExpanded ? 'bg-indigo-50/40' : ''
                        }`}
                        onClick={() => toggleExpand(finding.id || finding.check_id)}
                      >
                        <td className={`${cellPadding} text-slate-400`}>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </td>
                        <td className={`${cellPadding} font-medium text-slate-900`}>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">
                              {finding.title}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 mt-0.5">
                              {finding.check_id}
                            </span>
                          </div>
                        </td>
                        <td className={`${cellPadding} text-xs text-slate-600 font-medium`}>
                          {finding.category?.replace('_', ' ').toUpperCase()}
                        </td>
                        <td className={cellPadding}>
                          <SeverityBadge severity={finding.severity} />
                        </td>
                        <td className={`${cellPadding} text-right font-mono text-xs font-semibold text-slate-900`}>
                          <span className={isPassing ? 'text-emerald-600' : 'text-amber-600'}>
                            {finding.points_earned}
                          </span>
                          <span className="text-slate-400"> / {finding.points_possible}</span>
                        </td>
                        <td className={`${cellPadding} text-right`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectFinding) onSelectFinding(finding);
                              else toggleExpand(finding.id || finding.check_id);
                            }}
                            className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors"
                          >
                            {onSelectFinding ? 'Inspect' : isExpanded ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row Detail */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={6} className="p-5 pl-12">
                            <div className="flex flex-col gap-3.5 text-xs text-slate-700">
                              <div>
                                <span className="text-xs font-semibold text-slate-900 block mb-1">
                                  Analysis:
                                </span>
                                <p className="leading-relaxed text-slate-600">
                                  {finding.description}
                                </p>
                              </div>

                              {finding.details && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-900">
                                      Evidence & Headers:
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(finding.check_id, finding.details)}
                                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>
                                        {copiedId === finding.check_id ? 'Copied' : 'Copy'}
                                      </span>
                                    </button>
                                  </div>
                                  <div className="p-3 rounded-lg bg-white border border-slate-200 font-mono text-xs text-indigo-950 break-all shadow-xs">
                                    {finding.details}
                                  </div>
                                </div>
                              )}

                              {finding.recommendation && (
                                <div className="p-3.5 rounded-lg bg-indigo-50/70 border border-indigo-100">
                                  <span className="text-xs font-bold text-indigo-900 block mb-1">
                                    Recommendation:
                                  </span>
                                  <p className="text-slate-700 text-xs leading-relaxed">
                                    {finding.recommendation}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls when total findings exceed page size */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
            <span>
              Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredFindings.length)} of {filteredFindings.length} findings
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                Previous
              </button>
              <span className="font-mono text-xs px-2 text-slate-700 font-semibold">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
