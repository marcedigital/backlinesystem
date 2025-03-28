"use client";

import React from 'react';
import TimeSlot from '../TimeSlot';
import { TimeSlot as TimeSlotType } from '@/utils/bookingUtils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlotsGridProps {
  timeSlots: TimeSlotType[];
  isSelecting: boolean;
  onSelectStart: (slot: TimeSlotType) => void;
  onSelectEnd: (slot: TimeSlotType) => void;
  onMouseEnter: (slot: TimeSlotType) => void;
  isInSelectionRange: (slot: TimeSlotType) => boolean;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

const TimeSlotsGrid: React.FC<TimeSlotsGridProps> = ({
  timeSlots,
  isSelecting,
  onSelectStart,
  onSelectEnd,
  onMouseEnter,
  isInSelectionRange,
  selectedDate,
  onDateChange,
}) => {
  // Organize slots in columns based on the number of slots
  const organizeInColumns = () => {
    if (timeSlots.length <= 6) {
      // For next day (6 hours or less), split into two even columns
      const halfLength = Math.ceil(timeSlots.length / 2);
      const column1 = timeSlots.slice(0, halfLength);
      const column2 = timeSlots.slice(halfLength);
      return [column1, column2];
    } else {
      // For current day (24 hours), split at noon (12 slots per column)
      const slot1 = timeSlots.slice(0, 12); // 12am - 11am
      const slot2 = timeSlots.slice(12, 24); // 12pm - 11pm
      return [slot1, slot2];
    }
  };
  
  const columns = organizeInColumns();
  
  return (
    <div className="bg-gradient-to-r from-[rgba(255,212,0,0.05)] to-[rgba(0,255,229,0.1)] p-4 rounded-lg">
      {selectedDate && onDateChange && (
        <div className="flex justify-start mb-4">
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
            <PopoverContent className="w-auto p-0 z-50 bg-white" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && onDateChange(date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col space-y-2">
            {column.map((slot) => (
              <TimeSlot
                key={slot.id}
                slot={slot}
                isSelecting={isSelecting}
                isInSelectionRange={isInSelectionRange(slot)}
                onSelectStart={onSelectStart}
                onSelectEnd={onSelectEnd}
                onMouseEnter={onMouseEnter}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeSlotsGrid;
