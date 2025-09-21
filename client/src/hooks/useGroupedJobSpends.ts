import { useQuery } from '@tanstack/react-query';
import type { PaginatedGroupedJobs, JobSpendFilter } from '@/types/job-spend';

const API_BASE_URL = 'http://localhost:8000/api';

export const useGroupedJobSpends = (params: JobSpendFilter) => {
  return useQuery({
    queryKey: ['grouped-job-spends', params],
    queryFn: async (): Promise<PaginatedGroupedJobs> => {
      const searchParams = new URLSearchParams({
        start_date: params.start_date,
        end_date: params.end_date,
        page: params.page.toString(),
        per_page: params.per_page.toString(),
      });

      if (params.job_name) {
        searchParams.append('job_name', params.job_name);
      }

      const response = await fetch(`${API_BASE_URL}/grouped-job-spends?${searchParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch grouped job spends: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};