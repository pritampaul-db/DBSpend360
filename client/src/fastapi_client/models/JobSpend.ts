/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Data model for Databricks job spending records.
 */
export type JobSpend = {
    cluster_id: string;
    ec2_cost: number;
    job_id: string;
    run_id: string;
    usage_date: string;
    databricks_cost: number;
    /**
     * Calculate total cost as sum of EC2 and Databricks costs.
     */
    readonly total_cost: number;
    /**
     * Calculate EC2 cost as percentage of total.
     */
    readonly ec2_percentage: number;
    /**
     * Calculate Databricks cost as percentage of total.
     */
    readonly databricks_percentage: number;
};

