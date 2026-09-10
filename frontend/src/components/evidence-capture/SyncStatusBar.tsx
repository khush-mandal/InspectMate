import React, { useState, useEffect } from 'react';
import { RefreshCw, CloudCheck, CloudOff, AlertTriangle, HardDrive, CheckCircle2 } from 'lucide-react';
import { networkMonitor, NetworkStatus } from '../../services/network/NetworkMonitor';
import { useEvidenceCapture } from '../../context/EvidenceCaptureContext';
import { GlassCard } from '../common/GlassCard';

export const SyncStatusBar: React.FC = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(networkMonitor.getStatus());
  const { syncSummary, isSyncing, syncNow } = useEvidenceCapture();

  useEffect(() => {
    return networkMonitor.subscribe((status) => {
      setNetworkStatus(status);
    });
  }, []);

  const isOffline = networkStatus === 'OFFLINE';
  const isUnreachable = networkStatus === 'ONLINE_UNREACHABLE';

  return (
    <div className="space-y-3">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 sm:p-4 flex items-center gap-3 text-amber-900 animate-fade-in">
          <CloudOff className="text-amber-600 shrink-0" size={22} />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-amber-800">Operating in Offline Mode</h4>
            <p className="text-xs text-amber-700/90 mt-0.5">
              Evidence is durably persisted to device storage. Synchronizations will resume automatically upon network recovery.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
            <HardDrive size={12} /> Local-Only
          </span>
        </div>
      )}

      {/* Sync Operational Status Bar */}
      <GlassCard className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-200/80 shadow-xs">
        <div className="flex items-center flex-wrap gap-2.5 text-xs sm:text-sm">
          {/* Connection Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className={`w-2 h-2 rounded-full ${
              networkStatus === 'ONLINE_HEALTHY' 
                ? 'bg-emerald-500 animate-pulse' 
                : isUnreachable 
                ? 'bg-amber-500' 
                : 'bg-slate-400'
            }`} />
            <span>
              {networkStatus === 'ONLINE_HEALTHY' 
                ? 'Online' 
                : isUnreachable 
                ? 'Server Unreachable' 
                : 'Offline'}
            </span>
          </div>

          {/* Sync Statistics Counter */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            {syncSummary.synced > 0 && (
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                <CheckCircle2 size={12} /> {syncSummary.synced} Synced
              </span>
            )}

            {syncSummary.pending > 0 && (
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                <HardDrive size={12} /> {syncSummary.pending} Waiting to Sync
              </span>
            )}

            {syncSummary.syncing > 0 && (
              <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 animate-pulse">
                <RefreshCw size={12} className="animate-spin" /> {syncSummary.syncing} Syncing
              </span>
            )}

            {syncSummary.failed > 0 && (
              <span className="flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                <AlertTriangle size={12} /> {syncSummary.failed} Failed
              </span>
            )}
          </div>
        </div>

        {/* Sync Now Action */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => syncNow()}
            disabled={isSyncing || isOffline}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isSyncing
                ? 'bg-indigo-100 text-indigo-500 cursor-not-allowed'
                : isOffline
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-indigo-500/20 active:scale-95'
            }`}
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
