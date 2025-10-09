import os
from typing import Optional
import logging
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.serving import ChatMessage, ChatMessageRole

logger = logging.getLogger(__name__)

class LLMService:
    """Service for LLM inference using Databricks models."""

    def __init__(self):
        # Check if we're running in Databricks Apps (OAuth available)
        client_id = os.getenv("DATABRICKS_CLIENT_ID")
        host = os.getenv("DATABRICKS_HOST")
        token = os.getenv("DATABRICKS_TOKEN")

        if client_id:
            # Running in Databricks Apps - use OAuth automatically
            self.client = WorkspaceClient()
        elif host and token:
            # Running locally with PAT
            self.client = WorkspaceClient(
                host=host,
                token=token
            )
        else:
            raise ValueError("Either DATABRICKS_CLIENT_ID (for OAuth) or both DATABRICKS_HOST and DATABRICKS_TOKEN (for PAT) must be set")
        self.model_name = "databricks-claude-sonnet-4"

    async def analyze_job_costs(
        self,
        job_id: str,
        run_id: str,
        ec2_cost: float,
        databricks_cost: float,
        total_cost: float,
        cluster_id: Optional[str] = None,
        usage_date: Optional[str] = None
    ) -> str:
        """
        Analyze job costs using LLM and provide insights.

        Args:
            job_id: The Databricks job ID
            run_id: The job run ID
            ec2_cost: EC2 infrastructure cost
            databricks_cost: Databricks platform cost
            total_cost: Total cost for the job run
            cluster_id: Optional cluster ID
            usage_date: Optional usage date

        Returns:
            LLM-generated analysis and recommendations
        """
        try:
            # Calculate cost percentages
            ec2_percentage = (ec2_cost / total_cost * 100) if total_cost > 0 else 0
            databricks_percentage = (databricks_cost / total_cost * 100) if total_cost > 0 else 0

            # Create analysis prompt
            prompt = f"""You are a Databricks cost optimization expert. Analyze the following job cost breakdown and provide actionable insights:

Job Details:
- Job ID: {job_id}
- Run ID: {run_id}
- Cluster ID: {cluster_id or 'N/A'}
- Usage Date: {usage_date or 'N/A'}

Cost Breakdown:
- Total Cost: ${total_cost:.2f}
- EC2 Cost: ${ec2_cost:.2f} ({ec2_percentage:.1f}%)
- Databricks Cost: ${databricks_cost:.2f} ({databricks_percentage:.1f}%)

Please provide:
1. A brief analysis of the cost distribution
2. Key insights about whether this is EC2-heavy or Databricks-heavy
3. Specific optimization recommendations
4. Cost efficiency assessment (High/Medium/Low concern level)

Keep the response concise (3-4 bullet points) and actionable for data engineers."""

            # Make the LLM call
            response = self.client.serving_endpoints.query(
                name=self.model_name,
                messages=[
                    ChatMessage(
                        role=ChatMessageRole.USER,
                        content=prompt
                    )
                ],
                max_tokens=300,
                temperature=0.1
            )

            if response.choices and len(response.choices) > 0:
                return response.choices[0].message.content.strip()
            else:
                return "Unable to generate cost analysis at this time."

        except Exception as e:
            logger.error(f"Error in LLM cost analysis: {str(e)}")
            return f"Analysis temporarily unavailable. Error: {str(e)}"

    async def analyze_cluster_configuration(
        self,
        cluster_id: str,
        owned_by: Optional[str] = None,
        create_time: Optional[str] = None,
        driver_node_type: Optional[str] = None,
        worker_node_type: Optional[str] = None,
        worker_count: Optional[int] = None,
        min_autoscale_workers: Optional[int] = None,
        max_autoscale_workers: Optional[int] = None,
        auto_termination_minutes: Optional[int] = None,
        enable_elastic_disk: Optional[bool] = None,
        tags: Optional[dict] = None,
        aws_attributes: Optional[dict] = None,
        dbr_version: Optional[str] = None,
        data_security_mode: Optional[str] = None
    ) -> str:
        """
        Analyze cluster configuration using LLM and provide optimization insights.

        Args:
            cluster_id: The cluster ID
            And all other cluster configuration parameters from system.compute.clusters

        Returns:
            LLM-generated analysis and recommendations for cluster optimization
        """
        try:
            # Format the cluster configuration information
            autoscale_info = "Fixed worker count" if not min_autoscale_workers else f"Autoscaling: {min_autoscale_workers}-{max_autoscale_workers} workers"

            # Extract AWS availability info
            aws_availability = "Not specified"
            spot_bid_percent = "Not specified"
            if aws_attributes:
                aws_availability = aws_attributes.get("availability", "Not specified")
                spot_bid_percent = aws_attributes.get("spot_bid_price_percent", "Not specified")

            # Create analysis prompt
            prompt = f"""You are a Databricks cluster optimization expert. Analyze the following cluster configuration and provide actionable insights:

Cluster Configuration:
- Cluster ID: {cluster_id}
- Owner: {owned_by or 'N/A'}
- Created: {create_time or 'N/A'}
- DBR Version: {dbr_version or 'N/A'}
- Data Security Mode: {data_security_mode or 'N/A'}

Node Configuration:
- Driver Node Type: {driver_node_type or 'N/A'}
- Worker Node Type: {worker_node_type or 'N/A'}
- Worker Count: {worker_count or 'N/A'}
- Autoscaling: {autoscale_info}
- Auto-termination: {auto_termination_minutes or 'Disabled'} minutes

Storage & AWS:
- Elastic Disk: {'Enabled' if enable_elastic_disk else 'Disabled'}
- AWS Availability: {aws_availability}
- Spot Bid Percentage: {spot_bid_percent}%

Please provide:
1. **Configuration Assessment**: Overall evaluation of the cluster setup (Excellent/Good/Needs Improvement)
2. **Cost Optimization Opportunities**: Specific recommendations to reduce costs
3. **Performance Optimization**: Suggestions for better performance and resource utilization
4. **Security & Compliance**: Assessment of security configuration
5. **Best Practices**: Key recommendations for production workloads

Keep the response concise (4-5 bullet points) and actionable for data platform engineers."""

            # Make the LLM call
            response = self.client.serving_endpoints.query(
                name=self.model_name,
                messages=[
                    ChatMessage(
                        role=ChatMessageRole.USER,
                        content=prompt
                    )
                ],
                max_tokens=400,
                temperature=0.1
            )

            if response.choices and len(response.choices) > 0:
                return response.choices[0].message.content.strip()
            else:
                return "Unable to generate cluster analysis at this time."

        except Exception as e:
            logger.error(f"Error in LLM cluster analysis: {str(e)}")
            return f"Cluster analysis temporarily unavailable. Error: {str(e)}"