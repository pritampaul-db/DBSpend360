from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from server.models.job_spend import JobSpend, SummaryMetrics, CostBreakdown, PaginatedJobSpends, PaginatedGroupedJobs
from server.services.databricks_service import DatabricksService

router = APIRouter(prefix="/api", tags=["dashboard"])

# Lazy initialization of Databricks service
databricks_service = None

def get_databricks_service():
    global databricks_service
    if databricks_service is None:
        databricks_service = DatabricksService()
    return databricks_service


class DateRangeRequest(BaseModel):
    """Request model for date range operations."""
    start_date: date
    end_date: date


@router.get("/job-spends", response_model=PaginatedJobSpends)
async def get_job_spends(
    start_date: date = Query(..., description="Start date for filtering (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date for filtering (YYYY-MM-DD)"),
    job_name: Optional[str] = Query(None, description="Optional job name filter"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=1000, description="Items per page")
):
    """
    Get paginated job spending data with optional filters.

    Returns job spending records for the specified date range with optional job name filtering.
    Results are paginated and sorted by total cost (highest first).
    """
    try:
        # Validate date range
        if start_date > end_date:
            raise HTTPException(
                status_code=400,
                detail="Start date must be before or equal to end date"
            )

        # Calculate offset for pagination
        offset = (page - 1) * per_page

        # Get data from Databricks service
        service = get_databricks_service()
        result = await service.get_job_spends(
            start_date=start_date,
            end_date=end_date,
            job_name=job_name,
            limit=per_page,
            offset=offset
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving job spending data: {str(e)}"
        )


@router.get("/grouped-job-spends", response_model=PaginatedGroupedJobs)
async def get_grouped_job_spends(
    start_date: date = Query(..., description="Start date for filtering (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date for filtering (YYYY-MM-DD)"),
    job_name: Optional[str] = Query(None, description="Optional job name filter"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=1000, description="Items per page")
):
    """
    Get paginated job spending data grouped by job with aggregated costs and run details.

    Returns jobs with aggregated costs across all runs and detailed run information.
    Each job shows total costs and individual run breakdowns for drill-down functionality.
    """
    try:
        # Validate date range
        if start_date > end_date:
            raise HTTPException(
                status_code=400,
                detail="Start date must be before or equal to end date"
            )

        # Calculate offset for pagination
        offset = (page - 1) * per_page

        # Get data from Databricks service
        service = get_databricks_service()
        result = await service.get_grouped_job_spends(
            start_date=start_date,
            end_date=end_date,
            job_name=job_name,
            limit=per_page,
            offset=offset
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving grouped job spending data: {str(e)}"
        )


@router.get("/summary", response_model=SummaryMetrics)
async def get_summary_metrics(
    start_date: date = Query(..., description="Start date for summary (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date for summary (YYYY-MM-DD)")
):
    """
    Get summary metrics for job spending in the specified date range.

    Returns aggregated metrics including total spend, average cost, and breakdowns.
    """
    try:
        # Validate date range
        if start_date > end_date:
            raise HTTPException(
                status_code=400,
                detail="Start date must be before or equal to end date"
            )

        # Get summary data from Databricks service
        service = get_databricks_service()
        result = await service.get_summary_metrics(
            start_date=start_date,
            end_date=end_date
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving summary metrics: {str(e)}"
        )


@router.get("/job/{job_id}/breakdown", response_model=CostBreakdown)
async def get_job_cost_breakdown(
    job_id: str,
    run_id: str = Query(..., description="Run ID for the specific job execution")
):
    """
    Get detailed cost breakdown for a specific job run.

    Returns EC2 vs Databricks cost breakdown and additional job details
    for use in drill-down modals and pie charts.
    """
    try:
        # Get breakdown data from Databricks service
        service = get_databricks_service()
        result = await service.get_job_cost_breakdown(
            job_id=job_id,
            run_id=run_id
        )

        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"No cost breakdown found for job_id: {job_id}, run_id: {run_id}"
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving job cost breakdown: {str(e)}"
        )


@router.get("/top-jobs", response_model=list[JobSpend])
async def get_top_jobs(
    start_date: date = Query(..., description="Start date for top jobs (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date for top jobs (YYYY-MM-DD)"),
    limit: int = Query(5, ge=1, le=20, description="Number of top jobs to return")
):
    """
    Get the top N most expensive jobs for the specified date range.

    Used for summary cards and highlighting high-cost jobs.
    """
    try:
        # Validate date range
        if start_date > end_date:
            raise HTTPException(
                status_code=400,
                detail="Start date must be before or equal to end date"
            )

        # Get top jobs from Databricks service
        service = get_databricks_service()
        result = await service.get_top_jobs(
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving top jobs: {str(e)}"
        )


