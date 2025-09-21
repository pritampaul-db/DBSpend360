import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, AlertTriangle } from 'lucide-react';
import { useSummaryMetrics, useTopJobs } from '@/hooks/useJobSpends';
import { DateRange } from '@/types/job-spend';

interface SummaryCardsProps {
  dateRange: DateRange;
}

export const SummaryCards = ({ dateRange }: SummaryCardsProps) => {
  const { data: metrics, isLoading: isMetricsLoading } = useSummaryMetrics(dateRange);
  const { data: topJobs, isLoading: isTopJobsLoading } = useTopJobs(dateRange, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (isMetricsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px] mb-2" />
              <Skeleton className="h-3 w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-slate-500">
              No data available for the selected date range
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dailyAverageSpend = metrics.total_spend / Math.max(metrics.date_range_days, 1);
  const ec2Percentage = metrics.total_spend > 0 ? (metrics.total_ec2_cost / metrics.total_spend) * 100 : 0;
  const databricksPercentage = metrics.total_spend > 0 ? (metrics.total_databricks_cost / metrics.total_spend) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Spend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(metrics.total_spend)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.date_range_days} day{metrics.date_range_days !== 1 ? 's' : ''} period
            </p>
          </CardContent>
        </Card>

        {/* Total Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(metrics.total_jobs)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(dailyAverageSpend)}/day avg
            </p>
          </CardContent>
        </Card>

        {/* Average Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(metrics.average_cost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              per job execution
            </p>
          </CardContent>
        </Card>

        {/* Max Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Cost</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.max_cost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              single job execution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EC2 vs Databricks Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* EC2 Costs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">EC2 Costs</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(metrics.total_ec2_cost)}</div>
                  <div className="text-xs text-muted-foreground">{ec2Percentage.toFixed(1)}%</div>
                </div>
              </div>

              {/* Databricks Costs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Databricks Costs</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(metrics.total_databricks_cost)}</div>
                  <div className="text-xs text-muted-foreground">{databricksPercentage.toFixed(1)}%</div>
                </div>
              </div>

              {/* Visual Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div
                  className="bg-blue-500 h-2 rounded-l-full"
                  style={{ width: `${ec2Percentage}%` }}
                ></div>
                <div
                  className="bg-red-500 h-2 rounded-r-full -mt-2 ml-auto"
                  style={{ width: `${databricksPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Costliest Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 5 Costliest Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {isTopJobsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                ))}
              </div>
            ) : topJobs && topJobs.length > 0 ? (
              <div className="space-y-3">
                {topJobs.map((job, index) => (
                  <div key={`${job.job_id}-${job.run_id}`} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded">#{index + 1}</span>
                      <span className="text-sm font-medium truncate max-w-[120px]" title={job.job_id}>
                        {job.job_id}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatCurrency(job.total_cost)}</div>
                      <div className="text-xs text-muted-foreground">{job.usage_date}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-4">
                No jobs found for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};