"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/bookingUtils';
import type { TimeSlot as TimeSlotType } from '@/utils/bookingUtils';

interface TimeSlotProps {
  slot: TimeSlotType;
  isSelecting: boolean;
  isInSelectionRange: boolean;
  onSelectStart: (slot: TimeSlotType) => void;
  onSelectEnd: (slot: TimeSlotType) => void;
  onMouseEnter: (slot: TimeSlotType) => void;
}

const TimeSlot: React.FC<TimeSlotProps> = ({
  slot,
  isSelecting,
  isInSelectionRange,
  onSelectStart,
  onSelectEnd,
  onMouseEnter,
}) => {
  const handleClick = () => {
    if (!slot.isAvailable) return;
    
    if (isSelecting) {
      onSelectEnd(slot);
    } else {
      onSelectStart(slot);
    }
  };

  const handleDoubleClick = () => {
    if (!slot.isAvailable) return;
    
    onSelectStart(slot);
    // When double-clicked, use the same slot for both start and end
    onSelectEnd(slot);
  };

  const handleMouseEnter = () => {
    onMouseEnter(slot);
  };

  return (
    <div
      className={cn(
        'time-slot relative rounded-md p-2 mb-1 transition-all duration-200 border',
        slot.isAvailable ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed',
        slot.isSelected ? 'border-accent bg-accent bg-opacity-10 text-accent' : 'border-transparent',
        isInSelectionRange && slot.isAvailable ? 'bg-accent bg-opacity-10 border-accent' : '',
        !slot.isAvailable && 'bg-gray-100 text-gray-500'
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{formatTime(slot.startTime)}</span>
        {!slot.isAvailable && (
          <span className="text-xs px-2 py-0.5 bg-secondary bg-opacity-10 text-secondary rounded-full">
            Booked
          </span>
        )}
      </div>
      
      {/* Visual indicator for selected slots */}
      {(slot.isSelected || isInSelectionRange) && slot.isAvailable && (
        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-4 bg-accent rounded-full" />
      )}
    </div>
  );
};

export default TimeSlot;