@router.get("/date-presets")
async def get_date_presets():
    """
    Get common date range presets for the dashboard.

    Returns predefined date ranges like "Today", "This Week", "Last 30 Days", etc.
    """
    today = date.today()

    presets = {
        "today": {
            "label": "Today",
            "start_date": today,
            "end_date": today
        },
        "yesterday": {
            "label": "Yesterday",
            "start_date": today - timedelta(days=1),
            "end_date": today - timedelta(days=1)
        },
        "this_week": {
            "label": "This Week",
            "start_date": today - timedelta(days=today.weekday()),
            "end_date": today
        },
        "last_week": {
            "label": "Last Week",
            "start_date": today - timedelta(days=today.weekday() + 7),
            "end_date": today - timedelta(days=today.weekday() + 1)
        },
        "this_month": {
            "label": "This Month",
            "start_date": today.replace(day=1),
            "end_date": today
        },
        "last_7_days": {
            "label": "Last 7 Days",
            "start_date": today - timedelta(days=7),
            "end_date": today
        },
        "last_30_days": {
            "label": "Last 30 Days",
            "start_date": today - timedelta(days=30),
            "end_date": today
        },
        "last_90_days": {
            "label": "Last 90 Days",
            "start_date": today - timedelta(days=90),
            "end_date": today
        }
    }

    return presets


@router.get("/health")
async def dashboard_health():
    """Health check endpoint for the dashboard API."""
    return {"status": "healthy", "service": "dashboard"}


@router.get("/databricks-host")
async def get_databricks_host():
    """Get the Databricks host URL for frontend use."""
    import os
    host = os.getenv("DATABRICKS_HOST")
    if not host:
        raise HTTPException(status_code=500, detail="DATABRICKS_HOST not configured")
    return {"databricks_host": host}


@router.get("/debug-table")
async def debug_table_data():
    """Debug endpoint to see sample data from the table."""
    try:
        service = get_databricks_service()
        client = service.client

        # Get sample data
        sample_response = client.statement_execution.execute_statement(
            warehouse_id=service.warehouse_id,
            statement=f"SELECT * FROM {service.table_name} LIMIT 5"
        )

        # Get date range
        date_range_response = client.statement_execution.execute_statement(
            warehouse_id=service.warehouse_id,
            statement=f"SELECT MIN(usage_date) as min_date, MAX(usage_date) as max_date FROM {service.table_name}"
        )

        # Test date filter query
        test_filter_response = client.statement_execution.execute_statement(
            warehouse_id=service.warehouse_id,
            statement=f"SELECT COUNT(*) FROM {service.table_name} WHERE usage_date >= '2024-09-01' AND usage_date <= '2025-09-30'"
        )

        sample_data = []
        if sample_response.result and sample_response.result.data_array:
            sample_data = sample_response.result.data_array

        date_range = {}
        if date_range_response.result and date_range_response.result.data_array:
            row = date_range_response.result.data_array[0]
            date_range = {
                "min_date": row[0],
                "max_date": row[1]
            }

        test_filter_count = 0
        if test_filter_response.result and test_filter_response.result.data_array:
            test_filter_count = test_filter_response.result.data_array[0][0]

        return {
            "status": "success",
            "table_name": service.table_name,
            "sample_data": sample_data,
            "date_range": date_range,
            "test_filter_count": test_filter_count,
            "columns": ["cluster_id", "ec2_cost", "job_id", "run_id", "usage_date", "databricks_cost"]
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


@router.get("/test-connection")
async def test_databricks_connection():
    """Test Databricks connection and table access."""
    import os

    # Check environment variables
    env_info = {
        "DATABRICKS_HOST": os.getenv("DATABRICKS_HOST", "Not set"),
        "DATABRICKS_TOKEN": "***" if os.getenv("DATABRICKS_TOKEN") else "Not set",
        "Has .env.local": os.path.exists(".env.local")
    }

    try:
        # Test basic connection
        service = get_databricks_service()
        client = service.client

        # Try to get current user to test authentication
        try:
            current_user = client.current_user.me()
            user_info = {
                "user_name": getattr(current_user, 'user_name', 'Unknown'),
                "active": getattr(current_user, 'active', 'Unknown')
            }
        except Exception as e:
            user_info = f"Error getting current user: {str(e)}"

        # List available warehouses
        warehouses = []
        try:
            warehouse_list = client.warehouses.list()
            warehouses = [{"id": w.id, "name": w.name, "state": w.state} for w in warehouse_list]
        except Exception as e:
            warehouses = [f"Error listing warehouses: {str(e)}"]

        # Test simple query with configured warehouse
        test_result = None
        warehouse_error = None
        try:
            response = client.statement_execution.execute_statement(
                warehouse_id=service.warehouse_id,
                statement="SELECT 1 as test_value"
            )
            if response.result and response.result.data_array:
                test_result = response.result.data_array[0][0]
        except Exception as e:
            warehouse_error = str(e)

        # Test table access
        table_result = None
        table_error = None
        if test_result:
            try:
                table_response = client.statement_execution.execute_statement(
                    warehouse_id=service.warehouse_id,
                    statement=f"SELECT COUNT(*) as row_count FROM {service.table_name}"
                )
                if table_response.result and table_response.result.data_array:
                    table_result = table_response.result.data_array[0][0]
            except Exception as e:
                table_error = str(e)

        return {
            "status": "success" if test_result and table_result else "partial",
            "environment": env_info,
            "user_info": user_info,
            "configured_warehouse": service.warehouse_id,
            "available_warehouses": warehouses,
            "table_name": service.table_name,
            "test_query_result": test_result,
            "warehouse_error": warehouse_error,
            "table_row_count": table_result,
            "table_error": table_error
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "environment": env_info,
            "warehouse_id": "Not initialized",
            "table_name": "Not initialized"
        }