import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api-config';

export const useDatabricksHost = () => {
  return useQuery({
    queryKey: ['databricks-host'],
    queryFn: async (): Promise<string> => {
      const response = await fetch(`${API_BASE_URL}/databricks-host`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Databricks host: ${response.statusText}`);
      }

      const data = await response.json();
      return data.databricks_host;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - host URL rarely changes
    refetchOnWindowFocus: false,
  });
};