import { useState, useEffect, useCallback } from 'react';
import { syncCoordinator } from '../services/sync/SyncCoordinator';
import { networkMonitor, NetworkStatus } from '../services/network/NetworkMonitor';
import { localEvidenceStore } from '../services/storage/LocalEvidenceStore';
import { evidenceRepository } from '../services/EvidenceRepository';
import { SyncSummary } from '../types/capture.types';

export interface SyncStatusState {
  summary: SyncSummary;
  isSyncing: boolean;
  isOnline: boolean;
  networkStatus: NetworkStatus;
  lastSyncTime: number | null;
  syncNow: () => Promise<SyncSummary>;
  retryAllFailed: () => Promise<void>;
}

export function useSyncStatus(inspectionId?: string): SyncStatusState {
  const [summary, setSummary] = useState<SyncSummary>({
    total: 0,
    synced: 0,
    pending: 0,
    syncing: 0,
    failed: 0,
    localOnly: 0,
    isFullySynced: true
  });
  const [isOnline, setIsOnline] = useState<boolean>(networkMonitor.isOnline());
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(networkMonitor.getStatus());
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(syncCoordinator.getLastSyncTime());

  const refreshSummary = useCallback(async () => {
    try {
      const updatedSummary = await syncCoordinator.getSyncSummary(inspectionId);
      setSummary(updatedSummary);
      setLastSyncTime(syncCoordinator.getLastSyncTime());
    } catch (err) {
      console.error('Failed to load sync summary:', err);
    }
  }, [inspectionId]);

  useEffect(() => {
    refreshSummary();

    // 1. Subscribe to SyncCoordinator events
    const unsubSync = syncCoordinator.subscribe(() => {
      refreshSummary();
    });

    // 2. Subscribe to NetworkMonitor events
    const unsubNet = networkMonitor.subscribe((status) => {
      setNetworkStatus(status);
      setIsOnline(status === 'ONLINE_HEALTHY');
    });

    return () => {
      unsubSync();
      unsubNet();
    };
  }, [refreshSummary]);

  const handleSyncNow = useCallback(async () => {
    const result = await syncCoordinator.syncNow();
    await refreshSummary();
    return result;
  }, [refreshSummary]);

  const handleRetryAllFailed = useCallback(async () => {
    const failedRecords = await localEvidenceStore.listPendingSyncEvidence('current');
    for (const record of failedRecords) {
      if (record.syncStatus === 'SYNC_FAILED') {
        await evidenceRepository.retryFailedEvidence(record.clientEvidenceId, record.userId);
      }
    }
    syncCoordinator.triggerSync();
    await refreshSummary();
  }, [refreshSummary]);

  return {
    summary,
    isSyncing: summary.syncing > 0,
    isOnline,
    networkStatus,
    lastSyncTime,
    syncNow: handleSyncNow,
    retryAllFailed: handleRetryAllFailed
  };
}
