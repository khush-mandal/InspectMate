import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useUpdateInspection = () => {
  const { token, logout } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMetadata = useCallback(async (inspectionId: string, data: {
    location?: { type: 'Point'; coordinates: [number, number] };
    productCategory?: string;
    manufacturer?: string;
    notes?: string;
  }) => {
    if (!token) return false;

    if (!navigator.onLine) {
      setError('Cannot update inspection metadata while offline');
      return false;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/inspections/${inspectionId}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error('Session expired');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update inspection');
      }

      const result = await response.json();
      if (result.success) {
        return true;
      } else {
        throw new Error(result.error || 'Failed to update inspection');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [token, logout]);

  return {
    updateMetadata,
    isUpdating,
    error
  };
};
