import React, { useEffect, useState } from 'react';
import TimeSlot from '../TimeSlot';
import { TimeSlot as TimeSlotType } from '@/utils/bookingUtils';
import DateSelector from './DateSelector';

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
      // For few hours (6 or less), split into two even columns
      const halfLength = Math.ceil(timeSlots.length / 2);
      const column1 = timeSlots.slice(0, halfLength);
      const column2 = timeSlots.slice(halfLength);
      return [column1, column2];
    } else {
      // For many hours (more than 6), split at noon (12 slots per column)
      const morning = timeSlots.slice(0, 12); // First 12 hours
      const evening = timeSlots.slice(12); // Remaining hours
      return [morning, evening];
    }
  };
  
  const columns = organizeInColumns();
  
  return (
    <div className="bg-gradient-to-r from-[rgba(255,212,0,0.05)] to-[rgba(0,255,229,0.1)] p-4 rounded-lg">
      {selectedDate && onDateChange && (
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={onDateChange}
        />
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