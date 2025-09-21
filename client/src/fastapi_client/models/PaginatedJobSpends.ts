/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JobSpend } from './JobSpend';
/**
 * Paginated response for job spends.
 */
export type PaginatedJobSpends = {
    data: Array<JobSpend>;
    total_count: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
};

