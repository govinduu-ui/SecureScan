import React from 'react';

/**
 * Accessible Radio Group component with clean enterprise styling
 */
export default function RadioGroup({
  name,
  options, // [{ value: string, label: string, description?: string }]
  value,
  onChange,
  disabled = false,
  layout = 'horizontal', // 'horizontal' | 'vertical'
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={`flex ${
        layout === 'vertical' ? 'flex-col gap-2' : 'flex-wrap gap-2'
      }`}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;

        return (
          <label
            key={opt.value}
            className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs cursor-pointer select-none transition-colors duration-150 ${
              disabled ? 'cursor-not-allowed opacity-50' : ''
            } ${
              isSelected
                ? 'bg-indigo-50/70 border-indigo-600 text-indigo-950 font-medium shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              disabled={disabled}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {/* Custom accessible radio dot */}
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-600'
                  : 'border-slate-300 bg-white group-hover:border-slate-400'
              }`}
            >
              {isSelected && (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </span>

            <div className="flex flex-col">
              <span className={`font-medium ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                {opt.label}
              </span>
              {opt.description && (
                <span className="text-[10px] text-slate-500">
                  {opt.description}
                </span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
