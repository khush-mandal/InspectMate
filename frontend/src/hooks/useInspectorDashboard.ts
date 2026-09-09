import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { InspectionRecord } from '../types';

export interface DashboardSummary {
  totalInspections: number;
  pendingReview: number;
  potentialViolations: number;
  verified: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  recentInspections: InspectionRecord[];
}

export const useInspectorDashboard = () => {
  const { token, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async (abortController?: AbortController) => {
    if (!token) return;

    if (!navigator.onLine) {
      setIsOffline(true);
      // Attempt to load from cache
      const cached = localStorage.getItem('inspector_dashboard_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setData(parsed.data);
          setLastUpdated(new Date(parsed.timestamp));
        } catch (e) {
          // ignore cache error
        }
      }
      setIsLoading(false);
      return;
    }

    setIsOffline(false);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/inspections/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortController?.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error('Session expired');
        }
        if (response.status === 403) {
          throw new Error('Unauthorized role');
        }
        throw new Error('Failed to load dashboard data');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
        
        // Cache data for offline use
        localStorage.setItem('inspector_dashboard_cache', JSON.stringify({
          data: result.data,
          timestamp: new Date().toISOString()
        }));
      } else {
        throw new Error(result.error || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Network error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      fetchDashboard();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const abortController = new AbortController();
    fetchDashboard(abortController);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      abortController.abort();
    };
  }, [fetchDashboard]);

  const refresh = () => {
    fetchDashboard();
  };

  return {
    data,
    isLoading,
    error,
    isOffline,
    lastUpdated,
    refresh
  };
};
