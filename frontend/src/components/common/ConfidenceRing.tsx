import React from 'react';

interface ConfidenceRingProps {
  score: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercent?: boolean;
}

export const ConfidenceRing: React.FC<ConfidenceRingProps> = ({
  score,
  size = 56,
  strokeWidth = 5,
  label,
  showPercent = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Status colors based on prompt specification:
  // Green ≥90%, Amber 70-89%, Red <70%
  let strokeColor = '#0D9488'; // Teal/Green
  let trackColor = '#CCFBF1';
  let badgeColor = 'text-teal-700 bg-teal-50';

  if (clampedScore < 70) {
    strokeColor = '#DC2626'; // Red
    trackColor = '#FEE2E2';
    badgeColor = 'text-rose-700 bg-rose-50';
  } else if (clampedScore < 90) {
    strokeColor = '#D97706'; // Amber
    trackColor = '#FEF3C7';
    badgeColor = 'text-amber-800 bg-amber-50';
  }

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 origin-center transition-all duration-700 ease-out"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            className="opacity-70"
          />
          {/* Animated Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {showPercent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className="font-bold tracking-tight text-slate-900 leading-none"
              style={{ fontSize: size * 0.28 }}
            >
              {clampedScore}%
            </span>
          </div>
        )}
      </div>

      {label && (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border border-current/20 ${badgeColor}`}>
          {label}
        </span>
      )}
    </div>
  );
};
