import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCards } from './SummaryCards';
import { FilterControls } from './FilterControls';
import { JobSpendTable } from './JobSpendTable';
import { JobBreakdownModal } from './JobBreakdownModal';
import { DateRange, JobSpend } from '@/types/job-spend';

const Dashboard = () => {
  // Default to last 30 days as specified in requirements
  const defaultDateRange: DateRange = {
    start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
  };

  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [jobFilter, setJobFilter] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<JobSpend | null>(null);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

  const handleJobClick = (job: JobSpend) => {
    setSelectedJob(job);
    setIsBreakdownModalOpen(true);
  };

  const handleModalClose = () => {
    setIsBreakdownModalOpen(false);
    setSelectedJob(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">
            DBSpend360
          </h1>
          <p className="text-slate-600">
            Databricks Job Cost Analytics Dashboard
          </p>
        </div>

        {/* Summary Cards */}
        <SummaryCards dateRange={dateRange} />

        {/* Filter Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <FilterControls
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              jobFilter={jobFilter}
              onJobFilterChange={setJobFilter}
            />
          </CardContent>
        </Card>

        {/* Job Spend Table */}
        <Card>
          <CardHeader>
            <CardTitle>Job Spending Details</CardTitle>
          </CardHeader>
          <CardContent>
            <JobSpendTable
              dateRange={dateRange}
              jobFilter={jobFilter}
              onJobClick={handleJobClick}
            />
          </CardContent>
        </Card>

        {/* Drill-down Modal */}
        {selectedJob && (
          <JobBreakdownModal
            jobId={selectedJob.job_id}
            runId={selectedJob.run_id}
            isOpen={isBreakdownModalOpen}
            onClose={handleModalClose}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;