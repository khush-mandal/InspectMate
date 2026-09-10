export type NetworkStatus = 'ONLINE_HEALTHY' | 'ONLINE_UNREACHABLE' | 'OFFLINE';

export class NetworkMonitor {
  private currentStatus: NetworkStatus = typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE_HEALTHY' : 'OFFLINE';
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private pingIntervalId: any = null;
  private isChecking = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleBrowserOnline);
      window.addEventListener('offline', this.handleBrowserOffline);
      this.startHeartbeat();
    }
  }

  private handleBrowserOnline = () => {
    this.probeServerHealth();
  };

  private handleBrowserOffline = () => {
    this.setStatus('OFFLINE');
  };

  private setStatus(newStatus: NetworkStatus) {
    if (this.currentStatus !== newStatus) {
      this.currentStatus = newStatus;
      this.listeners.forEach(fn => {
        try {
          fn(newStatus);
        } catch (err) {
          console.error('Error in NetworkMonitor listener:', err);
        }
      });
    }
  }

  async probeServerHealth(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('OFFLINE');
      return false;
    }

    if (this.isChecking) return this.currentStatus === 'ONLINE_HEALTHY';
    this.isChecking = true;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeout);

      if (res.ok) {
        this.setStatus('ONLINE_HEALTHY');
        return true;
      } else {
        this.setStatus('ONLINE_UNREACHABLE');
        return false;
      }
    } catch {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        this.setStatus('OFFLINE');
      } else {
        this.setStatus('ONLINE_UNREACHABLE');
      }
      return false;
    } finally {
      this.isChecking = false;
    }
  }

  startHeartbeat(intervalMs = 30_000) {
    if (this.pingIntervalId) clearInterval(this.pingIntervalId);
    this.pingIntervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.probeServerHealth();
      }
    }, intervalMs);
  }

  stopHeartbeat() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  getStatus(): NetworkStatus {
    return this.currentStatus;
  }

  isOnline(): boolean {
    return this.currentStatus === 'ONLINE_HEALTHY';
  }

  subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify current status
    listener(this.currentStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  destroy() {
    this.stopHeartbeat();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleBrowserOnline);
      window.removeEventListener('offline', this.handleBrowserOffline);
    }
    this.listeners.clear();
  }
}

export const networkMonitor = new NetworkMonitor();
