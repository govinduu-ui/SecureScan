import React from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * Enterprise Setting Section
 * Clean light-mode layout with subtle borders and clear typography without unnecessary cards
 */
export default function SettingSection({
  id,
  title,
  description,
  icon: Icon,
  onResetSection,
  children,
}) {
  return (
    <section id={id} className="scroll-mt-24 pt-6 first:pt-0">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h2 className="font-semibold text-sm text-slate-900">{title}</h2>
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {onResetSection && (
          <button
            type="button"
            onClick={onResetSection}
            title={`Reset ${title} to defaults`}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset section</span>
          </button>
        )}
      </div>

      {/* Setting Rows Container */}
      <div className="flex flex-col">
        {children}
      </div>
    </section>
  );
}
