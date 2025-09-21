/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CostBreakdown } from '../models/CostBreakdown';
import type { JobSpend } from '../models/JobSpend';
import type { PaginatedGroupedJobs } from '../models/PaginatedGroupedJobs';
import type { PaginatedJobSpends } from '../models/PaginatedJobSpends';
import type { SummaryMetrics } from '../models/SummaryMetrics';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardService {
    /**
     * Get Job Spends
     * Get paginated job spending data with optional filters.
     *
     * Returns job spending records for the specified date range with optional job name filtering.
     * Results are paginated and sorted by total cost (highest first).
     * @param startDate Start date for filtering (YYYY-MM-DD)
     * @param endDate End date for filtering (YYYY-MM-DD)
     * @param jobName Optional job name filter
     * @param page Page number
     * @param perPage Items per page
     * @returns PaginatedJobSpends Successful Response
     * @throws ApiError
     */
    public static getJobSpendsApiJobSpendsGet(
        startDate: string,
        endDate: string,
        jobName?: (string | null),
        page: number = 1,
        perPage: number = 50,
    ): CancelablePromise<PaginatedJobSpends> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/job-spends',
            query: {
                'start_date': startDate,
                'end_date': endDate,
                'job_name': jobName,
                'page': page,
                'per_page': perPage,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Grouped Job Spends
     * Get paginated job spending data grouped by job with aggregated costs and run details.
     *
     * Returns jobs with aggregated costs across all runs and detailed run information.
     * Each job shows total costs and individual run breakdowns for drill-down functionality.
     * @param startDate Start date for filtering (YYYY-MM-DD)
     * @param endDate End date for filtering (YYYY-MM-DD)
     * @param jobName Optional job name filter
     * @param page Page number
     * @param perPage Items per page
     * @returns PaginatedGroupedJobs Successful Response
     * @throws ApiError
     */
    public static getGroupedJobSpendsApiGroupedJobSpendsGet(
        startDate: string,
        endDate: string,
        jobName?: (string | null),
        page: number = 1,
        perPage: number = 50,
    ): CancelablePromise<PaginatedGroupedJobs> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/grouped-job-spends',
            query: {
                'start_date': startDate,
                'end_date': endDate,
                'job_name': jobName,
                'page': page,
                'per_page': perPage,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Summary Metrics
     * Get summary metrics for job spending in the specified date range.
     *
     * Returns aggregated metrics including total spend, average cost, and breakdowns.
     * @param startDate Start date for summary (YYYY-MM-DD)
     * @param endDate End date for summary (YYYY-MM-DD)
     * @returns SummaryMetrics Successful Response
     * @throws ApiError
     */
    public static getSummaryMetricsApiSummaryGet(
        startDate: string,
        endDate: string,
    ): CancelablePromise<SummaryMetrics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/summary',
            query: {
                'start_date': startDate,
                'end_date': endDate,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Job Cost Breakdown
     * Get detailed cost breakdown for a specific job run.
     *
     * Returns EC2 vs Databricks cost breakdown and additional job details
     * for use in drill-down modals and pie charts.
     * @param jobId
     * @param runId Run ID for the specific job execution
     * @returns CostBreakdown Successful Response
     * @throws ApiError
     */
    public static getJobCostBreakdownApiJobJobIdBreakdownGet(
        jobId: string,
        runId: string,
    ): CancelablePromise<CostBreakdown> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/job/{job_id}/breakdown',
            path: {
                'job_id': jobId,
            },
            query: {
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Top Jobs
     * Get the top N most expensive jobs for the specified date range.
     *
     * Used for summary cards and highlighting high-cost jobs.
     * @param startDate Start date for top jobs (YYYY-MM-DD)
     * @param endDate End date for top jobs (YYYY-MM-DD)
     * @param limit Number of top jobs to return
     * @returns JobSpend Successful Response
     * @throws ApiError
     */
    public static getTopJobsApiTopJobsGet(
        startDate: string,
        endDate: string,
        limit: number = 5,
    ): CancelablePromise<Array<JobSpend>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/top-jobs',
            query: {
                'start_date': startDate,
                'end_date': endDate,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Date Presets
     * Get common date range presets for the dashboard.
     *
     * Returns predefined date ranges like "Today", "This Week", "Last 30 Days", etc.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getDatePresetsApiDatePresetsGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/date-presets',
        });
    }
    /**
     * Dashboard Health
     * Health check endpoint for the dashboard API.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static dashboardHealthApiHealthGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/health',
        });
    }
    /**
     * Debug Table Data
     * Debug endpoint to see sample data from the table.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static debugTableDataApiDebugTableGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/debug-table',
        });
    }
    /**
     * Test Databricks Connection
     * Test Databricks connection and table access.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testDatabricksConnectionApiTestConnectionGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/test-connection',
        });
    }
}
