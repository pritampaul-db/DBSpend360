import os
from datetime import date, timedelta
from typing import List, Optional, Tuple

from databricks.sdk import WorkspaceClient

from server.models.job_spend import JobSpend, SummaryMetrics, CostBreakdown, PaginatedJobSpends


class DatabricksService:
    """Service for interacting with Databricks SQL Warehouse."""

    def __init__(self):
        # Explicitly configure the WorkspaceClient with environment variables
        host = os.getenv("DATABRICKS_HOST")
        token = os.getenv("DATABRICKS_TOKEN")

        if not host or not token:
            raise ValueError("DATABRICKS_HOST and DATABRICKS_TOKEN environment variables must be set")

        self.client = WorkspaceClient(
            host=host,
            token=token
        )
        self.warehouse_id = "862f1d757f0424f7"  # Correct warehouse ID
        self.table_name = "pritam_demo.dbcost360.databricks_job_spends"

    async def get_job_spends(
        self,
        start_date: date,
        end_date: date,
        job_name: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> PaginatedJobSpends:
        """Get paginated job spending data with optional job name filter."""

        # Build the base query with direct string interpolation
        where_clause = f"WHERE usage_date >= '{start_date.isoformat()}' AND usage_date <= '{end_date.isoformat()}'"

        # Add job name filter if provided
        if job_name:
            # Escape single quotes in job_name to prevent SQL injection
            escaped_job_name = job_name.replace("'", "''")
            where_clause += f" AND job_id LIKE '%{escaped_job_name}%'"

        # Count query for pagination
        count_query = f"""
        SELECT COUNT(*) as total_count
        FROM {self.table_name}
        {where_clause}
        """

        # Data query with pagination
        data_query = f"""
        SELECT
            cluster_id,
            ec2_cost,
            job_id,
            run_id,
            usage_date,
            databricks_cost
        FROM {self.table_name}
        {where_clause}
        ORDER BY (ec2_cost + databricks_cost) DESC
        LIMIT {limit} OFFSET {offset}
        """

        # Execute count query
        count_response = self.client.statement_execution.execute_statement(
            warehouse_id=self.warehouse_id,
            statement=count_query
        )

        total_count = 0
        if count_response.result and count_response.result.data_array:
            total_count = int(count_response.result.data_array[0][0])

        # Execute data query
        data_response = self.client.statement_execution.execute_statement(
            warehouse_id=self.warehouse_id,
            statement=data_query
        )

        job_spends = []
        if data_response.result and data_response.result.data_array:
            for row in data_response.result.data_array:
                job_spend = JobSpend(
                    cluster_id=row[0],
                    ec2_cost=float(row[1]),
                    job_id=row[2],
                    run_id=row[3],
                    usage_date=date.fromisoformat(row[4]),
                    databricks_cost=float(row[5])
                )
                job_spends.append(job_spend)

        # Calculate pagination info
        total_pages = (total_count + limit - 1) // limit
        current_page = (offset // limit) + 1

        return PaginatedJobSpends(
            data=job_spends,
            total_count=total_count,
            page=current_page,
            per_page=limit,
            total_pages=total_pages,
            has_next=current_page < total_pages,
            has_previous=current_page > 1
        )

    async def get_summary_metrics(self, start_date: date, end_date: date) -> SummaryMetrics:
        """Get summary metrics for the specified date range."""

        query = f"""
        SELECT
            COUNT(*) as total_jobs,
            SUM(ec2_cost + databricks_cost) as total_spend,
            AVG(ec2_cost + databricks_cost) as avg_cost,
            MAX(ec2_cost + databricks_cost) as max_cost,
            MIN(ec2_cost + databricks_cost) as min_cost,
            SUM(ec2_cost) as total_ec2_cost,
            SUM(databricks_cost) as total_databricks_cost
        FROM {self.table_name}
        WHERE usage_date >= '{start_date.isoformat()}' AND usage_date <= '{end_date.isoformat()}'
        """

        response = self.client.statement_execution.execute_statement(
            warehouse_id=self.warehouse_id,
            statement=query
        )

        if response.result and response.result.data_array:
            row = response.result.data_array[0]
            date_range_days = (end_date - start_date).days + 1

            return SummaryMetrics(
                total_jobs=int(row[0]) if row[0] else 0,
                total_spend=float(row[1]) if row[1] else 0.0,
                average_cost=float(row[2]) if row[2] else 0.0,
                max_cost=float(row[3]) if row[3] else 0.0,
                min_cost=float(row[4]) if row[4] else 0.0,
                total_ec2_cost=float(row[5]) if row[5] else 0.0,
                total_databricks_cost=float(row[6]) if row[6] else 0.0,
                date_range_days=date_range_days
            )

        # Return empty metrics if no data
        return SummaryMetrics(
            total_jobs=0,
            total_spend=0.0,
            average_cost=0.0,
            max_cost=0.0,
            min_cost=0.0,
            total_ec2_cost=0.0,
            total_databricks_cost=0.0,
            date_range_days=(end_date - start_date).days + 1
        )

    async def get_job_cost_breakdown(self, job_id: str, run_id: str) -> Optional[CostBreakdown]:
        """Get detailed cost breakdown for a specific job run."""

        # Escape single quotes to prevent SQL injection
        escaped_job_id = job_id.replace("'", "''")
        escaped_run_id = run_id.replace("'", "''")

        query = f"""
        SELECT
            job_id,
            run_id,
            cluster_id,
            usage_date,
            ec2_cost,
            databricks_cost
        FROM {self.table_name}
        WHERE job_id = '{escaped_job_id}' AND run_id = '{escaped_run_id}'
        """

        response = self.client.statement_execution.execute_statement(
            warehouse_id=self.warehouse_id,
            statement=query
        )

        if response.result and response.result.data_array:
            row = response.result.data_array[0]
            ec2_cost = float(row[4])
            databricks_cost = float(row[5])

            return CostBreakdown(
                job_id=row[0],
                run_id=row[1],
                cluster_id=row[2],
                usage_date=date.fromisoformat(row[3]),
                ec2_cost=ec2_cost,
                databricks_cost=databricks_cost,
                total_cost=ec2_cost + databricks_cost
            )

        return None

    async def get_top_jobs(self, start_date: date, end_date: date, limit: int = 5) -> List[JobSpend]:
        """Get top N most expensive jobs for the date range."""

        query = f"""
        SELECT
            cluster_id,
            ec2_cost,
            job_id,
            run_id,
            usage_date,
            databricks_cost
        FROM {self.table_name}
        WHERE usage_date >= '{start_date.isoformat()}' AND usage_date <= '{end_date.isoformat()}'
        ORDER BY (ec2_cost + databricks_cost) DESC
        LIMIT {limit}
        """

        response = self.client.statement_execution.execute_statement(
            warehouse_id=self.warehouse_id,
            statement=query
        )

        jobs = []
        if response.result and response.result.data_array:
            for row in response.result.data_array:
                job_spend = JobSpend(
                    cluster_id=row[0],
                    ec2_cost=float(row[1]),
                    job_id=row[2],
                    run_id=row[3],
                    usage_date=date.fromisoformat(row[4]),
                    databricks_cost=float(row[5])
                )
                jobs.append(job_spend)

        return jobs