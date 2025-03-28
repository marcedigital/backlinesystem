"use client";

import { format, addMonths } from 'date-fns';
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
  const today = new Date();
  const threeMonthsLater = addMonths(today, 3);

  if (calendarOnly) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-medium bg-white hover:bg-accent/10",
              "border border-input hover:text-accent"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(selectedDate, 'MMMM d, yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-50 bg-white" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateChange(date)}
            initialFocus
            fromDate={today}
            toDate={threeMonthsLater}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    );
  }


};

export default CalendarHeader;
