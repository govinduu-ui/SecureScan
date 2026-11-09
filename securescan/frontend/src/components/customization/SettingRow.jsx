import React from 'react';

/**
 * Standard Enterprise Setting Row
 * Left side: Clear Label + Concise Explanatory Subtext + Optional Value Badge
 * Right side: Interactive Control
 */
export default function SettingRow({
  label,
  description,
  currentValueBadge,
  children,
  htmlFor,
  isLast = false,
}) {
  return (
    <div
      className={`py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
        isLast ? '' : 'border-b border-slate-100'
      }`}
    >
      <div className="flex flex-col max-w-xl">
        <div className="flex items-center gap-2">
          {htmlFor ? (
            <label
              htmlFor={htmlFor}
              className="font-medium text-xs text-slate-800 cursor-pointer select-none"
            >
              {label}
            </label>
          ) : (
            <span className="font-medium text-xs text-slate-800 select-none">
              {label}
            </span>
          )}
          {currentValueBadge && (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
              {currentValueBadge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center sm:justify-end shrink-0">
        {children}
      </div>
    </div>
  );
}
