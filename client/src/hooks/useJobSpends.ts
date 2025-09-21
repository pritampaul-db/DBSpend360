import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { JobSpendFilter, DateRange } from '@/types/job-spend';

export const useJobSpends = (filter: JobSpendFilter) => {
  return useQuery({
    queryKey: ['job-spends', filter],
    queryFn: () => apiClient.getJobSpends(filter),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!(filter.start_date && filter.end_date),
  });
};

export const useSummaryMetrics = (dateRange: DateRange) => {
  return useQuery({
    queryKey: ['summary-metrics', dateRange],
    queryFn: () => apiClient.getSummaryMetrics(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!(dateRange.start_date && dateRange.end_date),
  });
};

export const useJobBreakdown = (jobId: string, runId: string) => {
  return useQuery({
    queryKey: ['job-breakdown', jobId, runId],
    queryFn: () => apiClient.getJobCostBreakdown(jobId, runId),
    staleTime: 30 * 60 * 1000, // 30 minutes - breakdown data is less likely to change
    enabled: !!(jobId && runId),
  });
};

export const useTopJobs = (dateRange: DateRange, limit: number = 5) => {
  return useQuery({
    queryKey: ['top-jobs', dateRange, limit],
    queryFn: () => apiClient.getTopJobs(dateRange, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!(dateRange.start_date && dateRange.end_date),
  });
};

export const useDatePresets = () => {
  return useQuery({
    queryKey: ['date-presets'],
    queryFn: () => apiClient.getDatePresets(),
    staleTime: 60 * 60 * 1000, // 1 hour - presets don't change often
  });
};