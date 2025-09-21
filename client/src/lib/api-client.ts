import { JobSpend, SummaryMetrics, CostBreakdown, PaginatedJobSpends, DateRange, JobSpendFilter, DatePreset } from '@/types/job-spend';

const API_BASE_URL = 'http://localhost:8000/api';

class ApiClient {
  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getJobSpends(filter: JobSpendFilter): Promise<PaginatedJobSpends> {
    const params = new URLSearchParams({
      start_date: filter.start_date,
      end_date: filter.end_date,
      page: filter.page.toString(),
      per_page: filter.per_page.toString(),
    });

    if (filter.job_name) {
      params.append('job_name', filter.job_name);
    }

    return this.fetchApi<PaginatedJobSpends>(`/job-spends?${params}`);
  }

  async getSummaryMetrics(dateRange: DateRange): Promise<SummaryMetrics> {
    const params = new URLSearchParams({
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
    });

    return this.fetchApi<SummaryMetrics>(`/summary?${params}`);
  }

  async getJobCostBreakdown(jobId: string, runId: string): Promise<CostBreakdown> {
    const params = new URLSearchParams({ run_id: runId });
    return this.fetchApi<CostBreakdown>(`/job/${jobId}/breakdown?${params}`);
  }

  async getTopJobs(dateRange: DateRange, limit: number = 5): Promise<JobSpend[]> {
    const params = new URLSearchParams({
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
      limit: limit.toString(),
    });

    return this.fetchApi<JobSpend[]>(`/top-jobs?${params}`);
  }

  async getDatePresets(): Promise<Record<string, DatePreset>> {
    return this.fetchApi<Record<string, DatePreset>>('/date-presets');
  }

  async healthCheck(): Promise<{ status: string; service: string }> {
    return this.fetchApi<{ status: string; service: string }>('/health');
  }
}

export const apiClient = new ApiClient();