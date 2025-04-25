"use client";

import React from 'react';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CalendarHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  calendarOnly?: boolean;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  selectedDate,
  onDateChange,
  calendarOnly = false,
}) => {
  // Get current date with time set to start of day to avoid timezone issues
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate three months from today
  const threeMonthsLater = addMonths(today, 3);
  
  if (calendarOnly) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-medium bg-white hover:bg-accent/10 w-full",
              "border border-input hover:text-accent"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {/* Use date-fns format with Spanish locale */}
            {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-50 bg-white" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateChange(date)}
            initialFocus
            fromDate={today}
            toDate={threeMonthsLater}
            locale={es} // Set Spanish locale
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    );
  }

  // If not calendarOnly, provide other UI elements here
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-6">
      <div className="w-full md:w-auto mb-4 md:mb-0">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-medium bg-white hover:bg-accent/10",
                "border border-input hover:text-accent w-full md:w-auto"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {/* Format date in Spanish locale for Costa Rica */}
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50 bg-white" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
              fromDate={today}
              toDate={threeMonthsLater}
              locale={es} // Set Spanish locale
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default CalendarHeader;