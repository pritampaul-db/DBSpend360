from datetime import date
from typing import Optional, Any
from pydantic import BaseModel, Field, computed_field


class JobSpend(BaseModel):
    """Data model for Databricks job spending records."""

    cluster_id: str
    ec2_cost: float
    job_id: str
    job_name: Optional[str] = None
    run_id: str
    usage_date: date
    databricks_cost: float

    @computed_field
    @property
    def total_cost(self) -> float:
        """Calculate total cost as sum of EC2 and Databricks costs."""
        return self.ec2_cost + self.databricks_cost

    @computed_field
    @property
    def ec2_percentage(self) -> float:
        """Calculate EC2 cost as percentage of total."""
        if self.total_cost == 0:
            return 0.0
        return (self.ec2_cost / self.total_cost) * 100

    @computed_field
    @property
    def databricks_percentage(self) -> float:
        """Calculate Databricks cost as percentage of total."""
        if self.total_cost == 0:
            return 0.0
        return (self.databricks_cost / self.total_cost) * 100


class JobSpendFilter(BaseModel):
    """Filter parameters for job spend queries."""

    start_date: date
    end_date: date
    job_name: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)


class SummaryMetrics(BaseModel):
    """Summary metrics for job spending data."""

    total_jobs: int
    total_spend: float
    average_cost: float
    max_cost: float
    min_cost: float
    total_ec2_cost: float
    total_databricks_cost: float
    date_range_days: int


class CostBreakdown(BaseModel):
    """Cost breakdown for individual job."""

    job_id: str
    run_id: str
    cluster_id: str
    usage_date: date
    ec2_cost: float
    databricks_cost: float
    total_cost: float
    cost_split: list[dict[str, Any]] = Field(default_factory=list)

    def __init__(self, **data):
        super().__init__(**data)
        # Generate cost split data for pie chart
        self.cost_split = [
            {"name": "EC2 Cost", "value": self.ec2_cost, "color": "#3b82f6"},
            {"name": "Databricks Cost", "value": float(data.get('databricks_cost', 0)), "color": "#ef4444"}
        ]


class JobRun(BaseModel):
    """Individual job run details."""

    run_id: str
    cluster_id: str
    usage_date: date
    ec2_cost: float
    databricks_cost: float

    @computed_field
    @property
    def total_cost(self) -> float:
        """Calculate total cost as sum of EC2 and Databricks costs."""
        return self.ec2_cost + self.databricks_cost

    @computed_field
    @property
    def ec2_percentage(self) -> float:
        """Calculate EC2 cost as percentage of total."""
        if self.total_cost == 0:
            return 0.0
        return (self.ec2_cost / self.total_cost) * 100

    @computed_field
    @property
    def databricks_percentage(self) -> float:
        """Calculate Databricks cost as percentage of total."""
        if self.total_cost == 0:
            return 0.0
        return (self.databricks_cost / self.total_cost) * 100


class GroupedJob(BaseModel):
    """Grouped job data with aggregated costs and run details."""

    job_id: str
    job_name: Optional[str] = None
    run_count: int
    total_ec2_cost: float
    total_databricks_cost: float
    runs: list[JobRun]

    @computed_field
    @property
    def total_cost(self) -> float:
        """Calculate total cost across all runs."""
        return self.total_ec2_cost + self.total_databricks_cost

    @computed_field
    @property
    def ec2_percentage(self) -> float:
        """Calculate EC2 cost as percentage of total."""
        if self.total_cost == 0:
            return 0.0
        return (self.total_ec2_cost / self.total_cost) * 100

    @computed_field
    @property
    def databricks_percentage(self) -> float:
        """Calculate Databricks cost as percentage of total."""
        if self.total_cost == 0:
            return 0.0
        return (self.total_databricks_cost / self.total_cost) * 100


class PaginatedJobSpends(BaseModel):
    """Paginated response for job spends."""

    data: list[JobSpend]
    total_count: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_previous: bool


class PaginatedGroupedJobs(BaseModel):
    """Paginated response for grouped jobs."""

    data: list[GroupedJob]
    total_count: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_previous: bool