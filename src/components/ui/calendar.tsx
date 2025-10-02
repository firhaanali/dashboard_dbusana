"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";

export interface CalendarProps {
  mode?: "single" | "range";
  selected?: any;
  onSelect?: (date: any) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  initialFocus?: boolean;
  defaultMonth?: Date;
  numberOfMonths?: number;
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, mode = "single", selected, onSelect, disabled, numberOfMonths = 1, ...props }, ref) => {
    const [currentMonth, setCurrentMonth] = React.useState(() => {
      if (props.defaultMonth) return props.defaultMonth;
      if (selected?.from) return selected.from;
      return new Date();
    });

    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days: (Date | null)[] = [];

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }

      // Add all days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
      }

      return days;
    };

    const handleDateClick = (date: Date) => {
      if (disabled && disabled(date)) return;

      if (mode === "single") {
        onSelect?.(date);
      } else if (mode === "range") {
        if (!selected?.from || (selected.from && selected.to)) {
          // Start new range
          onSelect?.({ from: date, to: undefined });
        } else if (selected.from && !selected.to) {
          // Complete range
          if (date >= selected.from) {
            onSelect?.({ from: selected.from, to: date });
          } else {
            onSelect?.({ from: date, to: selected.from });
          }
        }
      }
    };

    const isDateSelected = (date: Date) => {
      if (mode === "single") {
        return selected && selected.toDateString() === date.toDateString();
      } else if (mode === "range" && selected) {
        if (selected.from && selected.to) {
          return date >= selected.from && date <= selected.to;
        } else if (selected.from) {
          return date.toDateString() === selected.from.toDateString();
        }
      }
      return false;
    };

    const isDateInRange = (date: Date) => {
      if (mode === "range" && selected?.from && selected?.to) {
        return date > selected.from && date < selected.to;
      }
      return false;
    };

    const isRangeStart = (date: Date) => {
      return mode === "range" && selected?.from && date.toDateString() === selected.from.toDateString();
    };

    const isRangeEnd = (date: Date) => {
      return mode === "range" && selected?.to && date.toDateString() === selected.to.toDateString();
    };

    const previousMonth = () => {
      setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const nextMonth = () => {
      setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const renderMonth = (monthOffset: number = 0) => {
      const displayMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1);
      const days = getDaysInMonth(displayMonth);

      return (
        <div className="flex flex-col gap-4">
          {/* Month Header */}
          <div className="flex justify-center pt-1 relative items-center">
            {monthOffset === 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute left-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                  onClick={previousMonth}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                  onClick={nextMonth}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </>
            )}
            <div className="text-sm font-medium">
              {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
            </div>
          </div>

          {/* Days Grid */}
          <div className="w-full border-collapse space-x-1">
            {/* Header Row */}
            <div className="flex">
              {dayNames.map(day => (
                <div
                  key={day}
                  className="text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex items-center justify-center h-8"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="flex flex-col mt-2">
              {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
                <div key={weekIndex} className="flex w-full mt-2">
                  {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={cn(
                        "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-8 h-8",
                        mode === "range" && date && isDateInRange(date) && "bg-accent",
                        mode === "range" && date && isRangeStart(date) && "rounded-l-md",
                        mode === "range" && date && isRangeEnd(date) && "rounded-r-md"
                      )}
                    >
                      {date && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "size-8 p-0 font-normal aria-selected:opacity-100 w-full h-full",
                            isDateSelected(date) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                            date.toDateString() === new Date().toDateString() && !isDateSelected(date) && "bg-accent text-accent-foreground",
                            disabled && disabled(date) && "text-muted-foreground opacity-50 pointer-events-none"
                          )}
                          onClick={() => handleDateClick(date)}
                          disabled={disabled && disabled(date)}
                        >
                          {date.getDate()}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div ref={ref} className={cn("p-3", className)}>
        <div className={cn("flex", numberOfMonths > 1 ? "gap-4" : "")}>
          {Array.from({ length: numberOfMonths }, (_, i) => (
            <div key={i}>
              {renderMonth(i)}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

Calendar.displayName = "Calendar";

export { Calendar };