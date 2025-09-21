/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Cost breakdown for individual job.
 */
export type CostBreakdown = {
    job_id: string;
    run_id: string;
    cluster_id: string;
    usage_date: string;
    ec2_cost: number;
    databricks_cost: number;
    total_cost: number;
    cost_split?: Array<Record<string, any>>;
};

