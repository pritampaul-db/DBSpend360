export interface JobSpend {
  cluster_id: string;
  ec2_cost: number;
  job_id: string;
  run_id: string;
  usage_date: string; // ISO date string
  databricks_cost: number;
  total_cost: number;
  ec2_percentage: number;
  databricks_percentage: number;
}

export interface SummaryMetrics {
  total_jobs: number;
  total_spend: number;
  average_cost: number;
  max_cost: number;
  min_cost: number;
  total_ec2_cost: number;
  total_databricks_cost: number;
  date_range_days: number;
}

export interface CostBreakdown {
  job_id: string;
  run_id: string;
  cluster_id: string;
  usage_date: string;
  ec2_cost: number;
  databricks_cost: number;
  total_cost: number;
  cost_split: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export interface PaginatedJobSpends {
  data: JobSpend[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface DateRange {
  start_date: string; // ISO date string
  end_date: string; // ISO date string
}

export interface DatePreset {
  label: string;
  start_date: string;
  end_date: string;
}

export interface JobSpendFilter {
  start_date: string;
  end_date: string;
  job_name?: string;
  page: number;
  per_page: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    filters_applied?: Record<string, any>;
    cache_hit?: boolean;
    query_time_ms?: number;
  };
}