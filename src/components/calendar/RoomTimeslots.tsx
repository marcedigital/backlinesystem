"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Room, TimeSlot as TimeSlotType } from '@/utils/bookingUtils';
import TimeSlotsGrid from './TimeSlotsGrid';
import TimeSlotsLegend from './TimeSlotsLegend';

interface RoomTimeslotsProps {
  rooms: Room[];
  selectedRoom: string;
  timeSlots: { [roomId: string]: TimeSlotType[] };
  isSelecting: boolean;
  onRoomChange: (roomId: string) => void;
  onSelectStart: (slot: TimeSlotType) => void;
  onSelectEnd: (slot: TimeSlotType) => void;
  onMouseEnter: (slot: TimeSlotType) => void;
  isInSelectionRange: (slot: TimeSlotType) => boolean;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

const RoomTimeslots: React.FC<RoomTimeslotsProps> = ({
  rooms,
  selectedRoom,
  timeSlots,
  isSelecting,
  onRoomChange,
  onSelectStart,
  onSelectEnd,
  onMouseEnter,
  isInSelectionRange,
  selectedDate,
  onDateChange,
}) => {
  return (
    <Tabs 
      value={selectedRoom} 
      onValueChange={onRoomChange}
      className="w-full"
    >
      <TabsList className="hidden">
        {rooms.map(room => (
          <TabsTrigger key={room.id} value={room.id}>
            {room.name}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {rooms.map(room => (
        <TabsContent key={room.id} value={room.id} className="mt-0">
          <TimeSlotsGrid
            timeSlots={timeSlots[room.id] || []}
            isSelecting={isSelecting}
            onSelectStart={onSelectStart}
            onSelectEnd={onSelectEnd}
            onMouseEnter={onMouseEnter}
            isInSelectionRange={isInSelectionRange}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />
          
          <TimeSlotsLegend />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default RoomTimeslots;
