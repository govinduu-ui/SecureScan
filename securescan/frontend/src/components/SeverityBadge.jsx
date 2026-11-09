import React from 'react';

const SEVERITY_STYLES = {
  critical: 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs',
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  low: 'bg-sky-50 text-sky-700 border-sky-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  passed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
};

export default function SeverityBadge({ severity, label, size = 'sm' }) {
  const sevKey = (severity || 'info').toLowerCase();
  const styleClasses = SEVERITY_STYLES[sevKey] || SEVERITY_STYLES.info;
  const displayLabel = label || severity?.toUpperCase() || 'INFO';

  const sizeClasses = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5 tracking-wider'
    : 'text-[11px] px-2.5 py-0.5 tracking-wide';

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase rounded-[4px] border ${sizeClasses} ${styleClasses} select-none`}
    >
      {displayLabel}
    </span>
  );
}
