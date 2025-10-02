import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CalendarIcon } from 'lucide-react';
import { cn } from './ui/utils';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface PeriodSelectorProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
  disabled?: boolean;
  latestDataDate?: Date;
}

export function PeriodSelector({ 
  dateRange, 
  onDateRangeChange, 
  className,
  disabled = false,
  latestDataDate
}: PeriodSelectorProps) {
  
  // Get latest available date from the system (defaulting to today if none available)
  const getLatestDataDate = () => {
    return latestDataDate || new Date();
  };

  // Generate period options
  const getPeriodOptions = () => {
    const latestDate = getLatestDataDate();
    const currentDate = new Date();
    
    return [
      {
        value: "today",
        label: "Hari Ini",
        dateRange: {
          from: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
          to: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
        }
      },
      {
        value: "yesterday",
        label: "Kemarin",
        dateRange: {
          from: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000),
          to: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000)
        }
      },
      {
        value: "7days",
        label: "7 Hari Terakhir",
        dateRange: {
          from: new Date(latestDate.getTime() - 6 * 24 * 60 * 60 * 1000),
          to: latestDate
        }
      },
      {
        value: "30days",
        label: "30 Hari Terakhir",
        dateRange: {
          from: new Date(latestDate.getTime() - 29 * 24 * 60 * 60 * 1000),
          to: latestDate
        }
      },
      {
        value: "current_month",
        label: "Bulan Ini",
        dateRange: {
          from: new Date(latestDate.getFullYear(), latestDate.getMonth(), 1),
          to: latestDate
        }
      },
      {
        value: "last_month",
        label: "Bulan Lalu",
        dateRange: (() => {
          const firstDayLastMonth = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);
          const lastDayLastMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 0);
          return {
            from: firstDayLastMonth,
            to: lastDayLastMonth
          };
        })()
      },
      {
        value: "august_2024",
        label: "Agustus 2024",
        dateRange: {
          from: new Date(2024, 7, 1), // August = month 7 (0-indexed)
          to: new Date(2024, 7, 31)
        }
      },
      {
        value: "july_2024",
        label: "Juli 2024",
        dateRange: {
          from: new Date(2024, 6, 1), // July = month 6 (0-indexed)
          to: new Date(2024, 6, 31)
        }
      },
      {
        value: "current_quarter",
        label: "Kuartal Ini",
        dateRange: (() => {
          const currentMonth = latestDate.getMonth();
          const currentYear = latestDate.getFullYear();
          const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
          return {
            from: new Date(currentYear, quarterStartMonth, 1),
            to: latestDate
          };
        })()
      },
      {
        value: "current_year",
        label: "Tahun Ini",
        dateRange: {
          from: new Date(latestDate.getFullYear(), 0, 1),
          to: latestDate
        }
      },
      {
        value: "last_year",
        label: "Tahun Lalu",
        dateRange: {
          from: new Date(latestDate.getFullYear() - 1, 0, 1),
          to: new Date(latestDate.getFullYear() - 1, 11, 31)
        }
      },
      {
        value: "all_time",
        label: "Sepanjang Waktu",
        dateRange: {
          from: undefined,
          to: undefined
        }
      },
      {
        value: "custom",
        label: "Periode Custom",
        dateRange: dateRange // Keep current selection for custom
      }
    ];
  };

  const periodOptions = getPeriodOptions();

  // Find current selection
  const getCurrentSelection = () => {
    if (!dateRange.from && !dateRange.to) {
      return "all_time";
    }

    // Check if current dateRange matches any predefined period
    for (const option of periodOptions) {
      if (option.value === "custom") continue;
      
      const optionRange = option.dateRange;
      if (optionRange.from && optionRange.to && dateRange.from && dateRange.to) {
        if (optionRange.from.toDateString() === dateRange.from.toDateString() &&
            optionRange.to.toDateString() === dateRange.to.toDateString()) {
          return option.value;
        }
      } else if (!optionRange.from && !optionRange.to && !dateRange.from && !dateRange.to) {
        return option.value;
      }
    }
    
    return "custom";
  };

  const handlePeriodChange = (value: string) => {
    const selectedOption = periodOptions.find(option => option.value === value);
    if (selectedOption && value !== "custom") {
      onDateRangeChange(selectedOption.dateRange);
    }
    // For custom, we don't change the dateRange here - user would need to use a separate date picker
  };

  const getCurrentLabel = () => {
    const currentSelection = getCurrentSelection();
    const selectedOption = periodOptions.find(option => option.value === currentSelection);
    return selectedOption?.label || "Pilih Periode";
  };

  return (
    <Select 
      value={getCurrentSelection()} 
      onValueChange={handlePeriodChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <div className="flex items-center">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Pilih periode">
            {getCurrentLabel()}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {periodOptions.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="cursor-pointer"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}