import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useCreateInspection = () => {
  const { token, logout } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInspection = useCallback(async (clientReference: string) => {
    if (!token) return null;

    if (!navigator.onLine) {
      setError('Cannot create inspection while offline');
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clientReference
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error('Session expired');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create inspection');
      }

      const result = await response.json();
      if (result.success) {
        return result.data.inspectionId;
      } else {
        throw new Error(result.error || 'Failed to create inspection');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [token, logout]);

  return {
    createInspection,
    isCreating,
    error
  };
};
