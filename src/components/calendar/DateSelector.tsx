import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Add interface for component props
interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateChange }) => {
  const today = new Date();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Limit selectable dates (today + 3 months)
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  
  // Navigate to next/previous day
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    
    // Check if the new date is within allowed range
    if (newDate >= today && newDate <= threeMonthsLater) {
      onDateChange(newDate);
    }
  };

  // Format the date in a nice way
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  };

  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigateDay('prev')}
          disabled={selectedDate.toDateString() === today.toDateString()}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-auto justify-start text-left font-medium bg-white hover:bg-accent/10",
                "border border-input hover:text-accent"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span className="text-base">
                {formatDate(selectedDate)}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50 bg-white" align="center">
            <CalendarUI
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  onDateChange(date);
                  setIsCalendarOpen(false);
                }
              }}
              initialFocus
              fromDate={today}
              toDate={threeMonthsLater}
              className="border-none p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigateDay('next')}
          disabled={selectedDate.toDateString() === threeMonthsLater.toDateString()}
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DateSelector;