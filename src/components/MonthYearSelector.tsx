import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CalendarDays } from 'lucide-react';

interface MonthYearSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  className?: string;
  compact?: boolean;
}

export function MonthYearSelector({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  className = '',
  compact = false
}: MonthYearSelectorProps) {
  // Generate months (1-12)
  const months = [
    { value: 1, label: 'Januari', short: 'Jan' },
    { value: 2, label: 'Februari', short: 'Feb' },
    { value: 3, label: 'Maret', short: 'Mar' },
    { value: 4, label: 'April', short: 'Apr' },
    { value: 5, label: 'Mei', short: 'Mei' },
    { value: 6, label: 'Juni', short: 'Jun' },
    { value: 7, label: 'Juli', short: 'Jul' },
    { value: 8, label: 'Agustus', short: 'Agu' },
    { value: 9, label: 'September', short: 'Sep' },
    { value: 10, label: 'Oktober', short: 'Okt' },
    { value: 11, label: 'November', short: 'Nov' },
    { value: 12, label: 'Desember', short: 'Des' }
  ];

  // Generate years (last 3 years + current year + next year)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 3; i <= currentYear + 1; i++) {
    years.push(i);
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <CalendarDays className="w-3 h-3 text-muted-foreground" />
        
        {/* Compact Month Selector */}
        <Select 
          value={selectedMonth.toString()} 
          onValueChange={(value) => onMonthChange(parseInt(value))}
        >
          <SelectTrigger className="w-14 h-7 text-xs border bg-transparent px-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value.toString()}>
                {month.short}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Compact Year Selector */}
        <Select 
          value={selectedYear.toString()} 
          onValueChange={(value) => onYearChange(parseInt(value))}
        >
          <SelectTrigger className="w-14 h-7 text-xs border bg-transparent px-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Filter Periode</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Month Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Bulan</label>
          <Select 
            value={selectedMonth.toString()} 
            onValueChange={(value) => onMonthChange(parseInt(value))}
          >
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Pilih Bulan" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Tahun</label>
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(value) => onYearChange(parseInt(value))}
          >
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}