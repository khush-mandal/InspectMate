/**
 * Centralized API Configuration for InspectMate
 * Supports both:
 * 1. Explicit remote API URL via VITE_API_URL (e.g. in Vercel environment variables)
 * 2. Relative URLs via '' for local Vite proxy or Vercel rewrites (vercel.json)
 */

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

/**
 * Returns a fully qualified or properly relative API URL.
 * Example: getApiUrl('/api/inspections') -> 'https://inspectmate.onrender.com/api/inspections' or '/api/inspections'
 */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!API_BASE_URL) {
    return cleanEndpoint;
  }
  return `${API_BASE_URL}${cleanEndpoint}`;
};
