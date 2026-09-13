import React from 'react';
import { RefreshCw, Cloud, CloudOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useSyncStatus } from '../../hooks/useSyncStatus';

interface SyncStatusBarProps {
  inspectionId?: string;
  className?: string;
}

export const SyncStatusBar: React.FC<SyncStatusBarProps> = ({ inspectionId, className = '' }) => {
  const { summary, isSyncing, isOnline, lastSyncTime, syncNow, retryAllFailed } = useSyncStatus(inspectionId);

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const diffSec = Math.round((Date.now() - timestamp) / 1000);
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      data-testid="sync-status-bar"
      className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium border backdrop-blur-md transition-all ${
        !isOnline
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
          : summary.failed > 0
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          : isSyncing
          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <CloudOff size={15} className="animate-pulse text-amber-600" />
        ) : isSyncing ? (
          <RefreshCw size={15} className="animate-spin text-indigo-600" />
        ) : summary.failed > 0 ? (
          <AlertTriangle size={15} className="text-rose-600" />
        ) : (
          <CheckCircle2 size={15} className="text-emerald-600" />
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {!isOnline ? (
            <span>Offline mode &bull; Evidence safely queued locally</span>
          ) : isSyncing ? (
            <span>Syncing {summary.syncing} item{summary.syncing > 1 ? 's' : ''}...</span>
          ) : summary.failed > 0 ? (
            <span>{summary.failed} failed upload{summary.failed > 1 ? 's' : ''}</span>
          ) : (
            <span>All evidence synced</span>
          )}

          {summary.pending > 0 && !isSyncing && isOnline && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 text-[10px]">
              {summary.pending} pending
            </span>
          )}

          <span className="text-[11px] opacity-75 ml-1">
            (Last sync: {formatLastSync(lastSyncTime)})
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {summary.failed > 0 && (
          <button
            onClick={() => retryAllFailed()}
            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition active:scale-95 cursor-pointer"
          >
            Retry Failed
          </button>
        )}

        <button
          onClick={() => syncNow()}
          disabled={isSyncing || !isOnline}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition active:scale-95 text-[11px] font-semibold ${
            isSyncing || !isOnline
              ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm'
          }`}
        >
          <Cloud size={12} />
          <span>{isSyncing ? 'Syncing' : 'Sync Now'}</span>
        </button>
      </div>
    </div>
  );
};
