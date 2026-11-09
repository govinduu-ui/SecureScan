import React from 'react';

/**
 * Enterprise Select Dropdown component
 */
export default function SelectDropdown({
  id,
  name,
  value,
  onChange,
  options, // [{ value: string | number, label: string }]
  disabled = false,
  ariaLabel,
}) {
  return (
    <div className="relative inline-block w-full sm:w-auto min-w-[200px]">
      <select
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-xs text-slate-800 font-sans focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-white text-slate-800 py-1"
          >
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
