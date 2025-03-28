"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Reservation {
  id: string;
  clientName: string;
  email: string;
  date: string;
  time: string;
  duration: number;
  room: string;
  status: 'Revisar' | 'Aprobada' | 'Cancelada' | 'Completa';
  paymentProof: string;
}

interface ReservasCalendarViewProps {
  reservations: Reservation[];
  onReservationClick: (reservation: Reservation) => void;
}

interface Day {
  date: Date;
  isCurrentMonth: boolean;
  reservations: Reservation[];
}

const ReservasCalendarView: React.FC<ReservasCalendarViewProps> = ({ 
  reservations, 
  onReservationClick 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Day[]>([]);
  
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Revisar':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Aprobada':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Cancelada':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Completa':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return '';
    }
  };
  
  useEffect(() => {
    const generateCalendarDays = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Get the first day of the month
      const firstDayOfMonth = new Date(year, month, 1);
      const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Get the last day of the month
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const daysInMonth = lastDayOfMonth.getDate();
      
      // Get the last day of the previous month
      const lastDayOfPreviousMonth = new Date(year, month, 0);
      const daysInPreviousMonth = lastDayOfPreviousMonth.getDate();
      
      const days: Day[] = [];
      
      // Add days from the previous month
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, daysInPreviousMonth - i);
        const dateString = date.toISOString().split('T')[0];
        days.push({
          date,
          isCurrentMonth: false,
          reservations: reservations.filter(r => r.date === dateString)
        });
      }
      
      // Add days from the current month
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const dateString = date.toISOString().split('T')[0];
        days.push({
          date,
          isCurrentMonth: true,
          reservations: reservations.filter(r => r.date === dateString)
        });
      }
      
      // Add days from the next month to fill out the calendar (if needed)
      const remainingDays = 42 - days.length; // 6 rows of 7 days
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        const dateString = date.toISOString().split('T')[0];
        days.push({
          date,
          isCurrentMonth: false,
          reservations: reservations.filter(r => r.date === dateString)
        });
      }
      
      return days;
    };
    
    setCalendarDays(generateCalendarDays());
  }, [currentDate, reservations]);
  
  return (
    <Card>
      <CardHeader className="px-6 py-4">
        <div className="flex items-center justify-between">
          <CardTitle>Calendario de Reservas</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              {currentDate.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {daysOfWeek.map(day => (
            <div key={day} className="text-center py-2 font-semibold text-sm">
              {day}
            </div>
          ))}
          
          {calendarDays.map((day, i) => (
            <div
              key={i}
              className={`min-h-24 p-1 border rounded-sm ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="text-right text-xs font-medium mb-1">
                {day.date.getDate()}
              </div>
              
              <div className="space-y-1">
                {day.reservations.map(reservation => (
                  <div
                    key={reservation.id}
                    onClick={() => onReservationClick(reservation)}
                    className={`px-2 py-1 text-xs rounded-md cursor-pointer ${getStatusColor(reservation.status)}`}
                  >
                    <div className="font-semibold truncate">{reservation.time} - {reservation.clientName}</div>
                    <div className="truncate">{reservation.room}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReservasCalendarView;
