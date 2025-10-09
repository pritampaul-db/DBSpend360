// API configuration that works in both development and deployed environments
export function getApiBaseUrl(): string {
  // In development, use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:8000/api';
  }

  // In deployed environment, use relative URLs to the same host
  return '/api';
}

export const API_BASE_URL = getApiBaseUrl();