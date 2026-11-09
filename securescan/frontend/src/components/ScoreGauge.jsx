import React from 'react';

export default function ScoreGauge({
  score = 0,
  grade = 'N/A',
  size = 100,
  strokeWidth = 7,
  showGrade = true,
  subtitle = '/ 100',
}) {
  const safeScore = Math.max(0, Math.min(100, score || 0));
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.3
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  let strokeColor = '#4F46E5';

  if (safeScore >= 90) {
    strokeColor = '#10B981'; // Emerald
  } else if (safeScore >= 80) {
    strokeColor = '#4F46E5'; // Indigo
  } else if (safeScore >= 70) {
    strokeColor = '#F59E0B'; // Amber
  } else {
    strokeColor = '#E11D48'; // Rose
  }

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        className="w-full h-full -rotate-90 overflow-visible"
        viewBox="0 0 100 100"
      >
        {/* Track (Light theme slate) */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        {/* Active Ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center Score & Grade */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
        <span
          className="font-sans font-extrabold text-slate-900 leading-none"
          style={{ fontSize: size * 0.28 }}
        >
          {safeScore}
        </span>
        {showGrade && (
          <span
            className="font-mono font-bold leading-none mt-0.5"
            style={{ fontSize: size * 0.14, color: strokeColor }}
          >
            {grade}
          </span>
        )}
        {subtitle && (
          <span
            className="font-mono text-slate-400 leading-none mt-0.5"
            style={{ fontSize: size * 0.1 }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
