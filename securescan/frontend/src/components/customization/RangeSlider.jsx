import React from 'react';

/**
 * Enterprise Range Slider component
 */
export default function RangeSlider({
  id,
  name,
  min = 0,
  max = 60,
  step = 5,
  value,
  onChange,
  disabled = false,
  formatValue = (v) => `${v}s`,
  ariaLabel,
}) {
  return (
    <div className="flex items-center gap-3 w-full sm:w-64">
      <input
        id={id}
        name={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
      />
      <span className="font-mono text-xs text-indigo-700 min-w-[50px] text-right font-semibold">
        {formatValue(value)}
      </span>
    </div>
  );
}
