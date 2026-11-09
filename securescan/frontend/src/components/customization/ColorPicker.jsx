import React from 'react';

const PRESET_COLORS = [
  { label: 'Charming Indigo', hex: '#4F46E5' },
  { label: 'Sky Blue', hex: '#0284C7' },
  { label: 'Emerald', hex: '#10B981' },
  { label: 'Violet', hex: '#7C3AED' },
  { label: 'Amber', hex: '#D97706' },
];

/**
 * Enterprise Color Picker with quick swatches and custom HEX selector
 */
export default function ColorPicker({
  id,
  value,
  onChange,
  disabled = false,
}) {
  return (
    <div className="flex items-center gap-3">
      {/* Presets */}
      <div className="flex items-center gap-1.5" role="group" aria-label="Preset brand colors">
        {PRESET_COLORS.map((preset) => {
          const isSelected = value.toLowerCase() === preset.hex.toLowerCase();
          return (
            <button
              key={preset.hex}
              type="button"
              disabled={disabled}
              title={`${preset.label} (${preset.hex})`}
              aria-label={`${preset.label} color preset`}
              aria-pressed={isSelected}
              onClick={() => onChange(preset.hex)}
              className={`w-6 h-6 rounded-full transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600 ${
                isSelected
                  ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110 shadow-xs'
                  : 'hover:scale-105 opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: preset.hex }}
            />
          );
        })}
      </div>

      <div className="h-4 w-px bg-slate-200" />

      {/* Custom Picker and Hex Text */}
      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
        <label
          htmlFor={`${id}-color`}
          className="w-4 h-4 rounded cursor-pointer border border-slate-300 shrink-0"
          style={{ backgroundColor: value }}
        >
          <input
            id={`${id}-color`}
            type="color"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
            aria-label="Custom color picker"
          />
        </label>
        <input
          id={id}
          type="text"
          value={value}
          maxLength={7}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#4F46E5"
          aria-label="Hex color value"
          className="w-20 bg-transparent font-mono text-xs text-slate-800 uppercase focus:outline-none"
        />
      </div>
    </div>
  );
}
