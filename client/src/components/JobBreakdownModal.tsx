import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { X, Calendar, Server, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useJobBreakdown } from '@/hooks/useJobSpends';

interface JobBreakdownModalProps {
  jobId: string;
  runId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const JobBreakdownModal = ({ jobId, runId, isOpen, onClose }: JobBreakdownModalProps) => {
  const { data: breakdown, isLoading, error } = useJobBreakdown(jobId, runId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / breakdown!.total_cost) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.payload.name}</p>
          <p className="text-blue-600">{formatCurrency(data.value)}</p>
          <p className="text-sm text-muted-foreground">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Job Cost Breakdown
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {error ? (
          <div className="text-center py-8">
            <div className="text-red-600 font-medium mb-2">Error loading breakdown</div>
            <div className="text-sm text-muted-foreground">{error.message}</div>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
            {/* Loading skeleton for chart */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
            {/* Loading skeleton for details */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : breakdown ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
            {/* Cost Breakdown Chart */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Cost Distribution
              </h3>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown.cost_split}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {breakdown.cost_split.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Cost Summary */}
              <div className="space-y-2">
                {breakdown.cost_split.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(item.value)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-2 bg-slate-100 rounded font-bold">
                  <span>Total Cost</span>
                  <span>{formatCurrency(breakdown.total_cost)}</span>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Server className="mr-2 h-5 w-5" />
                Job Details
              </h3>

              <div className="space-y-4">
                {/* Job Information */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">Job ID</span>
                    <div className="text-right">
                      <div className="font-mono text-sm max-w-[200px] truncate" title={breakdown.job_id}>
                        {breakdown.job_id}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">Run ID</span>
                    <div className="text-right">
                      <div className="font-mono text-sm max-w-[200px] truncate" title={breakdown.run_id}>
                        {breakdown.run_id}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">Cluster ID</span>
                    <div className="text-right">
                      <div className="font-mono text-sm max-w-[200px] truncate" title={breakdown.cluster_id}>
                        {breakdown.cluster_id}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Usage Date</span>
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-1 h-4 w-4" />
                      {formatDate(breakdown.usage_date)}
                    </div>
                  </div>
                </div>

                {/* Cost Analysis */}
                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-semibold">Cost Analysis</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {((breakdown.ec2_cost / breakdown.total_cost) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-blue-600">EC2 Share</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded">
                      <div className="text-2xl font-bold text-red-600">
                        {((breakdown.databricks_cost / breakdown.total_cost) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-red-600">Databricks Share</div>
                    </div>
                  </div>

                  {/* Cost Indicators */}
                  <div className="space-y-2">
                    {breakdown.total_cost > 100 && (
                      <Badge variant="destructive" className="w-full justify-center">
                        High Cost Job
                      </Badge>
                    )}
                    {breakdown.ec2_cost > breakdown.databricks_cost ? (
                      <Badge variant="secondary" className="w-full justify-center">
                        EC2-Heavy Workload
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="w-full justify-center">
                        Databricks-Heavy Workload
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-muted-foreground">No breakdown data available</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};