/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GroupedJob } from './GroupedJob';
/**
 * Paginated response for grouped jobs.
 */
export type PaginatedGroupedJobs = {
    data: Array<GroupedJob>;
    total_count: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
};

