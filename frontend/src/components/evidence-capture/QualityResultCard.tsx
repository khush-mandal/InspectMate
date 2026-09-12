import React from 'react';
import { QualityAssessment } from '../../types/capture.types';
import { ShieldAlert, ShieldCheck, ShieldQuestion, AlertTriangle, ChevronRight, Info } from 'lucide-react';

interface QualityResultCardProps {
  assessment: QualityAssessment | null;
  isProcessing: boolean;
  onReviewOverride?: () => void;
}

export const QualityResultCard: React.FC<QualityResultCardProps> = ({ assessment, isProcessing, onReviewOverride }) => {
  if (isProcessing) {
    return (
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 animate-pulse mt-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-6 rounded-full bg-slate-600"></div>
          <div className="h-4 bg-slate-600 rounded w-1/2"></div>
        </div>
        <div className="space-y-2 mt-4">
          <div className="h-3 bg-slate-600/50 rounded w-full"></div>
          <div className="h-3 bg-slate-600/50 rounded w-4/5"></div>
          <div className="h-3 bg-slate-600/50 rounded w-3/4"></div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="h-3 bg-slate-600/30 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  const { status, score, issues, recommendations } = assessment;

  let HeaderIcon = ShieldCheck;
  let headerColor = 'text-emerald-400';
  let bgColor = 'bg-emerald-500/10 border-emerald-500/20';
  let title = 'Image Suitable';
  let subtitle = 'Evidence meets technical requirements.';

  if (status === 'RECAPTURE') {
    HeaderIcon = ShieldAlert;
    headerColor = 'text-red-400';
    bgColor = 'bg-red-500/10 border-red-500/20';
    title = 'Image Not Suitable';
    subtitle = 'Please retake this image to ensure reliable inspection.';
  } else if (status === 'REVIEW') {
    HeaderIcon = ShieldQuestion;
    headerColor = 'text-amber-400';
    bgColor = 'bg-amber-500/10 border-amber-500/20';
    title = 'Marginal Quality';
    subtitle = 'Image may be difficult to process.';
  } else if (status === 'ERROR' || status === 'UNKNOWN') {
    HeaderIcon = Info;
    headerColor = 'text-slate-400';
    bgColor = 'bg-slate-800 border-slate-700';
    title = 'Quality Check Unavailable';
    subtitle = 'Could not assess image quality reliably.';
  }

  return (
    <div className={`rounded-xl p-4 border backdrop-blur-sm mt-4 ${bgColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <HeaderIcon className={`${headerColor}`} size={24} />
          <div>
            <h3 className={`font-semibold text-sm ${headerColor}`}>{title}</h3>
            <p className="text-xs text-slate-300 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-2xl font-bold text-white tracking-tight">{score}</div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Quality Score</div>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="mt-4 space-y-2">
          {issues.map((issue, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              {issue.blocking ? (
                <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5 ml-1"></div>
              )}
              <span className={issue.blocking ? 'text-red-200 font-medium' : 'text-slate-300'}>
                {issue.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-700/50">
          <div className="text-xs font-medium text-slate-400 mb-2">RECOMMENDATIONS</div>
          <ul className="space-y-1.5">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-teal-100 flex items-start gap-2">
                <ChevronRight size={14} className="text-teal-500 shrink-0 mt-0.5" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
