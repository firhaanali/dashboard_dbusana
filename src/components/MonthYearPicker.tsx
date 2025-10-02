import React, { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './ui/utils';

interface MonthYearPickerProps {
  selectedMonth?: number;
  selectedYear?: number;
  onMonthYearChange: (month?: number, year?: number) => void;
  className?: string;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function MonthYearPicker({ 
  selectedMonth, 
  selectedYear, 
  onMonthYearChange,
  className 
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedYear || new Date().getFullYear());

  const handleMonthSelect = (month: number) => {
    onMonthYearChange(month, viewYear);
    setIsOpen(false);
  };

  const handleAllDataSelect = () => {
    onMonthYearChange(undefined, undefined);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (selectedMonth !== undefined && selectedYear !== undefined) {
      return `${MONTHS[selectedMonth]} ${selectedYear}`;
    }
    return 'Semua Data';
  };

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 5;
  const maxYear = currentYear + 1;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={cn("gap-2 h-8 text-xs sm:text-sm", className)}
        >
          <Calendar className="w-4 h-4" />
          {getDisplayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          {/* Header dengan Year Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewYear(viewYear - 1)}
              disabled={viewYear <= minYear}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="font-medium text-gray-900 dark:text-gray-100">{viewYear}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewYear(viewYear + 1)}
              disabled={viewYear >= maxYear}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* All Data Option */}
          <Button
            variant={selectedMonth === undefined ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={handleAllDataSelect}
          >
            Semua Data
          </Button>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((monthName, index) => (
              <Button
                key={index}
                variant={
                  selectedMonth === index && selectedYear === viewYear
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className="text-xs"
                onClick={() => handleMonthSelect(index)}
              >
                {monthName}
              </Button>
            ))}
          </div>

          {/* Current Selection Display */}
          {selectedMonth !== undefined && selectedYear !== undefined && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2 border-t">
              Terpilih: {MONTHS[selectedMonth]} {selectedYear}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}