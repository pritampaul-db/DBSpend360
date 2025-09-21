import { useState } from 'react';
import { CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from '@/types/job-spend';
import { useDatePresets } from '@/hooks/useJobSpends';
import { cn } from '@/lib/utils';

interface FilterControlsProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
  jobFilter: string;
  onJobFilterChange: (filter: string) => void;
}

export const FilterControls = ({
  dateRange,
  onDateRangeChange,
  jobFilter,
  onJobFilterChange,
}: FilterControlsProps) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { data: presets } = useDatePresets();

  const handlePresetClick = (preset: { start_date: string; end_date: string }) => {
    onDateRangeChange({
      start_date: preset.start_date,
      end_date: preset.end_date,
    });
  };

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange({
        start_date: format(range.from, 'yyyy-MM-dd'),
        end_date: format(range.to, 'yyyy-MM-dd'),
      });
      setIsDatePickerOpen(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Date Range Controls */}
      <div className="space-y-4">
        <Label className="text-sm font-semibold">Date Range</Label>

        {/* Date Range Presets */}
        {presets && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(presets).map(([key, preset]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "text-xs",
                  dateRange.start_date === preset.start_date &&
                  dateRange.end_date === preset.end_date &&
                  "bg-blue-50 border-blue-200 text-blue-700"
                )}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        )}

        {/* Custom Date Picker */}
        <div className="flex items-center space-x-2">
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.start_date && dateRange.end_date ? (
                  <>
                    {formatDisplayDate(dateRange.start_date)} -{" "}
                    {formatDisplayDate(dateRange.end_date)}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={new Date(dateRange.start_date)}
                selected={{
                  from: new Date(dateRange.start_date),
                  to: new Date(dateRange.end_date),
                }}
                onSelect={handleDateSelect}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Job Filter Controls */}
      <div className="space-y-4">
        <Label className="text-sm font-semibold">Job Filters</Label>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by job name..."
            value={jobFilter}
            onChange={(e) => onJobFilterChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Summary */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>
            <strong>Date Range:</strong> {formatDisplayDate(dateRange.start_date)} to {formatDisplayDate(dateRange.end_date)}
          </div>
          {jobFilter && (
            <div>
              <strong>Job Filter:</strong> "{jobFilter}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};