import React from 'react';
import { Check, AlertTriangle, X, Circle, ShieldCheck, Clock } from 'lucide-react';
import { FindingClassification, InspectionStatus } from '../../types';

interface StatusPillProps {
  status: FindingClassification | InspectionStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  size = 'md',
  className = '',
  showIcon = true
}) => {
  let label = status;
  let bgClass = 'bg-slate-100/90 text-slate-700 border-slate-300';
  let Icon = Circle;

  switch (status) {
    case 'VERIFIED':
    case 'VERIFIED_COMPLIANT':
    case 'CONSISTENT':
      label = '✓ Verified';
      bgClass = 'bg-teal-50/95 text-teal-800 border-teal-200/80 shadow-xs shadow-teal-500/10';
      Icon = Check;
      break;

    case 'NEEDS_REVIEW':
    case 'OCR_PROCESSING':
      label = '⚠ Needs Review';
      bgClass = 'bg-amber-50/95 text-amber-900 border-amber-300/80 shadow-xs shadow-amber-500/10';
      Icon = AlertTriangle;
      break;

    case 'POTENTIAL_VIOLATION':
    case 'INCONSISTENT':
      label = '✗ Potential Violation';
      bgClass = 'bg-rose-50/95 text-rose-800 border-rose-200/90 shadow-xs shadow-rose-500/10';
      Icon = X;
      break;

    case 'INSUFFICIENT_EVIDENCE':
      label = '◌ Insufficient Evidence';
      bgClass = 'bg-slate-100/95 text-slate-700 border-slate-300/80 shadow-xs';
      Icon = Circle;
      break;

    case 'DRAFT':
      label = 'Draft Inspection';
      bgClass = 'bg-indigo-50/95 text-indigo-800 border-indigo-200/80';
      Icon = Clock;
      break;

    default:
      label = status.replace(/_/g, ' ');
      break;
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  }[size];

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border backdrop-blur-md transition-colors whitespace-nowrap ${bgClass} ${sizeClasses} ${className}`}
    >
      {showIcon && <Icon size={iconSizes} strokeWidth={2.5} className="shrink-0" />}
      <span>{label}</span>
    </span>
  );
};
