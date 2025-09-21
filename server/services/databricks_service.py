import os
from datetime import date, timedelta
from typing import List, Optional, Tuple, Dict

from databricks.sdk import WorkspaceClient

from server.models.job_spend import JobSpend, SummaryMetrics, CostBreakdown, PaginatedJobSpends, GroupedJob, JobRun, PaginatedGroupedJobs


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
        self.job_name_cache: Dict[str, str] = {}  # Cache for job names

    async def get_job_name(self, job_id: str) -> str:
        """Get job name from Jobs API with caching."""
        if job_id in self.job_name_cache:
            return self.job_name_cache[job_id]

        try:
            # Try to get job details from Jobs API
            job = self.client.jobs.get(job_id=int(job_id))
            job_name = job.settings.name if job.settings and job.settings.name else f"Job {job_id}"
            self.job_name_cache[job_id] = job_name
            return job_name
        except Exception as e:
            # If job doesn't exist or we can't access it, return a default name
            job_name = f"Job {job_id}"
            self.job_name_cache[job_id] = job_name
            return job_name

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
                job_id = row[2]
                job_name = await self.get_job_name(job_id)

                job_spend = JobSpend(
                    cluster_id=row[0],
                    ec2_cost=float(row[1]),
                    job_id=job_id,
                    job_name=job_name,
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
        """Get detailed cost breakdown for a specific job run, aggregated by run_id."""

        # Escape single quotes to prevent SQL injection
        escaped_job_id = job_id.replace("'", "''")
        escaped_run_id = run_id.replace("'", "''")

        query = f"""
        SELECT
            job_id,
            run_id,
            cluster_id,
            usage_date,
            SUM(ec2_cost) as total_ec2_cost,
            SUM(databricks_cost) as total_databricks_cost
        FROM {self.table_name}
        WHERE job_id = '{escaped_job_id}' AND run_id = '{escaped_run_id}'
        GROUP BY job_id, run_id, cluster_id, usage_date
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
                job_id = row[2]
                job_name = await self.get_job_name(job_id)

                job_spend = JobSpend(
                    cluster_id=row[0],
                    ec2_cost=float(row[1]),
                    job_id=job_id,
                    job_name=job_name,
                    run_id=row[3],
                    usage_date=date.fromisoformat(row[4]),
                    databricks_cost=float(row[5])
                )
                jobs.append(job_spend)

        return jobs

    async def get_grouped_job_spends(
        self,
        start_date: date,
        end_date: date,
        job_name: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> PaginatedGroupedJobs:
        """Get paginated job spending data grouped by job with run details."""

        # Build the base query with direct string interpolation
        where_clause = f"WHERE usage_date >= '{start_date.isoformat()}' AND usage_date <= '{end_date.isoformat()}'"

        # For job name filtering, we need to get more results and filter after retrieving job names
        # since job names come from the Jobs API, not the database
        fetch_limit = limit * 3 if job_name else limit  # Get more results if filtering by name
        fetch_offset = 0 if job_name else offset  # Start from beginning if filtering

        # Data query with aggregation
        data_query = f"""
        SELECT
            job_id,
            SUM(ec2_cost) as total_ec2_cost,
            SUM(databricks_cost) as total_databricks_cost,
            COUNT(*) as run_count
        FROM {self.table_name}
        {where_clause}
        GROUP BY job_id
        ORDER BY (SUM(ec2_cost) + SUM(databricks_cost)) DESC
        LIMIT {fetch_limit} OFFSET {fetch_offset}
        """

        # Execute data query
        data_response = self.client.statement_execution.execute_statement(
            warehouse_id=self.warehouse_id,
            statement=data_query
        )

        all_grouped_jobs = []
        if data_response.result and data_response.result.data_array:
            for row in data_response.result.data_array:
                job_id = row[0]
                total_ec2_cost = float(row[1])
                total_databricks_cost = float(row[2])
                run_count = int(row[3])

                # Get job name
                retrieved_job_name = await self.get_job_name(job_id)

                # Filter by job name if provided (case-insensitive partial match)
                if job_name and job_name.lower() not in retrieved_job_name.lower():
                    continue

                # Get individual runs for this job (limited to most recent 10 for performance)
                runs = await self.get_job_runs(job_id, start_date, end_date, limit=10)

                grouped_job = GroupedJob(
                    job_id=job_id,
                    job_name=retrieved_job_name,
                    run_count=run_count,
                    total_ec2_cost=total_ec2_cost,
                    total_databricks_cost=total_databricks_cost,
                    runs=runs
                )
                all_grouped_jobs.append(grouped_job)

        # Apply pagination to filtered results
        if job_name:
            total_count = len(all_grouped_jobs)
            start_idx = offset
            end_idx = offset + limit
            grouped_jobs = all_grouped_jobs[start_idx:end_idx]
        else:
            # For non-filtered queries, get total count separately
            count_query = f"""
            SELECT COUNT(DISTINCT job_id) as total_count
            FROM {self.table_name}
            {where_clause}
            """
            count_response = self.client.statement_execution.execute_statement(
                warehouse_id=self.warehouse_id,
                statement=count_query
            )
            total_count = 0
            if count_response.result and count_response.result.data_array:
                total_count = int(count_response.result.data_array[0][0])
            grouped_jobs = all_grouped_jobs

        # Calculate pagination info
        total_pages = (total_count + limit - 1) // limit
        current_page = (offset // limit) + 1

        return PaginatedGroupedJobs(
            data=grouped_jobs,
            total_count=total_count,
            page=current_page,
            per_page=limit,
            total_pages=total_pages,
            has_next=current_page < total_pages,
            has_previous=current_page > 1
        )

    async def get_job_runs(self, job_id: str, start_date: date, end_date: date, limit: int = 10) -> List[JobRun]:
        """Get recent runs for a specific job within date range, aggregated by run_id."""

        # Escape single quotes to prevent SQL injection
        escaped_job_id = job_id.replace("'", "''")

        # First, get distinct run_ids with their max usage_date for ordering
        query = f"""
        SELECT
            run_id,
            cluster_id,
            usage_date,
            SUM(ec2_cost) as total_ec2_cost,
            SUM(databricks_cost) as total_databricks_cost
        FROM {self.table_name}
        WHERE job_id = '{escaped_job_id}'
        AND usage_date >= '{start_date.isoformat()}'
        AND usage_date <= '{end_date.isoformat()}'
        GROUP BY run_id, cluster_id, usage_date
        ORDER BY usage_date DESC, run_id DESC
        LIMIT {limit}
        """

        response = self.client.statement_execution.execute_statement(
            warehouse_id=self.warehouse_id,
            statement=query
        )

        runs = []
        if response.result and response.result.data_array:
            for row in response.result.data_array:
                run = JobRun(
                    run_id=row[0],
                    cluster_id=row[1],
                    usage_date=date.fromisoformat(row[2]),
                    ec2_cost=float(row[3]),
                    databricks_cost=float(row[4])
                )
                runs.append(run)

        return runs